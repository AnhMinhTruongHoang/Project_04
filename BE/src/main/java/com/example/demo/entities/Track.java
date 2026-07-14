package com.example.demo.entities;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "tracks")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Track implements java.io.Serializable {

	private String id;
	private String title;
	private String slug;
	private String description;

	// New category relation
	private String categoryId;
	private Category categoryInfo;

	private String imgUrl;
	private String trackUrl;
	private Integer countLike;
	private Integer countPlay;
	private String uploaderId;
	private String approvalStatus;
	private String rejectionReason;

	public void setRejectionReason(String rejectionReason) {
		this.rejectionReason = rejectionReason;
	}

	public String getRejectionReason() {
		return rejectionReason;
	}

	private Boolean isDeleted;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	/// upload
	private String audioHash;

	private Long audioSize;

	private String processingStatus;

	private String copyrightStatus;

	private String copyrightMessage;

	private Double copyrightScore;

	private LocalDateTime scannedAt;

	///

	private User uploader;
	private Set<Comment> comments = new HashSet<Comment>(0);
	private Set<Playlist> playlists = new HashSet<Playlist>(0);
	private Set<User> likedByUsers = new HashSet<User>(0);

	public Track() {
	}

	public Track(String id, String title) {
		this.id = id;
		this.title = title;
	}

	public Track(
			String id,
			String title,
			String description,
			String categoryId,
			String imgUrl,
			String trackUrl,
			Integer countLike,
			Integer countPlay,
			String uploaderId,
			Boolean isDeleted,
			LocalDateTime createdAt,
			LocalDateTime updatedAt) {
		this.id = id;
		this.title = title;
		this.description = description;
		this.categoryId = categoryId;
		this.imgUrl = imgUrl;
		this.trackUrl = trackUrl;
		this.countLike = countLike;
		this.countPlay = countPlay;
		this.uploaderId = uploaderId;
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

	@Column(name = "title", nullable = false, length = 500)
	public String getTitle() {
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	@Column(name = "slug", unique = true, length = 600)
	public String getSlug() {
		return this.slug;
	}

	public void setSlug(String slug) {
		this.slug = slug;
	}

	@Column(name = "description", length = 65535)
	public String getDescription() {
		return this.description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	@Column(name = "categoryId", length = 24)
	public String getCategoryId() {
		return this.categoryId;
	}

	public void setCategoryId(String categoryId) {
		this.categoryId = categoryId;
	}

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "categoryId", insertable = false, updatable = false)
	@JsonProperty("categoryInfo")
	public Category getCategoryInfo() {
		return this.categoryInfo;
	}

	public void setCategoryInfo(Category categoryInfo) {
		this.categoryInfo = categoryInfo;
	}

	// Giữ compatibility cho FE cũ:
	// FE vẫn có thể đọc track.category = "ncs", "kpop", "pop", ...
	@Transient
	@JsonProperty("category")
	public String getCategory() {
		if (this.categoryInfo == null) {
			return null;
		}

		return this.categoryInfo.getSlug();
	}

	@Column(name = "imgUrl", length = 500)
	public String getImgUrl() {
		return this.imgUrl;
	}

	public void setImgUrl(String imgUrl) {
		this.imgUrl = imgUrl;
	}

	@Column(name = "trackUrl", length = 500)
	public String getTrackUrl() {
		return this.trackUrl;
	}

	public void setTrackUrl(String trackUrl) {
		this.trackUrl = trackUrl;
	}

	@Column(name = "countLike")
	public Integer getCountLike() {
		return this.countLike;
	}

	public void setCountLike(Integer countLike) {
		this.countLike = countLike;
	}

	@Column(name = "countPlay")
	public Integer getCountPlay() {
		return this.countPlay;
	}

	public void setCountPlay(Integer countPlay) {
		this.countPlay = countPlay;
	}

	@Column(name = "uploaderId", length = 24)
	public String getUploaderId() {
		return this.uploaderId;
	}

	public void setUploaderId(String uploaderId) {
		this.uploaderId = uploaderId;
	}

	@Column(name = "approvalStatus", length = 30)
	public String getApprovalStatus() {
		return this.approvalStatus;
	}

	public void setApprovalStatus(String approvalStatus) {
		this.approvalStatus = approvalStatus;
	}

	@Column(name = "durationSeconds")
	private Long durationSeconds;

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
	@JoinColumn(name = "uploaderId", insertable = false, updatable = false)
	public User getUploader() {
		return this.uploader;
	}

	public void setUploader(User uploader) {
		this.uploader = uploader;
	}

	@OneToMany(fetch = FetchType.LAZY, mappedBy = "track")
	@JsonManagedReference
	public Set<Comment> getComments() {
		return this.comments;
	}

	public void setComments(Set<Comment> comments) {
		this.comments = comments;
	}

	@ManyToMany(fetch = FetchType.LAZY, mappedBy = "likedTracks")
	@JsonIgnore
	public Set<User> getLikedByUsers() {
		return this.likedByUsers;
	}

	public void setLikedByUsers(Set<User> likedByUsers) {
		this.likedByUsers = likedByUsers;
	}

	@ManyToMany(fetch = FetchType.LAZY, mappedBy = "tracks")
	@JsonIgnore
	public Set<Playlist> getPlaylists() {
		return this.playlists;
	}

	public void setPlaylists(Set<Playlist> playlists) {
		this.playlists = playlists;
	}

	public String getAudioHash() {
		return audioHash;
	}

	public void setAudioHash(String audioHash) {
		this.audioHash = audioHash;
	}

	public Long getAudioSize() {
		return audioSize;
	}

	public void setAudioSize(Long audioSize) {
		this.audioSize = audioSize;
	}

	public String getProcessingStatus() {
		return processingStatus;
	}

	public void setProcessingStatus(
			String processingStatus) {
		this.processingStatus = processingStatus;
	}

	public String getCopyrightStatus() {
		return copyrightStatus;
	}

	public void setCopyrightStatus(
			String copyrightStatus) {
		this.copyrightStatus = copyrightStatus;
	}

	public String getCopyrightMessage() {
		return copyrightMessage;
	}

	public void setCopyrightMessage(
			String copyrightMessage) {
		this.copyrightMessage = copyrightMessage;
	}

	public Double getCopyrightScore() {
		return copyrightScore;
	}

	public void setCopyrightScore(
			Double copyrightScore) {
		this.copyrightScore = copyrightScore;
	}

	public LocalDateTime getScannedAt() {
		return scannedAt;
	}

	public void setScannedAt(
			LocalDateTime scannedAt) {
		this.scannedAt = scannedAt;
	}

	public Long getDurationSeconds() {
		return durationSeconds;
	}

	public void setDurationSeconds(
			Long durationSeconds) {
		this.durationSeconds = durationSeconds;
	}
}