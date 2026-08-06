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
@Table(name = "artist_membership_subscriptions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_membership_subscription_member_artist", columnNames = {
                "memberId",
                "artistId"
        })
}, indexes = {
        @Index(name = "idx_membership_subscription_member", columnList = "memberId"),

        @Index(name = "idx_membership_subscription_artist", columnList = "artistId"),

        @Index(name = "idx_membership_subscription_plan", columnList = "planId"),

        @Index(name = "idx_membership_subscription_status", columnList = "status"),

        @Index(name = "idx_membership_subscription_period_end", columnList = "currentPeriodEnd")
})

public class ArtistMembershipSubscription {

    public static final String STATUS_ACTIVE = "ACTIVE";

    public static final String STATUS_CANCELED = "CANCELED";

    public static final String STATUS_EXPIRED = "EXPIRED";

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 24)
    private String id;

    /*
     * User đăng ký làm hội viên.
     */
    @Column(name = "memberId", nullable = false, length = 24)
    private String memberId;

    /*
     * Artist nhận đăng ký hội viên.
     */
    @Column(name = "artistId", nullable = false, length = 24)
    private String artistId;

    @Column(name = "planId", nullable = false, length = 24)
    private String planId;

    /*
     * Giao dịch thanh toán gần nhất đã kích hoạt
     * hoặc gia hạn membership.
     */
    @Column(name = "latestPaymentId", length = 24)
    private String latestPaymentId;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

    /*
     * Thời điểm user lần đầu trở thành hội viên
     * của artist này.
     */
    @Column(name = "startedAt", nullable = false)
    private LocalDateTime startedAt;

    /*
     * Chu kỳ membership hiện tại.
     */
    @Column(name = "currentPeriodStart", nullable = false)
    private LocalDateTime currentPeriodStart;

    @Column(name = "currentPeriodEnd", nullable = false)
    private LocalDateTime currentPeriodEnd;

    /*
     * MVP chưa tự động trừ tiền.
     *
     * Field này vẫn được giữ để hỗ trợ:
     * user hủy nhưng tiếp tục dùng tới cuối kỳ.
     */
    @Column(name = "cancelAtPeriodEnd", nullable = false)
    private Boolean cancelAtPeriodEnd = false;

    private LocalDateTime canceledAt;

    private LocalDateTime expiredAt;

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

        if (status == null || status.isBlank()) {
            status = STATUS_ACTIVE;
        } else {
            status = status
                    .trim()
                    .toUpperCase(Locale.ROOT);
        }

        if (startedAt == null) {
            startedAt = now;
        }

        if (currentPeriodStart == null) {
            currentPeriodStart = startedAt;
        }

        if (currentPeriodEnd == null
                || !currentPeriodEnd.isAfter(
                        currentPeriodStart)) {

            currentPeriodEnd = currentPeriodStart.plusDays(30);
        }

        if (cancelAtPeriodEnd == null) {
            cancelAtPeriodEnd = false;
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

        if (cancelAtPeriodEnd == null) {
            cancelAtPeriodEnd = false;
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

    public String getLatestPaymentId() {
        return latestPaymentId;
    }

    public void setLatestPaymentId(
            String latestPaymentId) {
        this.latestPaymentId = latestPaymentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(
            LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCurrentPeriodStart() {
        return currentPeriodStart;
    }

    public void setCurrentPeriodStart(
            LocalDateTime currentPeriodStart) {
        this.currentPeriodStart = currentPeriodStart;
    }

    public LocalDateTime getCurrentPeriodEnd() {
        return currentPeriodEnd;
    }

    public void setCurrentPeriodEnd(
            LocalDateTime currentPeriodEnd) {
        this.currentPeriodEnd = currentPeriodEnd;
    }

    public Boolean getCancelAtPeriodEnd() {
        return cancelAtPeriodEnd;
    }

    public void setCancelAtPeriodEnd(
            Boolean cancelAtPeriodEnd) {
        this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }

    public LocalDateTime getCanceledAt() {
        return canceledAt;
    }

    public void setCanceledAt(
            LocalDateTime canceledAt) {
        this.canceledAt = canceledAt;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(
            LocalDateTime expiredAt) {
        this.expiredAt = expiredAt;
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