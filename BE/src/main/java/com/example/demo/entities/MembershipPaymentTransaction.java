package com.example.demo.entities;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

@Entity
@Table(name = "membership_payment_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_membership_payment_order_code", columnNames = "orderCode"),

        @UniqueConstraint(name = "uk_membership_payment_provider_transaction", columnNames = {
                "provider",
                "providerTransactionId"
        })
}, indexes = {
        @Index(name = "idx_membership_payment_member", columnList = "memberId"),

        @Index(name = "idx_membership_payment_artist", columnList = "artistId"),

        @Index(name = "idx_membership_payment_plan", columnList = "planId"),

        @Index(name = "idx_membership_payment_subscription", columnList = "subscriptionId"),

        @Index(name = "idx_membership_payment_status", columnList = "status"),

        @Index(name = "idx_membership_payment_expires_at", columnList = "expiresAt"),

        @Index(name = "idx_membership_payment_created_at", columnList = "createdAt")
})
public class MembershipPaymentTransaction {

    public static final String PROVIDER_VNPAY = "VNPAY";

    public static final String STATUS_PENDING = "PENDING";

    public static final String STATUS_PROCESSING = "PROCESSING";

    public static final String STATUS_PAID = "PAID";

    public static final String STATUS_FAILED = "FAILED";

    public static final String STATUS_CANCELED = "CANCELED";

    public static final String STATUS_EXPIRED = "EXPIRED";

    public static final String STATUS_REFUNDED = "REFUNDED";

    public static final String CURRENCY_VND = "VND";

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    /*
     * User thanh toán để trở thành hội viên.
     */
    @Column(nullable = false, length = 24)
    private String memberId;

    /*
     * Artist nhận doanh thu hội viên.
     */
    @Column(nullable = false, length = 24)
    private String artistId;

    @Column(nullable = false, length = 24)
    private String planId;

    /*
     * Được gán sau khi VNPay xác nhận PAID.
     */
    @Column(length = 24)
    private String subscriptionId;

    @Column(nullable = false, length = 30)
    private String provider = PROVIDER_VNPAY;

    /*
     * Gửi sang VNPay qua vnp_TxnRef.
     * Membership sử dụng prefix SCM.
     */
    @Column(nullable = false, length = 100)
    private String orderCode;

    /*
     * Snapshot thông tin gói tại thời điểm tạo đơn.
     * Sau này artist sửa gói cũng không ảnh hưởng đơn cũ.
     */
    @Column(nullable = false, length = 50)
    private String planCodeSnapshot;

    @Column(nullable = false, length = 100)
    private String planNameSnapshot;

    @Column(nullable = false, length = 100)
    private String badgeNameSnapshot;

    @Column(nullable = false, length = 20)
    private String badgeColorSnapshot;

    /*
     * Số ngày hội viên được cấp sau khi thanh toán.
     */
    @Column(nullable = false)
    private Integer periodDays = 30;

    /*
     * Tổng tiền member thanh toán.
     */
    @Column(nullable = false)
    private Long grossAmount;

    /*
     * Snapshot tỷ lệ phí SoundClone.
     */
    @Column(nullable = false)
    private Integer platformFeePercent;

    /*
     * Phần SoundClone giữ lại.
     */
    @Column(nullable = false)
    private Long platformFeeAmount;

    /*
     * Phần doanh thu của artist.
     */
    @Column(nullable = false)
    private Long artistNetAmount;

    @Column(nullable = false, length = 10)
    private String currency = CURRENCY_VND;

    @Column(nullable = false, length = 30)
    private String status = STATUS_PENDING;

    @Column(length = 100)
    private String providerTransactionId;

    @Column(length = 20)
    private String responseCode;

    @Column(length = 20)
    private String transactionStatus;

    @Column(length = 50)
    private String bankCode;

    @Column(length = 100)
    private String bankTransactionNo;

    @Column(length = 50)
    private String cardType;

