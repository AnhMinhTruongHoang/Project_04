package com.example.demo.entities;

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
@Table(name = "ticket_revenue_ledgers", uniqueConstraints = {
        @UniqueConstraint(name = "uk_ticket_revenue_payment", columnNames = "ticketPaymentId")
}, indexes = {
        @Index(name = "idx_ticket_revenue_artist", columnList = "artistId"),
        @Index(name = "idx_ticket_revenue_event", columnList = "eventId"),
        @Index(name = "idx_ticket_revenue_status", columnList = "status"),
        @Index(name = "idx_ticket_revenue_available_at", columnList = "availableAt")
})
public class TicketRevenueLedger {

    public static final String SOURCE_TICKET_SALE = "TICKET_SALE";

    public static final String STATUS_PENDING = "PENDING";

    public static final String STATUS_AVAILABLE = "AVAILABLE";

    public static final String STATUS_REVERSED = "REVERSED";

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    @Column(nullable = false, unique = true, length = 24)
    private String ticketPaymentId;

    @Column(nullable = false, length = 24)
    private String eventId;

    @Column(nullable = false, length = 24)
    private String artistId;

    @Column(nullable = false, length = 24)
    private String buyerId;

    @Column(nullable = false, length = 30)
    private String sourceType = SOURCE_TICKET_SALE;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Long grossAmount;

    @Column(nullable = false)
    private Long platformFeeAmount;

    @Column(nullable = false)
    private Long artistNetAmount;

    @Column(nullable = false, length = 10)
    private String currency = "VND";

    @Column(nullable = false, length = 20)
    private String status = STATUS_PENDING;

    /*
     * Sau thời điểm này:
     *
     * pendingBalance
     * → availableBalance
     */
    @Column(nullable = false)
    private LocalDateTime availableAt;

    @Column
    private LocalDateTime releasedAt;

    @Column
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

        if (sourceType == null
                || sourceType.isBlank()) {

            sourceType = SOURCE_TICKET_SALE;
        }

        if (currency == null
                || currency.isBlank()) {

            currency = "VND";
        }

        if (status == null
                || status.isBlank()) {

            status = STATUS_PENDING;
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

    public void setId(String id) {
        this.id = id;
    }

    public String getTicketPaymentId() {
        return ticketPaymentId;
    }

    public void setTicketPaymentId(
            String ticketPaymentId) {

        this.ticketPaymentId = ticketPaymentId;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(
            String eventId) {

        this.eventId = eventId;
    }

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(
            String artistId) {

        this.artistId = artistId;
    }

    public String getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(
            String buyerId) {

        this.buyerId = buyerId;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(
            String sourceType) {

        this.sourceType = sourceType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
            Integer quantity) {

        this.quantity = quantity;
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