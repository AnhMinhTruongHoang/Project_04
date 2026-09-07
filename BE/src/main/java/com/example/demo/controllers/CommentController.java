package com.example.demo.controllers;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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

    private boolean isChatBanned(User user) {
        return user != null
                && "BANNED".equalsIgnoreCase(user.getChatStatus());
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
        map.put("chatStatus", user.getChatStatus());
        map.put("chatBanReason", user.getChatBanReason());
        map.put("chatStatusUpdatedAt", user.getChatStatusUpdatedAt());

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

    private Map<String, Object> toCommentMap(
            Comment comment) {

        User user = comment.getUser();

        Track track = comment.getTrack();

        Map<String, Object> map = new LinkedHashMap<>();

        map.put(
                "id",
                comment.getId());

        map.put(
                "_id",
                comment.getId());

        map.put(
                "content",
                comment.getContent());

        map.put(
                "moment",
                comment.getMoment());

        map.put(
                "isDeleted",
                comment.getIsDeleted());

        map.put(
                "createdAt",
                comment.getCreatedAt());

        map.put(
                "updatedAt",
                comment.getUpdatedAt());

        map.put(
                "user",
                toUserMap(user));

        map.put(
                "track",
                toTrackMap(track));

        return map;
    }

    @GetMapping
    public ResponseEntity<?> findAll(
            @RequestParam(defaultValue = "1") int current,

            @RequestParam(defaultValue = "20") int pageSize,

            HttpServletRequest request) {

        try {

            User user = getCurrentUser(request);

            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(
                                new ApiResponse<>(
                                        401,
                                        "Unauthorized",
                                        null));
            }

            if (!isAdmin(user)) {

                return ResponseEntity
                        .status(403)
                        .body(
                                new ApiResponse<>(
                                        403,
                                        "Access denied",
                                        null));
            }

            int safeCurrent = Math.max(current, 1);

            int safePageSize = Math.min(
                    Math.max(pageSize, 1),
                    100);

            Pageable pageable = PageRequest.of(
                    safeCurrent - 1,
                    safePageSize);

            Page<Comment> page = commentRepository
                    .findByIsDeletedFalseOrderByCreatedAtDesc(
                            pageable);

            Map<String, Object> data = new LinkedHashMap<>();

            data.put(
                    "result",
                    page.getContent()
                            .stream()
                            .map(this::toCommentMap)
                            .toList());

            data.put(
                    "current",
                    safeCurrent);

            data.put(
                    "pageSize",
                    safePageSize);

            data.put(
                    "total",
                    page.getTotalElements());

            data.put(
                    "pages",
                    page.getTotalPages());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch comments success",
                            data));

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            new ApiResponse<>(
                                    500,
                                    e.getMessage(),
                                    null));
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