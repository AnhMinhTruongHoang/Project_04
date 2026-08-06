package com.example.demo.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

@Entity
@Table(name = "artist_membership_poll_options", uniqueConstraints = {
        @UniqueConstraint(name = "uk_membership_poll_option_order", columnNames = {
                "postId",
                "displayOrder"
        })
}, indexes = {
        @Index(name = "idx_membership_poll_option_post", columnList = "postId")
})
public class ArtistMembershipPollOption {

    @Id
    @Column(nullable = false, updatable = false, length = 24)
    private String id;

    /*
     * ArtistMembershipPost có type = POLL.
     */
    @Column(nullable = false, length = 24)
    private String postId;

    @Column(nullable = false, length = 500)
    private String optionText;

    @Column(nullable = false)
    private Integer displayOrder;

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

        if (displayOrder == null
                || displayOrder < 0) {

            displayOrder = 0;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {

        if (displayOrder == null
                || displayOrder < 0) {

            displayOrder = 0;
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

    public String getOptionText() {
        return optionText;
    }

    public void setOptionText(
            String optionText) {
        this.optionText = optionText;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(
            Integer displayOrder) {
        this.displayOrder = displayOrder;
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