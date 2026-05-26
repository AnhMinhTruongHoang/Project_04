package com.example.demo.controllers;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.jsonwebtoken.Claims;

import com.example.demo.dtos.CreateEmptyPlaylistDTO;
import com.example.demo.dtos.UpdatePlaylistDTO;
import com.example.demo.entities.Playlist;
import com.example.demo.entities.Track;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.PlaylistService;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

	@Autowired
	private PlaylistService playlistService;

	@Autowired
	private TrackRepository trackRepository;

	@PostMapping("create")
	public ResponseEntity<?> createPlaylist(@RequestBody CreateEmptyPlaylistDTO dto, HttpServletRequest request) {

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

			playlist.setIsDeleted(false);

			playlist.setCreatedAt(new Date());
			playlist.setUpdatedAt(new Date());

			Playlist result = playlistService.save(playlist);

			return ResponseEntity.ok(new ApiResponse(200, "Create playlist success", result));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Cập nhật playlist
	@PutMapping("update/{id}")
	public ResponseEntity<?> updatePlaylist(@PathVariable String id, @RequestBody UpdatePlaylistDTO dto) {

		try {

			Playlist playlist = playlistService.findById(id);

			if (playlist == null) {

				return ResponseEntity.status(404).body(new ApiResponse(404, "Playlist not found", null));
			}

			playlist.setTitle(dto.getTitle());

			playlist.setIsPublic(dto.getIsPublic());

			playlist.setUpdatedAt(new Date());

			Set<Track> tracks = new HashSet<>();

			if (dto.getTrackIds() != null) {

				for (String trackId : dto.getTrackIds()) {

					Track track = trackRepository.findById(trackId).orElse(null);

					if (track != null) {
						tracks.add(track);
					}
				}
			}

			playlist.setTracks(tracks);

			Playlist result = playlistService.save(playlist);

			return ResponseEntity.ok(new ApiResponse(200, "Update playlist success", result));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Xóa playlist
	@DeleteMapping("delete/{id}")
	public ResponseEntity<?> deletePlaylist(@PathVariable String id) {

		try {

			Playlist playlist = playlistService.findById(id);

			if (playlist == null) {

				return ResponseEntity.status(404).body(new ApiResponse(404, "Playlist not found", null));
			}

			playlist.setIsDeleted(true);

			playlist.setUpdatedAt(new Date());

			playlistService.save(playlist);

			return ResponseEntity.ok(new ApiResponse(200, "Delete playlist success", null));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Lấy playlist bằng ID
	@GetMapping("search/{id}")
	public ResponseEntity<?> getPlaylistById(@PathVariable String id) {

		try {

			Playlist playlist = playlistService.findById(id);

			if (playlist == null || Boolean.TRUE.equals(playlist.getIsDeleted())) {

				return ResponseEntity.status(404).body(new ApiResponse(404, "Playlist not found", null));
			}

			return ResponseEntity.ok(new ApiResponse(200, "Fetch playlist success", playlist));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Lấy danh sách có phân trang
	@GetMapping
	public ResponseEntity<?> getPlaylists(@RequestParam(defaultValue = "1") int current,
			@RequestParam(defaultValue = "10") int pageSize) {

		try {

			Pageable pageable = PageRequest.of(current - 1, pageSize);

			Page<Playlist> page = playlistService.findAll(pageable);

			Map<String, Object> meta = new HashMap<>();

			meta.put("current", current);
			meta.put("pageSize", pageSize);
			meta.put("pages", page.getTotalPages());
			meta.put("total", page.getTotalElements());

			Map<String, Object> data = new HashMap<>();

			data.put("meta", meta);
			data.put("result", page.getContent());

			return ResponseEntity.ok(new ApiResponse(200, "Fetch playlists success", data));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}

	// Lấy danh sách từ một user cụ thể
	@GetMapping("/my-playlists")
	public ResponseEntity<?> getMyPlaylists(@RequestParam(defaultValue = "1") int current,
			@RequestParam(defaultValue = "10") int pageSize, HttpServletRequest request) {

		try {

			String authHeader = request.getHeader("Authorization");

			if (authHeader == null || !authHeader.startsWith("Bearer ")) {

				return ResponseEntity.status(401).body(new ApiResponse(401, "Unauthorized", null));
			}

			String token = authHeader.substring(7);

			Claims claims = JwtHelper.verifyToken(token);

			String userId = claims.get("id", String.class);

			Pageable pageable = PageRequest.of(current - 1, pageSize);

			Page<Playlist> page = playlistService.findByUserId(userId, pageable);

			Map<String, Object> meta = new HashMap<>();

			meta.put("current", current);
			meta.put("pageSize", pageSize);
			meta.put("pages", page.getTotalPages());
			meta.put("total", page.getTotalElements());

			Map<String, Object> data = new HashMap<>();

			data.put("meta", meta);
			data.put("result", page.getContent());

			return ResponseEntity.ok(new ApiResponse(200, "Fetch my playlists success", data));

		} catch (Exception e) {

			return ResponseEntity.status(500).body(new ApiResponse(500, e.getMessage(), null));
		}
	}
}