package com.example.demo.dtos;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UserResponseDTO {

	private String id;
	private String email;
	private String username;
	private String name;
	private String role;
	private String address;
	private Integer age;
	private String gender;
	private Boolean isVerify;
	private String type;
	private String avatarUrl;
	private Integer followers;
	private Integer following;
	private String coverUrl;
	private String bio;
	private String website;
	private String city;
	private String country;
	private Boolean verified;
	private String spotlightTrackId;
	private String accountStatus;
	private String statusReason;
	private Date suspendedUntil;
	private Date statusUpdatedAt;
	private Date createdAt;
	private Date updatedAt;

	public String getCoverUrl() {
		return coverUrl;
	}

	public void setCoverUrl(String coverUrl) {
		this.coverUrl = coverUrl;
	}

	public String getBio() {
		return bio;
	}

	public void setBio(String bio) {
		this.bio = bio;
	}

	public String getWebsite() {
		return website;
	}

	public void setWebsite(String website) {
		this.website = website;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	public String getCountry() {
		return country;
	}

	public void setCountry(String country) {
		this.country = country;
	}

	public Boolean getVerified() {
		return verified;
	}

	public void setVerified(Boolean verified) {
		this.verified = verified;
	}

	public String getSpotlightTrackId() {
		return spotlightTrackId;
	}

	public void setSpotlightTrackId(String spotlightTrackId) {
		this.spotlightTrackId = spotlightTrackId;
	}

	public UserResponseDTO() {
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

	public String getAccountStatus() {
		return accountStatus == null || accountStatus.isBlank()
				? "ACTIVE"
				: accountStatus;
	}

	public void setAccountStatus(String accountStatus) {
		this.accountStatus = accountStatus;
	}

	public String getStatusReason() {
		return statusReason;
	}

	public void setStatusReason(String statusReason) {
		this.statusReason = statusReason;
	}

	public Date getSuspendedUntil() {
		return suspendedUntil;
	}

	public void setSuspendedUntil(Date suspendedUntil) {
		this.suspendedUntil = suspendedUntil;
	}

	public Date getStatusUpdatedAt() {
		return statusUpdatedAt;
	}

	public void setStatusUpdatedAt(Date statusUpdatedAt) {
		this.statusUpdatedAt = statusUpdatedAt;
	}

	public Boolean getIsDeleted() {
		return "DELETED".equalsIgnoreCase(accountStatus);
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public Integer getAge() {
		return age;
	}

	public void setAge(Integer age) {
		this.age = age;
	}

	public String getGender() {
		return gender;
	}

	public void setGender(String gender) {
		this.gender = gender;
	}

	public Boolean getIsVerify() {
		return isVerify;
	}

	public void setIsVerify(Boolean isVerify) {
		this.isVerify = isVerify;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getAvatarUrl() {
		return avatarUrl;
	}

	public void setAvatarUrl(String avatarUrl) {
		this.avatarUrl = avatarUrl;
	}

	public String getAvatar() {
		return avatarUrl;
	}

	public String getImage() {
		return avatarUrl;
	}

	public Integer getFollowers() {
		return followers;
	}

	public void setFollowers(Integer followers) {
		this.followers = followers;
	}

	public Integer getFollowing() {
		return following;
	}

	public void setFollowing(Integer following) {
		this.following = following;
	}

	public Date getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Date createdAt) {
		this.createdAt = createdAt;
	}

	public Date getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Date updatedAt) {
		this.updatedAt = updatedAt;
	}
}