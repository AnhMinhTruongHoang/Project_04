package com.example.demo.controllers;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.jsonwebtoken.Claims;

import com.example.demo.entities.Playlist;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.PlaylistRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;

@RestController
@RequestMapping({ "/api/playlists", "/api/v1/playlists" })
public class PlaylistController {

	@Autowired
	private PlaylistRepository playlistRepository;

	@Autowired
	private TrackRepository trackRepository;

	@Autowired
	private UserRepository userRepository;

	@Value("${images_url}")
	private String imagesUrl;

	@Value("${audio_url}")
	private String audioUrl;

	private String generateId() {
		return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
	}

	private String getBearerToken(HttpServletRequest request) {
		String authHeader = request.getHeader("Authorization");

		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			return null;
		}

		return authHeader.substring(7);
	}

	private User getCurrentUser(HttpServletRequest request) {
		try {
			String token = getBearerToken(request);

			if (token == null) {
				return null;
			}

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			return userRepository.findByEmail(email);
		} catch (Exception e) {
			return null;
		}
	}

	private boolean isAdmin(User user) {
		return user != null && "ADMIN".equals(user.getRole());
	}

	private boolean isOwnerOrAdmin(User user, Playlist playlist) {
		if (user == null || playlist == null) {
			return false;
		}

		return user.getId().equals(playlist.getUserId()) || isAdmin(user);
	}

	private String fullImageUrl(String imgUrl) {
		if (imgUrl == null || imgUrl.trim().isEmpty()) {
			return imgUrl;
		}

		if (imgUrl.startsWith("http")) {
			return imgUrl;
		}

		return imagesUrl + imgUrl;
	}

	private String fullAudioUrl(String trackUrl) {
		if (trackUrl == null || trackUrl.trim().isEmpty()) {
			return trackUrl;
		}

		if (trackUrl.startsWith("http")) {
			return trackUrl;
		}

		return audioUrl + trackUrl;
	}

	private String getString(Map<String, Object> body, String... keys) {
		if (body == null) {
			return null;
		}

		for (String key : keys) {
			Object value = body.get(key);

			if (value != null) {
				String result = String.valueOf(value).trim();

				if (!result.isEmpty()) {
					return result;
				}
			}
		}

		return null;
	}

	private Boolean getBoolean(Map<String, Object> body, String key) {
		if (body == null) {
			return null;
		}

		Object value = body.get(key);

		if (value == null) {
			return null;
		}

		if (value instanceof Boolean) {
			return (Boolean) value;
		}

		return Boolean.parseBoolean(String.valueOf(value));
	}

	private List<String> extractTrackIds(Map<String, Object> body) {
		if (body == null) {
			return null;
		}

		Object raw = body.get("trackIds");

		if (raw == null) {
			raw = body.get("tracks");
		}

		if (raw == null) {
			raw = body.get("trackId");
		}

		if (raw == null) {
			return null;
		}

		List<String> ids = new ArrayList<>();

		if (raw instanceof List<?>) {
			List<?> list = (List<?>) raw;

			for (Object item : list) {
				if (item == null) {
					continue;
				}

				if (item instanceof Map<?, ?>) {
					Map<?, ?> map = (Map<?, ?>) item;

					Object id = map.get("_id");

					if (id == null) {
						id = map.get("id");
					}

					if (id != null) {
						ids.add(String.valueOf(id));
					}
				} else {
					ids.add(String.valueOf(item));
				}
			}
		} else {
			ids.add(String.valueOf(raw));
		}

		return ids;
	}

	private Set<Track> getTracksFromBody(Map<String, Object> body) {
		List<String> trackIds = extractTrackIds(body);

		if (trackIds == null) {
			return null;
		}

		Set<Track> tracks = new HashSet<>();

		for (String trackId : trackIds) {
			Track track = trackRepository.findById(trackId).orElse(null);

			if (track != null && !Boolean.TRUE.equals(track.getIsDeleted())) {
				tracks.add(track);
			}
		}

		return tracks;
	}

	private Map<String, Object> toUserMap(User user) {
		if (user == null) {
			return null;
		}

		Map<String, Object> map = new LinkedHashMap<>();

		map.put("_id", user.getId());
		map.put("id", user.getId());
		map.put("email", user.getEmail());
		map.put("username", user.getUsername());
		map.put("name", user.getName());
		map.put("role", user.getRole());
		map.put("avatarUrl", user.getAvatarUrl());
		map.put("avatar", user.getAvatarUrl());
		map.put("image", user.getAvatarUrl());

		return map;
	}

	private Map<String, Object> toTrackMap(Track track) {
		if (track == null) {
			return null;
		}

		Map<String, Object> map = new LinkedHashMap<>();

		map.put("_id", track.getId());
		map.put("id", track.getId());
		map.put("title", track.getTitle());
		map.put("slug", track.getSlug());
		map.put("description", track.getDescription());
		map.put("category", track.getCategory());
		map.put("imgUrl", fullImageUrl(track.getImgUrl()));
		map.put("trackUrl", fullAudioUrl(track.getTrackUrl()));
		map.put("countLike", track.getCountLike() == null ? 0 : track.getCountLike());
		map.put("countPlay", track.getCountPlay() == null ? 0 : track.getCountPlay());
		map.put("uploaderId", track.getUploaderId());
		map.put("isDeleted", track.getIsDeleted());
		map.put("createdAt", track.getCreatedAt());
		map.put("updatedAt", track.getUpdatedAt());

		return map;
	}

	private Map<String, Object> toPlaylistMap(Playlist playlist) {
		Map<String, Object> map = new LinkedHashMap<>();

		map.put("_id", playlist.getId());
		map.put("id", playlist.getId());
		map.put("title", playlist.getTitle());
		map.put("isPublic", playlist.getIsPublic());
		map.put("isAlbum", playlist.getIsAlbum() == null ? false : playlist.getIsAlbum());
		map.put("isDeleted", playlist.getIsDeleted());
		map.put("userId", playlist.getUserId());
		map.put("createdAt", playlist.getCreatedAt());
		map.put("updatedAt", playlist.getUpdatedAt());

		User user = null;

		if (playlist.getUserId() != null) {
			user = userRepository.findById(playlist.getUserId()).orElse(null);
		}

		map.put("user", toUserMap(user));

		List<Map<String, Object>> tracks = new ArrayList<>();

		if (playlist.getTracks() != null) {
			for (Track track : playlist.getTracks()) {
				if (track != null && !Boolean.TRUE.equals(track.getIsDeleted())) {
					tracks.add(toTrackMap(track));
				}
			}
		}

		map.put("tracks", tracks);

		return map;
	}

	private List<Map<String, Object>> toPlaylistList(List<Playlist> playlists) {
		List<Map<String, Object>> result = new ArrayList<>();

		for (Playlist playlist : playlists) {
			result.add(toPlaylistMap(playlist));
		}

		return result;
	}

	@PostMapping({ "", "create" })
	public ResponseEntity<?> createPlaylist(
			@RequestBody(required = false) Map<String, Object> body,
			HttpServletRequest request) {

		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			String title = getString(body, "title", "name");

			if (title == null) {
				return ResponseEntity.badRequest().body(new ApiResponse<>(400, "Title is required", null));
			}

			Boolean isPublic = getBoolean(body, "isPublic");

			Playlist playlist = new Playlist();

			playlist.setId(generateId());
			playlist.setTitle(title);
			playlist.setIsPublic(isPublic == null ? false : isPublic);
			playlist.setUserId(user.getId());
			playlist.setIsAlbum(false);
			playlist.setIsDeleted(false);
			playlist.setCreatedAt(new Date());
			playlist.setUpdatedAt(new Date());

			Set<Track> tracks = getTracksFromBody(body);

			if (tracks != null) {
				playlist.setTracks(tracks);
			}

			playlistRepository.save(playlist);

			return ResponseEntity.ok(new ApiResponse<>(200, "Create playlist success", toPlaylistMap(playlist)));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@RequestMapping(value = { "", "{id}", "update/{id}" }, method = { RequestMethod.PUT, RequestMethod.PATCH })
	public ResponseEntity<?> updatePlaylist(
			@PathVariable(required = false) String id,
			@RequestBody(required = false) Map<String, Object> body,
			HttpServletRequest request) {

		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			String playlistId = id != null ? id : getString(body, "id", "_id");

			if (playlistId == null) {
				return ResponseEntity.badRequest().body(new ApiResponse<>(400, "Playlist id is required", null));
			}

			Playlist playlist = playlistRepository.findById(playlistId).orElse(null);

			if (playlist == null || Boolean.TRUE.equals(playlist.getIsDeleted())) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Playlist not found", null));
			}

			if (!isOwnerOrAdmin(user, playlist)) {
				return ResponseEntity.status(403).body(new ApiResponse<>(403, "Access denied", null));
			}

			String title = getString(body, "title", "name");

			if (title != null) {
				playlist.setTitle(title);
			}

			Boolean isPublic = getBoolean(body, "isPublic");

			if (isPublic != null) {
				playlist.setIsPublic(isPublic);
			}

			Set<Track> tracks = getTracksFromBody(body);

			if (tracks != null) {
				playlist.setTracks(tracks);
			}

			playlist.setUpdatedAt(new Date());

			playlistRepository.save(playlist);

			return ResponseEntity.ok(new ApiResponse<>(200, "Update playlist success", toPlaylistMap(playlist)));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@DeleteMapping({ "{id}", "delete/{id}" })
	public ResponseEntity<?> deletePlaylist(@PathVariable String id, HttpServletRequest request) {
		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			Playlist playlist = playlistRepository.findById(id).orElse(null);

			if (playlist == null || Boolean.TRUE.equals(playlist.getIsDeleted())) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Playlist not found", null));
			}

			if (!isOwnerOrAdmin(user, playlist)) {
				return ResponseEntity.status(403).body(new ApiResponse<>(403, "Access denied", null));
			}

			playlist.setIsDeleted(true);
			playlist.setUpdatedAt(new Date());

			playlistRepository.save(playlist);

			return ResponseEntity.ok(new ApiResponse<>(200, "Delete playlist success", null));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping({ "search/{id}", "{id}" })
	public ResponseEntity<?> getPlaylistById(@PathVariable String id) {
		try {
			Playlist playlist = playlistRepository.findById(id).orElse(null);

			if (playlist == null || Boolean.TRUE.equals(playlist.getIsDeleted())) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Playlist not found", null));
			}

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch playlist success", toPlaylistMap(playlist)));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping
	public ResponseEntity<?> getPlaylists(
			@RequestParam(defaultValue = "1") int current,
			@RequestParam(defaultValue = "10") int pageSize) {

		try {
			int safeCurrent = Math.max(current, 1);
			int safePageSize = Math.max(pageSize, 1);

			Pageable pageable = PageRequest.of(safeCurrent - 1, safePageSize);

			Page<Playlist> page = playlistRepository.findByIsDeletedFalse(pageable);

			Map<String, Object> meta = new LinkedHashMap<>();

			meta.put("current", safeCurrent);
			meta.put("pageSize", safePageSize);
			meta.put("pages", page.getTotalPages());
			meta.put("total", page.getTotalElements());

			Map<String, Object> data = new LinkedHashMap<>();

			data.put("meta", meta);
			data.put("result", toPlaylistList(page.getContent()));

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch playlists success", data));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping({ "my-playlists", "by-user" })
	public ResponseEntity<?> getMyPlaylists(HttpServletRequest request) {
		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			List<Playlist> playlists = playlistRepository.findByUserIdAndIsDeletedFalse(user.getId());

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch my playlists success", toPlaylistList(playlists)));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}
}