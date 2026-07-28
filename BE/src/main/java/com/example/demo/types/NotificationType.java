package com.example.demo.types;

public enum NotificationType {

    /*
     * =========================
     * SOCIAL
     * =========================
     */
    NEW_FOLLOW,

    TRACK_LIKE,
    TRACK_COMMENT,

    /*
     * =========================
     * TRACK MODERATION
     * =========================
     */
    TRACK_APPROVED,
    TRACK_REJECTED,

    COPYRIGHT_APPROVED,
    COPYRIGHT_REJECTED,

    TRACK_PROCESSING_COMPLETED,

    /*
     * =========================
     * UPLOAD QUOTA
     * =========================
     */
    UPLOAD_QUOTA_WARNING,
    UPLOAD_QUOTA_EXCEEDED,

    /*
     * =========================
     * PAYMENT
     * =========================
     */
    PAYMENT_PAID,
    PAYMENT_FAILED,
    PAYMENT_CANCELED,
    PAYMENT_EXPIRED,

    /*
     * =========================
     * SUBSCRIPTION
     * =========================
     */
    SUBSCRIPTION_ACTIVATED,
    SUBSCRIPTION_CHANGED,
    SUBSCRIPTION_CANCEL_SCHEDULED,
    SUBSCRIPTION_RENEWED,
    SUBSCRIPTION_EXPIRING,
    SUBSCRIPTION_EXPIRED,

    /*
     * =========================
     * ARTIST EARNING
     * =========================
     */
    EARNING_AVAILABLE,

    /*
     * =========================
     * ARTIST PAYOUT
     * =========================
     */
    PAYOUT_REQUESTED,
    PAYOUT_APPROVED,
    PAYOUT_REJECTED,
    PAYOUT_PAID,
    PAYOUT_CANCELED,

    /*
     * =========================
     * SYSTEM
     * =========================
     */
    SYSTEM
}