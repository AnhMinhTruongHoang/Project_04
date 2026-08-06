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
@Table(name = "membership_revenue_ledgers", uniqueConstraints = {
        /*
         * Một payment chỉ được cộng doanh thu
         * cho artist tối đa một lần.
         */
        @UniqueConstraint(name = "uk_membership_revenue_payment", columnNames = "membershipPaymentId")
}, indexes = {
        @Index(name = "idx_membership_revenue_artist", columnList = "artistId"),

        @Index(name = "idx_membership_revenue_member", columnList = "memberId"),

        @Index(name = "idx_membership_revenue_subscription", columnList = "subscriptionId"),

        @Index(name = "idx_membership_revenue_status", columnList = "status"),

        @Index(name = "idx_membership_revenue_available_at", columnList = "availableAt"),

        @Index(name = "idx_membership_revenue_created_at", columnList = "createdAt")
})
public class MembershipRevenueLedger {

    public static final String SOURCE_MEMBERSHIP = "MEMBERSHIP";

    public static final String STATUS_PENDING = "PENDING";

    public static final String STATUS_AVAILABLE = "AVAILABLE";

    public static final String STATUS_REVERSED = "REVERSED";

    public static final String CURRENCY_VND = "VND";

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    @Column(nullable = false, unique = true, length = 24)
    private String membershipPaymentId;

    @Column(nullable = false, length = 24)
    private String subscriptionId;

    @Column(nullable = false, length = 24)
    private String memberId;

    @Column(nullable = false, length = 24)
    private String artistId;

    @Column(nullable = false, length = 24)
    private String planId;

    @Column(nullable = false, length = 30)
    private String sourceType = SOURCE_MEMBERSHIP;

    @Column(nullable = false)
    private Long grossAmount;

    @Column(nullable = false)
    private Long platformFeeAmount;

    /*
     * Doanh thu thực nhận của artist.
     */
    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false, length = 10)
    private String currency = CURRENCY_VND;

    @Column(nullable = false, length = 20)
    private String status = STATUS_PENDING;

    /*
     * Sau thời điểm này, scheduler chuyển:
     *
     * PENDING → AVAILABLE
     */
    @Column(nullable = false)
    private LocalDateTime availableAt;

    private LocalDateTime releasedAt;

    private LocalDateTime reversedAt;

    @Column(length = 500)
    private String reversalReason;

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

        if (sourceType == null || sourceType.isBlank()) {
            sourceType = SOURCE_MEMBERSHIP;
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

        if (grossAmount == null) {
            grossAmount = 0L;
        }

        if (platformFeeAmount == null) {
            platformFeeAmount = 0L;
        }

        if (amount == null) {
            amount = 0L;
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

    public String getMembershipPaymentId() {
        return membershipPaymentId;
    }

    public void setMembershipPaymentId(
            String membershipPaymentId) {
        this.membershipPaymentId = membershipPaymentId;
    }

    public String getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(
            String subscriptionId) {
        this.subscriptionId = subscriptionId;
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

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(
            String sourceType) {
        this.sourceType = sourceType;
    }

    public Long getGrossAmount() {
        return grossAmount;
    }

    public void setGrossAmount(
            Long grossAmount) {
        this.grossAmount = grossAmount;
    }

    public Long getPlatformFeeAmount() {
        return platformFeeAmount;
    }

    public void setPlatformFeeAmount(
            Long platformFeeAmount) {
        this.platformFeeAmount = platformFeeAmount;
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
        this.status = status;
    }

    public LocalDateTime getAvailableAt() {
        return availableAt;
    }

    public void setAvailableAt(
            LocalDateTime availableAt) {
        this.availableAt = availableAt;
    }

    public LocalDateTime getReleasedAt() {
        return releasedAt;
    }

    public void setReleasedAt(
            LocalDateTime releasedAt) {
        this.releasedAt = releasedAt;
    }

    public LocalDateTime getReversedAt() {
        return reversedAt;
    }

    public void setReversedAt(
            LocalDateTime reversedAt) {
        this.reversedAt = reversedAt;
    }

    public String getReversalReason() {
        return reversalReason;
    }

    public void setReversalReason(
            String reversalReason) {
        this.reversalReason = reversalReason;
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