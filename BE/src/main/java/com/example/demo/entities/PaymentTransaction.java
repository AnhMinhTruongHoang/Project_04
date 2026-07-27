package com.example.demo.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

@Entity
@Table(name = "payment_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_order_code", columnNames = "orderCode")
}, indexes = {
        @Index(name = "idx_payment_user", columnList = "userId"),
        @Index(name = "idx_payment_plan", columnList = "planId"),
        @Index(name = "idx_payment_status", columnList = "status"),
        @Index(name = "idx_payment_created_at", columnList = "createdAt"),
        @Index(name = "idx_payment_vnp_transaction_no", columnList = "providerTransactionId")
})
public class PaymentTransaction {

    public static final String PROVIDER_VNPAY = "VNPAY";

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_PAID = "PAID";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_CANCELED = "CANCELED";
    public static final String STATUS_EXPIRED = "EXPIRED";
    public static final String STATUS_REFUNDED = "REFUNDED";

    @Id
    @Column(name = "id", nullable = false, length = 24)
    private String id;

    @Column(name = "userId", nullable = false, length = 24)
    private String userId;

    @Column(name = "planId", nullable = false, length = 24)
    private String planId;

    /**
     * Chỉ được gán sau khi giao dịch PAID
     * và subscription được kích hoạt.
     */
    @Column(name = "subscriptionId", length = 24)
    private String subscriptionId;

    @Column(name = "provider", nullable = false, length = 30)
    private String provider;

    /**
     * Giá trị gửi sang VNPAY qua vnp_TxnRef.
     */
    @Column(name = "orderCode", nullable = false, length = 100)
    private String orderCode;

    /**
     * Số tiền thực tế theo VND.
     *
     * Ví dụ:
     * amount = 99000
     *
     * Khi gửi VNPAY:
     * vnp_Amount = amount * 100
     */
    @Column(name = "amount", nullable = false)
    private Long amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    /**
     * Mã giao dịch do VNPAY trả về:
     * vnp_TransactionNo.
     */
    @Column(name = "providerTransactionId", length = 100)
    private String providerTransactionId;

    /**
     * vnp_ResponseCode.
     */
    @Column(name = "responseCode", length = 20)
    private String responseCode;

    /**
     * vnp_TransactionStatus.
     */
    @Column(name = "transactionStatus", length = 20)
    private String transactionStatus;

    /**
     * vnp_BankCode.
     */
    @Column(name = "bankCode", length = 50)
    private String bankCode;

    /**
     * vnp_BankTranNo.
     */
    @Column(name = "bankTransactionNo", length = 100)
    private String bankTransactionNo;

    /**
     * vnp_CardType.
     */
    @Column(name = "cardType", length = 50)
    private String cardType;

    /**
     * URL chuyển người dùng đến VNPAY.
     */
    @Column(name = "paymentUrl", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "orderInfo", length = 255)
    private String orderInfo;

    @Column(name = "failureReason", length = 500)
    private String failureReason;

    /**
     * Lưu payload Return/IPN để đối soát.
     * Không lưu Hash Secret.
     */
    @Column(name = "callbackPayload", columnDefinition = "TEXT")
    private String callbackPayload;

    @Column(name = "paidAt")
    private LocalDateTime paidAt;

    @Column(name = "expiresAt")
    private LocalDateTime expiresAt;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    /**
     * Chống Return URL và IPN cập nhật đè nhau.
     */
    @Version
    @Column(name = "version")
    private Long version;

    public String getId() {
        return id;
    }

    public void setId(
            String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(
            String userId) {
        this.userId = userId;
    }

    public String getPlanId() {
        return planId;
    }

    public void setPlanId(
            String planId) {
        this.planId = planId;
    }

    public String getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(
            String subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(
            String provider) {
        this.provider = provider;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(
            String orderCode) {
        this.orderCode = orderCode;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(
            Long amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(
            String currency) {
        this.currency = currency;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {

        this.status = status == null
                ? null
                : status.trim().toUpperCase();
    }

    public String getProviderTransactionId() {
        return providerTransactionId;
    }

    public void setProviderTransactionId(
            String providerTransactionId) {
        this.providerTransactionId = providerTransactionId;
    }

    public String getResponseCode() {
        return responseCode;
    }

    public void setResponseCode(
            String responseCode) {
        this.responseCode = responseCode;
    }

    public String getTransactionStatus() {
        return transactionStatus;
    }

    public void setTransactionStatus(
            String transactionStatus) {
        this.transactionStatus = transactionStatus;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(
            String bankCode) {
        this.bankCode = bankCode;
    }

    public String getBankTransactionNo() {
        return bankTransactionNo;
    }

    public void setBankTransactionNo(
            String bankTransactionNo) {
        this.bankTransactionNo = bankTransactionNo;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(
            String cardType) {
        this.cardType = cardType;
    }

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public void setPaymentUrl(
            String paymentUrl) {
        this.paymentUrl = paymentUrl;
    }

    public String getOrderInfo() {
        return orderInfo;
    }

    public void setOrderInfo(
            String orderInfo) {
        this.orderInfo = orderInfo;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(
            String failureReason) {
        this.failureReason = failureReason;
    }

    public String getCallbackPayload() {
        return callbackPayload;
    }

    public void setCallbackPayload(
            String callbackPayload) {
        this.callbackPayload = callbackPayload;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(
            LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(
            LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(
            Long version) {
        this.version = version;
    }
}