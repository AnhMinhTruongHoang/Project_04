package com.example.demo.entities;

import java.time.LocalDateTime;

import com.example.demo.types.NotificationEntityType;
import com.example.demo.types.NotificationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_recipient_created", columnList = "recipient_id, created_at"),
        @Index(name = "idx_notification_recipient_read", columnList = "recipient_id, is_read"),
        @Index(name = "idx_notification_entity", columnList = "entity_type, entity_id")
})
public class Notification {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "recipient_id", nullable = false, length = 50)
    private String recipientId;

    @Column(name = "actor_id", length = 50)
    private String actorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private NotificationType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", length = 40)
    private NotificationEntityType entityType;

    @Column(name = "entity_id", length = 50)
    private String entityId;

    @Column(name = "redirect_url", length = 500)
    private String redirectUrl;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "deduplication_key", unique = true, length = 255)
    private String deduplicationKey;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(
            String id) {
        this.id = id;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(
            String recipientId) {
        this.recipientId = recipientId;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(
            String actorId) {
        this.actorId = actorId;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(
            NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(
            String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(
            String message) {
        this.message = message;
    }

    public NotificationEntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(
            NotificationEntityType entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(
            String entityId) {
        this.entityId = entityId;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public void setRedirectUrl(
            String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }

    public String getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(
            String metadataJson) {
        this.metadataJson = metadataJson;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(
            Boolean isRead) {
        this.isRead = isRead;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(
            LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public String getDeduplicationKey() {
        return deduplicationKey;
    }

    public void setDeduplicationKey(
            String deduplicationKey) {
        this.deduplicationKey = deduplicationKey;
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