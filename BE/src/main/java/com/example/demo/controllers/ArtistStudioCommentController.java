package com.example.demo.controllers;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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

@RestController
@RequestMapping("/api/v1/artist-studio/comments")
public class ArtistStudioCommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TrackRepository trackRepository;

    @Autowired
    private UserRepository userRepository;

    /*
     * =========================================================
     * AUTH
     * =========================================================
     */

    private String getBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null
                || !authHeader.startsWith("Bearer ")) {

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

    /*
     * =========================================================
     * RESPONSE MAPPERS
     * =========================================================
     */

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new LinkedHashMap<>();

        if (user == null) {
            return map;
        }

        map.put("id", user.getId());
        map.put("_id", user.getId());

        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("username", user.getUsername());

        map.put("avatar", user.getAvatarUrl());
        map.put("avatarUrl", user.getAvatarUrl());

        map.put("type", user.getType());

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
        map.put("slug", track.getSlug());
        map.put("category", track.getCategory());

        map.put("imgUrl", track.getImgUrl());

        return map;
    }

    private Map<String, Object> toCommentMap(Comment comment) {
        User commentUser = userRepository
                .findById(comment.getUserId())
                .orElse(null);

        Track track = trackRepository
                .findById(comment.getTrackId())
                .orElse(null);

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", comment.getId());
        map.put("_id", comment.getId());

        map.put("content", comment.getContent());
        map.put("moment", comment.getMoment());

        map.put("userId", comment.getUserId());
        map.put("trackId", comment.getTrackId());

        map.put("user", toUserMap(commentUser));
        map.put("track", toTrackMap(track));

        map.put("isDeleted", comment.getIsDeleted());

        map.put("createdAt", comment.getCreatedAt());
        map.put("updatedAt", comment.getUpdatedAt());

        return map;
    }

    /*
     * =========================================================
     * SEARCH / FILTER
     * =========================================================
     */

    @SuppressWarnings("unchecked")
    private boolean matchesFilter(
            Map<String, Object> comment,
            String keyword,
            String trackId) {

        Map<String, Object> user = (Map<String, Object>) comment.get("user");

        Map<String, Object> track = (Map<String, Object>) comment.get("track");

        /*
         * TRACK FILTER
         */
        if (trackId != null
                && !trackId.isBlank()) {

            String commentTrackId = String.valueOf(
                    track.getOrDefault("id", ""));

            if (!trackId.trim().equals(commentTrackId)) {
                return false;
            }
        }

        /*
         * SEARCH
         */
        if (keyword == null
                || keyword.isBlank()) {

            return true;
        }

        String normalizedKeyword = keyword
                .trim()
                .toLowerCase(Locale.ROOT);

        String searchable = String.join(
                " ",
                String.valueOf(
                        comment.getOrDefault(
                                "content",
                                "")),

                String.valueOf(
                        user.getOrDefault(
                                "name",
                                "")),

                String.valueOf(
                        user.getOrDefault(
                                "username",
                                "")),

                String.valueOf(
                        user.getOrDefault(
                                "email",
                                "")),

                String.valueOf(
                        track.getOrDefault(
                                "title",
                                "")))
                .toLowerCase(Locale.ROOT);

        return searchable.contains(normalizedKeyword);
    }

    /*
     * =========================================================
     * GET ARTIST COMMENTS
     * =========================================================
     */

    @GetMapping
    public ResponseEntity<?> findMyTrackComments(
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String trackId,
            HttpServletRequest request) {

        try {
            User artist = getCurrentUser(request);

            if (artist == null) {
                return ResponseEntity
                        .status(401)
                        .body(
                                new ApiResponse<>(
                                        401,
                                        "Unauthorized",
                                        null));
            }

            int normalizedCurrent = Math.max(current, 1);

            int normalizedPageSize = Math.min(
                    Math.max(pageSize, 1),
                    100);

            List<Map<String, Object>> comments = commentRepository
                    .findActiveCommentsByUploaderId(
                            artist.getId())
                    .stream()
                    .map(this::toCommentMap)
                    .filter(comment -> matchesFilter(
                            comment,
                            keyword,
                            trackId))
                    .toList();

            int total = comments.size();

            int fromIndex = Math.min(
                    (normalizedCurrent - 1)
                            * normalizedPageSize,
                    total);

            int toIndex = Math.min(
                    fromIndex
                            + normalizedPageSize,
                    total);

            List<Map<String, Object>> result = comments.subList(
                    fromIndex,
                    toIndex);

            int totalPages = total == 0
                    ? 0
                    : (int) Math.ceil(
                            (double) total
                                    / normalizedPageSize);

            Map<String, Object> data = new LinkedHashMap<>();

            data.put("result", result);

            data.put(
                    "current",
                    normalizedCurrent);

            data.put(
                    "pageSize",
                    normalizedPageSize);

            data.put("total", total);

            data.put(
                    "totalPages",
                    totalPages);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch Artist Studio comments success",
                            data));

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            new ApiResponse<>(
                                    500,
                                    exception.getMessage(),
                                    null));
        }
    }

    /*
     * =========================================================
     * DELETE COMMENT FROM OWN TRACK
     * =========================================================
     */

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteArtistTrackComment(
            @PathVariable String commentId,
            HttpServletRequest request) {

        try {
            User artist = getCurrentUser(request);

            if (artist == null) {
                return ResponseEntity
                        .status(401)
                        .body(
                                new ApiResponse<>(
                                        401,
                                        "Unauthorized",
                                        null));
            }

            Comment comment = commentRepository
                    .findById(commentId)
                    .orElse(null);

            if (comment == null) {
                return ResponseEntity
                        .status(404)
                        .body(
                                new ApiResponse<>(
                                        404,
                                        "Comment not found",
                                        null));
            }

            Track track = trackRepository
                    .findById(comment.getTrackId())
                    .orElse(null);

            if (track == null) {
                return ResponseEntity
                        .status(404)
                        .body(
                                new ApiResponse<>(
                                        404,
                                        "Track not found",
                                        null));
            }

            /*
             * CRITICAL PERMISSION CHECK
             *
             * Artist chỉ được xóa comment
             * nằm trên track của chính mình.
             */
            if (!artist.getId().equals(
                    track.getUploaderId())) {

                return ResponseEntity
                        .status(403)
                        .body(
                                new ApiResponse<>(
                                        403,
                                        "You cannot delete comments from another artist's track.",
                                        null));
            }

            /*
             * Idempotent soft delete.
             */
            if (!Boolean.TRUE.equals(
                    comment.getIsDeleted())) {

                comment.setIsDeleted(true);

                comment.setUpdatedAt(
                        LocalDateTime.now());

                commentRepository.save(comment);
            }

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Comment deleted successfully",
                            true));

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            new ApiResponse<>(
                                    500,
                                    exception.getMessage(),
                                    null));
        }
    }
}