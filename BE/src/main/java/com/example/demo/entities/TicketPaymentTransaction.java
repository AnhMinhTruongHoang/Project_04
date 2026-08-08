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
@Table(name = "ticket_payment_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_ticket_payment_order_code", columnNames = "orderCode"),
        @UniqueConstraint(name = "uk_ticket_payment_provider_transaction", columnNames = {
                "provider",
                "providerTransactionId"
        })
}, indexes = {
        @Index(name = "idx_ticket_payment_buyer", columnList = "buyerId"),
        @Index(name = "idx_ticket_payment_artist", columnList = "artistId"),
        @Index(name = "idx_ticket_payment_event", columnList = "eventId"),
        @Index(name = "idx_ticket_payment_status", columnList = "status"),
        @Index(name = "idx_ticket_payment_created", columnList = "createdAt")
})
public class TicketPaymentTransaction {

    /*
     * =========================
     * PROVIDER
     * =========================
     */

    public static final String PROVIDER_VNPAY = "VNPAY";

    /*
     * =========================
     * PAYMENT STATUS
     * =========================
     */

    public static final String STATUS_PENDING = "PENDING";

    public static final String STATUS_PROCESSING = "PROCESSING";

    public static final String STATUS_PAID = "PAID";

    public static final String STATUS_FAILED = "FAILED";

    public static final String STATUS_CANCELED = "CANCELED";

    public static final String STATUS_EXPIRED = "EXPIRED";

    public static final String STATUS_REFUNDED = "REFUNDED";

    public static final String CURRENCY_VND = "VND";

    /*
     * =========================
     * IDENTITY
     * =========================
     */

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    @Column(nullable = false, length = 24)
    private String buyerId;

    @Column(nullable = false, length = 24)
    private String artistId;

    @Column(nullable = false, length = 24)
    private String eventId;

    /*
     * Sau khi payment PAID có thể
     * tạo một hoặc nhiều UserEventTicket.
     */
    @Column(length = 24)
    private String primaryTicketId;

    /*
     * =========================
     * ORDER
     * =========================
     */

    @Column(nullable = false, length = 80)
    private String orderCode;

    @Column(nullable = false, length = 30)
    private String provider = PROVIDER_VNPAY;

    /*
     * =========================
     * EVENT SNAPSHOT
     * =========================
     */

    @Column(nullable = false, length = 200)
    private String eventNameSnapshot;

    @Column(length = 1000)
    private String ticketImageUrlSnapshot;

    /*
     * =========================
     * QUANTITY / MONEY
     * =========================
     */

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(nullable = false)
    private Long unitPrice;

    @Column(nullable = false)
    private Long grossAmount;

    @Column(nullable = false)
    private Integer platformFeePercent = 0;

    @Column(nullable = false)
    private Long platformFeeAmount = 0L;

    @Column(nullable = false)
    private Long artistNetAmount;

    @Column(nullable = false, length = 10)
    private String currency = CURRENCY_VND;

    /*
     * true:
     * quantity hiện vẫn đang nằm trong
     * ArtistEvent.reservedQuantity.
     *
     * false:
     * reservation đã convert sang sold
     * hoặc đã được release.
     *
     * Giúp callback chạy nhiều lần
     * không trừ reservedQuantity hai lần.
     */
    @Column(nullable = false)
    private Boolean inventoryReserved = true;

    /*
     * =========================
     * PAYMENT STATE
     * =========================
     */

    @Column(nullable = false, length = 30)
    private String status = STATUS_PENDING;

    /*
     * =========================
     * VNPAY CALLBACK DATA
     * =========================
     */

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

    /*
     * =========================
     * PAYMENT URL / INFORMATION
     * =========================
     */

    @Column(length = 4000)
    private String paymentUrl;

    @Column(length = 500)
    private String orderInfo;

    @Column(length = 2000)
    private String failureReason;

    @Column(columnDefinition = "TEXT")
    private String callbackPayload;

    /*
     * =========================
     * PAYMENT TIME
     * =========================
     */

    @Column
    private LocalDateTime paidAt;

    @Column
    private LocalDateTime expiresAt;

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

        if (quantity == null || quantity <= 0) {
            quantity = 1;
        }

        if (platformFeePercent == null) {
            platformFeePercent = 0;
        }

        if (platformFeeAmount == null) {
            platformFeeAmount = 0L;
        }

        if (inventoryReserved == null) {
            inventoryReserved = true;
        }

        if (provider == null
                || provider.isBlank()) {

            provider = PROVIDER_VNPAY;
        }

        if (currency == null
                || currency.isBlank()) {

            currency = CURRENCY_VND;
        }

        if (status == null
                || status.isBlank()) {

            status = STATUS_PENDING;
        }

        normalizeFields();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {

        normalizeFields();

        updatedAt = LocalDateTime.now();
    }

    private void normalizeFields() {

        provider = normalizeCode(
                provider);

        currency = normalizeCode(
                currency);

        status = normalizeCode(
                status);

        orderCode = normalizeText(
                orderCode);

        eventNameSnapshot = normalizeText(
                eventNameSnapshot);

        ticketImageUrlSnapshot = normalizeOptionalText(
                ticketImageUrlSnapshot);

        providerTransactionId = normalizeOptionalText(
                providerTransactionId);

        responseCode = normalizeOptionalText(
                responseCode);

        transactionStatus = normalizeOptionalText(
                transactionStatus);

        bankCode = normalizeCode(
                bankCode);

        bankTransactionNo = normalizeOptionalText(
                bankTransactionNo);

        cardType = normalizeOptionalText(
                cardType);

        paymentUrl = normalizeOptionalText(
                paymentUrl);

        orderInfo = normalizeOptionalText(
                orderInfo);

        failureReason = normalizeOptionalText(
                failureReason);
    }

    private String normalizeCode(
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

    private String normalizeOptionalText(
            String value) {

        if (value == null
                || value.isBlank()) {

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

    public void setId(String id) {
        this.id = id;
    }

    public String getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(String buyerId) {
        this.buyerId = buyerId;
    }

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(String artistId) {
        this.artistId = artistId;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getPrimaryTicketId() {
        return primaryTicketId;
    }

    public void setPrimaryTicketId(
            String primaryTicketId) {

        this.primaryTicketId = primaryTicketId;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(
            String orderCode) {

        this.orderCode = orderCode;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(
            String provider) {

        this.provider = provider;
    }

    public String getEventNameSnapshot() {
        return eventNameSnapshot;
    }

    public void setEventNameSnapshot(
            String eventNameSnapshot) {

        this.eventNameSnapshot = eventNameSnapshot;
    }

    public String getTicketImageUrlSnapshot() {
        return ticketImageUrlSnapshot;
    }

    public void setTicketImageUrlSnapshot(
            String ticketImageUrlSnapshot) {

        this.ticketImageUrlSnapshot = ticketImageUrlSnapshot;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
            Integer quantity) {

        this.quantity = quantity;
    }

    public Long getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(
            Long unitPrice) {

        this.unitPrice = unitPrice;
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

    public Boolean getInventoryReserved() {
        return inventoryReserved;
    }

    public void setInventoryReserved(
            Boolean inventoryReserved) {

        this.inventoryReserved = inventoryReserved;
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