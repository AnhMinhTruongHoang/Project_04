package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.time.format.DateTimeParseException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.configs.VNPayConfig;
import com.example.demo.dtos.CreateTicketPaymentDTO;
import com.example.demo.entities.ArtistEvent;
import com.example.demo.entities.TicketPaymentTransaction;
import com.example.demo.entities.User;
import com.example.demo.helpers.VNPayHelper;
import com.example.demo.repositories.ArtistEventRepository;
import com.example.demo.repositories.TicketPaymentTransactionRepository;
import com.example.demo.repositories.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class TicketPaymentService {

        private static final String CURRENCY_VND = "VND";

        private static final ZoneId VIETNAM_ZONE = ZoneId.of(
                        "Asia/Ho_Chi_Minh");

        private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern(
                        "yyyyMMddHHmmss");

        private final VNPayConfig vnPayConfig;

        private final TicketPaymentTransactionRepository ticketPaymentTransactionRepository;

        private final ArtistEventRepository artistEventRepository;

        private final UserRepository userRepository;

        private final TicketFulfillmentService ticketFulfillmentService;

        @Value("${ticketing.return-fallback-enabled:true}")
        private boolean returnFallbackEnabled;

        @Value("${ticketing.platform-fee-percent:10}")
        private int platformFeePercent;

        public TicketPaymentService(
                        VNPayConfig vnPayConfig,
                        TicketPaymentTransactionRepository ticketPaymentTransactionRepository,
                        ArtistEventRepository artistEventRepository,
                        UserRepository userRepository,
                        TicketFulfillmentService ticketFulfillmentService) {

                this.vnPayConfig = vnPayConfig;

                this.ticketPaymentTransactionRepository = ticketPaymentTransactionRepository;

                this.artistEventRepository = artistEventRepository;

                this.userRepository = userRepository;

                this.ticketFulfillmentService = ticketFulfillmentService;
        }

        /*
         * =========================
         * CREATE TICKET PAYMENT
         * =========================
         */
        @Transactional
        public Map<String, Object> createPayment(
                        String buyerId,
                        CreateTicketPaymentDTO dto,
                        HttpServletRequest request) {

                vnPayConfig.validate();

                String normalizedBuyerId = normalizeRequired(
                                buyerId,
                                "Buyer ID");

                if (dto == null) {

                        throw new IllegalArgumentException(
                                        "Ticket payment information is required");
                }

                String eventId = normalizeRequired(
                                dto.getEventId(),
                                "Event ID");

                int quantity = normalizeQuantity(
                                dto.getQuantity());

                /*
                 * =========================
                 * BUYER
                 * =========================
                 */
                User buyer = userRepository
                                .findById(
                                                normalizedBuyerId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Buyer account not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                buyer.getAccountStatus())) {

                        throw new SecurityException(
                                        "This account cannot purchase tickets");
                }

                /*
                 * =========================
                 * LOCK EVENT INVENTORY
                 * =========================
                 *
                 * Tất cả việc:
                 *
                 * - check availability
                 * - release reservation cũ
                 * - reserve ticket mới
                 *
                 * đều nằm trong cùng DB transaction.
                 */
                ArtistEvent event = artistEventRepository
                                .findByIdForUpdate(
                                                eventId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Ticket event not found"));

                LocalDateTime now = LocalDateTime.now(
                                VIETNAM_ZONE);

                validatePurchasableEvent(
                                event,
                                now);

                /*
                 * Artist không tự mua ticket
                 * của chính event mình.
                 */
                if (buyer.getId().equals(
                                event.getArtistId())) {

                        throw new IllegalArgumentException(
                                        "An artist cannot purchase tickets for their own event");
                }

                /*
                 * =========================
                 * ARTIST
                 * =========================
                 */
                User artist = userRepository
                                .findById(
                                                event.getArtistId())
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Artist account not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                artist.getAccountStatus())) {

                        throw new IllegalStateException(
                                        "Artist account is not active");
                }

                /*
                 * =========================
                 * EXISTING PENDING PAYMENT
                 * =========================
                 *
                 * Chống double-click Buy.
                 */
                TicketPaymentTransaction pendingPayment = ticketPaymentTransactionRepository
                                .findFirstByBuyerIdAndEventIdAndStatusOrderByCreatedAtDesc(
                                                buyer.getId(),
                                                event.getId(),
                                                TicketPaymentTransaction.STATUS_PENDING)
                                .orElse(null);

                if (pendingPayment != null) {

                        boolean stillValid = pendingPayment.getExpiresAt() != null
                                        && pendingPayment
                                                        .getExpiresAt()
                                                        .isAfter(now);

                        boolean hasPaymentUrl = pendingPayment.getPaymentUrl() != null
                                        && !pendingPayment
                                                        .getPaymentUrl()
                                                        .isBlank();

                        boolean sameQuantity = pendingPayment.getQuantity() != null
                                        && pendingPayment
                                                        .getQuantity()
                                                        .equals(quantity);

                        /*
                         * Cùng quantity và payment
                         * vẫn còn hiệu lực:
                         *
                         * reuse URL hiện tại.
                         */
                        if (stillValid
                                        && hasPaymentUrl
                                        && sameQuantity) {

                                return buildPaymentResponse(
                                                pendingPayment,
                                                true);
                        }

                        /*
                         * Payment cũ không reuse được.
                         *
                         * Release inventory trước khi
                         * tạo payment mới.
                         */
                        releaseReservation(
                                        event,
                                        pendingPayment);

                        if (stillValid) {

                                pendingPayment.setStatus(
                                                TicketPaymentTransaction.STATUS_CANCELED);

                                pendingPayment.setFailureReason(
                                                "Replaced by a new ticket payment");

                        } else {

                                pendingPayment.setStatus(
                                                TicketPaymentTransaction.STATUS_EXPIRED);

                                pendingPayment.setFailureReason(
                                                "Ticket payment expired");
                        }

                        ticketPaymentTransactionRepository
                                        .saveAndFlush(
                                                        pendingPayment);
                }

                /*
                 * =========================
                 * CHECK INVENTORY
                 * =========================
                 */
                int availableQuantity = calculateAvailableQuantity(
                                event);

                if (quantity > availableQuantity) {

                        throw new IllegalStateException(
                                        "Not enough tickets are available");
                }

                /*
                 * =========================
                 * MONEY
                 * =========================
                 */
                long unitPrice = normalizePrice(
                                event.getTicketPrice());

                long grossAmount = Math.multiplyExact(
                                unitPrice,
                                (long) quantity);

                int normalizedFeePercent = normalizePlatformFeePercent(
                                platformFeePercent);

                long platformFeeAmount = Math.floorDiv(
                                Math.multiplyExact(
                                                grossAmount,
                                                normalizedFeePercent),
                                100L);

                long artistNetAmount = Math.subtractExact(
                                grossAmount,
                                platformFeeAmount);

                if (artistNetAmount <= 0L) {

                        throw new IllegalStateException(
                                        "Artist ticket revenue must be greater than zero");
                }

                /*
                 * =========================
                 * RESERVE INVENTORY
                 * =========================
                 */
                int currentReserved = event.getReservedQuantity() == null
                                ? 0
                                : event.getReservedQuantity();

                event.setReservedQuantity(
                                Math.addExact(
                                                currentReserved,
                                                quantity));

                artistEventRepository
                                .saveAndFlush(
                                                event);

                /*
                 * =========================
                 * VNPAY SETTINGS
                 * =========================
                 */
                String locale = normalizeLocale(
                                dto.getLocale());

                String bankCode = normalizeBankCode(
                                dto.getBankCode());

                String orderCode = generateUniqueOrderCode();

                LocalDateTime expiresAt = now.plusMinutes(
                                vnPayConfig.getExpireMinutes());

                String orderInfo = VNPayHelper.normalizeOrderInfo(
                                "Thanh toan ve "
                                                + event.getEventName()
                                                + " SoundClone "
                                                + orderCode);

                /*
                 * =========================
                 * BUILD VNPAY PARAMETERS
                 * =========================
                 */
                Map<String, String> parameters = new TreeMap<>();

                parameters.put(
                                "vnp_Version",
                                VNPayConfig.VERSION);

                parameters.put(
                                "vnp_Command",
                                VNPayConfig.COMMAND_PAY);

                parameters.put(
                                "vnp_TmnCode",
                                vnPayConfig.getTmnCode());

                parameters.put(
                                "vnp_Amount",
                                String.valueOf(
                                                Math.multiplyExact(
                                                                grossAmount,
                                                                100L)));

                parameters.put(
                                "vnp_CurrCode",
                                CURRENCY_VND);

                parameters.put(
                                "vnp_TxnRef",
                                orderCode);

                parameters.put(
                                "vnp_OrderInfo",
                                orderInfo);

                parameters.put(
                                "vnp_OrderType",
                                VNPayConfig.DEFAULT_ORDER_TYPE);

                parameters.put(
                                "vnp_Locale",
                                locale);

                parameters.put(
                                "vnp_ReturnUrl",
                                vnPayConfig.getReturnUrl());

                parameters.put(
                                "vnp_IpAddr",
                                limitLength(
                                                VNPayHelper.getClientIpAddress(
                                                                request),
                                                45));

                parameters.put(
                                "vnp_CreateDate",
                                formatVNPayDate(
                                                now));

                parameters.put(
                                "vnp_ExpireDate",
                                formatVNPayDate(
                                                expiresAt));

                if (bankCode != null) {

                        parameters.put(
                                        "vnp_BankCode",
                                        bankCode);
                }

                String paymentUrl = VNPayHelper.buildPaymentUrl(
                                vnPayConfig.getPayUrl(),
                                parameters,
                                vnPayConfig.getHashSecret());

                /*
                 * =========================
                 * CREATE PAYMENT RECORD
                 * =========================
                 */
                TicketPaymentTransaction payment = new TicketPaymentTransaction();

                payment.setBuyerId(
                                buyer.getId());

                payment.setArtistId(
                                artist.getId());

                payment.setEventId(
                                event.getId());

                payment.setPrimaryTicketId(
                                null);

                payment.setOrderCode(
                                orderCode);

                payment.setProvider(
                                TicketPaymentTransaction.PROVIDER_VNPAY);

                /*
                 * Event snapshot.
                 */
                payment.setEventNameSnapshot(
                                event.getEventName());

                payment.setTicketImageUrlSnapshot(
                                event.getTicketImageUrl());

                payment.setQuantity(
                                quantity);

                payment.setUnitPrice(
                                unitPrice);

                payment.setGrossAmount(
                                grossAmount);

                payment.setPlatformFeePercent(
                                normalizedFeePercent);

                payment.setPlatformFeeAmount(
                                platformFeeAmount);

                payment.setArtistNetAmount(
                                artistNetAmount);

                payment.setCurrency(
                                CURRENCY_VND);

                /*
                 * Inventory hiện đang được giữ.
                 */
                payment.setInventoryReserved(
                                true);

                payment.setStatus(
                                TicketPaymentTransaction.STATUS_PENDING);

                payment.setPaymentUrl(
                                paymentUrl);

                payment.setOrderInfo(
                                orderInfo);

                payment.setFailureReason(
                                null);

                payment.setExpiresAt(
                                expiresAt);

                TicketPaymentTransaction savedPayment = ticketPaymentTransactionRepository
                                .saveAndFlush(
                                                payment);

                return buildPaymentResponse(
                                savedPayment,
                                false);
        }

        /*
         * =========================
         * GET BUYER PAYMENT
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getBuyerPayment(
                        String buyerId,
                        String orderCode) {

                String normalizedBuyerId = normalizeRequired(
                                buyerId,
                                "Buyer ID");

                String normalizedOrderCode = normalizeRequired(
                                orderCode,
                                "Payment order code");

                TicketPaymentTransaction payment = ticketPaymentTransactionRepository
                                .findByOrderCode(
                                                normalizedOrderCode)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Ticket payment not found"));

                if (!normalizedBuyerId.equals(
                                payment.getBuyerId())) {

                        throw new IllegalArgumentException(
                                        "Ticket payment not found");
                }

                return buildPaymentResponse(
                                payment,
                                false);
        }

        /*
         * =========================
         * TICKET VNPAY IPN
         * =========================
         */
        @Transactional
        public Map<String, String> processIpn(
                        Map<String, String> parameters) {

                vnPayConfig.validate();

                if (parameters == null
                                || parameters.isEmpty()) {

                        return buildIpnResponse(
                                        "99",
                                        "Missing callback parameters");
                }

                /*
                 * =========================
                 * VERIFY SIGNATURE
                 * =========================
                 */
                boolean signatureValid = VNPayHelper.verifySignature(
                                parameters,
                                vnPayConfig.getHashSecret());

                if (!signatureValid) {

                        return buildIpnResponse(
                                        "97",
                                        "Invalid signature");
                }

                /*
                 * =========================
                 * VERIFY MERCHANT
                 * =========================
                 */
                String callbackTmnCode = normalizeCallbackValue(
                                parameters.get(
                                                "vnp_TmnCode"),
                                50);

                if (!vnPayConfig
                                .getTmnCode()
                                .equals(
                                                callbackTmnCode)) {

                        return buildIpnResponse(
                                        "99",
                                        "Invalid merchant code");
                }

                /*
                 * =========================
                 * ORDER CODE
                 * =========================
                 */
                String orderCode = normalizeCallbackValue(
                                parameters.get(
                                                "vnp_TxnRef"),
                                100);

                if (orderCode == null
                                || !orderCode.startsWith(
                                                "SCT")) {

                        return buildIpnResponse(
                                        "01",
                                        "Order not found");
                }

                /*
                 * =========================
                 * LOCK PAYMENT
                 * =========================
                 */
                TicketPaymentTransaction payment = ticketPaymentTransactionRepository
                                .findByOrderCodeForUpdate(
                                                orderCode)
                                .orElse(null);

                if (payment == null) {

                        return buildIpnResponse(
                                        "01",
                                        "Order not found");
                }

                /*
                 * =========================
                 * VERIFY AMOUNT
                 * =========================
                 */
                Long callbackAmount = parseVNPayAmount(
                                parameters.get(
                                                "vnp_Amount"));

                boolean amountValid = callbackAmount != null
                                && callbackAmount.equals(
                                                payment.getGrossAmount());

                if (!amountValid) {

                        return buildIpnResponse(
                                        "04",
                                        "Invalid amount");
                }

                /*
                 * =========================
                 * IDEMPOTENCY
                 * =========================
                 */
                if (TicketPaymentTransaction.STATUS_PAID
                                .equalsIgnoreCase(
                                                payment.getStatus())) {

                        return buildIpnResponse(
                                        "02",
                                        "Order already confirmed");
                }

                if (TicketPaymentTransaction.STATUS_REFUNDED
                                .equalsIgnoreCase(
                                                payment.getStatus())) {

                        return buildIpnResponse(
                                        "02",
                                        "Order already processed");
                }

                /*
                 * =========================
                 * PROVIDER TRANSACTION
                 * =========================
                 */
                String providerTransactionId = normalizeCallbackValue(
                                parameters.get(
                                                "vnp_TransactionNo"),
                                100);

                if (providerTransactionId != null) {

                        TicketPaymentTransaction duplicated = ticketPaymentTransactionRepository
                                        .findByProviderAndProviderTransactionId(
                                                        TicketPaymentTransaction.PROVIDER_VNPAY,
                                                        providerTransactionId)
                                        .orElse(null);

                        if (duplicated != null
                                        && !duplicated
                                                        .getId()
                                                        .equals(
                                                                        payment.getId())) {

                                return buildIpnResponse(
                                                "02",
                                                "Transaction already used");
                        }
                }

                /*
                 * =========================
                 * STORE CALLBACK DATA
                 * =========================
                 */
                applyCallbackData(
                                payment,
                                parameters);

                String responseCode = payment.getResponseCode();

                String transactionStatus = payment.getTransactionStatus();

                boolean paymentSucceeded = "00".equals(
                                responseCode)
                                && "00".equals(
                                                transactionStatus);

                /*
                 * =========================
                 * PAYMENT FAILED / CANCELED
                 * =========================
                 */
                if (!paymentSucceeded) {

                        releasePaymentReservation(
                                        payment);

                        boolean canceled = "24".equals(
                                        responseCode);

                        payment.setStatus(
                                        canceled
                                                        ? TicketPaymentTransaction.STATUS_CANCELED
                                                        : TicketPaymentTransaction.STATUS_FAILED);

                        payment.setFailureReason(
                                        canceled
                                                        ? "Ticket payment was canceled by the buyer"
                                                        : "VNPAY ticket payment failed with response code "
                                                                        + safeCallbackText(
                                                                                        responseCode));

                        ticketPaymentTransactionRepository
                                        .saveAndFlush(
                                                        payment);

                        return buildIpnResponse(
                                        "00",
                                        "Confirm success");
                }

                /*
                 * =========================
                 * LOCK ARTIST
                 * =========================
                 *
                 * Fulfillment sẽ:
                 *
                 * reserved -> sold
                 * create tickets
                 * create revenue ledger
                 * update ArtistWallet
                 */
                userRepository
                                .findByIdForUpdate(
                                                payment.getArtistId())
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Artist account not found"));

                LocalDateTime paidAt = parseVNPayDate(
                                parameters.get(
                                                "vnp_PayDate"));

                if (paidAt == null) {

                        paidAt = LocalDateTime.now(
                                        VIETNAM_ZONE);
                }

                /*
                 * =========================
                 * PROCESSING
                 * =========================
                 */
                payment.setStatus(
                                TicketPaymentTransaction.STATUS_PROCESSING);

                payment.setFailureReason(
                                null);

                ticketPaymentTransactionRepository
                                .saveAndFlush(
                                                payment);

                /*
                 * =========================
                 * FULFILL TICKET
                 * =========================
                 */
                List<com.example.demo.entities.UserEventTicket> tickets = ticketFulfillmentService
                                .fulfillPaidPayment(
                                                payment,
                                                paidAt);

                if (tickets.isEmpty()) {

                        throw new IllegalStateException(
                                        "Ticket payment completed but no ticket was issued");
                }

                /*
                 * =========================
                 * PAYMENT PAID
                 * =========================
                 */
                payment.setStatus(
                                TicketPaymentTransaction.STATUS_PAID);

                payment.setPaidAt(
                                paidAt);

                payment.setFailureReason(
                                null);

                ticketPaymentTransactionRepository
                                .saveAndFlush(
                                                payment);

                return buildIpnResponse(
                                "00",
                                "Confirm success");
        }

        /*
         * =========================
         * RELEASE RESERVATION
         * =========================
         */
        private void releaseReservation(
                        ArtistEvent event,
                        TicketPaymentTransaction payment) {

                if (!Boolean.TRUE.equals(
                                payment.getInventoryReserved())) {

                        return;
                }

                int reserved = event.getReservedQuantity() == null
                                ? 0
                                : event.getReservedQuantity();

                int quantity = payment.getQuantity() == null
                                ? 0
                                : payment.getQuantity();

                event.setReservedQuantity(
                                Math.max(
                                                reserved - quantity,
                                                0));

                payment.setInventoryReserved(
                                false);

                artistEventRepository
                                .saveAndFlush(
                                                event);
        }

        /*
         * =========================
         * AVAILABLE INVENTORY
         * =========================
         */
        private int calculateAvailableQuantity(
                        ArtistEvent event) {

                int total = event.getTotalQuantity() == null
                                ? 0
                                : event.getTotalQuantity();

                int sold = event.getSoldQuantity() == null
                                ? 0
                                : event.getSoldQuantity();

                int reserved = event.getReservedQuantity() == null
                                ? 0
                                : event.getReservedQuantity();

                return Math.max(
                                total
                                                - sold
                                                - reserved,
                                0);
        }

        /*
         * =========================
         * EVENT VALIDATION
         * =========================
         */
        private void validatePurchasableEvent(
                        ArtistEvent event,
                        LocalDateTime now) {

                if (!ArtistEvent.APPROVAL_APPROVED
                                .equalsIgnoreCase(
                                                event.getApprovalStatus())) {

                        throw new IllegalStateException(
                                        "This ticket event is not available for purchase");
                }

                if (!ArtistEvent.STATUS_ACTIVE
                                .equalsIgnoreCase(
                                                event.getStatus())) {

                        throw new IllegalStateException(
                                        "This ticket event is not active");
                }

                if (event.getEventStartAt() == null
                                || !event.getEventStartAt()
                                                .isAfter(now)) {

                        throw new IllegalStateException(
                                        "This event has already started or ended");
                }

                if (event.getSaleStartAt() == null
                                || now.isBefore(
                                                event.getSaleStartAt())) {

                        throw new IllegalStateException(
                                        "Ticket sales have not started yet");
                }

                if (event.getSaleEndAt() == null
                                || now.isAfter(
                                                event.getSaleEndAt())) {

                        throw new IllegalStateException(
                                        "Ticket sales have ended");
                }
        }

        /*
         * =========================
         * PAYMENT RESPONSE
         * =========================
         */
        private Map<String, Object> buildPaymentResponse(
                        TicketPaymentTransaction payment,
                        boolean reused) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "paymentId",
                                payment.getId());

                result.put(
                                "orderCode",
                                payment.getOrderCode());

                result.put(
                                "provider",
                                payment.getProvider());

                result.put(
                                "buyerId",
                                payment.getBuyerId());

                result.put(
                                "artistId",
                                payment.getArtistId());

                result.put(
                                "eventId",
                                payment.getEventId());

                result.put(
                                "eventName",
                                payment.getEventNameSnapshot());

                result.put(
                                "ticketImageUrl",
                                payment.getTicketImageUrlSnapshot());

                result.put(
                                "quantity",
                                payment.getQuantity());

                result.put(
                                "unitPrice",
                                payment.getUnitPrice());

                result.put(
                                "grossAmount",
                                payment.getGrossAmount());

                result.put(
                                "platformFeePercent",
                                payment.getPlatformFeePercent());

                result.put(
                                "platformFeeAmount",
                                payment.getPlatformFeeAmount());

                result.put(
                                "artistNetAmount",
                                payment.getArtistNetAmount());

                result.put(
                                "currency",
                                payment.getCurrency());

                result.put(
                                "status",
                                payment.getStatus());

                result.put(
                                "inventoryReserved",
                                payment.getInventoryReserved());

                result.put(
                                "primaryTicketId",
                                payment.getPrimaryTicketId());

                result.put(
                                "paymentUrl",
                                payment.getPaymentUrl());

                result.put(
                                "responseCode",
                                payment.getResponseCode());

                result.put(
                                "transactionStatus",
                                payment.getTransactionStatus());

                result.put(
                                "paidAt",
                                payment.getPaidAt());

                result.put(
                                "expiresAt",
                                payment.getExpiresAt());

                result.put(
                                "createdAt",
                                payment.getCreatedAt());

                result.put(
                                "reused",
                                reused);

                return result;
        }

        /*
         * =========================
         * SCT ORDER CODE
         * =========================
         */
        private String generateUniqueOrderCode() {

                for (int attempt = 0; attempt < 10; attempt++) {

                        String timestamp = LocalDateTime.now(
                                        VIETNAM_ZONE)
                                        .format(
                                                        VNPAY_DATE_FORMAT);

                        String randomPart = UUID.randomUUID()
                                        .toString()
                                        .replace("-", "")
                                        .substring(0, 8)
                                        .toUpperCase(
                                                        Locale.ROOT);

                        String orderCode = "SCT"
                                        + timestamp
                                        + randomPart;

                        if (!ticketPaymentTransactionRepository
                                        .existsByOrderCode(
                                                        orderCode)) {

                                return orderCode;
                        }
                }

                throw new IllegalStateException(
                                "Unable to generate ticket payment order code");
        }

        /*
         * =========================
         * VALIDATION HELPERS
         * =========================
         */
        private int normalizeQuantity(
                        Integer quantity) {

                if (quantity == null
                                || quantity <= 0) {

                        throw new IllegalArgumentException(
                                        "Ticket quantity must be greater than zero");
                }

                return quantity;
        }

        private long normalizePrice(
                        Long value) {

                if (value == null
                                || value <= 0L) {

                        throw new IllegalStateException(
                                        "Ticket price is invalid");
                }

                return value;
        }

        private int normalizePlatformFeePercent(
                        int value) {

                if (value < 0
                                || value >= 100) {

                        throw new IllegalStateException(
                                        "Ticketing platform fee percent must be between 0 and 99");
                }

                return value;
        }

        private String normalizeRequired(
                        String value,
                        String fieldName) {

                if (value == null
                                || value.isBlank()) {

                        throw new IllegalArgumentException(
                                        fieldName
                                                        + " is required");
                }

                return value.trim();
        }

        private String normalizeLocale(
                        String value) {

                String normalized = value == null
                                ? ""
                                : value
                                                .trim()
                                                .toLowerCase(
                                                                Locale.ROOT);

                return "en".equals(
                                normalized)
                                                ? "en"
                                                : "vn";
        }

        private String normalizeBankCode(
                        String value) {

                if (value == null
                                || value.isBlank()) {

                        return null;
                }

                String normalized = value.trim()
                                .toUpperCase(
                                                Locale.ROOT);

                if (!normalized.matches(
                                "^[A-Z0-9_-]{2,30}$")) {

                        throw new IllegalArgumentException(
                                        "Bank code is invalid");
                }

                return normalized;
        }

        private String formatVNPayDate(
                        LocalDateTime value) {

                return value.format(
                                VNPAY_DATE_FORMAT);
        }

        private String limitLength(
                        String value,
                        int maximumLength) {

                if (value == null) {
                        return "";
                }

                return value.length() > maximumLength
                                ? value.substring(
                                                0,
                                                maximumLength)
                                : value;
        }

        /*
         * =========================
         * TICKET VNPAY RETURN
         * =========================
         */
        @Transactional
        public Map<String, Object> handleReturn(
                        Map<String, String> parameters) {

                vnPayConfig.validate();

                Map<String, Object> result = new LinkedHashMap<>();

                String orderCode = parameters == null
                                ? ""
                                : safeCallbackText(
                                                parameters.get(
                                                                "vnp_TxnRef"));

                String responseCode = parameters == null
                                ? ""
                                : safeCallbackText(
                                                parameters.get(
                                                                "vnp_ResponseCode"));

                String transactionStatus = parameters == null
                                ? ""
                                : safeCallbackText(
                                                parameters.get(
                                                                "vnp_TransactionStatus"));

                /*
                 * =========================
                 * VERIFY RETURN
                 * =========================
                 */
                boolean signatureValid = parameters != null
                                && VNPayHelper
                                                .verifySignature(
                                                                parameters,
                                                                vnPayConfig
                                                                                .getHashSecret());

                boolean merchantValid = parameters != null
                                && vnPayConfig
                                                .getTmnCode()
                                                .equals(
                                                                parameters.get(
                                                                                "vnp_TmnCode"));

                TicketPaymentTransaction payment = orderCode.startsWith(
                                "SCT")
                                                ? ticketPaymentTransactionRepository
                                                                .findByOrderCode(
                                                                                orderCode)
                                                                .orElse(null)
                                                : null;

                boolean orderFound = payment != null;

                Long callbackAmount = parameters == null
                                ? null
                                : parseVNPayAmount(
                                                parameters.get(
                                                                "vnp_Amount"));

                boolean amountValid = payment != null
                                && callbackAmount != null
                                && callbackAmount.equals(
                                                payment.getGrossAmount());

                /*
                 * =========================
                 * SANDBOX RETURN FALLBACK
                 * =========================
                 *
                 * Production:
                 * IPN vẫn là callback chính.
                 *
                 * Localhost/Sandbox:
                 * VNPay có thể không gọi được IPN,
                 * nên Return hợp lệ được phép xử lý.
                 *
                 * processIpn() đã có lock +
                 * idempotency nên IPN đến sau vẫn an toàn.
                 */
                if (returnFallbackEnabled
                                && signatureValid
                                && merchantValid
                                && orderFound
                                && amountValid) {

                        processIpn(
                                        parameters);

                        payment = ticketPaymentTransactionRepository
                                        .findByOrderCode(
                                                        orderCode)
                                        .orElse(payment);
                }

                boolean paymentConfirmed = payment != null
                                && TicketPaymentTransaction.STATUS_PAID
                                                .equalsIgnoreCase(
                                                                payment.getStatus());

                result.put(
                                "paymentType",
                                "TICKET");

                result.put(
                                "orderCode",
                                orderCode);

                result.put(
                                "signatureValid",
                                signatureValid);

                result.put(
                                "merchantValid",
                                merchantValid);

                result.put(
                                "orderFound",
                                orderFound);

                result.put(
                                "amountValid",
                                amountValid);

                result.put(
                                "paymentConfirmed",
                                paymentConfirmed);

                result.put(
                                "responseCode",
                                responseCode);

                result.put(
                                "transactionStatus",
                                transactionStatus);

                result.put(
                                "status",
                                payment == null
                                                ? TicketPaymentTransaction.STATUS_PENDING
                                                : payment.getStatus());

                result.put(
                                "paymentId",
                                payment == null
                                                ? null
                                                : payment.getId());

                result.put(
                                "eventId",
                                payment == null
                                                ? null
                                                : payment.getEventId());

                result.put(
                                "primaryTicketId",
                                payment == null
                                                ? null
                                                : payment.getPrimaryTicketId());

                return result;
        }

        /*
         * =========================
         * RELEASE CALLBACK INVENTORY
         * =========================
         */
        private void releasePaymentReservation(
                        TicketPaymentTransaction payment) {

                if (!Boolean.TRUE.equals(
                                payment.getInventoryReserved())) {

                        return;
                }

                ArtistEvent event = artistEventRepository
                                .findByIdForUpdate(
                                                payment.getEventId())
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Ticket event not found"));

                releaseReservation(
                                event,
                                payment);
        }

        /*
         * =========================
         * APPLY VNPAY CALLBACK
         * =========================
         */
        private void applyCallbackData(
                        TicketPaymentTransaction payment,
                        Map<String, String> parameters) {

                payment.setProviderTransactionId(
                                normalizeCallbackValue(
                                                parameters.get(
                                                                "vnp_TransactionNo"),
                                                100));

                payment.setResponseCode(
                                normalizeCallbackValue(
                                                parameters.get(
                                                                "vnp_ResponseCode"),
                                                20));

                payment.setTransactionStatus(
                                normalizeCallbackValue(
                                                parameters.get(
                                                                "vnp_TransactionStatus"),
                                                20));

                payment.setBankCode(
                                normalizeCallbackValue(
                                                parameters.get(
                                                                "vnp_BankCode"),
                                                50));

                payment.setBankTransactionNo(
                                normalizeCallbackValue(
                                                parameters.get(
                                                                "vnp_BankTranNo"),
                                                100));

                payment.setCardType(
                                normalizeCallbackValue(
                                                parameters.get(
                                                                "vnp_CardType"),
                                                50));

                payment.setCallbackPayload(
                                buildSafeCallbackPayload(
                                                parameters));
        }

        /*
         * =========================
         * VNPAY AMOUNT
         * =========================
         */
        private Long parseVNPayAmount(
                        String value) {

                if (value == null
                                || value.isBlank()) {

                        return null;
                }

                try {

                        long rawAmount = Long.parseLong(
                                        value.trim());

                        if (rawAmount <= 0L
                                        || rawAmount % 100L != 0L) {

                                return null;
                        }

                        return rawAmount / 100L;

                } catch (NumberFormatException e) {

                        return null;
                }
        }

        /*
         * =========================
         * VNPAY DATE
         * =========================
         */
        private LocalDateTime parseVNPayDate(
                        String value) {

                if (value == null
                                || value.isBlank()) {

                        return null;
                }

                try {

                        return LocalDateTime.parse(
                                        value.trim(),
                                        VNPAY_DATE_FORMAT);

                } catch (DateTimeParseException e) {

                        return null;
                }
        }

        /*
         * =========================
         * CALLBACK NORMALIZATION
         * =========================
         */
        private String normalizeCallbackValue(
                        String value,
                        int maximumLength) {

                if (value == null
                                || value.isBlank()) {

                        return null;
                }

                return limitLength(
                                value.trim(),
                                maximumLength);
        }

        private String safeCallbackText(
                        String value) {

                return value == null
                                ? ""
                                : value.trim();
        }

        /*
         * =========================
         * SAFE CALLBACK AUDIT
         * =========================
         */
        private String buildSafeCallbackPayload(
                        Map<String, String> parameters) {

                if (parameters == null
                                || parameters.isEmpty()) {

                        return null;
                }

                Map<String, String> safeParameters = new TreeMap<>();

                parameters.forEach(
                                (key, value) -> {

                                        if (key == null
                                                        || "vnp_SecureHash".equals(
                                                                        key)
                                                        || "vnp_SecureHashType".equals(
                                                                        key)) {

                                                return;
                                        }

                                        safeParameters.put(
                                                        key,
                                                        value == null
                                                                        ? ""
                                                                        : value);
                                });

                StringBuilder payload = new StringBuilder();

                safeParameters.forEach(
                                (key, value) -> {

                                        if (payload.length() > 0) {
                                                payload.append("&");
                                        }

                                        payload.append(
                                                        key)
                                                        .append("=")
                                                        .append(
                                                                        value);
                                });

                return payload.toString();
        }

        /*
         * =========================
         * IPN RESPONSE
         * =========================
         */
        private Map<String, String> buildIpnResponse(
                        String rspCode,
                        String message) {

                Map<String, String> result = new LinkedHashMap<>();

                result.put(
                                "RspCode",
                                rspCode);

                result.put(
                                "Message",
                                message);

                return result;
        }
}