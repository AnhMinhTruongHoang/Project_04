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
import jakarta.persistence.Version;

@Entity
@Table(name = "artist_events", indexes = {
        @Index(name = "idx_artist_event_artist", columnList = "artistId"),
        @Index(name = "idx_artist_event_approval", columnList = "approvalStatus"),
        @Index(name = "idx_artist_event_start", columnList = "eventStartAt"),
        @Index(name = "idx_artist_event_sale", columnList = "saleStartAt,saleEndAt")
})
public class ArtistEvent {

    /*
     * =========================
     * EVENT TYPES
     * =========================
     */

    public static final String TYPE_CONCERT = "CONCERT";

    public static final String TYPE_TOUR = "TOUR";

    public static final String TYPE_FAN_MEETING = "FAN_MEETING";

    public static final String TYPE_OTHER = "OTHER";

    /*
     * =========================
     * APPROVAL STATUS
     * =========================
     */

    public static final String APPROVAL_PENDING_REVIEW = "PENDING_REVIEW";

    public static final String APPROVAL_APPROVED = "APPROVED";

    public static final String APPROVAL_REJECTED = "REJECTED";

    /*
     * =========================
     * EVENT STATUS
     * =========================
     */

    public static final String STATUS_ACTIVE = "ACTIVE";

    public static final String STATUS_CANCELLED = "CANCELLED";

    public static final String STATUS_ENDED = "ENDED";

    public static final String CURRENCY_VND = "VND";

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    /*
     * =========================
     * ARTIST
     * =========================
     */

    @Column(nullable = false, length = 24)
    private String artistId;

    /*
     * =========================
     * EVENT INFORMATION
     * =========================
     */

    @Column(nullable = false, length = 200)
    private String eventName;

    @Column(nullable = false, length = 30)
    private String eventType;

    @Column(length = 5000)
    private String description;

    /*
     * =========================
     * VENUE
     * =========================
     */

    @Column(nullable = false, length = 200)
    private String venueName;

    @Column(nullable = false, length = 500)
    private String venueAddress;

    /*
     * =========================
     * EVENT TIME
     * =========================
     */

    @Column(nullable = false)
    private LocalDateTime eventStartAt;

    /*
     * =========================
     * RESERVED INVENTORY
     * =========================
     *
     * Ticket đang được giữ cho các
     * payment PENDING/PROCESSING.
     */
    @Column(nullable = false)
    private Integer reservedQuantity = 0;

    @Column
    private LocalDateTime eventEndAt;

    /*
     * =========================
     * TICKET SALE WINDOW
     * =========================
     */

    @Column(nullable = false)
    private LocalDateTime saleStartAt;

    @Column(nullable = false)
    private LocalDateTime saleEndAt;

    /*
     * =========================
     * TICKET PRICE
     * =========================
     */

    @Column(nullable = false)
    private Long ticketPrice;

    @Column(nullable = false, length = 10)
    private String currency = CURRENCY_VND;

    /*
     * =========================
     * INVENTORY
     * =========================
     */

    @Column(nullable = false)
    private Integer totalQuantity;

    @Column(nullable = false)
    private Integer soldQuantity = 0;

    /*
     * =========================
     * TICKET ARTWORK
     * =========================
     */

    @Column(nullable = false, length = 1000)
    private String ticketImageUrl;

    /*
     * =========================
     * ADMIN MODERATION
     * =========================
     */

    @Column(nullable = false, length = 30)
    private String approvalStatus = APPROVAL_PENDING_REVIEW;

    @Column(length = 2000)
    private String rejectionReason;

    @Column(length = 24)
    private String reviewedBy;

    @Column
    private LocalDateTime reviewedAt;

    /*
     * =========================
     * EVENT LIFECYCLE
     * =========================
     */

    @Column(nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

    /*
     * =========================
     * VERSION / TIMESTAMPS
     * =========================
     */

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

        normalizeFields();

        if (soldQuantity == null) {
            soldQuantity = 0;
        }

        if (approvalStatus == null
                || approvalStatus.isBlank()) {

            approvalStatus = APPROVAL_PENDING_REVIEW;
        }

        if (status == null
                || status.isBlank()) {

            status = STATUS_ACTIVE;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        if (reservedQuantity == null) {
            reservedQuantity = 0;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {

        normalizeFields();

        updatedAt = LocalDateTime.now();
    }

    private void normalizeFields() {

        eventName = normalizeRequiredText(
                eventName);

        eventType = normalizeCode(
                eventType);

        description = normalizeOptionalText(
                description);

        venueName = normalizeRequiredText(
                venueName);

        venueAddress = normalizeRequiredText(
                venueAddress);

        ticketImageUrl = normalizeRequiredText(
                ticketImageUrl);

        currency = normalizeCode(
                currency);

        approvalStatus = normalizeCode(
                approvalStatus);

        status = normalizeCode(
                status);

        rejectionReason = normalizeOptionalText(
                rejectionReason);
    }

    private String normalizeRequiredText(
            String value) {

        if (value == null) {
            return null;
        }

        return value.trim();
    }

    private String normalizeOptionalText(
            String value) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value.trim();
    }

    private String normalizeCode(
            String value) {

        if (value == null) {
            return null;
        }

        return value
                .trim()
                .toUpperCase(
                        Locale.ROOT);
    }

    /*
     * =========================
     * GETTERS / SETTERS
     * =========================
     */

    public String getId() {
        return id;
    }

    public void setId(
            String id) {
        this.id = id;
    }

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(
            String artistId) {
        this.artistId = artistId;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(
            String eventName) {
        this.eventName = eventName;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(
            String eventType) {
        this.eventType = eventType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {
        this.description = description;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(
            String venueName) {
        this.venueName = venueName;
    }

    public String getVenueAddress() {
        return venueAddress;
    }

    public void setVenueAddress(
            String venueAddress) {
        this.venueAddress = venueAddress;
    }

    public LocalDateTime getEventStartAt() {
        return eventStartAt;
    }

    public void setEventStartAt(
            LocalDateTime eventStartAt) {
        this.eventStartAt = eventStartAt;
    }

    public LocalDateTime getEventEndAt() {
        return eventEndAt;
    }

    public void setEventEndAt(
            LocalDateTime eventEndAt) {
        this.eventEndAt = eventEndAt;
    }

    public LocalDateTime getSaleStartAt() {
        return saleStartAt;
    }

    public void setSaleStartAt(
            LocalDateTime saleStartAt) {
        this.saleStartAt = saleStartAt;
    }

    public LocalDateTime getSaleEndAt() {
        return saleEndAt;
    }

    public void setSaleEndAt(
            LocalDateTime saleEndAt) {
        this.saleEndAt = saleEndAt;
    }

    public Long getTicketPrice() {
        return ticketPrice;
    }

    public void setTicketPrice(
            Long ticketPrice) {
        this.ticketPrice = ticketPrice;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(
            String currency) {
        this.currency = currency;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(
            Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public Integer getSoldQuantity() {
        return soldQuantity;
    }

    public void setSoldQuantity(
            Integer soldQuantity) {
        this.soldQuantity = soldQuantity;
    }

    public String getTicketImageUrl() {
        return ticketImageUrl;
    }

    public void setTicketImageUrl(
            String ticketImageUrl) {
        this.ticketImageUrl = ticketImageUrl;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(
            String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(
            String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(
            String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(
            LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {
        this.status = status;
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

    public Integer getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(
            Integer reservedQuantity) {

        this.reservedQuantity = reservedQuantity;
    }
}