    @Column(columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(length = 255)
    private String orderInfo;

    @Column(length = 500)
    private String failureReason;

    /*
     * Payload IPN/Return dùng để đối soát.
     * Không lưu VNPay Hash Secret.
     */
    @Column(columnDefinition = "TEXT")
    private String callbackPayload;

    private LocalDateTime paidAt;

    private LocalDateTime expiresAt;

    @Version
    private Long version;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {

        LocalDateTime now = LocalDateTime.now();

        if (id == null || id.isBlank()) {
            id = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 24);
        }

        if (provider == null || provider.isBlank()) {
            provider = PROVIDER_VNPAY;
        } else {
            provider = provider
                    .trim()
                    .toUpperCase(Locale.ROOT);
        }

        if (status == null || status.isBlank()) {
            status = STATUS_PENDING;
        } else {
            status = status
                    .trim()
                    .toUpperCase(Locale.ROOT);
        }

        if (currency == null || currency.isBlank()) {
            currency = CURRENCY_VND;
        } else {
            currency = currency
                    .trim()
                    .toUpperCase(Locale.ROOT);
        }

        if (periodDays == null || periodDays <= 0) {
            periodDays = 30;
        }

        if (grossAmount == null) {
            grossAmount = 0L;
        }

        if (platformFeePercent == null) {
            platformFeePercent = 0;
        }

        if (platformFeeAmount == null) {
            platformFeeAmount = 0L;
        }

        if (artistNetAmount == null) {
            artistNetAmount = 0L;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {

        if (status != null) {
            status = status
                    .trim()
                    .toUpperCase(Locale.ROOT);
        }

        updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(
            String id) {
        this.id = id;
    }

    public String getMemberId() {
        return memberId;
    }

    public void setMemberId(
            String memberId) {
        this.memberId = memberId;
    }

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(
            String artistId) {
        this.artistId = artistId;
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

    public String getPlanCodeSnapshot() {
        return planCodeSnapshot;
    }

    public void setPlanCodeSnapshot(
            String planCodeSnapshot) {
        this.planCodeSnapshot = planCodeSnapshot;
    }

    public String getPlanNameSnapshot() {
        return planNameSnapshot;
    }

    public void setPlanNameSnapshot(
            String planNameSnapshot) {
        this.planNameSnapshot = planNameSnapshot;
    }

    public String getBadgeNameSnapshot() {
        return badgeNameSnapshot;
    }

    public void setBadgeNameSnapshot(
            String badgeNameSnapshot) {
        this.badgeNameSnapshot = badgeNameSnapshot;
    }

    public String getBadgeColorSnapshot() {
        return badgeColorSnapshot;
    }

    public void setBadgeColorSnapshot(
            String badgeColorSnapshot) {
        this.badgeColorSnapshot = badgeColorSnapshot;
    }

    public Integer getPeriodDays() {
        return periodDays;
    }

    public void setPeriodDays(
            Integer periodDays) {
        this.periodDays = periodDays;
    }

    public Long getGrossAmount() {
        return grossAmount;
    }

    public void setGrossAmount(
            Long grossAmount) {
        this.grossAmount = grossAmount;
    }

    public Integer getPlatformFeePercent() {
        return platformFeePercent;
    }

    public void setPlatformFeePercent(
            Integer platformFeePercent) {
        this.platformFeePercent = platformFeePercent;
    }

    public Long getPlatformFeeAmount() {
        return platformFeeAmount;
    }

    public void setPlatformFeeAmount(
            Long platformFeeAmount) {
        this.platformFeeAmount = platformFeeAmount;
    }

    public Long getArtistNetAmount() {
        return artistNetAmount;
    }

    public void setArtistNetAmount(
            Long artistNetAmount) {
        this.artistNetAmount = artistNetAmount;
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
        this.status = status;
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

    public Long getVersion() {
        return version;
    }

    public void setVersion(
            Long version) {
        this.version = version;
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
}