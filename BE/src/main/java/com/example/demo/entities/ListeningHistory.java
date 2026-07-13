package com.example.demo.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "listening_histories", uniqueConstraints = @UniqueConstraint(columnNames = {
        "userId",
        "trackId"
}))
public class ListeningHistory
        implements java.io.Serializable {

    private Long id;
    private String userId;
    private String trackId;

    private Double lastPosition;
    private Double duration;
    private Boolean completed;

    private LocalDateTime lastPlayedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ListeningHistory() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Column(name = "userId", nullable = false)
    public String getUserId() {
        return userId;
    }

    public void setUserId(
            String userId) {
        this.userId = userId;
    }

    @Column(name = "trackId", nullable = false)
    public String getTrackId() {
        return trackId;
    }

    public void setTrackId(
            String trackId) {
        this.trackId = trackId;
    }

    @Column(name = "lastPosition", nullable = false)
    public Double getLastPosition() {
        return lastPosition;
    }

    public void setLastPosition(
            Double lastPosition) {
        this.lastPosition = lastPosition;
    }

    @Column(name = "duration", nullable = false)
    public Double getDuration() {
        return duration;
    }

    public void setDuration(
            Double duration) {
        this.duration = duration;
    }

    @Column(name = "completed", nullable = false)
    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(
            Boolean completed) {
        this.completed = completed;
    }

    @Column(name = "lastPlayedAt", nullable = false)
    public LocalDateTime getLastPlayedAt() {
        return lastPlayedAt;
    }

    public void setLastPlayedAt(
            LocalDateTime lastPlayedAt) {
        this.lastPlayedAt = lastPlayedAt;
    }

    @Column(name = "createdAt", nullable = false)
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Column(name = "updatedAt", nullable = false)
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}