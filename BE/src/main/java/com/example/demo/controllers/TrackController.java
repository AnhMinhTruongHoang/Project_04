package com.example.demo.controllers;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dtos.CreateAlbumDTO;
import com.example.demo.dtos.CreateCommentDTO;
import com.example.demo.dtos.TrackDTO;
import com.example.demo.dtos.UserDTO;
import com.example.demo.entities.Category;
import com.example.demo.entities.Comment;
import com.example.demo.entities.Playlist;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;

import com.example.demo.helpers.FileHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.CategoryRepository;
import com.example.demo.repositories.CommentRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;

import com.example.demo.responses.ApiResponse;
import com.example.demo.services.PlaylistService;

@RestController
@RequestMapping({ "/api/tracks", "/api/v1/tracks" })
public class TrackController {

	private static final String TRACK_PENDING = "PENDING";
	private static final String TRACK_APPROVED = "APPROVED";
	private static final String TRACK_REJECTED = "REJECTED";

	@Autowired
	private TrackRepository trackRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PlaylistService playlistService;

	@Autowired
	private CommentRepository commentRepository;

	@Autowired
	private CategoryRepository categoryRepository;

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
		String token = getBearerToken(request);

		if (token == null) {
			return null;
		}

		Claims claims = JwtHelper.verifyToken(token);
		String email = claims.getSubject();

