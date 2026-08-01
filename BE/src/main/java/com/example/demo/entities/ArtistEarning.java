package com.example.demo.entities;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
@Table(name = "artist_earnings", uniqueConstraints = {
        /*
         * Một ListeningSession chỉ được tạo
         * tối đa một earning.
         */
        @UniqueConstraint(name = "uk_artist_earning_session", columnNames = "listeningSessionId"),

        /*
         * Một listener chỉ tạo một earning
         * cho cùng track trong một ngày.
         */
        @UniqueConstraint(name = "uk_artist_earning_daily_stream", columnNames = {
                "listenerId",
                "trackId",
                "earningDate"
        })
}, indexes = {
        @Index(name = "idx_artist_earning_artist", columnList = "artistId"),
        @Index(name = "idx_artist_earning_track", columnList = "trackId"),
        @Index(name = "idx_artist_earning_listener", columnList = "listenerId"),
        @Index(name = "idx_artist_earning_status", columnList = "status"),
        @Index(name = "idx_artist_earning_available_at", columnList = "availableAt"),
        @Index(name = "idx_artist_earning_date", columnList = "earningDate")
})
public class ArtistEarning {

    public static final String SOURCE_QUALIFIED_STREAM = "QUALIFIED_STREAM";

    /*
     * Đang trong thời gian giữ tiền.
     */
    public static final String STATUS_PENDING = "PENDING";

    /*
     * Đã hết thời gian giữ và có thể rút.
     */
    public static final String STATUS_AVAILABLE = "AVAILABLE";

    /*
     * Lượt nghe bị từ chối hoặc phát hiện không hợp lệ.
     */
    public static final String STATUS_REJECTED = "REJECTED";

    /*
     * Khoản thu nhập đã bị thu hồi.
     */
    public static final String STATUS_REVERSED = "REVERSED";

    @Id
    @Column(length = 24, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 24)
    private String listeningSessionId;

    @Column(nullable = false, length = 24)
    private String listenerId;

    @Column(nullable = false, length = 24)
    private String artistId;

    @Column(nullable = false, length = 24)
    private String trackId;

    /*
     * Plan của artist tại thời điểm
     * lượt nghe được xác nhận.
     */
    @Column(nullable = false, length = 30)
    private String artistPlanCode;

    @Column(nullable = false, length = 30)
    private String sourceType = SOURCE_QUALIFIED_STREAM;

    /*
     * Snapshot tỷ giá tại thời điểm earning được tạo.
     *
     * Ví dụ:
     * 1 qualified stream = 20 VND
     *
     * Sau này Admin thay đổi tỷ giá, earning cũ vẫn giữ nguyên
     * ratePerStream và amount ban đầu.
     */
    @Column(nullable = false)
    private Long ratePerStream;

    /*
     * Số tiền theo đơn vị VND.
     * Không dùng Double cho tiền.
     */
    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false, length = 10)
    private String currency = "VND";

    @Column(nullable = false, length = 20)
    private String status = STATUS_PENDING;

    /*
     * Dùng để giới hạn:
     * một listener + track + ngày.
     */
    @Column(nullable = false)
    private LocalDate earningDate;

    /*
     * Thời điểm ListeningSession đủ điều kiện.
     */
    @Column(nullable = false)
    private LocalDateTime qualifiedAt;

    /*
     * Sau thời điểm này scheduler sẽ chuyển:
     * PENDING → AVAILABLE.
     */
    @Column(nullable = false)
    private LocalDateTime availableAt;

    @Column(length = 255)
    private String rejectionReason;

    private LocalDateTime releasedAt;

    private LocalDateTime reversedAt;

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

        if (sourceType == null
                || sourceType.isBlank()) {

            sourceType = SOURCE_QUALIFIED_STREAM;
        }

        if (amount == null) {
            amount = 0L;
        }

        if (ratePerStream == null) {
            ratePerStream = amount;
        }

        if (currency == null
                || currency.isBlank()) {

            currency = "VND";
        }

        if (status == null
                || status.isBlank()) {

            status = STATUS_PENDING;
        }

        if (earningDate == null) {
            earningDate = now.toLocalDate();
        }

        if (qualifiedAt == null) {
            qualifiedAt = now;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(
            String id) {
        this.id = id;
    }

    public String getListeningSessionId() {
        return listeningSessionId;
    }

    public void setListeningSessionId(
            String listeningSessionId) {
        this.listeningSessionId = listeningSessionId;
    }

    public String getListenerId() {
        return listenerId;
    }

    public void setListenerId(
            String listenerId) {
        this.listenerId = listenerId;
    }

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(
            String artistId) {
        this.artistId = artistId;
    }

    public String getTrackId() {
        return trackId;
    }

    public void setTrackId(
            String trackId) {
        this.trackId = trackId;
    }

    public String getArtistPlanCode() {
        return artistPlanCode;
    }

    public void setArtistPlanCode(
            String artistPlanCode) {
        this.artistPlanCode = artistPlanCode;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(
            String sourceType) {
        this.sourceType = sourceType;
    }

    public Long getRatePerStream() {
        return ratePerStream;
    }

    public void setRatePerStream(
            Long ratePerStream) {
        this.ratePerStream = ratePerStream;
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

    public LocalDate getEarningDate() {
        return earningDate;
    }

    public void setEarningDate(
            LocalDate earningDate) {
        this.earningDate = earningDate;
    }

    public LocalDateTime getQualifiedAt() {
        return qualifiedAt;
    }

    public void setQualifiedAt(
            LocalDateTime qualifiedAt) {
        this.qualifiedAt = qualifiedAt;
    }

    public LocalDateTime getAvailableAt() {
        return availableAt;
    }

    public void setAvailableAt(
            LocalDateTime availableAt) {
        this.availableAt = availableAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(
            String rejectionReason) {
        this.rejectionReason = rejectionReason;
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