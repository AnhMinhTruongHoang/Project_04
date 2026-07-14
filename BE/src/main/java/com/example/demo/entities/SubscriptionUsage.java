package com.example.demo.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "subscription_usages", uniqueConstraints = {
        @UniqueConstraint(name = "uk_subscription_usage_period", columnNames = {
                "userId",
                "subscriptionId",
                "periodStart",
                "periodEnd"
        })
}, indexes = {
        @Index(name = "idx_usage_user", columnList = "userId")
})
public class SubscriptionUsage {

    @Id
    @Column(length = 24)
    private String id;

    @Column(nullable = false, length = 24)
    private String userId;

    @Column(nullable = false, length = 24)
    private String subscriptionId;

    @Column(nullable = false)
    private LocalDateTime periodStart;

    @Column(nullable = false)
    private LocalDateTime periodEnd;

    @Column(nullable = false)
    private Long uploadedSeconds;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(
            String subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public LocalDateTime getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(
            LocalDateTime periodStart) {
        this.periodStart = periodStart;
    }

    public LocalDateTime getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(
            LocalDateTime periodEnd) {
        this.periodEnd = periodEnd;
    }

    public Long getUploadedSeconds() {
        return uploadedSeconds;
    }

    public void setUploadedSeconds(
            Long uploadedSeconds) {
        this.uploadedSeconds = uploadedSeconds;
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