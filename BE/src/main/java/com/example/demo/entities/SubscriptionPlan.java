package com.example.demo.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @Column(length = 24)
    private String id;

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Long monthlyPrice;

    @Column(nullable = false)
    private Integer uploadMinutesLimit;

    @Column(nullable = false)
    private Boolean unlimitedUploads;

    @Column(nullable = false)
    private Boolean hasTicketingBenefits = false;

    @Column(nullable = false)
    private Integer advancedInsightsDays;

    @Column(nullable = false)
    private Boolean canDistribute;

    @Column(nullable = false)
    private Boolean canMonetize;

    @Column(nullable = false)
    private Boolean canScheduleRelease;

    @Column(nullable = false)
    private Boolean hasMembershipBenefits;

    @Column(nullable = false)
    private Boolean isActive;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public Integer getUploadMinutesLimit() {
        return uploadMinutesLimit;
    }

    public void setUploadMinutesLimit(
            Integer uploadMinutesLimit) {
        this.uploadMinutesLimit = uploadMinutesLimit;
    }

    public Boolean getUnlimitedUploads() {
        return unlimitedUploads;
    }

    public void setUnlimitedUploads(
            Boolean unlimitedUploads) {
        this.unlimitedUploads = unlimitedUploads;
    }

    public Integer getAdvancedInsightsDays() {
        return advancedInsightsDays;
    }

    public void setAdvancedInsightsDays(
            Integer advancedInsightsDays) {
        this.advancedInsightsDays = advancedInsightsDays;
    }

    public Boolean getCanDistribute() {
        return canDistribute;
    }

    public void setCanDistribute(
            Boolean canDistribute) {
        this.canDistribute = canDistribute;
    }

    public Boolean getCanMonetize() {
        return canMonetize;
    }

    public void setCanMonetize(
            Boolean canMonetize) {
        this.canMonetize = canMonetize;
    }

    public Boolean getCanScheduleRelease() {
        return canScheduleRelease;
    }

    public void setCanScheduleRelease(
            Boolean canScheduleRelease) {
        this.canScheduleRelease = canScheduleRelease;
    }

    public Boolean getHasMembershipBenefits() {
        return hasMembershipBenefits;
    }

    public void setHasMembershipBenefits(
            Boolean hasMembershipBenefits) {
        this.hasMembershipBenefits = hasMembershipBenefits;
    }

    public Boolean getHasTicketingBenefits() {
        return hasTicketingBenefits;
    }

    public void setHasTicketingBenefits(
            Boolean hasTicketingBenefits) {

        this.hasTicketingBenefits = hasTicketingBenefits;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
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