package com.example.demo.entities;
// Generated May 25, 2026 by Hibernate Tools

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Playlist entity
 */
@Entity
@Table(name = "playlists")
public class Playlist implements java.io.Serializable {

	private String id;
	private String title;
	private Boolean isPublic;
	private String userId;
	private Boolean isDeleted;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	private Boolean isAlbum;

	private User user;
	private Set<Track> tracks = new HashSet<>(0);

	public Playlist() {
	}

	public Playlist(String id, String title) {
		this.id = id;
		this.title = title;
	}

	public Playlist(String id, String title, Boolean isPublic, String userId, Boolean isDeleted,
			LocalDateTime createdAt, LocalDateTime updatedAt) {
		this.id = id;
		this.title = title;
		this.isPublic = isPublic;
		this.userId = userId;
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

	@Column(name = "title", nullable = false, length = 255)
	public String getTitle() {
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	@Column(name = "isPublic")
	public Boolean getIsPublic() {
		return this.isPublic;
	}

	public void setIsPublic(Boolean isPublic) {
		this.isPublic = isPublic;
	}

	@Column(name = "userId", length = 24)
	public String getUserId() {
		return this.userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
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

	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(name = "playlist_tracks", joinColumns = {
			@JoinColumn(name = "playlistId", nullable = false) }, inverseJoinColumns = {
					@JoinColumn(name = "trackId", nullable = false) })
	public Set<Track> getTracks() {
		return this.tracks;
	}

	public void setTracks(Set<Track> tracks) {
		this.tracks = tracks;
	}

	@Column(name = "isAlbum")
	public Boolean getIsAlbum() {
		return isAlbum;
	}

	public void setIsAlbum(Boolean isAlbum) {
		this.isAlbum = isAlbum;
	}
}
