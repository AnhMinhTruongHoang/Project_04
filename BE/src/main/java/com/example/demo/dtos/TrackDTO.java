package com.example.demo.dtos;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TrackDTO {

	private String id;
	private String title;
	private String slug;
	private String description;

	private String category;
	private String categoryId;
	private String categoryName;

	private String imgUrl;
	private String trackUrl;
	private Integer countLike;
	private Integer countPlay;
	private String uploaderId;
	private UserDTO uploader;
	private Boolean isDeleted;
	private String approvalStatus;
	private String rejectionReason;
	private Long durationSeconds;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	/// copyright
	private String audioHash;

	private Long audioSize;

	private String processingStatus;

	private String copyrightStatus;

	private String copyrightMessage;

	private Double copyrightScore;

	private LocalDateTime scannedAt;

	/*
	 * =========================
	 * COPYRIGHT LICENSE DOCUMENT
	 * =========================
	 */

	private String licenseUrl;

	private String licenseFileName;

	private Long licenseFileSize;

	private String licenseType;

	private String licenseNote;

	private String licenseReviewStatus;

	private String licenseReviewReason;

	private LocalDateTime licenseUploadedAt;

	private LocalDateTime licenseReviewedAt;

	private String licenseReviewedBy;

	/*
	 * =========================
	 * AUDIO FINGERPRINT RESULT
	 * =========================
	 */

	private String fingerprintAlgorithm;

	private String fingerprintVersion;

	private String matchedTrackId;

	private Double fingerprintScore;

	private Double matchedDurationRatio;

	private String copyrightRiskLevel;

	///

	public TrackDTO() {
	}

	@JsonProperty("_id")
	public String get_id() {
		return id;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getSlug() {
		return slug;
	}

	public void setSlug(String slug) {
		this.slug = slug;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	// FE cũ vẫn đọc field này: track.category = "ncs", "kpop", "pop", ...
	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getCategoryId() {
		return categoryId;
	}

	public void setCategoryId(String categoryId) {
		this.categoryId = categoryId;
	}

	public String getCategoryName() {
		return categoryName;
	}

	public void setCategoryName(String categoryName) {
		this.categoryName = categoryName;
	}

	public String getImgUrl() {
		return imgUrl;
	}

	public void setImgUrl(String imgUrl) {
		this.imgUrl = imgUrl;
	}

	public String getTrackUrl() {
		return trackUrl;
	}

	public void setTrackUrl(String trackUrl) {
		this.trackUrl = trackUrl;
	}

	public Integer getCountLike() {
		return countLike;
	}

	public void setCountLike(Integer countLike) {
		this.countLike = countLike;
	}

	public Integer getCountPlay() {
		return countPlay;
	}

	public void setCountPlay(Integer countPlay) {
		this.countPlay = countPlay;
	}

	public String getUploaderId() {
		return uploaderId;
	}

	public void setUploaderId(String uploaderId) {
		this.uploaderId = uploaderId;
	}

	public UserDTO getUploader() {
		return uploader;
	}

	public void setUploader(UserDTO uploader) {
		this.uploader = uploader;
	}

	public Boolean getIsDeleted() {
		return isDeleted;
	}

	public void setIsDeleted(Boolean isDeleted) {
		this.isDeleted = isDeleted;
	}

	public String getApprovalStatus() {
		return approvalStatus;
	}

	public void setApprovalStatus(String approvalStatus) {
		this.approvalStatus = approvalStatus;
	}

	public String getRejectionReason() {
		return rejectionReason;
	}

	public void setRejectionReason(
			String rejectionReason) {
		this.rejectionReason = rejectionReason;
	}

	public Long getDurationSeconds() {
		return durationSeconds;
	}

	public void setDurationSeconds(
			Long durationSeconds) {
		this.durationSeconds = durationSeconds;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	public String getAudioHash() {
		return audioHash;
	}

	public void setAudioHash(
			String audioHash) {
		this.audioHash = audioHash;
	}

	public Long getAudioSize() {
		return audioSize;
	}

	public void setAudioSize(
			Long audioSize) {
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

	/*
	 * =========================
	 * AUDIO FINGERPRINT RESULT
	 * =========================
	 */

	public String getFingerprintAlgorithm() {
		return fingerprintAlgorithm;
	}

	public void setFingerprintAlgorithm(
			String fingerprintAlgorithm) {

		this.fingerprintAlgorithm = fingerprintAlgorithm;
	}

	public String getFingerprintVersion() {
		return fingerprintVersion;
	}

	public void setFingerprintVersion(
			String fingerprintVersion) {

		this.fingerprintVersion = fingerprintVersion;
	}

	public String getMatchedTrackId() {
		return matchedTrackId;
	}

	public void setMatchedTrackId(
			String matchedTrackId) {

		this.matchedTrackId = matchedTrackId;
	}

	public Double getFingerprintScore() {
		return fingerprintScore;
	}

	public void setFingerprintScore(
			Double fingerprintScore) {

		this.fingerprintScore = fingerprintScore;
	}

	public Double getMatchedDurationRatio() {
		return matchedDurationRatio;
	}

	public void setMatchedDurationRatio(
			Double matchedDurationRatio) {

		this.matchedDurationRatio = matchedDurationRatio;
	}

	public String getCopyrightRiskLevel() {
		return copyrightRiskLevel;
	}

	public void setCopyrightRiskLevel(
			String copyrightRiskLevel) {

		this.copyrightRiskLevel = copyrightRiskLevel;
	}

	/*
	 * =========================
	 * COPYRIGHT LICENSE DOCUMENT
	 * =========================
	 */

	public String getLicenseUrl() {
		return licenseUrl;
	}

	public void setLicenseUrl(
			String licenseUrl) {

		this.licenseUrl = licenseUrl;
	}

	public String getLicenseFileName() {
		return licenseFileName;
	}

	public void setLicenseFileName(
			String licenseFileName) {

		this.licenseFileName = licenseFileName;
	}

	public Long getLicenseFileSize() {
		return licenseFileSize;
	}

	public void setLicenseFileSize(
			Long licenseFileSize) {

		this.licenseFileSize = licenseFileSize;
	}

	public String getLicenseType() {
		return licenseType;
	}

	public void setLicenseType(
			String licenseType) {

		this.licenseType = licenseType;
	}

	public String getLicenseNote() {
		return licenseNote;
	}

	public void setLicenseNote(
			String licenseNote) {

		this.licenseNote = licenseNote;
	}

	public String getLicenseReviewStatus() {
		return licenseReviewStatus;
	}

	public void setLicenseReviewStatus(
			String licenseReviewStatus) {

		this.licenseReviewStatus = licenseReviewStatus;
	}

	public String getLicenseReviewReason() {
		return licenseReviewReason;
	}

	public void setLicenseReviewReason(
			String licenseReviewReason) {

		this.licenseReviewReason = licenseReviewReason;
	}

	public LocalDateTime getLicenseUploadedAt() {
		return licenseUploadedAt;
	}

	public void setLicenseUploadedAt(
			LocalDateTime licenseUploadedAt) {

		this.licenseUploadedAt = licenseUploadedAt;
	}

	public LocalDateTime getLicenseReviewedAt() {
		return licenseReviewedAt;
	}

	public void setLicenseReviewedAt(
			LocalDateTime licenseReviewedAt) {

		this.licenseReviewedAt = licenseReviewedAt;
	}

	public String getLicenseReviewedBy() {
		return licenseReviewedBy;
	}

	public void setLicenseReviewedBy(
			String licenseReviewedBy) {

		this.licenseReviewedBy = licenseReviewedBy;
	}
}