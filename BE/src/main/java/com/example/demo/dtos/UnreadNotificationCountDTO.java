package com.example.demo.dtos;

public class UnreadNotificationCountDTO {

    private long unreadCount;

    public UnreadNotificationCountDTO(
            long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(
            long unreadCount) {
        this.unreadCount = unreadCount;
    }
}