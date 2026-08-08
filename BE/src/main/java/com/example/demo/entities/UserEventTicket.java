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
@Table(name = "user_event_tickets", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_event_ticket_code", columnNames = "ticketCode"),
        @UniqueConstraint(name = "uk_user_event_ticket_qr_hash", columnNames = "qrTokenHash")
}, indexes = {
        @Index(name = "idx_user_event_ticket_buyer", columnList = "buyerId"),
        @Index(name = "idx_user_event_ticket_event", columnList = "eventId"),
        @Index(name = "idx_user_event_ticket_artist", columnList = "artistId"),
        @Index(name = "idx_user_event_ticket_payment", columnList = "paymentId"),
        @Index(name = "idx_user_event_ticket_status", columnList = "status")
})
public class UserEventTicket {

    public static final String STATUS_VALID = "VALID";

    public static final String STATUS_USED = "USED";

    public static final String STATUS_CANCELLED = "CANCELLED";

    /*
     * =========================
     * IDENTITY
     * =========================
     */

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    @Column(nullable = false, length = 50)
    private String ticketCode;

    @Column(nullable = false, length = 24)
    private String eventId;

    @Column(nullable = false, length = 24)
    private String artistId;

    @Column(nullable = false, length = 24)
    private String buyerId;

    @Column(nullable = false, length = 24)
    private String paymentId;

    /*
     * =========================
     * EVENT SNAPSHOT
     * =========================
     *
     * Giữ lại dữ liệu lịch sử để
     * Ticket Collection vẫn đúng
     * kể cả event sau này thay đổi.
     */

    @Column(nullable = false, length = 200)
    private String eventNameSnapshot;

    @Column(nullable = false, length = 200)
    private String venueNameSnapshot;

    @Column(nullable = false, length = 500)
    private String venueAddressSnapshot;

    @Column(nullable = false)
    private LocalDateTime eventStartAtSnapshot;

    @Column(nullable = false, length = 1000)
    private String ticketImageUrl;

    /*
     * =========================
     * PURCHASE SNAPSHOT
     * =========================
     */

    @Column(nullable = false)
    private Long purchasePrice;

    @Column(nullable = false, length = 10)
    private String currency = "VND";

    /*
     * =========================
     * QR SECURITY
     * =========================
     *
     * Không lưu raw QR token.
     * Chỉ lưu SHA-256/hash của token.
     *
     * Raw token chỉ được trả cho
     * ticket owner khi cần render QR.
     */
    @Column(nullable = false, length = 128)
    private String qrTokenHash;

    /*
     * =========================
     * TICKET STATE
     * =========================
     */

    @Column(nullable = false, length = 20)
    private String status = STATUS_VALID;

    @Column(nullable = false)
    private LocalDateTime purchasedAt;

    @Column
    private LocalDateTime checkedInAt;

    @Column(length = 24)
    private String checkedInBy;

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

        ticketCode = normalizeUpper(
                ticketCode);

        currency = normalizeUpper(
                currency);

        status = normalizeUpper(
                status);

        eventNameSnapshot = normalizeText(
                eventNameSnapshot);

        venueNameSnapshot = normalizeText(
                venueNameSnapshot);

        venueAddressSnapshot = normalizeText(
                venueAddressSnapshot);

        ticketImageUrl = normalizeText(
                ticketImageUrl);

        qrTokenHash = normalizeText(
                qrTokenHash);

        if (status == null
                || status.isBlank()) {

            status = STATUS_VALID;
        }

        if (currency == null
                || currency.isBlank()) {

            currency = "VND";
        }

        if (purchasedAt == null) {
            purchasedAt = now;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {

        status = normalizeUpper(
                status);

        updatedAt = LocalDateTime.now();
    }

    private String normalizeUpper(
            String value) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value
                .trim()
                .toUpperCase(
                        Locale.ROOT);
    }

    private String normalizeText(
            String value) {

        if (value == null) {
            return null;
        }

        return value.trim();
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

    public String getTicketCode() {
        return ticketCode;
    }

    public void setTicketCode(
            String ticketCode) {

        this.ticketCode = ticketCode;
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

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(
            String paymentId) {

        this.paymentId = paymentId;
    }

    public String getEventNameSnapshot() {
        return eventNameSnapshot;
    }

    public void setEventNameSnapshot(
            String eventNameSnapshot) {

        this.eventNameSnapshot = eventNameSnapshot;
    }

    public String getVenueNameSnapshot() {
        return venueNameSnapshot;
    }

    public void setVenueNameSnapshot(
            String venueNameSnapshot) {

        this.venueNameSnapshot = venueNameSnapshot;
    }

    public String getVenueAddressSnapshot() {
        return venueAddressSnapshot;
    }

    public void setVenueAddressSnapshot(
            String venueAddressSnapshot) {

        this.venueAddressSnapshot = venueAddressSnapshot;
    }

    public LocalDateTime getEventStartAtSnapshot() {
        return eventStartAtSnapshot;
    }

    public void setEventStartAtSnapshot(
            LocalDateTime eventStartAtSnapshot) {

        this.eventStartAtSnapshot = eventStartAtSnapshot;
    }

    public String getTicketImageUrl() {
        return ticketImageUrl;
    }

    public void setTicketImageUrl(
            String ticketImageUrl) {

        this.ticketImageUrl = ticketImageUrl;
    }

    public Long getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(
            Long purchasePrice) {

        this.purchasePrice = purchasePrice;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(
            String currency) {

        this.currency = currency;
    }

    public String getQrTokenHash() {
        return qrTokenHash;
    }

    public void setQrTokenHash(
            String qrTokenHash) {

        this.qrTokenHash = qrTokenHash;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {

        this.status = status;
    }

    public LocalDateTime getPurchasedAt() {
        return purchasedAt;
    }

    public void setPurchasedAt(
            LocalDateTime purchasedAt) {

        this.purchasedAt = purchasedAt;
    }

    public LocalDateTime getCheckedInAt() {
        return checkedInAt;
    }

    public void setCheckedInAt(
            LocalDateTime checkedInAt) {

        this.checkedInAt = checkedInAt;
    }

    public String getCheckedInBy() {
        return checkedInBy;
    }

    public void setCheckedInBy(
            String checkedInBy) {

        this.checkedInBy = checkedInBy;
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