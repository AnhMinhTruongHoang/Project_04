package com.example.demo.controllers.admin;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.PostMapping;
import com.example.demo.services.CopyrightScanService;
import com.example.demo.services.CopyrightScanService.CopyrightScanResult;

import com.example.demo.dtos.RejectTrackDTO;
import com.example.demo.entities.Category;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;
import com.example.demo.helpers.FileHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.CategoryRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
		"/api/admin/tracks",
		"/api/v1/admin/tracks"
})
public class AdminTrackController {

	private static final String ROLE_ADMIN = "ADMIN";

	private static final String STATUS_APPROVED = "APPROVED";

	private static final String STATUS_REJECTED = "REJECTED";

	private static final String STATUS_COMPLETED = "COMPLETED";

	private static final String COPYRIGHT_CLEAN = "CLEAN";

	private static final String COPYRIGHT_MANUAL_APPROVED = "MANUAL_APPROVED";

	private static final String COPYRIGHT_MANUAL_REJECTED = "MANUAL_REJECTED";

	@Autowired
	private TrackRepository trackRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private CategoryRepository categoryRepository;

	@Autowired
	private CopyrightScanService copyrightScanService;

	// =====================================================
	// GET TRACKS WITH PAGINATION
	// =====================================================

	@GetMapping("/find-all")
	public ResponseEntity<?> getTracks(
			@RequestParam(defaultValue = "1") int current,

			@RequestParam(defaultValue = "100") int pageSize,

			HttpServletRequest request) {

		try {
			User admin = getCurrentAdmin(request);

			if (admin == null) {
				return ResponseEntity
						.status(403)
						.body(new ApiResponse<>(
								403,
								"Access denied",
								null));
			}

			int safeCurrent = Math.max(current, 1);

			int safePageSize = Math.max(pageSize, 1);

			Page<Track> page = trackRepository
					.findByIsDeletedFalse(
							PageRequest.of(
									safeCurrent - 1,
									safePageSize,
									Sort.by(
											Sort.Direction.DESC,
											"createdAt")));

			List<Map<String, Object>> result = page.getContent()
					.stream()
					.map(
							this::toAdminTrackResponse)
					.collect(
							Collectors.toList());

			Map<String, Object> meta = new LinkedHashMap<>();

			meta.put(
					"current",
					safeCurrent);

			meta.put(
					"pageSize",
					safePageSize);

			meta.put(
					"pages",
					page.getTotalPages());

			meta.put(
					"total",
					page.getTotalElements());

			Map<String, Object> data = new LinkedHashMap<>();

			data.put(
					"meta",
					meta);

			data.put(
					"result",
					result);

			return ResponseEntity.ok(
					new ApiResponse<>(
							200,
							"Fetch admin tracks success",
							data));

		} catch (Exception e) {
			e.printStackTrace();

			return ResponseEntity
					.internalServerError()
					.body(new ApiResponse<>(
							500,
							e.getMessage(),
							null));
		}
	}

	// =====================================================
	// GET TRACK BY ID
	// =====================================================

	@GetMapping("/search/{id}")
	public ResponseEntity<?> getTrackById(
			@PathVariable String id,
			HttpServletRequest request) {

		try {
			User admin = getCurrentAdmin(request);

			if (admin == null) {
				return ResponseEntity
						.status(403)
						.body(new ApiResponse<>(
								403,
								"Access denied",
								null));
			}

			Track track = trackRepository
					.findById(id)
					.orElse(null);

			if (track == null
					|| Boolean.TRUE.equals(
							track.getIsDeleted())) {

				return ResponseEntity
						.status(404)
						.body(new ApiResponse<>(
								404,
								"Track not found",
								null));
			}

			return ResponseEntity.ok(
					new ApiResponse<>(
							200,
							"Fetch track success",
							toAdminTrackResponse(
									track)));

		} catch (Exception e) {
			e.printStackTrace();

			return ResponseEntity
					.internalServerError()
					.body(new ApiResponse<>(
							500,
							e.getMessage(),
							null));
		}
	}

