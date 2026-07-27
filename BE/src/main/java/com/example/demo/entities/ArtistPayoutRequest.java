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
import jakarta.persistence.Version;

@Entity
@Table(name = "artist_payout_requests", indexes = {
        @Index(name = "idx_artist_payout_artist", columnList = "artistId"),
        @Index(name = "idx_artist_payout_wallet", columnList = "walletId"),
        @Index(name = "idx_artist_payout_status", columnList = "status"),
        @Index(name = "idx_artist_payout_requested_at", columnList = "requestedAt")
})
public class ArtistPayoutRequest {

    public static final String METHOD_BANK_TRANSFER = "BANK_TRANSFER";

    /*
     * Artist vừa gửi yêu cầu,
     * đang chờ Admin kiểm tra.
     */
    public static final String STATUS_PENDING = "PENDING";

    /*
     * Admin đã duyệt,
     * đang chờ thực hiện chuyển khoản.
     */
    public static final String STATUS_APPROVED = "APPROVED";

    /*
     * Đã chuyển khoản thành công.
     */
    public static final String STATUS_PAID = "PAID";

    /*
     * Admin từ chối yêu cầu.
     */
    public static final String STATUS_REJECTED = "REJECTED";

    /*
     * Artist hủy yêu cầu trước khi được duyệt.
     */
    public static final String STATUS_CANCELED = "CANCELED";

    @Id
    @Column(length = 24, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, length = 24)
    private String artistId;

    @Column(nullable = false, length = 24)
    private String walletId;

    /*
     * Số tiền theo đơn vị VND.
     * Không sử dụng Double cho dữ liệu tiền.
     */
    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false, length = 10)
    private String currency = "VND";

    @Column(nullable = false, length = 30)
    private String payoutMethod = METHOD_BANK_TRANSFER;

    @Column(nullable = false, length = 30)
    private String status = STATUS_PENDING;

    /*
     * Thông tin ngân hàng được snapshot
     * tại thời điểm Artist gửi yêu cầu.
     */
    @Column(nullable = false, length = 30)
    private String bankCode;

    @Column(nullable = false, length = 100)
    private String bankName;

    @Column(nullable = false, length = 50)
    private String accountNumber;

    @Column(nullable = false, length = 150)
    private String accountHolderName;

    /*
     * Ghi chú do Artist nhập.
     */
    @Column(length = 500)
    private String artistNote;

    /*
     * Ghi chú hoặc lý do từ Admin.
     */
    @Column(length = 500)
    private String adminNote;

    /*
     * Mã tham chiếu chuyển khoản do Admin nhập
     * sau khi thực hiện payout.
     */
    @Column(length = 100)
    private String transactionReference;

    /*
     * Admin xử lý yêu cầu.
     */
    @Column(length = 24)
    private String reviewedBy;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime reviewedAt;

    private LocalDateTime approvedAt;

    private LocalDateTime paidAt;

    private LocalDateTime rejectedAt;

    private LocalDateTime canceledAt;

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

        if (amount == null) {
            amount = 0L;
        }

        if (currency == null
                || currency.isBlank()) {

            currency = "VND";
        }

        if (payoutMethod == null
                || payoutMethod.isBlank()) {

            payoutMethod = METHOD_BANK_TRANSFER;
        }

        if (status == null
                || status.isBlank()) {

            status = STATUS_PENDING;
        }

        if (requestedAt == null) {
            requestedAt = now;
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

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(
            String artistId) {
        this.artistId = artistId;
    }

    public String getWalletId() {
        return walletId;
    }

    public void setWalletId(
            String walletId) {
        this.walletId = walletId;
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

    public String getPayoutMethod() {
        return payoutMethod;
    }

    public void setPayoutMethod(
            String payoutMethod) {
        this.payoutMethod = payoutMethod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {
        this.status = status;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(
            String bankCode) {
        this.bankCode = bankCode;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(
            String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(
            String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(
            String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }

    public String getArtistNote() {
        return artistNote;
    }

    public void setArtistNote(
            String artistNote) {
        this.artistNote = artistNote;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(
            String adminNote) {
        this.adminNote = adminNote;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(
            String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(
            String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(
            LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(
            LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(
            LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(
            LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(
            LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public LocalDateTime getCanceledAt() {
        return canceledAt;
    }

    public void setCanceledAt(
            LocalDateTime canceledAt) {
        this.canceledAt = canceledAt;
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