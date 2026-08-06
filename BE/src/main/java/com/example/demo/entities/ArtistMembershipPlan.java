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
@Table(name = "artist_membership_plans", uniqueConstraints = {
        @UniqueConstraint(name = "uk_membership_plan_artist_code", columnNames = {
                "artistId",
                "code"
        })
}, indexes = {
        @Index(name = "idx_membership_plan_artist", columnList = "artistId"),
        @Index(name = "idx_membership_plan_active", columnList = "active"),
        @Index(name = "idx_membership_plan_price", columnList = "monthlyPrice")
})
public class ArtistMembershipPlan {

    public static final String CURRENCY_VND = "VND";

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 24)
    private String id;

    @Column(name = "artistId", nullable = false, length = 24)
    private String artistId;

    /*
     * Mã ổn định của gói, ví dụ:
     *
     * SUPPORTER
     * SUPERFAN
     */
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    /*
     * Giá một chu kỳ hội viên theo VND.
     * Không sử dụng Double cho dữ liệu tiền.
     */
    @Column(name = "monthlyPrice", nullable = false)
    private Long monthlyPrice;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = CURRENCY_VND;

    /*
     * Badge động hiển thị cho hội viên.
     * Không lưu vào bảng user_badges.
     */
    @Column(name = "badgeName", nullable = false, length = 100)
    private String badgeName;

    @Column(name = "badgeColor", nullable = false, length = 20)
    private String badgeColor = "#FF5500";

    @Column(name = "displayOrder", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updatedAt", nullable = false)
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

        code = normalizeCode(code);
        name = normalizeRequiredText(name);
        description = normalizeOptionalText(description);
        badgeName = normalizeRequiredText(badgeName);
        badgeColor = normalizeColor(badgeColor);

        if (monthlyPrice == null) {
            monthlyPrice = 0L;
        }

        if (currency == null || currency.isBlank()) {
            currency = CURRENCY_VND;
        } else {
            currency = currency
                    .trim()
                    .toUpperCase(Locale.ROOT);
        }

        if (displayOrder == null) {
            displayOrder = 0;
        }

        if (active == null) {
            active = true;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {

        code = normalizeCode(code);
        name = normalizeRequiredText(name);
        description = normalizeOptionalText(description);
        badgeName = normalizeRequiredText(badgeName);
        badgeColor = normalizeColor(badgeColor);

        updatedAt = LocalDateTime.now();
    }

    private String normalizeCode(String value) {

        if (value == null) {
            return null;
        }

        return value
                .trim()
                .toUpperCase(Locale.ROOT);
    }

    private String normalizeRequiredText(String value) {

        if (value == null) {
            return null;
        }

        return value.trim();
    }

    private String normalizeOptionalText(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String normalizeColor(String value) {

        if (value == null || value.isBlank()) {
            return "#FF5500";
        }

        return value
                .trim()
                .toUpperCase(Locale.ROOT);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(String artistId) {
        this.artistId = artistId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {
        this.description = description;
    }

    public Long getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(
            Long monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(
            String currency) {
        this.currency = currency;
    }

    public String getBadgeName() {
        return badgeName;
    }

    public void setBadgeName(
            String badgeName) {
        this.badgeName = badgeName;
    }

    public String getBadgeColor() {
        return badgeColor;
    }

    public void setBadgeColor(
            String badgeColor) {
        this.badgeColor = badgeColor;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(
            Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(
            Boolean active) {
        this.active = active;
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