	// =====================================================
	// UPDATE TRACK
	// =====================================================

	@PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> update(
			@PathVariable String id,

			@RequestParam("title") String title,

			@RequestParam("description") String description,

			@RequestParam("category") String category,

			@RequestParam(value = "image", required = false) MultipartFile image,

			@RequestParam(value = "audio", required = false) MultipartFile audio,

			HttpServletRequest request) {

		try {
			User admin = getCurrentAdmin(request);

			if (admin == null) {
				return ResponseEntity
						.status(403)
						.body(new ApiResponse<>(
								403,
								"Access denied",
								null));
			}

			Track track = trackRepository
					.findById(id)
					.orElse(null);

			if (track == null
					|| Boolean.TRUE.equals(
							track.getIsDeleted())) {

				return ResponseEntity
						.status(404)
						.body(new ApiResponse<>(
								404,
								"Track not found",
								null));
			}

			if (title == null
					|| title.trim().isEmpty()) {

				return ResponseEntity
						.badRequest()
						.body(new ApiResponse<>(
								400,
								"Title is required",
								null));
			}

			if (category == null
					|| category.trim().isEmpty()) {

				return ResponseEntity
						.badRequest()
						.body(new ApiResponse<>(
								400,
								"Category is required",
								null));
			}

			Category categoryEntity = findOrCreateCategory(
					category);

			String cleanTitle = title.trim();

			track.setTitle(
					cleanTitle);

			track.setSlug(
					createSlug(
							cleanTitle,
							track.getId()));

			track.setDescription(
					description == null
							? ""
							: description.trim());

			track.setCategoryId(
					categoryEntity.getId());

			if (image != null
					&& !image.isEmpty()) {

				String imageName = FileHelper.upload(
						image,
						"uploads/images");

				track.setImgUrl(
						imageName);
			}

			if (audio != null
					&& !audio.isEmpty()) {

				String audioName = FileHelper.upload(
						audio,
						"uploads/audio");

				track.setTrackUrl(
						audioName);
			}

			track.setUpdatedAt(
					LocalDateTime.now());

			Track savedTrack = trackRepository.save(
					track);

			return ResponseEntity.ok(
					new ApiResponse<>(
							200,
							"Admin update track success",
							toAdminTrackResponse(
									savedTrack)));

		} catch (Exception e) {
			e.printStackTrace();

			return ResponseEntity
					.internalServerError()
					.body(new ApiResponse<>(
							500,
							e.getMessage(),
							null));
		}
	}

	// =====================================================
	// DELETE TRACK
	// =====================================================

	@DeleteMapping({
			"/delete/{id}",
			"/{id}"
	})
	public ResponseEntity<?> delete(
			@PathVariable String id,
			HttpServletRequest request) {

		try {
			User admin = getCurrentAdmin(request);

			if (admin == null) {
				return ResponseEntity
						.status(403)
						.body(new ApiResponse<>(
								403,
								"Access denied",
								null));
			}

			Track track = trackRepository
					.findById(id)
					.orElse(null);

			if (track == null
					|| Boolean.TRUE.equals(
							track.getIsDeleted())) {

				return ResponseEntity
						.status(404)
						.body(new ApiResponse<>(
								404,
								"Track not found",
								null));
			}

			track.setIsDeleted(true);

			track.setUpdatedAt(
					LocalDateTime.now());

			trackRepository.save(
					track);

			return ResponseEntity.ok(
					new ApiResponse<>(
							200,
							"Admin delete track success",
							null));

		} catch (Exception e) {
			e.printStackTrace();

			return ResponseEntity
					.internalServerError()
					.body(new ApiResponse<>(
							500,
							e.getMessage(),
							null));
		}
	}

	// =====================================================
	// AI-ASSISTED COPYRIGHT SCAN
	// =====================================================

