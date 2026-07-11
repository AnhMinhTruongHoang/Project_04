package com.example.demo.controllers;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.entities.Comment;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.CommentRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;

@RestController
@RequestMapping({ "/api/comments", "/api/v1/comments" })
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackRepository trackRepository;

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
        return user != null && "ADMIN".equalsIgnoreCase(user.getRole());
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new LinkedHashMap<>();

        if (user == null) {
            return map;
        }

        map.put("id", user.getId());
        map.put("_id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("avatar", user.getAvatarUrl());
        map.put("avatarUrl", user.getAvatarUrl());
        map.put("followers", user.getFollowers() == null ? 0 : user.getFollowers());
        map.put("following", user.getFollowing() == null ? 0 : user.getFollowing());

        return map;
    }

    private Map<String, Object> toTrackMap(Track track) {
        Map<String, Object> map = new LinkedHashMap<>();

        if (track == null) {
            return map;
        }

        map.put("id", track.getId());
        map.put("_id", track.getId());
        map.put("title", track.getTitle());
        map.put("category", track.getCategory());
        map.put("slug", track.getSlug());

        return map;
    }

    private Map<String, Object> toCommentMap(Comment comment) {
        User user = userRepository.findById(comment.getUserId()).orElse(null);
        Track track = trackRepository.findById(comment.getTrackId()).orElse(null);

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", comment.getId());
        map.put("_id", comment.getId());
        map.put("content", comment.getContent());
        map.put("moment", comment.getMoment());
        map.put("isDeleted", comment.getIsDeleted());
        map.put("createdAt", comment.getCreatedAt());
        map.put("updatedAt", comment.getUpdatedAt());
        map.put("user", toUserMap(user));
        map.put("track", toTrackMap(track));

        return map;
    }

    @GetMapping
    public ResponseEntity<?> findAll(
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "100") int pageSize,
            HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);

            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
            }

            if (!isAdmin(user)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(403, "Access denied", null));
            }

            List<Map<String, Object>> comments = commentRepository.findAll()
                    .stream()
                    .filter(comment -> !Boolean.TRUE.equals(comment.getIsDeleted()))
                    .sorted((a, b) -> {
                        LocalDateTime dateA = a.getCreatedAt();
                        LocalDateTime dateB = b.getCreatedAt();

                        if (dateA == null && dateB == null) {
                            return 0;
                        }

                        if (dateA == null) {
                            return 1;
                        }

                        if (dateB == null) {
                            return -1;
                        }

                        return dateB.compareTo(dateA);
                    })
                    .map(this::toCommentMap)
                    .collect(Collectors.toList());

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("result", comments);
            data.put("current", current);
            data.put("pageSize", pageSize);
            data.put("total", comments.size());

            return ResponseEntity.ok(new ApiResponse<>(200, "Fetch comments success", data));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    @DeleteMapping("{id}")
    public ResponseEntity<?> delete(@PathVariable String id, HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);

            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse<>(401, "Unauthorized", null));
            }

            if (!isAdmin(user)) {
                return ResponseEntity.status(403).body(new ApiResponse<>(403, "Access denied", null));
            }

            Comment comment = commentRepository.findById(id).orElse(null);

            if (comment == null) {
                return ResponseEntity.status(404).body(new ApiResponse<>(404, "Comment not found", null));
            }

            comment.setIsDeleted(true);
            comment.setUpdatedAt(LocalDateTime.now());

            commentRepository.save(comment);

            return ResponseEntity.ok(new ApiResponse<>(200, "Delete comment success", true));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ApiResponse<>(500, e.getMessage(), null));
        }
    }
}