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
@Table(name = "artist_membership_post_comments", indexes = {
        @Index(name = "idx_membership_comment_post", columnList = "postId"),

        @Index(name = "idx_membership_comment_user", columnList = "userId"),

        @Index(name = "idx_membership_comment_parent", columnList = "parentCommentId"),

        @Index(name = "idx_membership_comment_status", columnList = "status"),

        @Index(name = "idx_membership_comment_created_at", columnList = "createdAt")
})
public class ArtistMembershipPostComment {

    public static final String STATUS_ACTIVE = "ACTIVE";

    public static final String STATUS_DELETED = "DELETED";

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    /*
     * Community post được bình luận.
     */
    @Column(nullable = false, length = 24)
    private String postId;

    /*
     * User hoặc artist tạo bình luận.
     */
    @Column(nullable = false, length = 24)
    private String userId;

    /*
     * null:
     * bình luận cấp cao nhất.
     *
     * Có giá trị:
     * phản hồi một bình luận khác.
     */
    @Column(length = 24)
    private String parentCommentId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

    /*
     * Thời điểm nội dung được chỉnh sửa.
     */
    private LocalDateTime editedAt;

    /*
     * Soft delete:
     * không xóa vật lý để tránh mất chuỗi phản hồi.
     */
    private LocalDateTime deletedAt;

    /*
     * User hoặc artist đã xóa bình luận.
     */
    @Column(length = 24)
    private String deletedBy;

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

        if (status == null
                || status.isBlank()) {

            status = STATUS_ACTIVE;

        } else {

            status = status
                    .trim()
                    .toUpperCase(
                            Locale.ROOT);
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {

        if (status == null
                || status.isBlank()) {

            status = STATUS_ACTIVE;

        } else {

            status = status
                    .trim()
                    .toUpperCase(
                            Locale.ROOT);
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

    public String getPostId() {
        return postId;
    }

    public void setPostId(
            String postId) {

        this.postId = postId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(
            String userId) {

        this.userId = userId;
    }

    public String getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(
            String parentCommentId) {

        this.parentCommentId = parentCommentId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(
            String content) {

        this.content = content;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {

        this.status = status;
    }

    public LocalDateTime getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(
            LocalDateTime editedAt) {

        this.editedAt = editedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(
            LocalDateTime deletedAt) {

        this.deletedAt = deletedAt;
    }

    public String getDeletedBy() {
        return deletedBy;
    }

    public void setDeletedBy(
            String deletedBy) {

        this.deletedBy = deletedBy;
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