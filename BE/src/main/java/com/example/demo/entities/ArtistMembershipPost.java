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
import jakarta.persistence.Version;

@Entity
@Table(name = "artist_membership_posts", indexes = {
        @Index(name = "idx_membership_post_artist", columnList = "artistId"),

        @Index(name = "idx_membership_post_status", columnList = "status"),

        @Index(name = "idx_membership_post_visibility", columnList = "visibility"),

        @Index(name = "idx_membership_post_required_plan", columnList = "requiredPlanId"),

        @Index(name = "idx_membership_post_track", columnList = "trackId"),

        @Index(name = "idx_membership_post_published_at", columnList = "publishedAt")
})
public class ArtistMembershipPost {

    /*
     * =========================
     * POST TYPES
     * =========================
     */

    public static final String TYPE_TEXT = "TEXT";

    public static final String TYPE_IMAGE = "IMAGE";

    public static final String TYPE_POLL = "POLL";

    public static final String TYPE_TRACK_PREVIEW = "TRACK_PREVIEW";

    /*
     * =========================
     * VISIBILITY
     * =========================
     */

    public static final String VISIBILITY_PUBLIC = "PUBLIC";

    public static final String VISIBILITY_MEMBERS_ONLY = "MEMBERS_ONLY";

    public static final String VISIBILITY_TIER_ONLY = "TIER_ONLY";

    /*
     * =========================
     * POST STATUS
     * =========================
     */

    public static final String STATUS_DRAFT = "DRAFT";

    public static final String STATUS_PUBLISHED = "PUBLISHED";

    public static final String STATUS_ARCHIVED = "ARCHIVED";

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    /*
     * Artist sở hữu Community post.
     */
    @Column(nullable = false, length = 24)
    private String artistId;

    /*
     * TEXT
     * IMAGE
     * POLL
     * TRACK_PREVIEW
     */
    @Column(nullable = false, length = 30)
    private String type;

    /*
     * PUBLIC
     * MEMBERS_ONLY
     * TIER_ONLY
     */
    @Column(nullable = false, length = 30)
    private String visibility = VISIBILITY_PUBLIC;

    /*
     * Chỉ bắt buộc khi visibility = TIER_ONLY.
     */
    @Column(length = 24)
    private String requiredPlanId;

    /*
     * TEXT:
     * Nội dung bài viết.
     *
     * IMAGE:
     * Caption của ảnh.
     *
     * POLL:
     * Câu hỏi bình chọn.
     *
     * TRACK_PREVIEW:
     * Nội dung giới thiệu track.
     */
    @Column(columnDefinition = "TEXT")
    private String content;

    /*
     * Chỉ dùng cho IMAGE.
     */
    @Column(length = 1000)
    private String imageUrl;

    /*
     * Chỉ dùng cho TRACK_PREVIEW.
     */
    @Column(length = 24)
    private String trackId;

    /*
     * Thời điểm bắt đầu đoạn preview.
     */
    private Long previewStartSeconds;

    /*
     * Thời lượng được phép nghe.
     *
     * null:
     * cho nghe toàn bộ track.
     */
    private Integer previewDurationSeconds;

    @Column(nullable = false)
    private Boolean allowComments = true;

    @Column(nullable = false, length = 20)
    private String status = STATUS_PUBLISHED;

    private LocalDateTime publishedAt;

    @Version
    private Long version;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {

        LocalDateTime now = LocalDateTime.now();

        if (id == null
                || id.isBlank()) {

            id = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 24);
        }

        if (type != null) {
            type = type
                    .trim()
                    .toUpperCase(
                            Locale.ROOT);
        }

        if (visibility == null
                || visibility.isBlank()) {

            visibility = VISIBILITY_PUBLIC;

        } else {

            visibility = visibility
                    .trim()
                    .toUpperCase(
                            Locale.ROOT);
        }

        if (status == null
                || status.isBlank()) {

            status = STATUS_PUBLISHED;

        } else {

            status = status
                    .trim()
                    .toUpperCase(
                            Locale.ROOT);
        }

        if (allowComments == null) {
            allowComments = true;
        }

        if (previewStartSeconds == null
                || previewStartSeconds < 0L) {

            previewStartSeconds = 0L;
        }

        if (STATUS_PUBLISHED.equals(status)
                && publishedAt == null) {

            publishedAt = now;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {

        if (type != null) {
            type = type
                    .trim()
                    .toUpperCase(
                            Locale.ROOT);
        }

        if (visibility != null) {
            visibility = visibility
                    .trim()
                    .toUpperCase(
                            Locale.ROOT);
        }

        if (status != null) {
            status = status
                    .trim()
                    .toUpperCase(
                            Locale.ROOT);
        }

        if (allowComments == null) {
            allowComments = true;
        }

        if (previewStartSeconds == null
                || previewStartSeconds < 0L) {

            previewStartSeconds = 0L;
        }

        if (STATUS_PUBLISHED.equals(status)
                && publishedAt == null) {

            publishedAt = LocalDateTime.now();
        }

        updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(
            String id) {
        this.id = id;
    }

    public String getArtistId() {
        return artistId;
    }

    public void setArtistId(
            String artistId) {
        this.artistId = artistId;
    }

    public String getType() {
        return type;
    }

    public void setType(
            String type) {
        this.type = type;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(
            String visibility) {
        this.visibility = visibility;
    }

    public String getRequiredPlanId() {
        return requiredPlanId;
    }

    public void setRequiredPlanId(
            String requiredPlanId) {
        this.requiredPlanId = requiredPlanId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(
            String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(
            String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getTrackId() {
        return trackId;
    }

    public void setTrackId(
            String trackId) {
        this.trackId = trackId;
    }

    public Long getPreviewStartSeconds() {
        return previewStartSeconds;
    }

    public void setPreviewStartSeconds(
            Long previewStartSeconds) {
        this.previewStartSeconds = previewStartSeconds;
    }

    public Integer getPreviewDurationSeconds() {
        return previewDurationSeconds;
    }

    public void setPreviewDurationSeconds(
            Integer previewDurationSeconds) {
        this.previewDurationSeconds = previewDurationSeconds;
    }

    public Boolean getAllowComments() {
        return allowComments;
    }

    public void setAllowComments(
            Boolean allowComments) {
        this.allowComments = allowComments;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {
        this.status = status;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(
            LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
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