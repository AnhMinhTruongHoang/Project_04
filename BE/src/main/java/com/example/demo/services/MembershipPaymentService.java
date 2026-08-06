package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.configs.VNPayConfig;
import com.example.demo.dtos.CreateMembershipPaymentDTO;
import com.example.demo.entities.ArtistMembershipPlan;
import com.example.demo.entities.MembershipPaymentTransaction;
import com.example.demo.entities.User;
import com.example.demo.helpers.VNPayHelper;
import com.example.demo.repositories.ArtistMembershipPlanRepository;
import com.example.demo.repositories.MembershipPaymentTransactionRepository;
import com.example.demo.repositories.UserRepository;
import java.time.format.DateTimeParseException;
import com.example.demo.entities.ArtistMembershipSubscription;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class MembershipPaymentService {

        private static final String CURRENCY_VND = "VND";

        private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

        private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern(
                        "yyyyMMddHHmmss");

        private final VNPayConfig vnPayConfig;

        private final MembershipPaymentTransactionRepository membershipPaymentTransactionRepository;

        private final ArtistMembershipPlanRepository artistMembershipPlanRepository;

        private final UserRepository userRepository;

        private final ArtistMembershipActivationService artistMembershipActivationService;

        @Value("${membership.platform-fee-percent:10}")
        private int platformFeePercent;

        @Value("${membership.period-days:30}")
        private int membershipPeriodDays;

        public MembershipPaymentService(
                        VNPayConfig vnPayConfig,

                        MembershipPaymentTransactionRepository membershipPaymentTransactionRepository,

                        ArtistMembershipPlanRepository artistMembershipPlanRepository,

                        UserRepository userRepository,

                        ArtistMembershipActivationService artistMembershipActivationService) {

                this.vnPayConfig = vnPayConfig;

                this.membershipPaymentTransactionRepository = membershipPaymentTransactionRepository;

                this.artistMembershipPlanRepository = artistMembershipPlanRepository;

                this.userRepository = userRepository;

                this.artistMembershipActivationService = artistMembershipActivationService;
        }

        /*
         * =========================
         * CREATE MEMBERSHIP PAYMENT
         * =========================
         */
        @Transactional
        public Map<String, Object> createPayment(
                        String memberId,
                        CreateMembershipPaymentDTO dto,
                        HttpServletRequest request) {

                vnPayConfig.validate();

                validateMemberId(
                                memberId);

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Membership payment information is required");
                }

                String planId = normalizeRequired(
                                dto.getPlanId(),
                                "Membership plan ID");

                User member = userRepository
                                .findById(memberId.trim())
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Member account not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                member.getAccountStatus())) {

                        throw new SecurityException(
                                        "This account cannot create a membership payment");
                }

                ArtistMembershipPlan plan = artistMembershipPlanRepository
                                .findById(planId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Membership plan not found"));

                if (!Boolean.TRUE.equals(
                                plan.getActive())) {

                        throw new IllegalStateException(
                                        "This membership plan is not active");
                }

                User artist = userRepository
                                .findById(plan.getArtistId())
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Artist account not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                artist.getAccountStatus())) {

                        throw new IllegalStateException(
                                        "Artist account is not active");
                }

                if (!"ARTIST".equalsIgnoreCase(
                                artist.getType())) {

                        throw new IllegalStateException(
                                        "Membership plan owner is not an artist");
                }

                if (member.getId().equals(
                                artist.getId())) {

                        throw new IllegalArgumentException(
                                        "An artist cannot join their own membership");
                }

                long grossAmount = normalizeAmount(
                                plan.getMonthlyPrice());

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
                                        "Artist membership revenue must be greater than zero");
                }

                int normalizedPeriodDays = Math.max(
                                membershipPeriodDays,
                                1);

                LocalDateTime now = LocalDateTime.now(
                                VIETNAM_ZONE);

                /*
                 * =========================
                 * REUSE ACTIVE PENDING ORDER
                 * =========================
                 *
                 * Chống double-click tạo nhiều đơn
                 * thanh toán giống nhau.
                 */
                MembershipPaymentTransaction reusablePayment = membershipPaymentTransactionRepository
                                .findFirstByMemberIdAndArtistIdAndPlanIdAndStatusOrderByCreatedAtDesc(
                                                member.getId(),
                                                artist.getId(),
                                                plan.getId(),
                                                MembershipPaymentTransaction.STATUS_PENDING)
                                .filter(
                                                payment -> payment.getExpiresAt() != null
                                                                && payment
                                                                                .getExpiresAt()
                                                                                .isAfter(now))
                                .filter(
                                                payment -> payment.getPaymentUrl() != null
                                                                && !payment
                                                                                .getPaymentUrl()
                                                                                .isBlank())
                                .orElse(null);

                if (reusablePayment != null) {
                        return buildPaymentResponse(
                                        reusablePayment,
                                        true);
                }

                String locale = normalizeLocale(
                                dto.getLocale());

                String bankCode = normalizeBankCode(
                                dto.getBankCode());

                String orderCode = generateUniqueOrderCode();

                LocalDateTime expiresAt = now.plusMinutes(
                                vnPayConfig.getExpireMinutes());

                String orderInfo = VNPayHelper.normalizeOrderInfo(
                                "Thanh toan membership "
                                                + plan.getCode()
                                                + " SoundClone "
                                                + orderCode);

                /*
                 * =========================
                 * BUILD VNPAY PARAMETERS
                 * =========================
                 *
                 * Return URL hiện dùng chung route.
                 * Bước tiếp theo sẽ route theo:
                 *
                 * SCM... → MembershipPaymentService
                 * SC... → PaymentService
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

                MembershipPaymentTransaction payment = new MembershipPaymentTransaction();

                payment.setMemberId(
                                member.getId());

                payment.setArtistId(
                                artist.getId());

                payment.setPlanId(
                                plan.getId());

                payment.setSubscriptionId(
                                null);

                payment.setProvider(
                                MembershipPaymentTransaction.PROVIDER_VNPAY);

                payment.setOrderCode(
                                orderCode);

                /*
                 * Snapshot plan tại thời điểm thanh toán.
                 */
                payment.setPlanCodeSnapshot(
                                normalizeSnapshot(
                                                plan.getCode(),
                                                "MEMBERSHIP"));

                payment.setPlanNameSnapshot(
                                normalizeSnapshot(
                                                plan.getName(),
                                                "Membership"));

                payment.setBadgeNameSnapshot(
                                normalizeSnapshot(
                                                plan.getBadgeName(),
                                                "Member"));

                payment.setBadgeColorSnapshot(
                                normalizeBadgeColor(
                                                plan.getBadgeColor()));

                payment.setPeriodDays(
                                normalizedPeriodDays);

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

                payment.setStatus(
                                MembershipPaymentTransaction.STATUS_PENDING);

                payment.setPaymentUrl(
                                paymentUrl);

                payment.setOrderInfo(
                                orderInfo);

                payment.setFailureReason(
                                null);

                payment.setExpiresAt(
                                expiresAt);

                MembershipPaymentTransaction savedPayment = membershipPaymentTransactionRepository
                                .saveAndFlush(
                                                payment);

                return buildPaymentResponse(
                                savedPayment,
                                false);
        }

        /*
         * =========================
         * GET MEMBER PAYMENT STATUS
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getMemberPayment(
                        String memberId,
                        String orderCode) {

                validateMemberId(
                                memberId);

                String normalizedOrderCode = normalizeRequired(
                                orderCode,
                                "Payment order code");

                MembershipPaymentTransaction payment = membershipPaymentTransactionRepository
                                .findByOrderCode(
                                                normalizedOrderCode)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Membership payment not found"));

                if (!memberId.trim().equals(
                                payment.getMemberId())) {

                        throw new IllegalArgumentException(
                                        "Membership payment not found");
                }

                return buildPaymentResponse(
                                payment,
                                false);
        }

        /*
         * =========================
         * MEMBERSHIP VNPAY IPN
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
                 * [Chuẩn] Chỉ tin callback có chữ ký hợp lệ.
                 */
                boolean signatureValid = VNPayHelper.verifySignature(
                                parameters,
                                vnPayConfig.getHashSecret());

                if (!signatureValid) {
                        return buildIpnResponse(
                                        "97",
                                        "Invalid signature");
                }

                String callbackTmnCode = normalizeCallbackValue(
                                parameters.get(
                                                "vnp_TmnCode"),
                                50);

                if (!vnPayConfig
                                .getTmnCode()
                                .equals(callbackTmnCode)) {

                        return buildIpnResponse(
                                        "99",
                                        "Invalid merchant code");
                }

                String orderCode = normalizeCallbackValue(
                                parameters.get(
                                                "vnp_TxnRef"),
                                100);

                if (orderCode == null
                                || !orderCode.startsWith(
                                                "SCM")) {

                        return buildIpnResponse(
                                        "01",
                                        "Order not found");
                }

                /*
                 * Khóa payment để chống VNPay gửi IPN
                 * nhiều lần hoặc hai callback chạy đồng thời.
                 */
                MembershipPaymentTransaction payment = membershipPaymentTransactionRepository
                                .findByOrderCodeForUpdate(
                                                orderCode)
                                .orElse(null);

                if (payment == null) {
                        return buildIpnResponse(
                                        "01",
                                        "Order not found");
                }

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
                 * Payment đã hoàn tất trước đó.
                 * Không kích hoạt membership hoặc cộng ví lần hai.
                 */
                if (MembershipPaymentTransaction.STATUS_PAID
                                .equalsIgnoreCase(
                                                payment.getStatus())) {

                        return buildIpnResponse(
                                        "02",
                                        "Order already confirmed");
                }

                if (MembershipPaymentTransaction.STATUS_REFUNDED
                                .equalsIgnoreCase(
                                                payment.getStatus())) {

                        return buildIpnResponse(
                                        "02",
                                        "Order already processed");
                }

                String providerTransactionId = normalizeCallbackValue(
                                parameters.get(
                                                "vnp_TransactionNo"),
                                100);

                /*
                 * Một mã giao dịch VNPay không được dùng
                 * cho hai payment khác nhau.
                 */
                if (providerTransactionId != null) {

                        MembershipPaymentTransaction duplicatedProviderTransaction = membershipPaymentTransactionRepository
                                        .findByProviderAndProviderTransactionId(
                                                        MembershipPaymentTransaction.PROVIDER_VNPAY,
                                                        providerTransactionId)
                                        .orElse(null);

                        if (duplicatedProviderTransaction != null
                                        && !duplicatedProviderTransaction
                                                        .getId()
                                                        .equals(
                                                                        payment.getId())) {

                                return buildIpnResponse(
                                                "02",
                                                "Transaction already used");
                        }
                }

                applyCallbackData(
                                payment,
                                parameters);

                String responseCode = payment.getResponseCode();

                String transactionStatus = payment.getTransactionStatus();

                boolean paymentSucceeded = "00".equals(responseCode)
                                && "00".equals(
                                                transactionStatus);

                /*
                 * Callback hợp lệ nhưng thanh toán thất bại
                 * hoặc user hủy tại VNPay.
                 */
                if (!paymentSucceeded) {

                        boolean canceled = "24".equals(
                                        responseCode);

                        payment.setStatus(
                                        canceled
                                                        ? MembershipPaymentTransaction.STATUS_CANCELED
                                                        : MembershipPaymentTransaction.STATUS_FAILED);

                        payment.setFailureReason(
                                        canceled
                                                        ? "Payment was canceled by the member"
                                                        : "VNPAY payment failed with response code "
                                                                        + safeCallbackText(
                                                                                        responseCode));

                        membershipPaymentTransactionRepository
                                        .saveAndFlush(
                                                        payment);

                        return buildIpnResponse(
                                        "00",
                                        "Confirm success");
                }

                /*
                 * Khóa artist để tuần tự hóa:
                 *
                 * - tạo hoặc cập nhật membership;
                 * - tạo wallet nếu chưa tồn tại;
                 * - cộng pendingBalance.
                 *
                 * UserRepository hiện đã có
                 * findByIdForUpdate().
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

                payment.setStatus(
                                MembershipPaymentTransaction.STATUS_PROCESSING);

                /*
                 * Toàn bộ membership + ledger + wallet
                 * chạy trong cùng transaction này.
                 */
                ArtistMembershipSubscription subscription = artistMembershipActivationService
                                .activatePaidMembership(
                                                payment,
                                                paidAt);

                payment.setSubscriptionId(
                                subscription.getId());

                payment.setStatus(
                                MembershipPaymentTransaction.STATUS_PAID);

                payment.setPaidAt(
                                paidAt);

                payment.setFailureReason(
                                null);

                membershipPaymentTransactionRepository
                                .saveAndFlush(
                                                payment);

                return buildIpnResponse(
                                "00",
                                "Confirm success");
        }

        /*
         * =========================
         * MEMBERSHIP VNPAY RETURN
         * =========================
         *
         * Return URL chỉ dùng để hiển thị kết quả.
         * Không kích hoạt membership tại đây.
         *
         * Membership chỉ được kích hoạt bởi IPN.
         */
        @Transactional(readOnly = true)
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

                boolean signatureValid = parameters != null
                                && VNPayHelper.verifySignature(
                                                parameters,
                                                vnPayConfig.getHashSecret());

                boolean merchantValid = parameters != null
                                && vnPayConfig
                                                .getTmnCode()
                                                .equals(
                                                                parameters.get(
                                                                                "vnp_TmnCode"));

                MembershipPaymentTransaction payment = orderCode.startsWith("SCM")
                                ? membershipPaymentTransactionRepository
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

                boolean paymentConfirmed = payment != null
                                && MembershipPaymentTransaction.STATUS_PAID
                                                .equalsIgnoreCase(
                                                                payment.getStatus());

                result.put(
                                "paymentType",
                                "MEMBERSHIP");

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
                                                ? MembershipPaymentTransaction.STATUS_PENDING
                                                : payment.getStatus());

                result.put(
                                "subscriptionId",
                                payment == null
                                                ? null
                                                : payment.getSubscriptionId());

                result.put(
                                "artistId",
                                payment == null
                                                ? null
                                                : payment.getArtistId());

                result.put(
                                "planId",
                                payment == null
                                                ? null
                                                : payment.getPlanId());

                return result;
        }

        /*
         * =========================
         * RESPONSE
         * =========================
         */
        private Map<String, Object> buildPaymentResponse(
                        MembershipPaymentTransaction payment,
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
                                "memberId",
                                payment.getMemberId());

                result.put(
                                "artistId",
                                payment.getArtistId());

                result.put(
                                "planId",
                                payment.getPlanId());

                result.put(
                                "planCode",
                                payment.getPlanCodeSnapshot());

                result.put(
                                "planName",
                                payment.getPlanNameSnapshot());

                result.put(
                                "badgeName",
                                payment.getBadgeNameSnapshot());

                result.put(
                                "badgeColor",
                                payment.getBadgeColorSnapshot());

                result.put(
                                "periodDays",
                                payment.getPeriodDays());

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
                                "subscriptionId",
                                payment.getSubscriptionId());

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
         * ORDER CODE
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

                        String orderCode = "SCM"
                                        + timestamp
                                        + randomPart;

                        if (!membershipPaymentTransactionRepository
                                        .existsByOrderCode(
                                                        orderCode)) {

                                return orderCode;
                        }
                }

                throw new IllegalStateException(
                                "Unable to generate membership payment order code");
        }

        /*
         * =========================
         * VALIDATION
         * =========================
         */
        private void validateMemberId(
                        String memberId) {

                if (memberId == null
                                || memberId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Member ID is required");
                }
        }

        private long normalizeAmount(
                        Long amount) {

                if (amount == null
                                || amount <= 0L) {

                        throw new IllegalStateException(
                                        "Membership plan price is invalid");
                }

                return amount;
        }

        private int normalizePlatformFeePercent(
                        int value) {

                if (value < 0
                                || value >= 100) {

                        throw new IllegalStateException(
                                        "Membership platform fee percent must be between 0 and 99");
                }

                return value;
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

        private String normalizeRequired(
                        String value,
                        String fieldName) {

                if (value == null
                                || value.isBlank()) {

                        throw new IllegalArgumentException(
                                        fieldName + " is required");
                }

                return value.trim();
        }

        private String normalizeSnapshot(
                        String value,
                        String defaultValue) {

                if (value == null
                                || value.isBlank()) {

                        return defaultValue;
                }

                return value.trim();
        }

        private String normalizeBadgeColor(
                        String value) {

                if (value == null
                                || !value
                                                .trim()
                                                .matches(
                                                                "^#[0-9a-fA-F]{6}$")) {

                        return "#FF5500";
                }

                return value
                                .trim()
                                .toUpperCase(
                                                Locale.ROOT);
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
         * CALLBACK HELPERS
         * =========================
         */
        private void applyCallbackData(
                        MembershipPaymentTransaction payment,
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

        private Map<String, String> buildIpnResponse(
                        String responseCode,
                        String message) {

                Map<String, String> result = new LinkedHashMap<>();

                result.put(
                                "RspCode",
                                responseCode);

                result.put(
                                "Message",
                                message);

                return result;
        }

        private Long parseVNPayAmount(
                        String value) {

                if (value == null
                                || value.isBlank()) {

                        return null;
                }

                try {
                        long rawAmount = Long.parseLong(
                                        value.trim());

                        if (rawAmount < 0L
                                        || rawAmount % 100L != 0L) {

                                return null;
                        }

                        return rawAmount / 100L;

                } catch (NumberFormatException e) {
                        return null;
                }
        }

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
         * Không lưu vnp_SecureHash vào payload audit.
         * Hash secret không nằm trong callback nhưng
         * cũng không cần giữ secure hash lâu dài.
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
                                                        || "vnp_SecureHash".equals(key)
                                                        || "vnp_SecureHashType".equals(key)) {

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

                                        payload.append(key)
                                                        .append("=")
                                                        .append(value);
                                });

                return payload.toString();
        }
}