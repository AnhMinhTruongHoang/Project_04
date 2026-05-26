package com.example.demo.controllers;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

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
import com.example.demo.dtos.UpdateTrackDTO;
import com.example.demo.entities.Comment;
import com.example.demo.entities.Playlist;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;

import com.example.demo.helpers.FileHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.CommentRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;

import com.example.demo.responses.ApiResponse;
import com.example.demo.services.PlaylistService;

@RestController
@RequestMapping("api/tracks")
public class TrackController {

	@Autowired
	private TrackRepository trackRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PlaylistService playlistService;

	@Autowired
	private CommentRepository commentRepository;

	@Value("${images_url}")
	private String imagesUrl;

	@Value("${audio_url}")
	private String audioUrl;

	// Tạo track mới
	@PostMapping(value = "create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> create(

			@RequestParam("title") String title,

			@RequestParam("description") String description,

			@RequestParam("category") String category,

			@RequestParam("image") MultipartFile image,

			@RequestParam("audio") MultipartFile audio,

			@RequestHeader("Authorization") String authorization) {

		try {

			// get token
			String token = authorization.replace("Bearer ", "");

			// verify token
			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			// find user
			User user = userRepository.findByEmail(email);

			if (user == null) {

				return ResponseEntity.badRequest().body(

						new ApiResponse<>(

								400,

								"User not found",

								null));
			}

			// validate file
			if (image.isEmpty()) {

				return ResponseEntity.badRequest().body(

						new ApiResponse<>(

								400,

								"Image is required",

								null));
			}

			if (audio.isEmpty()) {

				return ResponseEntity.badRequest().body(

						new ApiResponse<>(

								400,

								"Audio is required",

								null));
			}

			// upload image
			String imageName = FileHelper.upload(image, "uploads/images");

			// upload audio
			String audioName = FileHelper.upload(audio, "uploads/audio");

			// create track
			Track track = new Track();

			track.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));

			track.setTitle(title);

			track.setDescription(description);

			track.setCategory(category);

			// chỉ lưu filename vào database
			track.setImgUrl(imageName);

			track.setTrackUrl(audioName);

			track.setCountLike(0);

			track.setCountPlay(0);

			track.setUploaderId(user.getId());

			track.setIsDeleted(false);

			track.setCreatedAt(new Date());

			track.setUpdatedAt(new Date());

			// save database
			trackRepository.save(track);

			// response data
			Map<String, Object> response = new HashMap<>();

			response.put("id", track.getId());

			response.put("title", track.getTitle());

			response.put("description", track.getDescription());

			response.put("category", track.getCategory());

			response.put("imgUrl", imagesUrl + track.getImgUrl());

			response.put("trackUrl", audioUrl + track.getTrackUrl());

			response.put("countLike", track.getCountLike());

			response.put("countPlay", track.getCountPlay());

			response.put("uploaderId", track.getUploaderId());

			response.put("createdAt", track.getCreatedAt());

			response.put("updatedAt", track.getUpdatedAt());

