package com.example.demo.entities;

import java.io.Serializable;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "user_badges", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_badges_user_badge", columnNames = {
                "user_id",
                "badge_id"
        })
})
public class UserBadge implements Serializable {

    private String id;
    private User user;
    private Badge badge;
    private User awardedBy;
    private String note;
    private Boolean active = true;
    private Date awardedAt;
    private Date expiresAt;
    private Date revokedAt;

    public UserBadge() {
    }

    @Id
    @Column(name = "id", nullable = false, length = 24)
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "badge_id", nullable = false)
    @JsonIgnore
    public Badge getBadge() {
        return badge;
    }

    public void setBadge(Badge badge) {
        this.badge = badge;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "awarded_by")
    @JsonIgnore
    public User getAwardedBy() {
        return awardedBy;
    }

    public void setAwardedBy(User awardedBy) {
        this.awardedBy = awardedBy;
    }

    @Column(name = "note", length = 1000)
    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note == null
                ? null
                : note.trim();
    }

    @Column(name = "active", nullable = false)
    public Boolean getActive() {
        return active == null ? true : active;
    }

    public void setActive(Boolean active) {
        this.active = active == null ? true : active;
    }

    @Column(name = "awarded_at", nullable = false)
    public Date getAwardedAt() {
        return awardedAt;
    }

    public void setAwardedAt(Date awardedAt) {
        this.awardedAt = awardedAt;
    }

    @Column(name = "expires_at")
    public Date getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }

    @Column(name = "revoked_at")
    public Date getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Date revokedAt) {
        this.revokedAt = revokedAt;
    }
}