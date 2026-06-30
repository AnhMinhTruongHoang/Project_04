package com.example.demo.controllers.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.text.Normalizer;
import java.time.LocalDateTime;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;
import com.example.demo.helpers.FileHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.entities.Category;
import com.example.demo.repositories.CategoryRepository;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({ "/api/admin/tracks", "/api/v1/admin/tracks" })
public class AdminTrackController {

	@Autowired
	private TrackRepository trackRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private CategoryRepository categoryRepository;

	// GET TRACKS WITH PAGINATE
	@GetMapping("find-all")
	public ResponseEntity<?> getTracks(@RequestParam(defaultValue = "1") int current,
			@RequestParam(defaultValue = "10") int pageSize, HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {
				return ResponseEntity.status(401).body(new ApiResponse(401, "Unauthorized", null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String role = claims.get("role", String.class);

			if (!role.equals("ADMIN")) {
				return ResponseEntity.status(403).body(new ApiResponse(403, "Access denied", null));
			}

			Page<Track> page = trackRepository.findAll(PageRequest.of(current - 1, pageSize));

			return ResponseEntity.ok(new ApiResponse(200, "Fetch tracks success", page));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
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

	private Category findOrCreateCategory(String categoryName) {
		String cleanName = categoryName == null ? "unknown" : categoryName.trim().toLowerCase();
		String slug = slugify(cleanName);

		Category category = categoryRepository.findBySlug(slug);

		if (category != null) {
			return category;
		}

		category = new Category();

		category.setId(java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 24));
		category.setName(cleanName.toUpperCase());
		category.setSlug(slug);
		category.setDescription(cleanName.toUpperCase() + " tracks");
		category.setIsDeleted(false);

		return categoryRepository.save(category);
	}

	// GET TRACK BY ID
	@GetMapping("search/{id}")
	public ResponseEntity<?> getTrackById(@PathVariable String id, HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {
				return ResponseEntity.status(401).body(new ApiResponse(401, "Unauthorized", null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String role = claims.get("role", String.class);

			if (!role.equals("ADMIN")) {
				return ResponseEntity.status(403).body(new ApiResponse(403, "Access denied", null));
			}

			Track track = trackRepository.findById(id).orElse(null);

			if (track == null) {
				return ResponseEntity.status(404).body(new ApiResponse(404, "Track not found", null));
			}

			return ResponseEntity.ok(new ApiResponse(200, "Fetch track success", track));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// UPDATE TRACK
	@PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> update(

			@PathVariable String id,

			@RequestParam("title") String title,

			@RequestParam("description") String description,

			@RequestParam("category") String category,

			@RequestParam(value = "image", required = false) MultipartFile image,

			@RequestParam(value = "audio", required = false) MultipartFile audio,

			@RequestHeader("Authorization") String authorization) {

		try {

			// ===== VERIFY TOKEN =====
			String token = authorization.replace("Bearer ", "");

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User admin = userRepository.findByEmail(email);

			// ===== CHECK ADMIN =====
			if (admin == null || !admin.getRole().equals("ADMIN")) {

				return ResponseEntity.status(403).body(

						new ApiResponse<>(

								403,

								"Access denied",

								null));
			}

			// ===== FIND TRACK =====
			Track track = trackRepository.findById(id).orElse(null);

			if (track == null) {

				return ResponseEntity.status(404).body(

						new ApiResponse<>(

								404,

								"Track not found",

								null));
			}

			// ===== UPDATE TEXT =====
			Category categoryEntity = findOrCreateCategory(category);

			track.setTitle(title.trim());

			track.setSlug(createSlug(title.trim(), track.getId()));

			track.setDescription(description.trim());

			track.setCategoryId(categoryEntity.getId());

			// ===== UPDATE IMAGE =====
			if (image != null && !image.isEmpty()) {

				String imageName = FileHelper.upload(image, "uploads/images");

				track.setImgUrl(imageName);
			}

			// ===== UPDATE AUDIO =====
			if (audio != null && !audio.isEmpty()) {

				String audioName = FileHelper.upload(audio, "uploads/audio");

				track.setTrackUrl(audioName);
			}

			track.setUpdatedAt(LocalDateTime.now());

			trackRepository.save(track);

			return ResponseEntity.ok(

					new ApiResponse<>(

							200,

							"Admin update track success",

							track));

		} catch (Exception e) {

			e.printStackTrace();

			return ResponseEntity.internalServerError().body(

					new ApiResponse<>(

							500,

							e.getMessage(),

							null));
		}
	}

	// DELETE TRACK
	@DeleteMapping("/delete/{id}")
	public ResponseEntity<?> delete(

			@PathVariable String id,

			@RequestHeader("Authorization") String authorization) {

		try {

			// ===== VERIFY TOKEN =====
			String token = authorization.replace("Bearer ", "");

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User admin = userRepository.findByEmail(email);

			// ===== CHECK ADMIN =====
			if (admin == null || !admin.getRole().equals("ADMIN")) {

				return ResponseEntity.status(403).body(

						new ApiResponse<>(

								403,

								"Access denied",

								null));
			}

			// ===== FIND TRACK =====
			Track track = trackRepository.findById(id).orElse(null);

			if (track == null) {

				return ResponseEntity.status(404).body(

						new ApiResponse<>(

								404,

								"Track not found",

								null));
			}

			// ===== SOFT DELETE =====
			track.setIsDeleted(true);

			track.setUpdatedAt(LocalDateTime.now());

			trackRepository.save(track);

			return ResponseEntity.ok(

					new ApiResponse<>(

							200,

							"Admin delete track success",

							null));

		} catch (Exception e) {

			return ResponseEntity.internalServerError().body(

					new ApiResponse<>(

							500,

							e.getMessage(),

							null));
		}
	}

	@PatchMapping({ "/approve/{id}", "/{id}/approve" })
	public ResponseEntity<?> approveTrack(
			@PathVariable String id,
			@RequestHeader("Authorization") String authorization) {

		try {
			String token = authorization.replace("Bearer ", "");
			Claims claims = JwtHelper.verifyToken(token);
			String email = claims.getSubject();

			User admin = userRepository.findByEmail(email);

			if (admin == null || !"ADMIN".equals(admin.getRole())) {
				return ResponseEntity.status(403).body(new ApiResponse<>(403, "Access denied", null));
			}

			Track track = trackRepository.findById(id).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted())) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			track.setApprovalStatus("APPROVED");
			track.setUpdatedAt(LocalDateTime.now());

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse<>(200, "Approve track success", track));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	@PatchMapping({ "/reject/{id}", "/{id}/reject" })
	public ResponseEntity<?> rejectTrack(
			@PathVariable String id,
			@RequestHeader("Authorization") String authorization) {

		try {
			String token = authorization.replace("Bearer ", "");
			Claims claims = JwtHelper.verifyToken(token);
			String email = claims.getSubject();

			User admin = userRepository.findByEmail(email);

			if (admin == null || !"ADMIN".equals(admin.getRole())) {
				return ResponseEntity.status(403).body(new ApiResponse<>(403, "Access denied", null));
			}

			Track track = trackRepository.findById(id).orElse(null);

			if (track == null || Boolean.TRUE.equals(track.getIsDeleted())) {
				return ResponseEntity.status(404).body(new ApiResponse<>(404, "Track not found", null));
			}

			track.setApprovalStatus("REJECTED");
			track.setUpdatedAt(LocalDateTime.now());

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse<>(200, "Reject track success", track));

		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(new ApiResponse<>(500, e.getMessage(), null));
		}
	}
}