		return userRepository.findByEmail(email);
	}

	private boolean isAdmin(User user) {
		return user != null && "ADMIN".equals(user.getRole());
	}

	private boolean isOwnerOrAdmin(User user, Track track) {
		if (user == null || track == null) {
			return false;
		}

		return user.getId().equals(track.getUploaderId()) || isAdmin(user);
	}

	private boolean isApproved(Track track) {
		return track != null && TRACK_APPROVED.equals(track.getApprovalStatus());
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

	private String slugify(String input) {
		if (input == null || input.trim().isEmpty()) {
			return "track";
		}

		String prepared = input.trim()
				.replace("Đ", "D")
				.replace("đ", "d");

		String normalized = Normalizer.normalize(prepared, Normalizer.Form.NFD);

		String slug = normalized.replaceAll("\\p{M}", "")
				.toLowerCase()
				.replaceAll("[^a-z0-9]+", "-")
				.replaceAll("^-+|-+$", "");

		return slug.isEmpty() ? "track" : slug;
	}

	private String createSlug(String title, String id) {
		String suffix = id.length() >= 6 ? id.substring(0, 6) : id;
		return slugify(title) + "-" + suffix;
	}

	private String getIdSuffixFromSlug(String slug) {
		if (slug == null || slug.trim().isEmpty()) {
			return "";
		}

		String cleanSlug = slug.trim().replace(".html", "");
		int lastDashIndex = cleanSlug.lastIndexOf("-");

		if (lastDashIndex < 0 || lastDashIndex >= cleanSlug.length() - 1) {
			return "";
		}

		return cleanSlug.substring(lastDashIndex + 1);
	}

	private Track findTrackBySlugOrId(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}

		String cleanValue = value.trim().replace(".html", "");

		Track track = trackRepository.findBySlugAndIsDeletedFalseAndApprovalStatus(cleanValue, TRACK_APPROVED);

		if (track != null) {
			return track;
		}

		track = trackRepository.findById(cleanValue).orElse(null);

		if (track != null) {
			return track;
		}

		String idPrefix = getIdSuffixFromSlug(cleanValue);

		if (idPrefix == null || idPrefix.trim().isEmpty()) {
			return null;
		}

		return trackRepository.findFirstByIdStartingWithAndIsDeletedFalseAndApprovalStatus(
				idPrefix,
				TRACK_APPROVED);
	}

	private Category findOrCreateCategory(String categoryName) {
		String cleanName = categoryName == null ? "unknown" : categoryName.trim().toLowerCase();
		String slug = slugify(cleanName);

		Category category = categoryRepository.findBySlug(slug);

		if (category != null) {
			return category;
		}

		category = new Category();

		category.setId(generateId());
		category.setName(cleanName.toUpperCase());
		category.setSlug(slug);
		category.setDescription(cleanName.toUpperCase() + " tracks");
		category.setIsDeleted(false);

		return categoryRepository.save(category);
	}

	private Category getTrackCategory(Track track) {
		if (track == null || track.getCategoryId() == null || track.getCategoryId().trim().isEmpty()) {
			return null;
		}

		return categoryRepository.findById(track.getCategoryId()).orElse(null);
	}

	private UserDTO toUserDTO(User user) {
		if (user == null) {
			return null;
		}

		UserDTO dto = new UserDTO();

		dto.setId(user.getId());
		dto.setEmail(user.getEmail());
		dto.setUsername(user.getUsername());
		dto.setName(user.getName());
		dto.setRole(user.getRole());
		dto.setAddress(user.getAddress());
		dto.setAge(user.getAge());
		dto.setGender(user.getGender());
		dto.setIsVerify(user.getIsVerify());
		dto.setType(user.getType());
		dto.setAvatarUrl(user.getAvatarUrl());
		dto.setFollowers(user.getFollowers() == null ? 0 : user.getFollowers());
		dto.setFollowing(user.getFollowing() == null ? 0 : user.getFollowing());
		dto.setCreatedAt(user.getCreatedAt());
		dto.setUpdatedAt(user.getUpdatedAt());

		return dto;
	}

	private TrackDTO toTrackDTO(Track track) {
		if (track == null) {
			return null;
		}

		Category category = getTrackCategory(track);

		TrackDTO dto = new TrackDTO();

		dto.setId(track.getId());
		dto.setTitle(track.getTitle());
		dto.setSlug(track.getSlug());
		dto.setDescription(track.getDescription());

		dto.setCategoryId(track.getCategoryId());

		if (category != null) {
			dto.setCategory(category.getSlug());
			dto.setCategoryName(category.getName());
		} else {
			dto.setCategory(null);
			dto.setCategoryName(null);
		}

		dto.setImgUrl(fullImageUrl(track.getImgUrl()));
		dto.setTrackUrl(fullAudioUrl(track.getTrackUrl()));
		dto.setCountLike(track.getCountLike() == null ? 0 : track.getCountLike());
		dto.setCountPlay(track.getCountPlay() == null ? 0 : track.getCountPlay());
		dto.setUploaderId(track.getUploaderId());
		dto.setIsDeleted(track.getIsDeleted());
		dto.setApprovalStatus(track.getApprovalStatus());
		dto.setCreatedAt(track.getCreatedAt());
		dto.setUpdatedAt(track.getUpdatedAt());

		User uploader = null;

		if (track.getUploaderId() != null) {
			uploader = userRepository.findById(track.getUploaderId()).orElse(null);
		}

		dto.setUploader(toUserDTO(uploader));

		return dto;
	}

	private List<TrackDTO> toTrackDTOList(List<Track> tracks) {
		return tracks.stream().map(this::toTrackDTO).collect(Collectors.toList());
	}

	private boolean userAlreadyLiked(User user, String trackId) {
		if (user == null || trackId == null || user.getLikedTracks() == null) {
			return false;
		}

		return user.getLikedTracks().stream().anyMatch(track -> trackId.equals(track.getId()));
	}

	private void removeLikedTrack(User user, String trackId) {
		if (user == null || trackId == null || user.getLikedTracks() == null) {
			return;
		}

		user.getLikedTracks().removeIf(track -> trackId.equals(track.getId()));
	}

	@PostMapping(value = { "", "create" }, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> create(
			@RequestParam("title") String title,
			@RequestParam("description") String description,
			@RequestParam("category") String category,
			@RequestParam("image") MultipartFile image,
			@RequestParam("audio") MultipartFile audio,
			HttpServletRequest request) {

		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			if (image == null || image.isEmpty()) {
				return ResponseEntity.badRequest().body(new ApiResponse<>(400, "Image is required", null));
			}

			if (audio == null || audio.isEmpty()) {
				return ResponseEntity.badRequest().body(new ApiResponse<>(400, "Audio is required", null));
			}

			String id = generateId();

			String cleanTitle = title.trim();
			String cleanDescription = description.trim();
			Category categoryEntity = findOrCreateCategory(category);

			String imageName = FileHelper.upload(image, "uploads/images");
			String audioName = FileHelper.upload(audio, "uploads/audio");

			Track track = new Track();

			track.setId(id);
			track.setTitle(cleanTitle);
			track.setSlug(createSlug(cleanTitle, id));
			track.setDescription(cleanDescription);
			track.setCategoryId(categoryEntity.getId());
			track.setImgUrl(imageName);
			track.setTrackUrl(audioName);
			track.setCountLike(0);
			track.setCountPlay(0);
			track.setUploaderId(user.getId());
			track.setIsDeleted(false);
			track.setApprovalStatus(isAdmin(user) ? TRACK_APPROVED : TRACK_PENDING);
			track.setCreatedAt(LocalDateTime.now());
			track.setUpdatedAt(LocalDateTime.now());

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse<>(200, "Create track success", toTrackDTO(track)));

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping({ "find-all", "all" })
	public ResponseEntity<?> findAll() {
		try {
			List<Track> tracks = trackRepository.findByIsDeletedFalseAndApprovalStatus(TRACK_APPROVED);

			Map<String, Object> data = new LinkedHashMap<>();
			data.put("result", toTrackDTOList(tracks));

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch all tracks", data));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping
	public ResponseEntity<?> paginate(
			@RequestParam(defaultValue = "1") int current,
			@RequestParam(defaultValue = "10") int pageSize) {

		try {
			int safeCurrent = Math.max(current, 1);
			int safePageSize = Math.max(pageSize, 1);

			Pageable pageable = PageRequest.of(safeCurrent - 1, safePageSize);

			Page<Track> page = trackRepository.findByIsDeletedFalseAndApprovalStatus(TRACK_APPROVED, pageable);

			Map<String, Object> meta = new LinkedHashMap<>();
			meta.put("current", safeCurrent);
			meta.put("pageSize", safePageSize);
			meta.put("pages", page.getTotalPages());
			meta.put("total", page.getTotalElements());

			Map<String, Object> data = new LinkedHashMap<>();
			data.put("meta", meta);
			data.put("result", toTrackDTOList(page.getContent()));

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch tracks paginate", data));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping("search/{id}")
	public ResponseEntity<?> findById(@PathVariable String id) {
		try {
			Track track = trackRepository.findById(id).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted()) || !isApproved(track)) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch track by id", toTrackDTO(track)));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping("slug/{slug}")
	public ResponseEntity<?> findBySlugV2(@PathVariable String slug) {
		return findBySlug(slug);
	}

	@GetMapping("{slug}")
	public ResponseEntity<?> findBySlug(@PathVariable String slug) {
		try {
			Track track = findTrackBySlugOrId(slug);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted()) || !isApproved(track)) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch track detail", toTrackDTO(track)));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@RequestMapping(value = { "{id}", "update/{id}" }, method = { RequestMethod.PUT,
			RequestMethod.PATCH }, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> update(
			@PathVariable String id,
			@RequestParam("title") String title,
			@RequestParam("description") String description,
			@RequestParam("category") String category,
			@RequestParam(value = "image", required = false) MultipartFile image,
			@RequestParam(value = "audio", required = false) MultipartFile audio,
			HttpServletRequest request) {

		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			Track track = trackRepository.findById(id).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted())) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			if (!isOwnerOrAdmin(user, track)) {
				return ResponseEntity.status(403).body(new ApiResponse<>(403, "Access denied", null));
			}

			String cleanTitle = title.trim();
			String cleanDescription = description.trim();
			Category categoryEntity = findOrCreateCategory(category);

			track.setTitle(cleanTitle);
			track.setSlug(createSlug(cleanTitle, track.getId()));
			track.setDescription(cleanDescription);
			track.setCategoryId(categoryEntity.getId());

			if (!isAdmin(user)) {
				track.setApprovalStatus(TRACK_PENDING);
			}

			if (image != null && !image.isEmpty()) {
				String imageName = FileHelper.upload(image, "uploads/images");
				track.setImgUrl(imageName);
			}

			if (audio != null && !audio.isEmpty()) {
				String audioName = FileHelper.upload(audio, "uploads/audio");
				track.setTrackUrl(audioName);
			}

			track.setUpdatedAt(LocalDateTime.now());

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse<>(200, "Update track success", toTrackDTO(track)));

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@DeleteMapping({ "{id}", "delete/{id}" })
	public ResponseEntity<?> delete(@PathVariable String id, HttpServletRequest request) {
		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			Track track = trackRepository.findById(id).orElse(null);

			if (track == null) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			if (!isOwnerOrAdmin(user, track)) {
				return ResponseEntity.status(403).body(new ApiResponse<>(403, "Access denied", null));
			}

			track.setIsDeleted(true);
			track.setUpdatedAt(LocalDateTime.now());

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse<>(200, "Delete track success", null));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@PostMapping("/create-album")
	public ResponseEntity<?> createAlbum(@RequestBody CreateAlbumDTO dto, HttpServletRequest request) {
		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			Playlist playlist = new Playlist();

			playlist.setId(generateId());
			playlist.setTitle(dto.getTitle());
			playlist.setIsPublic(dto.getIsPublic());
			playlist.setUserId(user.getId());
			playlist.setIsAlbum(true);
			playlist.setIsDeleted(false);
			playlist.setCreatedAt(new Date());
			playlist.setUpdatedAt(new Date());

			Set<Track> tracks = new HashSet<>();

			for (String trackId : dto.getTrackIds()) {
				Track track = trackRepository.findById(trackId).orElse(null);

				if (track != null && !Boolean.TRUE.equals(track.getIsDeleted()) && isApproved(track)) {
					tracks.add(track);
				}
			}

			playlist.setTracks(tracks);

			Playlist result = playlistService.save(playlist);

			return ResponseEntity.ok(new ApiResponse<>(200, "Create album success", result));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping("/{trackId}/comments")
	public ResponseEntity<?> getCommentsByTrack(@PathVariable String trackId) {
		try {
			Track track = trackRepository.findById(trackId).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted()) || !isApproved(track)) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			List<Comment> comments = commentRepository.findByTrackIdAndIsDeletedFalse(trackId);

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch comments success", comments));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@PostMapping("/{trackId}/comments")
	public ResponseEntity<?> createComment(
			@PathVariable String trackId,
			@RequestBody CreateCommentDTO dto,
			HttpServletRequest request) {

		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			Track track = trackRepository.findById(trackId).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted()) || !isApproved(track)) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			Comment comment = new Comment();

			comment.setId(generateId());
			comment.setContent(dto.getContent());
			comment.setUserId(user.getId());
			comment.setTrackId(trackId);
			comment.setIsDeleted(false);
			comment.setCreatedAt(new Date());
			comment.setUpdatedAt(new Date());

			commentRepository.save(comment);

			return ResponseEntity.ok(new ApiResponse<>(200, "Create comment success", comment));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@PostMapping("/{trackId}/like")
	public ResponseEntity<?> likeTrack(@PathVariable String trackId, HttpServletRequest request) {
		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			Track track = trackRepository.findById(trackId).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted()) || !isApproved(track)) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			if (userAlreadyLiked(user, trackId)) {
				return ResponseEntity.badRequest().body(new ApiResponse<>(400, "Track already liked", null));
			}

			user.getLikedTracks().add(track);

			if (track.getCountLike() == null) {
				track.setCountLike(0);
			}

			track.setCountLike(track.getCountLike() + 1);
			track.setUpdatedAt(LocalDateTime.now());

			userRepository.save(user);
			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse<>(200, "Like track success", toTrackDTO(track)));

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@PostMapping("/{trackId}/dislike")
	public ResponseEntity<?> dislikeTrack(@PathVariable String trackId, HttpServletRequest request) {
		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			Track track = trackRepository.findById(trackId).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted()) || !isApproved(track)) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			if (!userAlreadyLiked(user, trackId)) {
				return ResponseEntity.badRequest().body(new ApiResponse<>(400, "Track not liked yet", null));
			}

			removeLikedTrack(user, trackId);

			if (track.getCountLike() == null) {
				track.setCountLike(0);
			}

			if (track.getCountLike() > 0) {
				track.setCountLike(track.getCountLike() - 1);
			}

			track.setUpdatedAt(LocalDateTime.now());

			userRepository.save(user);
			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse<>(200, "Dislike track success", toTrackDTO(track)));

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping("/my-tracks")
	public ResponseEntity<?> getMyTracks(HttpServletRequest request) {
		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			List<Track> tracks = trackRepository.findByUploaderIdAndIsDeletedFalse(user.getId());

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch my tracks success", toTrackDTOList(tracks)));

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping("/liked")
	public ResponseEntity<?> getLikedTracks(HttpServletRequest request) {
		try {
			User user = getCurrentUser(request);

			if (user == null) {
				return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
			}

			List<Track> tracks = user.getLikedTracks()
					.stream()
					.filter(track -> !Boolean.TRUE.equals(track.getIsDeleted()))
					.filter(this::isApproved)
					.collect(Collectors.toList());

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch liked tracks success", toTrackDTOList(tracks)));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@PostMapping("/{trackId}/play")
	public ResponseEntity<?> increaseView(@PathVariable String trackId) {
		try {
			Track track = trackRepository.findById(trackId).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted()) || !isApproved(track)) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			if (track.getCountPlay() == null) {
				track.setCountPlay(0);
			}

			track.setCountPlay(track.getCountPlay() + 1);
			track.setUpdatedAt(LocalDateTime.now());

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse<>(200, "Increase play success", toTrackDTO(track)));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping("/search")
	public ResponseEntity<?> searchTracks(@RequestParam String keyword) {
		try {
			List<Track> tracks = trackRepository
					.findByTitleContainingIgnoreCaseAndIsDeletedFalseAndApprovalStatus(keyword, TRACK_APPROVED);

			return ResponseEntity.ok(new ApiResponse<>(200, "Search tracks success", toTrackDTOList(tracks)));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@GetMapping("/top")
	public ResponseEntity<?> getTopTracksByCategory(@RequestParam String category) {
		try {
			String categorySlug = slugify(category);

			List<Track> tracks = trackRepository
					.findByCategoryInfo_SlugAndIsDeletedFalseAndApprovalStatusOrderByCountPlayDesc(
							categorySlug,
							TRACK_APPROVED);

			return ResponseEntity.ok(new ApiResponse<>(200, "Fetch top tracks success", toTrackDTOList(tracks)));

		} catch (Exception e) {
			return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}
}