package com.example.demo.entities;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Comment entity
 */
@Entity
@Table(name = "comments")
public class Comment implements java.io.Serializable {

	private String id;
	private String content;
	private Integer moment;
	private String userId;
	private String trackId;
	private Boolean isDeleted;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	private User user;
	private Track track;

	public Comment() {
	}

	public Comment(String id, String content) {
		this.id = id;
		this.content = content;
	}

	public Comment(String id, String content, Integer moment, String userId, String trackId, Boolean isDeleted,
			LocalDateTime createdAt, LocalDateTime updatedAt) {
		this.id = id;
		this.content = content;
		this.moment = moment;
		this.userId = userId;
		this.trackId = trackId;
		this.isDeleted = isDeleted;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	@Id
	@Column(name = "id", unique = true, nullable = false, length = 24)
	public String getId() {
		return this.id;
	}

	public void setId(String id) {
		this.id = id;
	}

	@Column(name = "content", nullable = false)
	public String getContent() {
		return this.content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	@Column(name = "moment")
	public Integer getMoment() {
		return this.moment;
	}

	public void setMoment(Integer moment) {
		this.moment = moment;
	}

	@Column(name = "userId", length = 24)
	public String getUserId() {
		return this.userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	@Column(name = "trackId", length = 24)
	public String getTrackId() {
		return this.trackId;
	}

	public void setTrackId(String trackId) {
		this.trackId = trackId;
	}

	@Column(name = "isDeleted")
	public Boolean getIsDeleted() {
		return this.isDeleted;
	}

	public void setIsDeleted(Boolean isDeleted) {
		this.isDeleted = isDeleted;
	}

	@Column(name = "createdAt")
	public LocalDateTime getCreatedAt() {
		return this.createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	@Column(name = "updatedAt")
	public LocalDateTime getUpdatedAt() {
		return this.updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "userId", insertable = false, updatable = false)
	public User getUser() {
		return this.user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "trackId", insertable = false, updatable = false)
	@JsonBackReference
	public Track getTrack() {
		return this.track;
	}

	public void setTrack(Track track) {
		this.track = track;
	}
}