	@PostMapping({
			"/copyright-scan/{id}",
			"/{id}/copyright-scan"
	})
	public ResponseEntity<?> scanTrackCopyright(
			@PathVariable String id,
			HttpServletRequest request) {

		try {
			User admin = getCurrentAdmin(
					request);

			if (admin == null) {

				return ResponseEntity
						.status(403)
						.body(
								new ApiResponse<>(
										403,
										"Access denied",
										null));
			}

			Track track = trackRepository
					.findById(id)
					.orElse(null);

			if (track == null
					|| Boolean.TRUE.equals(
							track.getIsDeleted())) {

				return ResponseEntity
						.status(404)
						.body(
								new ApiResponse<>(
										404,
										"Track not found",
										null));
			}

			String copyrightStatus = String.valueOf(
					track.getCopyrightStatus());

			if ("SCANNING".equalsIgnoreCase(
					copyrightStatus)) {

				return ResponseEntity
						.status(409)
						.body(
								new ApiResponse<>(
										409,
										"Copyright scan is already running",
										null));
			}

			CopyrightScanResult result = copyrightScanService.scanTrack(
					id);

			return ResponseEntity.ok(
					new ApiResponse<>(
							200,
							"Copyright scan completed",
							result));

		} catch (IllegalArgumentException e) {

			return ResponseEntity
					.badRequest()
					.body(
							new ApiResponse<>(
									400,
									e.getMessage(),
									null));

		} catch (Exception e) {

			e.printStackTrace();

			return ResponseEntity
					.internalServerError()
					.body(
							new ApiResponse<>(
									500,
									e.getMessage() == null
											? "Copyright scan failed"
											: e.getMessage(),
									null));
		}
	}

	// =====================================================
	// APPROVE TRACK
	// =====================================================

	@PatchMapping({
			"/approve/{id}",
			"/{id}/approve"
	})
	public ResponseEntity<?> approveTrack(
			@PathVariable String id,
			HttpServletRequest request) {

		try {
			User admin = getCurrentAdmin(request);

			if (admin == null) {
				return ResponseEntity
						.status(403)
						.body(new ApiResponse<>(
								403,
								"Access denied",
								null));
			}

			Track track = trackRepository
					.findById(id)
					.orElse(null);

			if (track == null
					|| Boolean.TRUE.equals(
							track.getIsDeleted())) {

				return ResponseEntity
						.status(404)
						.body(new ApiResponse<>(
								404,
								"Track not found",
								null));
			}

			LocalDateTime now = LocalDateTime.now();

			track.setApprovalStatus(
					STATUS_APPROVED);

			track.setProcessingStatus(
					STATUS_COMPLETED);

			/*
			 * Khi approve lại track từng bị reject,
			 * phải xóa lý do reject cũ.
			 */
			track.setRejectionReason(
					null);

			String copyrightStatus = track.getCopyrightStatus();

			/*
			 * Nếu hệ thống đã xác định CLEAN thì giữ CLEAN.
			 * Các trạng thái còn lại sẽ chuyển thành
			 * MANUAL_APPROVED.
			 */
			if (!COPYRIGHT_CLEAN.equals(
					copyrightStatus)) {

				track.setCopyrightStatus(
						COPYRIGHT_MANUAL_APPROVED);

				track.setCopyrightMessage(
						"Approved manually by admin");
			}

			track.setScannedAt(now);
			track.setUpdatedAt(now);

			Track savedTrack = trackRepository.save(
					track);

			return ResponseEntity.ok(
					new ApiResponse<>(
							200,
							"Approve track success",
							toAdminTrackResponse(
									savedTrack)));

		} catch (Exception e) {
			e.printStackTrace();

			return ResponseEntity
					.internalServerError()
					.body(new ApiResponse<>(
							500,
							e.getMessage(),
							null));
		}
	}

	// =====================================================
	// REJECT TRACK
	// =====================================================

