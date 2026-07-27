package com.example.demo.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "listening_sessions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_listening_session_session_id", columnNames = "sessionId")
}, indexes = {
        @Index(name = "idx_listening_session_listener", columnList = "listenerId"),
        @Index(name = "idx_listening_session_track", columnList = "trackId"),
        @Index(name = "idx_listening_session_artist", columnList = "artistId"),
        @Index(name = "idx_listening_session_status", columnList = "status"),
        @Index(name = "idx_listening_session_qualified", columnList = "qualified")
})

public class ListeningSession {

    public static final String STATUS_ACTIVE = "ACTIVE";

    public static final String STATUS_COMPLETED = "COMPLETED";

    public static final String STATUS_EXPIRED = "EXPIRED";

    public static final String STATUS_INVALID = "INVALID";

    @Id
    @Column(length = 24, nullable = false, updatable = false)
    private String id;

    /*
     * UUID được Frontend tạo khi bắt đầu một lượt phát mới.
     */
    @Column(nullable = false, unique = true, length = 64)
    private String sessionId;

    @Column(nullable = false, length = 24)
    private String listenerId;

    @Column(nullable = false, length = 24)
    private String trackId;

    @Column(nullable = false, length = 24)
    private String artistId;

    /*
     * Vị trí cuối cùng do client gửi.
     * Không dùng trực tiếp làm số giây nghe hợp lệ.
     */
    @Column(nullable = false)
    private Double lastPosition = 0D;

    @Column(nullable = false)
    private Double duration = 0D;

    /*
     * Tổng số giây Backend đã xác nhận là nghe hợp lệ.
     */
    @Column(nullable = false)
    private Double accumulatedSeconds = 0D;

    @Column(nullable = false)
    private Integer heartbeatCount = 0;

    @Column(nullable = false)
    private Boolean qualified = false;

    @Column(length = 20, nullable = false)
    private String status = STATUS_ACTIVE;

    private LocalDateTime startedAt;

    private LocalDateTime lastHeartbeatAt;

    private LocalDateTime qualifiedAt;

    private LocalDateTime endedAt;

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

        if (lastPosition == null) {
            lastPosition = 0D;
        }

        if (duration == null) {
            duration = 0D;
        }

        if (accumulatedSeconds == null) {
            accumulatedSeconds = 0D;
        }

        if (heartbeatCount == null) {
            heartbeatCount = 0;
        }

        if (qualified == null) {
            qualified = false;
        }

        if (status == null || status.isBlank()) {
            status = STATUS_ACTIVE;
        }

        if (startedAt == null) {
            startedAt = now;
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

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(
            String sessionId) {
        this.sessionId = sessionId;
    }

    public String getListenerId() {
        return listenerId;
    }

    public void setListenerId(
            String listenerId) {
        this.listenerId = listenerId;
    }

    public String getTrackId() {
        return trackId;
    }

    public void setTrackId(
            String trackId) {
        this.trackId = trackId;
    }

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(
            String artistId) {
        this.artistId = artistId;
    }

    public Double getLastPosition() {
        return lastPosition;
    }

    public void setLastPosition(
            Double lastPosition) {
        this.lastPosition = lastPosition;
    }

    public Double getDuration() {
        return duration;
    }

    public void setDuration(
            Double duration) {
        this.duration = duration;
    }

    public Double getAccumulatedSeconds() {
        return accumulatedSeconds;
    }

    public void setAccumulatedSeconds(
            Double accumulatedSeconds) {
        this.accumulatedSeconds = accumulatedSeconds;
    }

    public Integer getHeartbeatCount() {
        return heartbeatCount;
    }

    public void setHeartbeatCount(
            Integer heartbeatCount) {
        this.heartbeatCount = heartbeatCount;
    }

    public Boolean getQualified() {
        return qualified;
    }

    public void setQualified(
            Boolean qualified) {
        this.qualified = qualified;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(
            LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getLastHeartbeatAt() {
        return lastHeartbeatAt;
    }

    public void setLastHeartbeatAt(
            LocalDateTime lastHeartbeatAt) {
        this.lastHeartbeatAt = lastHeartbeatAt;
    }

    public LocalDateTime getQualifiedAt() {
        return qualifiedAt;
    }

    public void setQualifiedAt(
            LocalDateTime qualifiedAt) {
        this.qualifiedAt = qualifiedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(
            LocalDateTime endedAt) {
        this.endedAt = endedAt;
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