			return ResponseEntity.ok(

					new ApiResponse<>(200, "Create track success", response));

		} catch (Exception e) {

			e.printStackTrace();

			return ResponseEntity.internalServerError().body(

					new ApiResponse<>(500, e.getMessage(), null));
		}
	}

	// Lấy danh sách track
	@GetMapping("find-all")
	public ResponseEntity<?> findAll() {

		try {

			List<Track> tracks = trackRepository.findAll();

			return ResponseEntity.ok(

					new ApiResponse<>(

							200,

							"Fetch all tracks",

							tracks));

		} catch (Exception e) {

			return ResponseEntity.internalServerError().body(

					new ApiResponse<>(

							500,

							e.getMessage(),

							null));
		}
	}

	// Lấy danh sách track có phân trang
	@GetMapping
	public ResponseEntity<?> paginate(

			@RequestParam(defaultValue = "1") int current,

			@RequestParam(defaultValue = "10") int pageSize) {

		try {

			Pageable pageable = PageRequest.of(current - 1, pageSize);

			Page<Track> page = trackRepository.findAll(pageable);

			Map<String, Object> meta = new HashMap<>();

			meta.put("current", current);

			meta.put("pageSize", pageSize);

			meta.put("pages", page.getTotalPages());

			meta.put("total", page.getTotalElements());

			Map<String, Object> data = new HashMap<>();

			data.put("meta", meta);

			data.put("result", page.getContent());

			return ResponseEntity.ok(

					new ApiResponse<>(

							200,

							"Fetch tracks paginate",

							data));

		} catch (Exception e) {

			return ResponseEntity.internalServerError().body(

					new ApiResponse<>(

							500,

							e.getMessage(),

							null));
		}
	}

	// Lấy track bằng ID
	@GetMapping("search/{id}")
	public ResponseEntity<?> findById(@PathVariable String id) {

		try {

			Track track = trackRepository.findById(id).orElse(null);

			if (track == null) {

				return ResponseEntity.status(404).body(

						new ApiResponse<>(

								404,

								"Track not found",

								null));
			}

			return ResponseEntity.ok(

					new ApiResponse<>(

							200,

							"Fetch track by id",

							track));

		} catch (Exception e) {

			return ResponseEntity.internalServerError().body(

					new ApiResponse<>(

							500,

							e.getMessage(),

							null));
		}
	}

	// Cập nhật track
	@PutMapping(value = "update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> update(

			@PathVariable String id,

			@RequestParam("title") String title,

			@RequestParam("description") String description,

			@RequestParam("category") String category,

			@RequestParam(value = "image", required = false) MultipartFile image,

			@RequestParam(value = "audio", required = false) MultipartFile audio,

			@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User user = userRepository.findByEmail(email);

			Track track = trackRepository.findById(id).orElse(null);

			if (track == null) {

				return ResponseEntity.status(404).body(

						new ApiResponse<>(

								404,

								"Track not found",

								null));
			}

			// check owner
			if (!track.getUploaderId().equals(user.getId())

					&&

					!user.getRole().equals("ADMIN")) {

				return ResponseEntity.status(403).body(

						new ApiResponse<>(

								403,

								"Access denied",

								null));
			}

			// update text
			track.setTitle(title);

			track.setDescription(description);

			track.setCategory(category);

			// update image nếu có
			if (image != null && !image.isEmpty()) {

				String imageName = FileHelper.upload(image, "uploads/images");

				track.setImgUrl(imageName);
			}

			// update audio nếu có
			if (audio != null && !audio.isEmpty()) {

				String audioName = FileHelper.upload(audio, "uploads/audio");

				track.setTrackUrl(audioName);
			}

			track.setUpdatedAt(new Date());

			trackRepository.save(track);

			return ResponseEntity.ok(

					new ApiResponse<>(

							200,

							"Update track success",

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

	// Xóa track
	@DeleteMapping("delete/{id}")
	public ResponseEntity<?> delete(

			@PathVariable String id,

			@RequestHeader("Authorization") String authorization) {

		try {

			String token = authorization.replace("Bearer ", "");

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User user = userRepository.findByEmail(email);

			Track track = trackRepository.findById(id).orElse(null);

			if (track == null) {

				return ResponseEntity.status(404).body(

						new ApiResponse<>(

								404,

								"Track not found",

								null));
			}

			// owner/admin
			if (!track.getUploaderId().equals(user.getId())

					&&

					!user.getRole().equals("ADMIN")) {

				return ResponseEntity.status(403).body(

						new ApiResponse<>(

								403,

								"Access denied",

								null));
			}

			track.setIsDeleted(true);

			track.setUpdatedAt(new Date());

			trackRepository.save(track);

			return ResponseEntity.ok(

					new ApiResponse<>(

							200,

							"Delete track success",

							null));

		} catch (Exception e) {

			return ResponseEntity.internalServerError().body(

					new ApiResponse<>(

							500,

							e.getMessage(),

							null));
		}
	}

	@PostMapping("/create-album")
	public ResponseEntity<?> createAlbum(@RequestBody CreateAlbumDTO dto, HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {
				return ResponseEntity.status(401).body(new ApiResponse(401, "Unauthorized", null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String userId = claims.get("id", String.class);

			Playlist playlist = new Playlist();

			playlist.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));

			playlist.setTitle(dto.getTitle());
			playlist.setIsPublic(dto.getIsPublic());
			playlist.setUserId(userId);
			playlist.setIsAlbum(true);
			playlist.setIsDeleted(false);
			playlist.setCreatedAt(new Date());
			playlist.setUpdatedAt(new Date());

			Set<Track> tracks = new HashSet<>();

			for (String trackId : dto.getTrackIds()) {

				Track track = trackRepository.findById(trackId).orElse(null);

				if (track != null) {
					tracks.add(track);
				}
			}

			playlist.setTracks(tracks);

			Playlist result = playlistService.save(playlist);

			return ResponseEntity.ok(new ApiResponse(200, "Create album success", result));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Lấy dach sách comment từ một track cụ thể
	@GetMapping("/{trackId}/comments")
	public ResponseEntity<?> getCommentsByTrack(@PathVariable String trackId) {

		try {

			List<Comment> comments = commentRepository.findByTrackIdAndIsDeletedFalse(trackId);

			return ResponseEntity.ok(new ApiResponse(200, "Fetch comments success", comments));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Tạo comment trong một track cụ thể
	@PostMapping("/{trackId}/comments")
	public ResponseEntity<?> createComment(@PathVariable String trackId, @RequestBody CreateCommentDTO dto,
			HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {

				return ResponseEntity.status(401).body(new ApiResponse(401, "Unauthorized", null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String userId = claims.get("id", String.class);

			Comment comment = new Comment();

			comment.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 24));

			comment.setContent(dto.getContent());

			comment.setUserId(userId);

			comment.setTrackId(trackId);

			comment.setIsDeleted(false);

			comment.setCreatedAt(new Date());

			comment.setUpdatedAt(new Date());

			commentRepository.save(comment);

			return ResponseEntity.ok(new ApiResponse(200, "Create comment success", comment));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Like một track cụ thể
	@PostMapping("/{trackId}/like")
	public ResponseEntity<?> likeTrack(@PathVariable String trackId, HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {

				return ResponseEntity.status(401).body(new ApiResponse(401, "Unauthorized", null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User user = userRepository.findByEmail(email);

			Track track = trackRepository.findById(trackId).orElse(null);

			if (user == null || track == null) {

				return ResponseEntity.status(404).body(new ApiResponse(404, "Track/User not found", null));
			}

			if (user.getLikedTracks().contains(track)) {

				return ResponseEntity.badRequest().body(new ApiResponse(400, "Track already liked", null));
			}

			user.getLikedTracks().add(track);

			if (track.getCountLike() == null) {
				track.setCountLike(0);
			}

			track.setCountLike(track.getCountLike() + 1);

			userRepository.save(user);

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse(200, "Like track success", null));

		} catch (Exception e) {

			e.printStackTrace();

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Dislike một track cụ thể
	@PostMapping("/{trackId}/dislike")
	public ResponseEntity<?> dislikeTrack(@PathVariable String trackId, HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {

				return ResponseEntity.status(401).body(new ApiResponse(401, "Unauthorized", null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User user = userRepository.findByEmail(email);

			Track track = trackRepository.findById(trackId).orElse(null);

			if (user == null || track == null) {

				return ResponseEntity.status(404).body(new ApiResponse(404, "Track/User not found", null));
			}

			if (!user.getLikedTracks().contains(track)) {

				return ResponseEntity.badRequest().body(new ApiResponse(400, "Track not liked yet", null));
			}

			user.getLikedTracks().remove(track);

			if (track.getCountLike() == null) {
				track.setCountLike(0);
			}

			if (track.getCountLike() > 0) {
				track.setCountLike(track.getCountLike() - 1);
			}

			userRepository.save(user);

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse(200, "Dislike track success", null));

		} catch (Exception e) {

			e.printStackTrace();

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Lấy danh sách track được tạo từ một user
	@GetMapping("/my-tracks")
	public ResponseEntity<?> getMyTracks(HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {

				return ResponseEntity.status(401).body(new ApiResponse(401, "Unauthorized", null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User user = userRepository.findByEmail(email);

			if (user == null) {

				return ResponseEntity.status(404).body(new ApiResponse(404, "User not found", null));
			}

			List<Track> tracks = trackRepository.findByUploaderIdAndIsDeletedFalse(user.getId());

			return ResponseEntity.ok(new ApiResponse(200, "Fetch my tracks success", tracks));

		} catch (Exception e) {

			e.printStackTrace();

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Lấy danh sách track được yêu thích từ một user
	@GetMapping("/liked")
	public ResponseEntity<?> getLikedTracks(HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {

				return ResponseEntity.status(401).body(

						new ApiResponse<>(

								401,

								"Unauthorized",

								null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String email = claims.getSubject();

			User user = userRepository.findByEmail(email);

			if (user == null) {

				return ResponseEntity.status(404).body(

						new ApiResponse<>(

								404,

								"User not found",

								null));
			}

			return ResponseEntity.ok(

					new ApiResponse<>(

							200,

							"Fetch liked tracks success",

							user.getLikedTracks()));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(

					new ApiResponse<>(

							500,

							e.getMessage(),

							null));
		}
	}

	// Tăng số lượt phát nhạc
	@PostMapping("/{trackId}/play")
	public ResponseEntity<?> increaseView(@PathVariable String trackId) {

		try {

			Track track = trackRepository.findById(trackId).orElse(null);

			if (track == null) {

				return ResponseEntity.status(404).body(new ApiResponse(404, "Track not found", null));
			}

			if (track.getCountPlay() == null) {
				track.setCountPlay(0);
			}

			track.setCountPlay(track.getCountPlay() + 1);

			trackRepository.save(track);

			return ResponseEntity.ok(new ApiResponse(200, "Increase play success", track));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Tìm kiếm track
	@GetMapping("/search")
	public ResponseEntity<?> searchTracks(@RequestParam String keyword) {

		try {

			List<Track> tracks = trackRepository.findByTitleContainingAndIsDeletedFalse(keyword);

			return ResponseEntity.ok(new ApiResponse(200, "Search tracks success", tracks));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Tìm Top track bằng danh mục
	@GetMapping("/top")
	public ResponseEntity<?> getTopTracksByCategory(@RequestParam String category) {

		try {

			List<Track> tracks = trackRepository.findByCategoryAndIsDeletedFalseOrderByCountPlayDesc(category);

			return ResponseEntity.ok(new ApiResponse(200, "Fetch top tracks success", tracks));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}
}