	@PatchMapping({
			"/reject/{id}",
			"/{id}/reject"
	})
	public ResponseEntity<?> rejectTrack(
			@PathVariable String id,

			@RequestBody(required = false) RejectTrackDTO dto,

			HttpServletRequest request) {

		try {
			User admin = getCurrentAdmin(request);

			if (admin == null) {
				return ResponseEntity
						.status(403)
						.body(new ApiResponse<>(
								403,
								"Access denied",
								null));
			}

			Track track = trackRepository
					.findById(id)
					.orElse(null);

			if (track == null
					|| Boolean.TRUE.equals(
							track.getIsDeleted())) {

				return ResponseEntity
						.status(404)
						.body(new ApiResponse<>(
								404,
								"Track not found",
								null));
			}

			String reason = dto == null
					? ""
					: dto.getReason();

			reason = reason == null
					? ""
					: reason.trim();

			if (reason.isEmpty()) {
				return ResponseEntity
						.badRequest()
						.body(new ApiResponse<>(
								400,
								"Rejection reason is required",
								null));
			}

			LocalDateTime now = LocalDateTime.now();

			track.setApprovalStatus(
					STATUS_REJECTED);

			track.setRejectionReason(
					reason);

			track.setProcessingStatus(
					STATUS_COMPLETED);

			track.setCopyrightStatus(
					COPYRIGHT_MANUAL_REJECTED);

			track.setCopyrightMessage(
					"Rejected manually by admin");

			track.setScannedAt(now);
			track.setUpdatedAt(now);

			Track savedTrack = trackRepository.save(
					track);

			return ResponseEntity.ok(
					new ApiResponse<>(
							200,
							"Reject track success",
							toAdminTrackResponse(
									savedTrack)));

		} catch (Exception e) {
			e.printStackTrace();

			return ResponseEntity
					.internalServerError()
					.body(new ApiResponse<>(
							500,
							e.getMessage(),
							null));
		}
	}

	// =====================================================
	// AUTHENTICATED ADMIN
	// =====================================================

	private User getCurrentAdmin(
			HttpServletRequest request) {

		String authorization = request.getHeader(
				"Authorization");

		if (authorization == null
				|| !authorization.startsWith(
						"Bearer ")) {

			return null;
		}

		String token = authorization.substring(7);

		Claims claims = JwtHelper.verifyToken(
				token);

		String email = claims.getSubject();

		User user = userRepository.findByEmail(
				email);

		if (user == null
				|| !ROLE_ADMIN.equals(
						user.getRole())) {

			return null;
		}

		return user;
	}

	// =====================================================
	// RESPONSE MAPPER
	// =====================================================

