package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.configs.VNPayConfig;
import com.example.demo.dtos.CreatePaymentDTO;
import com.example.demo.entities.PaymentTransaction;
import com.example.demo.entities.SubscriptionPlan;
import com.example.demo.entities.User;
import com.example.demo.helpers.VNPayHelper;
import com.example.demo.repositories.PaymentTransactionRepository;
import com.example.demo.repositories.SubscriptionPlanRepository;
import com.example.demo.repositories.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class PaymentService {

        private static final String PLAN_BASIC = "BASIC";

        private static final String CURRENCY_VND = "VND";

        private static final ZoneId VIETNAM_ZONE = ZoneId.of(
                        "Asia/Ho_Chi_Minh");

        private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern(
                        "yyyyMMddHHmmss");

        private final VNPayConfig vnPayConfig;

        private final PaymentTransactionRepository paymentTransactionRepository;

        private final SubscriptionPlanRepository subscriptionPlanRepository;

        private final UserRepository userRepository;

        private final SubscriptionService subscriptionService;

        private final JsonMapper jsonMapper;

        public PaymentService(
                        VNPayConfig vnPayConfig,
                        PaymentTransactionRepository paymentTransactionRepository,
                        SubscriptionPlanRepository subscriptionPlanRepository,
                        UserRepository userRepository,
                        SubscriptionService subscriptionService,
                        JsonMapper jsonMapper) {

                this.vnPayConfig = vnPayConfig;

                this.paymentTransactionRepository = paymentTransactionRepository;

                this.subscriptionPlanRepository = subscriptionPlanRepository;

                this.userRepository = userRepository;

                this.subscriptionService = subscriptionService;

                this.jsonMapper = jsonMapper;
        }

        /*
         * =========================
         * CREATE VNPAY PAYMENT
         * =========================
         */
        @Transactional
        public Map<String, Object> createPayment(
                        String userId,
                        CreatePaymentDTO dto,
                        HttpServletRequest request) {

                vnPayConfig.validate();

                if (userId == null
                                || userId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "User ID is required");
                }

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Payment information is required");
                }

                User user = userRepository
                                .findById(userId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "User not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                user.getAccountStatus())) {

                        throw new IllegalArgumentException(
                                        "This account cannot create a payment");
                }

                String planCode = normalizePlanCode(
                                dto.getPlanCode());

                if (planCode.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Plan code is required");
                }

                if (PLAN_BASIC.equals(planCode)) {
                        throw new IllegalArgumentException(
                                        "Basic plan does not require payment");
                }

                SubscriptionPlan plan = subscriptionPlanRepository
                                .findByCodeAndIsActiveTrue(
                                                planCode);

                if (plan == null) {
                        throw new IllegalArgumentException(
                                        "Subscription plan not found");
                }

                Long amount = plan.getMonthlyPrice();

                if (amount == null
                                || amount <= 0) {

                        throw new IllegalStateException(
                                        "Subscription plan price is invalid");
                }

                LocalDateTime now = nowInVietnam();

                Optional<PaymentTransaction> pendingPaymentOptional = paymentTransactionRepository
                                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                                                userId,
                                                PaymentTransaction.STATUS_PENDING);

                if (pendingPaymentOptional.isPresent()) {

                        PaymentTransaction pendingPayment = pendingPaymentOptional.get();

                        boolean samePlan = plan.getId().equals(
                                        pendingPayment.getPlanId());

                        boolean stillValid = pendingPayment.getExpiresAt() != null
                                        && now.isBefore(
                                                        pendingPayment.getExpiresAt());

                        boolean hasPaymentUrl = pendingPayment.getPaymentUrl() != null
                                        && !pendingPayment
                                                        .getPaymentUrl()
                                                        .isBlank();

                        if (samePlan
                                        && stillValid
                                        && hasPaymentUrl) {

                                return buildCreatePaymentResponse(
                                                pendingPayment,
                                                plan,
                                                true);
                        }

                        if (!stillValid) {
                                pendingPayment.setStatus(
                                                PaymentTransaction.STATUS_EXPIRED);

                                pendingPayment.setFailureReason(
                                                "Payment session expired.");

                                pendingPayment.setUpdatedAt(
                                                now);

                                paymentTransactionRepository.save(
                                                pendingPayment);
                        }
                }

                String locale = normalizeLocale(
                                dto.getLocale());

                String bankCode = normalizeBankCode(
                                dto.getBankCode());

                String paymentId = generateId();

                String orderCode = generateUniqueOrderCode();

                LocalDateTime expiresAt = now.plusMinutes(
                                vnPayConfig.getExpireMinutes());

                String orderInfo = VNPayHelper.normalizeOrderInfo(
                                "Thanh toan goi "
                                                + plan.getCode()
                                                + " SoundClone "
                                                + orderCode);

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
                                                                amount,
                                                                100L)));

                parameters.put(
                                "vnp_CurrCode",
                                VNPayConfig.CURRENCY_VND);

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
                                formatVNPayDate(now));

                parameters.put(
                                "vnp_ExpireDate",
                                formatVNPayDate(expiresAt));

                if (bankCode != null) {
                        parameters.put(
                                        "vnp_BankCode",
                                        bankCode);
                }

                String paymentUrl = VNPayHelper.buildPaymentUrl(
                                vnPayConfig.getPayUrl(),
                                parameters,
                                vnPayConfig.getHashSecret());

                PaymentTransaction payment = new PaymentTransaction();

                payment.setId(
                                paymentId);

                payment.setUserId(
                                userId);

                payment.setPlanId(
                                plan.getId());

                payment.setSubscriptionId(
                                null);

                payment.setProvider(
                                PaymentTransaction.PROVIDER_VNPAY);

                payment.setOrderCode(
                                orderCode);

                payment.setAmount(
                                amount);

                payment.setCurrency(
                                CURRENCY_VND);

                payment.setStatus(
                                PaymentTransaction.STATUS_PENDING);

                payment.setPaymentUrl(
                                paymentUrl);

                payment.setOrderInfo(
                                orderInfo);

                payment.setFailureReason(
                                null);

                payment.setExpiresAt(
                                expiresAt);

                payment.setCreatedAt(
                                now);

                payment.setUpdatedAt(
                                now);

                PaymentTransaction savedPayment = paymentTransactionRepository.save(
                                payment);

                return buildCreatePaymentResponse(
                                savedPayment,
                                plan,
                                false);
        }

        /*
         * =========================
         * PROCESS VNPAY IPN
         * =========================
         */
        @Transactional
        public Map<String, String> processIpn(
                        Map<String, String> requestParameters) {

                vnPayConfig.validate();

                Map<String, String> parameters = normalizeVNPayParameters(
                                requestParameters);

                if (!VNPayHelper.verifySignature(
                                parameters,
                                vnPayConfig.getHashSecret())) {

                        return buildIpnResponse(
                                        "97",
                                        "Invalid signature");
                }

                String receivedTmnCode = parameters.get(
                                "vnp_TmnCode");

                if (!vnPayConfig
                                .getTmnCode()
                                .equals(receivedTmnCode)) {

                        return buildIpnResponse(
                                        "97",
                                        "Invalid merchant code");
                }

                String orderCode = normalize(
                                parameters.get(
                                                "vnp_TxnRef"));

                if (orderCode.isBlank()) {
                        return buildIpnResponse(
                                        "01",
                                        "Order not found");
                }

                PaymentTransaction payment = paymentTransactionRepository
                                .findByOrderCodeForUpdate(
                                                orderCode)
                                .orElse(null);

                if (payment == null) {
                        return buildIpnResponse(
                                        "01",
                                        "Order not found");
                }

                String receivedAmount = normalize(
                                parameters.get(
                                                "vnp_Amount"));

                String expectedAmount = String.valueOf(
                                Math.multiplyExact(
                                                payment.getAmount(),
                                                100L));

                if (!expectedAmount.equals(
                                receivedAmount)) {

                        return buildIpnResponse(
                                        "04",
                                        "Invalid amount");
                }

                /*
                 * PAID là trạng thái thành công cuối cùng.
                 * Callback lặp lại không được kích hoạt gói lần nữa.
                 *
                 * FAILED/CANCELED/EXPIRED vẫn được phép nâng lên PAID
                 * nếu VNPay gửi IPN thành công đến muộn.
                 */
                if (PaymentTransaction.STATUS_PAID
                                .equalsIgnoreCase(
                                                payment.getStatus())) {

                        return buildIpnResponse(
                                        "02",
                                        "Order already confirmed");
                }

                LocalDateTime now = nowInVietnam();

                String responseCode = normalize(
                                parameters.get(
                                                "vnp_ResponseCode"));

                String transactionStatus = normalize(
                                parameters.get(
                                                "vnp_TransactionStatus"));

                payment.setProviderTransactionId(
                                normalizeNullable(
                                                parameters.get(
                                                                "vnp_TransactionNo")));

                payment.setResponseCode(
                                responseCode);

                payment.setTransactionStatus(
                                transactionStatus);

                payment.setBankCode(
                                normalizeNullable(
                                                parameters.get(
                                                                "vnp_BankCode")));

                payment.setBankTransactionNo(
                                normalizeNullable(
                                                parameters.get(
                                                                "vnp_BankTranNo")));

                payment.setCardType(
                                normalizeNullable(
                                                parameters.get(
                                                                "vnp_CardType")));

                payment.setCallbackPayload(
                                serializePayload(
                                                parameters));

                payment.setUpdatedAt(
                                now);

                boolean paymentSuccessful = "00".equals(responseCode)
                                && "00".equals(
                                                transactionStatus);

                if (paymentSuccessful) {

                        SubscriptionPlan plan = subscriptionPlanRepository
                                        .findById(payment.getPlanId())
                                        .orElseThrow(
                                                        () -> new IllegalStateException(
                                                                        "Subscription plan not found"));

                        LocalDateTime paidAt = parseVNPayDate(
                                        parameters.get("vnp_PayDate"),
                                        now);

                        Map<String, Object> subscriptionData = subscriptionService
                                        .activatePaidPlan(
                                                        payment.getUserId(),
                                                        plan.getCode(),
                                                        paidAt);

                        payment.setSubscriptionId(
                                        extractSubscriptionId(
                                                        subscriptionData));

                        payment.setStatus(
                                        PaymentTransaction.STATUS_PAID);

                        payment.setFailureReason(null);

                        payment.setPaidAt(paidAt);

                } else if (PaymentTransaction.STATUS_PENDING.equalsIgnoreCase(
                                payment.getStatus())
                                || PaymentTransaction.STATUS_PROCESSING.equalsIgnoreCase(
                                                payment.getStatus())) {

                        payment.setStatus(
                                        resolveFailedStatus(
                                                        responseCode));

                        payment.setFailureReason(
                                        "VNPAY payment failed. Response code: "
                                                        + responseCode);
                }

                paymentTransactionRepository.save(
                                payment);

                return buildIpnResponse(
                                "00",
                                "Confirm Success");
        }

        /*
         * =========================
         * GET USER PAYMENT
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getUserPayment(
                        String userId,
                        String orderCode) {

                if (userId == null || userId.isBlank()) {
                        throw new IllegalArgumentException(
                                        "User ID is required");
                }

                String normalizedOrderCode = normalize(
                                orderCode);

                if (normalizedOrderCode.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Payment order code is required");
                }

                PaymentTransaction payment = paymentTransactionRepository
                                .findByOrderCode(
                                                normalizedOrderCode)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Payment not found"));

                if (!userId.equals(
                                payment.getUserId())) {

                        throw new IllegalArgumentException(
                                        "Payment not found");
                }

                return toPaymentResponse(
                                payment);
        }

        /*
         * =========================
         * HANDLE VNPAY RETURN
         * =========================
         */
        @Transactional
        public Map<String, Object> handleReturn(
                        Map<String, String> requestParameters) {

                vnPayConfig.validate();

                Map<String, String> parameters = normalizeVNPayParameters(
                                requestParameters);

                boolean signatureValid = VNPayHelper.verifySignature(
                                parameters,
                                vnPayConfig.getHashSecret());

                boolean merchantValid = vnPayConfig.getTmnCode().equals(
                                normalize(
                                                parameters.get(
                                                                "vnp_TmnCode")));

                String orderCode = normalize(
                                parameters.get(
                                                "vnp_TxnRef"));

                PaymentTransaction payment = orderCode.isBlank()
                                ? null
                                : paymentTransactionRepository
                                                .findByOrderCodeForUpdate(
                                                                orderCode)
                                                .orElse(null);

                boolean amountValid = payment != null
                                && String.valueOf(
                                                Math.multiplyExact(
                                                                payment.getAmount(),
                                                                100L))
                                                .equals(
                                                                normalize(
                                                                                parameters.get(
                                                                                                "vnp_Amount")));

                String responseCode = normalize(
                                parameters.get(
                                                "vnp_ResponseCode"));

                String transactionStatus = normalize(
                                parameters.get(
                                                "vnp_TransactionStatus"));

                boolean vnpayReportedSuccess = "00".equals(responseCode)
                                && "00".equals(
                                                transactionStatus);

                /*
                 * RETURN FALLBACK:
                 * IPN vẫn là callback chính, nhưng Return hợp lệ
                 * được phép đồng bộ trạng thái khi IPN đến chậm
                 * hoặc không đến trong môi trường Sandbox.
                 */
                if (signatureValid
                                && merchantValid
                                && amountValid
                                && payment != null) {

                        LocalDateTime now = nowInVietnam();

                        payment.setProviderTransactionId(
                                        normalizeNullable(
                                                        parameters.get(
                                                                        "vnp_TransactionNo")));

                        payment.setResponseCode(
                                        responseCode);

                        payment.setTransactionStatus(
                                        transactionStatus);

                        payment.setBankCode(
                                        normalizeNullable(
                                                        parameters.get(
                                                                        "vnp_BankCode")));

                        payment.setBankTransactionNo(
                                        normalizeNullable(
                                                        parameters.get(
                                                                        "vnp_BankTranNo")));

                        payment.setCardType(
                                        normalizeNullable(
                                                        parameters.get(
                                                                        "vnp_CardType")));

                        payment.setCallbackPayload(
                                        serializePayload(
                                                        parameters));

                        payment.setUpdatedAt(
                                        now);

                        /*
                         * Không kích hoạt lại nếu giao dịch
                         * đã được IPN xử lý thành PAID.
                         */
                        if (vnpayReportedSuccess
                                        && !PaymentTransaction.STATUS_PAID
                                                        .equalsIgnoreCase(
                                                                        payment.getStatus())) {

                                SubscriptionPlan plan = subscriptionPlanRepository
                                                .findById(
                                                                payment.getPlanId())
                                                .orElseThrow(
                                                                () -> new IllegalStateException(
                                                                                "Subscription plan not found"));

                                LocalDateTime paidAt = parseVNPayDate(
                                                parameters.get(
                                                                "vnp_PayDate"),
                                                now);

                                Map<String, Object> subscriptionData = subscriptionService
                                                .activatePaidPlan(
                                                                payment.getUserId(),
                                                                plan.getCode(),
                                                                paidAt);

                                payment.setSubscriptionId(
                                                extractSubscriptionId(
                                                                subscriptionData));

                                payment.setStatus(
                                                PaymentTransaction.STATUS_PAID);

                                payment.setPaidAt(
                                                paidAt);

                                payment.setFailureReason(
                                                null);

                        } else if (!vnpayReportedSuccess
                                        && (PaymentTransaction.STATUS_PENDING
                                                        .equalsIgnoreCase(
                                                                        payment.getStatus())
                                                        || PaymentTransaction.STATUS_PROCESSING
                                                                        .equalsIgnoreCase(
                                                                                        payment.getStatus()))) {

                                payment.setStatus(
                                                resolveFailedStatus(
                                                                responseCode));

                                payment.setFailureReason(
                                                "VNPAY payment failed. Response code: "
                                                                + responseCode);
                        }

                        paymentTransactionRepository.save(
                                        payment);
                }

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "signatureValid",
                                signatureValid);

                result.put(
                                "merchantValid",
                                merchantValid);

                result.put(
                                "amountValid",
                                amountValid);

                result.put(
                                "orderFound",
                                payment != null);

                result.put(
                                "orderCode",
                                orderCode);

                result.put(
                                "vnpayReportedSuccess",
                                vnpayReportedSuccess);

                result.put(
                                "paymentConfirmed",
                                payment != null
                                                && PaymentTransaction.STATUS_PAID
                                                                .equalsIgnoreCase(
                                                                                payment.getStatus()));

                result.put(
                                "status",
                                payment == null
                                                ? null
                                                : payment.getStatus());

                result.put(
                                "amount",
                                payment == null
                                                ? null
                                                : payment.getAmount());

                result.put(
                                "currency",
                                payment == null
                                                ? CURRENCY_VND
                                                : payment.getCurrency());

                result.put(
                                "responseCode",
                                responseCode);

                result.put(
                                "transactionStatus",
                                transactionStatus);

                result.put(
                                "providerTransactionId",
                                parameters.get(
                                                "vnp_TransactionNo"));

                return result;
        }

        /*
         * =========================
         * PAYMENT RESPONSE
         * =========================
         */
        private Map<String, Object> buildCreatePaymentResponse(
                        PaymentTransaction payment,
                        SubscriptionPlan plan,
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
                                "planCode",
                                plan.getCode());

                result.put(
                                "planName",
                                plan.getName());

                result.put(
                                "amount",
                                payment.getAmount());

                result.put(
                                "currency",
                                payment.getCurrency());

                result.put(
                                "status",
                                payment.getStatus());

                result.put(
                                "paymentUrl",
                                payment.getPaymentUrl());

                result.put(
                                "expiresAt",
                                payment.getExpiresAt());

                result.put(
                                "reused",
                                reused);

                return result;
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

        /*
         * =========================
         * CALLBACK PARAMETERS
         * =========================
         */
        private Map<String, String> normalizeVNPayParameters(
                        Map<String, String> source) {

                Map<String, String> result = new TreeMap<>();

                if (source == null) {
                        return result;
                }

                for (Map.Entry<String, String> entry : source.entrySet()) {

                        String key = entry.getKey();

                        if (key == null
                                        || !key.startsWith(
                                                        "vnp_")) {

                                continue;
                        }

                        result.put(
                                        key,
                                        entry.getValue() == null
                                                        ? ""
                                                        : entry.getValue());
                }

                return result;
        }

        private String serializePayload(
                        Map<String, String> parameters) {

                try {
                        return jsonMapper.writeValueAsString(
                                        parameters);

                } catch (JacksonException e) {
                        return parameters.toString();
                }
        }

        /*
         * =========================
         * SUBSCRIPTION RESPONSE
         * =========================
         */
        private String extractSubscriptionId(
                        Map<String, Object> subscriptionData) {

                if (subscriptionData == null) {
                        throw new IllegalStateException(
                                        "Subscription activation returned no data");
                }

                Object subscriptionObject = subscriptionData.get(
                                "subscription");

                if (!(subscriptionObject instanceof Map<?, ?> subscriptionMap)) {

                        throw new IllegalStateException(
                                        "Subscription activation response is invalid");
                }

                Object subscriptionId = subscriptionMap.get(
                                "id");

                if (subscriptionId == null
                                || subscriptionId
                                                .toString()
                                                .isBlank()) {

                        throw new IllegalStateException(
                                        "Activated subscription ID is missing");
                }

                return subscriptionId
                                .toString();
        }

        /*
         * =========================
         * VALUE NORMALIZATION
         * =========================
         */
        private String normalizePlanCode(
                        String value) {

                return normalize(value)
                                .toUpperCase();
        }

        private String normalizeLocale(
                        String value) {

                return "en".equalsIgnoreCase(
                                normalize(value))
                                                ? "en"
                                                : VNPayConfig.DEFAULT_LOCALE;
        }

        private String normalizeBankCode(
                        String value) {

                String normalized = normalize(value)
                                .toUpperCase();

                if (normalized.isBlank()) {
                        return null;
                }

                if (!normalized.matches(
                                "[A-Z0-9]{3,20}")) {

                        throw new IllegalArgumentException(
                                        "Invalid VNPAY bank code");
                }

                return normalized;
        }

        private String normalize(
                        String value) {

                return value == null
                                ? ""
                                : value.trim();
        }

        private String normalizeNullable(
                        String value) {

                String normalized = normalize(value);

                return normalized.isBlank()
                                ? null
                                : normalized;
        }

        private String limitLength(
                        String value,
                        int maxLength) {

                String normalized = normalize(value);

                if (normalized.length() <= maxLength) {

                        return normalized;
                }

                return normalized.substring(
                                0,
                                maxLength);
        }

        /*
         * =========================
         * DATE HELPERS
         * =========================
         */
        private LocalDateTime nowInVietnam() {

                return ZonedDateTime
                                .now(VIETNAM_ZONE)
                                .toLocalDateTime();
        }

        private String formatVNPayDate(
                        LocalDateTime value) {

                return value.format(
                                VNPAY_DATE_FORMAT);
        }

        private LocalDateTime parseVNPayDate(
                        String value,
                        LocalDateTime fallback) {

                String normalized = normalize(value);

                if (normalized.isBlank()) {
                        return fallback;
                }

                try {
                        return LocalDateTime.parse(
                                        normalized,
                                        VNPAY_DATE_FORMAT);

                } catch (DateTimeParseException e) {
                        return fallback;
                }
        }

        /*
         * =========================
         * PAYMENT STATUS
         * =========================
         */
        private String resolveFailedStatus(
                        String responseCode) {

                if ("24".equals(responseCode)) {
                        return PaymentTransaction.STATUS_CANCELED;
                }

                if ("11".equals(responseCode)) {
                        return PaymentTransaction.STATUS_EXPIRED;
                }

                return PaymentTransaction.STATUS_FAILED;
        }

        /*
         * =========================
         * ID GENERATION
         * =========================
         */
        private String generateId() {

                return UUID.randomUUID()
                                .toString()
                                .replace("-", "")
                                .substring(0, 24);
        }

        private String generateUniqueOrderCode() {

                for (int attempt = 0; attempt < 10; attempt++) {

                        String orderCode = "SC"
                                        + formatVNPayDate(
                                                        nowInVietnam())
                                        + UUID.randomUUID()
                                                        .toString()
                                                        .replace("-", "")
                                                        .substring(0, 8)
                                                        .toUpperCase();

                        if (!paymentTransactionRepository
                                        .existsByOrderCode(
                                                        orderCode)) {

                                return orderCode;
                        }
                }

                throw new IllegalStateException(
                                "Cannot generate unique payment order code");
        }

        /*
         * =========================
         * USER PAYMENT HISTORY
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getUserPayments(
                        String userId,
                        int current,
                        int pageSize) {

                if (userId == null || userId.isBlank()) {
                        throw new IllegalArgumentException(
                                        "User ID is required");
                }

                int safeCurrent = Math.max(current, 1);

                int safePageSize = Math.min(
                                Math.max(pageSize, 1),
                                100);

                Pageable pageable = PageRequest.of(
                                safeCurrent - 1,
                                safePageSize);

                Page<PaymentTransaction> paymentPage = paymentTransactionRepository
                                .findByUserIdOrderByCreatedAtDesc(
                                                userId,
                                                pageable);

                return buildPaymentPageResponse(
                                paymentPage,
                                safeCurrent,
                                safePageSize);
        }

        /*
         * =========================
         * ADMIN PAYMENT LIST
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getAdminPayments(
                        String status,
                        int current,
                        int pageSize) {

                int safeCurrent = Math.max(current, 1);

                int safePageSize = Math.min(
                                Math.max(pageSize, 1),
                                100);

                Pageable pageable = PageRequest.of(
                                safeCurrent - 1,
                                safePageSize);

                String normalizedStatus = normalize(status)
                                .toUpperCase();

                Page<PaymentTransaction> paymentPage;

                if (normalizedStatus.isBlank()) {

                        paymentPage = paymentTransactionRepository
                                        .findAllByOrderByCreatedAtDesc(
                                                        pageable);

                } else {

                        if (!isSupportedPaymentStatus(
                                        normalizedStatus)) {

                                throw new IllegalArgumentException(
                                                "Invalid payment status");
                        }

                        paymentPage = paymentTransactionRepository
                                        .findByStatusOrderByCreatedAtDesc(
                                                        normalizedStatus,
                                                        pageable);
                }

                return buildPaymentPageResponse(
                                paymentPage,
                                safeCurrent,
                                safePageSize);
        }

        /*
         * =========================
         * PAYMENT PAGE RESPONSE
         * =========================
         */
        private Map<String, Object> buildPaymentPageResponse(
                        Page<PaymentTransaction> paymentPage,
                        int current,
                        int pageSize) {

                List<Map<String, Object>> result = paymentPage.getContent()
                                .stream()
                                .map(this::toPaymentResponse)
                                .toList();

                Map<String, Object> meta = new LinkedHashMap<>();

                meta.put(
                                "current",
                                current);

                meta.put(
                                "pageSize",
                                pageSize);

                meta.put(
                                "pages",
                                paymentPage.getTotalPages());

                meta.put(
                                "total",
                                paymentPage.getTotalElements());

                Map<String, Object> response = new LinkedHashMap<>();

                response.put(
                                "meta",
                                meta);

                response.put(
                                "result",
                                result);

                return response;
        }

        /*
         * =========================
         * PAYMENT ITEM RESPONSE
         * =========================
         */
        private Map<String, Object> toPaymentResponse(
                        PaymentTransaction payment) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                payment.getId());

                result.put(
                                "userId",
                                payment.getUserId());

                result.put(
                                "planId",
                                payment.getPlanId());

                result.put(
                                "subscriptionId",
                                payment.getSubscriptionId());

                result.put(
                                "orderCode",
                                payment.getOrderCode());

                result.put(
                                "provider",
                                payment.getProvider());

                result.put(
                                "amount",
                                payment.getAmount());

                result.put(
                                "currency",
                                payment.getCurrency());

                result.put(
                                "status",
                                payment.getStatus());

                result.put(
                                "responseCode",
                                payment.getResponseCode());

                result.put(
                                "transactionStatus",
                                payment.getTransactionStatus());

                result.put(
                                "providerTransactionId",
                                payment.getProviderTransactionId());

                result.put(
                                "bankCode",
                                payment.getBankCode());

                result.put(
                                "bankTransactionNo",
                                payment.getBankTransactionNo());

                result.put(
                                "cardType",
                                payment.getCardType());

                result.put(
                                "failureReason",
                                payment.getFailureReason());

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
                                "updatedAt",
                                payment.getUpdatedAt());

                return result;
        }

        /*
         * =========================
         * PAYMENT STATUS VALIDATION
         * =========================
         */
        private boolean isSupportedPaymentStatus(
                        String status) {

                return PaymentTransaction.STATUS_PENDING.equals(status)
                                || PaymentTransaction.STATUS_PROCESSING.equals(status)
                                || PaymentTransaction.STATUS_PAID.equals(status)
                                || PaymentTransaction.STATUS_FAILED.equals(status)
                                || PaymentTransaction.STATUS_CANCELED.equals(status)
                                || PaymentTransaction.STATUS_EXPIRED.equals(status)
                                || PaymentTransaction.STATUS_REFUNDED.equals(status);
        }
}