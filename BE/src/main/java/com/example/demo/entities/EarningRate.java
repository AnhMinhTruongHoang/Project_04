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
@Table(name = "earning_rates", indexes = {
        @Index(name = "idx_earning_rate_status", columnList = "status"),
        @Index(name = "idx_earning_rate_effective_from", columnList = "effectiveFrom"),
        @Index(name = "idx_earning_rate_effective_to", columnList = "effectiveTo"),
        @Index(name = "idx_earning_rate_created_by", columnList = "createdBy")
})
public class EarningRate {

    /*
     * Tỷ giá đang được áp dụng.
     */
    public static final String STATUS_ACTIVE = "ACTIVE";

    /*
     * Tỷ giá đã hết hiệu lực.
     */
    public static final String STATUS_INACTIVE = "INACTIVE";

    /*
     * Tỷ giá được tạo trước
     * và sẽ có hiệu lực trong tương lai.
     */
    public static final String STATUS_SCHEDULED = "SCHEDULED";

    @Id
    @Column(length = 24, nullable = false, updatable = false)
    private String id;

    /*
     * Số tiền Artist nhận được cho
     * một qualified stream.
     *
     * Đơn vị mặc định: VND.
     *
     * Ví dụ:
     * amountPerStream = 20
     * tương đương:
     * 1 qualified stream = 20 VND.
     */
    @Column(nullable = false)
    private Long amountPerStream;

    @Column(nullable = false, length = 10)
    private String currency = "VND";

    /*
     * Thời điểm tỷ giá bắt đầu có hiệu lực.
     */
    @Column(nullable = false)
    private LocalDateTime effectiveFrom;

    /*
     * Thời điểm tỷ giá hết hiệu lực.
     *
     * null nghĩa là chưa xác định
     * thời điểm kết thúc.
     */
    private LocalDateTime effectiveTo;

    @Column(nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

    /*
     * Lý do Admin thay đổi tỷ giá.
     */
    @Column(length = 500)
    private String reason;

    /*
     * ID của Admin tạo tỷ giá.
     */
    @Column(length = 24)
    private String createdBy;

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

        if (amountPerStream == null) {
            amountPerStream = 0L;
        }

        if (currency == null
                || currency.isBlank()) {

            currency = "VND";
        }

        if (effectiveFrom == null) {
            effectiveFrom = now;
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

    public Long getAmountPerStream() {
        return amountPerStream;
    }

    public void setAmountPerStream(
            Long amountPerStream) {
        this.amountPerStream = amountPerStream;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(
            String currency) {
        this.currency = currency;
    }

    public LocalDateTime getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(
            LocalDateTime effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDateTime getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(
            LocalDateTime effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(
            String reason) {
        this.reason = reason;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(
            String createdBy) {
        this.createdBy = createdBy;
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