	private Map<String, Object> toAdminTrackResponse(
			Track track) {

		Map<String, Object> result = new LinkedHashMap<>();

		result.put(
				"id",
				track.getId());

		result.put(
				"_id",
				track.getId());

		result.put(
				"title",
				track.getTitle());

		result.put(
				"slug",
				track.getSlug());

		result.put(
				"description",
				track.getDescription());

		result.put(
				"categoryId",
				track.getCategoryId());

		Category category = null;

		if (track.getCategoryId() != null
				&& !track.getCategoryId()
						.trim()
						.isEmpty()) {

			category = categoryRepository
					.findById(
							track.getCategoryId())
					.orElse(null);
		}

		result.put(
				"category",
				category != null
						? category.getSlug()
						: null);

		result.put(
				"categoryName",
				category != null
						? category.getName()
						: null);

		result.put(
				"imgUrl",
				track.getImgUrl());

		result.put(
				"trackUrl",
				track.getTrackUrl());

		result.put(
				"countLike",
				track.getCountLike() == null
						? 0
						: track.getCountLike());

		result.put(
				"countPlay",
				track.getCountPlay() == null
						? 0
						: track.getCountPlay());

		result.put(
				"uploaderId",
				track.getUploaderId());

		result.put(
				"approvalStatus",
				track.getApprovalStatus());

		result.put(
				"rejectionReason",
				track.getRejectionReason());

		result.put(
				"processingStatus",
				track.getProcessingStatus());

		result.put(
				"copyrightStatus",
				track.getCopyrightStatus());

		result.put(
				"copyrightMessage",
				track.getCopyrightMessage());

		result.put(
				"copyrightScore",
				track.getCopyrightScore());

		result.put(
				"audioHash",
				track.getAudioHash());

		result.put(
				"audioSize",
				track.getAudioSize());

		result.put(
				"durationSeconds",
				track.getDurationSeconds());

		result.put(
				"fingerprintAlgorithm",
				track.getFingerprintAlgorithm());

		result.put(
				"fingerprintVersion",
				track.getFingerprintVersion());

		result.put(
				"matchedTrackId",
				track.getMatchedTrackId());

		result.put(
				"fingerprintScore",
				track.getFingerprintScore());

		result.put(
				"matchedDurationRatio",
				track.getMatchedDurationRatio());

		result.put(
				"copyrightRiskLevel",
				track.getCopyrightRiskLevel());

		result.put(
				"scannedAt",
				track.getScannedAt());

		result.put(
				"isDeleted",
				track.getIsDeleted());

		result.put(
				"createdAt",
				track.getCreatedAt());

		result.put(
				"updatedAt",
				track.getUpdatedAt());

		User uploader = null;

		if (track.getUploaderId() != null
				&& !track.getUploaderId()
						.trim()
						.isEmpty()) {

			uploader = userRepository
					.findById(
							track.getUploaderId())
					.orElse(null);
		}

		if (uploader != null) {
			Map<String, Object> uploaderData = new LinkedHashMap<>();

			uploaderData.put(
					"id",
					uploader.getId());

			uploaderData.put(
					"_id",
					uploader.getId());

			uploaderData.put(
					"name",
					uploader.getName());

			uploaderData.put(
					"username",
					uploader.getUsername());

			uploaderData.put(
					"email",
					uploader.getEmail());

			uploaderData.put(
					"avatarUrl",
					uploader.getAvatarUrl());

			result.put(
					"uploader",
					uploaderData);

		} else {
			result.put(
					"uploader",
					null);
		}

		return result;
	}

	// =====================================================
	// CATEGORY HELPERS
	// =====================================================

	private String slugify(
			String input) {

		if (input == null
				|| input.trim().isEmpty()) {

			return "track";
		}

		String prepared = input.trim()
				.replace(
						"Đ",
						"D")
				.replace(
						"đ",
						"d");

		String normalized = Normalizer.normalize(
				prepared,
				Normalizer.Form.NFD);

		String slug = normalized
				.replaceAll(
						"\\p{M}",
						"")
				.toLowerCase()
				.replaceAll(
						"[^a-z0-9]+",
						"-")
				.replaceAll(
						"^-+|-+$",
						"");

		return slug.isEmpty()
				? "track"
				: slug;
	}

	private String createSlug(
			String title,
			String id) {

		String suffix = id != null
				&& id.length() >= 6
						? id.substring(
								0,
								6)
						: id;

		return slugify(title)
				+ "-"
				+ suffix;
	}

	private Category findOrCreateCategory(
			String categoryName) {

		String cleanName = categoryName == null
				? "unknown"
				: categoryName
						.trim()
						.toLowerCase();

		String slug = slugify(cleanName);

		Category category = categoryRepository
				.findBySlug(slug);

		if (category != null) {
			return category;
		}

		category = new Category();

		category.setId(
				UUID.randomUUID()
						.toString()
						.replace(
								"-",
								"")
						.substring(
								0,
								24));

		category.setName(
				cleanName.toUpperCase());

		category.setSlug(
				slug);

		category.setDescription(
				cleanName.toUpperCase()
						+ " tracks");

		category.setIsDeleted(
				false);

		return categoryRepository.save(
				category);
	}
}