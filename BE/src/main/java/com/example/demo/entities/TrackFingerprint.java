package com.example.demo.entities;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "track_fingerprints", uniqueConstraints = {
        @UniqueConstraint(name = "uk_track_fingerprint_version", columnNames = {
                "trackId",
                "algorithm",
                "algorithmVersion"
        })
}, indexes = {
        @Index(name = "idx_track_fingerprint_track", columnList = "trackId"),
        @Index(name = "idx_track_fingerprint_algorithm", columnList = "algorithm,algorithmVersion"),
        @Index(name = "idx_track_fingerprint_hash", columnList = "fingerprintHash")
})
@JsonIgnoreProperties({
        "hibernateLazyInitializer",
        "handler"
})
public class TrackFingerprint implements java.io.Serializable {

    /*
     * =========================
     * BASIC INFORMATION
     * =========================
     */

    private String id;

    private String trackId;

    /*
     * =========================
     * FINGERPRINT INFORMATION
     * =========================
     */

    private String algorithm;

    private String algorithmVersion;

    /*
     * Fingerprint đầy đủ do fpcalc/Chromaprint tạo ra.
     *
     * Chuỗi này có thể rất dài nên lưu dưới dạng LONGTEXT.
     */
    private String rawFingerprint;

    /*
     * SHA-256 của rawFingerprint.
     *
     * Dùng để:
     * - kiểm tra fingerprint giống tuyệt đối;
     * - lập index tìm kiếm nhanh;
     * - tránh so sánh chuỗi LONGTEXT không cần thiết.
     */
    private String fingerprintHash;

    private Integer fingerprintLength;

    private Long durationSeconds;

    /*
     * =========================
     * TIMESTAMPS
     * =========================
     */

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /*
     * =========================
     * RELATIONSHIPS
     * =========================
     */

    private Track track;

    public TrackFingerprint() {
    }

    public TrackFingerprint(
            String id,
            String trackId,
            String algorithm,
            String algorithmVersion,
            String rawFingerprint,
            String fingerprintHash,
            Integer fingerprintLength,
            Long durationSeconds,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.trackId = trackId;
        this.algorithm = algorithm;
        this.algorithmVersion = algorithmVersion;
        this.rawFingerprint = rawFingerprint;
        this.fingerprintHash = fingerprintHash;
        this.fingerprintLength = fingerprintLength;
        this.durationSeconds = durationSeconds;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /*
     * =========================
     * BASIC INFORMATION
     * =========================
     */

    @Id
    @Column(name = "id", unique = true, nullable = false, length = 24)
    public String getId() {
        return id;
    }

    public void setId(
            String id) {

        this.id = id;
    }

    @Column(name = "trackId", nullable = false, length = 24)
    public String getTrackId() {
        return trackId;
    }

    public void setTrackId(
            String trackId) {

        this.trackId = trackId;
    }

    /*
     * =========================
     * FINGERPRINT INFORMATION
     * =========================
     */

    @Column(name = "algorithm", nullable = false, length = 50)
    public String getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(
            String algorithm) {

        this.algorithm = algorithm;
    }

    @Column(name = "algorithmVersion", nullable = false, length = 50)
    public String getAlgorithmVersion() {
        return algorithmVersion;
    }

    public void setAlgorithmVersion(
            String algorithmVersion) {

        this.algorithmVersion = algorithmVersion;
    }

    @Column(name = "rawFingerprint", nullable = false, columnDefinition = "LONGTEXT")
    public String getRawFingerprint() {
        return rawFingerprint;
    }

    public void setRawFingerprint(
            String rawFingerprint) {

        this.rawFingerprint = rawFingerprint;
    }

    @Column(name = "fingerprintHash", nullable = false, length = 64)
    public String getFingerprintHash() {
        return fingerprintHash;
    }

    public void setFingerprintHash(
            String fingerprintHash) {

        this.fingerprintHash = fingerprintHash;
    }

    @Column(name = "fingerprintLength")
    public Integer getFingerprintLength() {
        return fingerprintLength;
    }

    public void setFingerprintLength(
            Integer fingerprintLength) {

        this.fingerprintLength = fingerprintLength;
    }

    @Column(name = "durationSeconds")
    public Long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(
            Long durationSeconds) {

        this.durationSeconds = durationSeconds;
    }

    /*
     * =========================
     * TIMESTAMPS
     * =========================
     */

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

    /*
     * =========================
     * RELATIONSHIPS
     * =========================
     */

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trackId", insertable = false, updatable = false)
    @JsonIgnore
    public Track getTrack() {
        return track;
    }

    public void setTrack(
            Track track) {

        this.track = track;
    }
}