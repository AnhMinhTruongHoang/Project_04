package com.example.demo.dtos;

import com.example.demo.types.NotificationEntityType;
import com.example.demo.types.NotificationType;

public class NotificationCreateDTO {

    private String recipientId;

    private String actorId;

    private NotificationType type;

    private String title;

    private String message;

    private NotificationEntityType entityType;

    private String entityId;

    private String redirectUrl;

    private String metadataJson;

    private String deduplicationKey;

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

    public String getDeduplicationKey() {
        return deduplicationKey;
    }

    public void setDeduplicationKey(
            String deduplicationKey) {
        this.deduplicationKey = deduplicationKey;
    }
}