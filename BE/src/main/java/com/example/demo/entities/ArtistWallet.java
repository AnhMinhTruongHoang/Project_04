package com.example.demo.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "artist_wallets", uniqueConstraints = {
        @UniqueConstraint(name = "uk_artist_wallet_artist_id", columnNames = "artistId")
}, indexes = {
        @Index(name = "idx_artist_wallet_artist_id", columnList = "artistId"),
        @Index(name = "idx_artist_wallet_status", columnList = "status")
})
public class ArtistWallet {

    public static final String STATUS_ACTIVE = "ACTIVE";

    public static final String STATUS_SUSPENDED = "SUSPENDED";

    @Id
    @Column(length = 24, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 24)
    private String artistId;

    /*
     * Tổng doanh thu đang trong thời gian giữ,
     * bao gồm lượt nghe và membership.
     */
    @Column(nullable = false)
    private Long pendingBalance = 0L;

    /*
     * Tiền artist có thể yêu cầu rút.
     */
    @Column(nullable = false)
    private Long availableBalance = 0L;

    /*
     * Tiền đã được giữ cho các yêu cầu rút
     * đang chờ Admin xử lý.
     */
    @Column(nullable = false)
    private Long reservedBalance = 0L;

    /*
     * Tổng tiền đã rút thành công.
     */
    @Column(nullable = false)
    private Long withdrawnBalance = 0L;

    /*
     * Tổng thu nhập trong toàn bộ thời gian.
     */
    @Column(nullable = false)
    private Long lifetimeEarnings = 0L;

    @Column(nullable = false, length = 10)
    private String currency = "VND";

    @Column(nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

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

        if (pendingBalance == null) {
            pendingBalance = 0L;
        }

        if (availableBalance == null) {
            availableBalance = 0L;
        }

        if (reservedBalance == null) {
            reservedBalance = 0L;
        }

        if (withdrawnBalance == null) {
            withdrawnBalance = 0L;
        }

        if (lifetimeEarnings == null) {
            lifetimeEarnings = 0L;
        }

        if (currency == null
                || currency.isBlank()) {

            currency = "VND";
        }

        if (status == null
                || status.isBlank()) {

            status = STATUS_ACTIVE;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    public Long getReservedBalance() {
        return reservedBalance;
    }

    public void setReservedBalance(
            Long reservedBalance) {
        this.reservedBalance = reservedBalance;
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

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(
            String artistId) {
        this.artistId = artistId;
    }

    public Long getPendingBalance() {
        return pendingBalance;
    }

    public void setPendingBalance(
            Long pendingBalance) {
        this.pendingBalance = pendingBalance;
    }

    public Long getAvailableBalance() {
        return availableBalance;
    }

    public void setAvailableBalance(
            Long availableBalance) {
        this.availableBalance = availableBalance;
    }

    public Long getWithdrawnBalance() {
        return withdrawnBalance;
    }

    public void setWithdrawnBalance(
            Long withdrawnBalance) {
        this.withdrawnBalance = withdrawnBalance;
    }

    public Long getLifetimeEarnings() {
        return lifetimeEarnings;
    }

    public void setLifetimeEarnings(
            Long lifetimeEarnings) {
        this.lifetimeEarnings = lifetimeEarnings;
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