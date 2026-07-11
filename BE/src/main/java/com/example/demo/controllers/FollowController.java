package com.example.demo.controllers;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dtos.FollowStatusDTO;
import com.example.demo.dtos.FollowUserDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.FollowService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api/users",
        "/api/v1/users"
})
public class FollowController {

    private final FollowService followService;
    private final UserRepository userRepository;

    public FollowController(
            FollowService followService,
            UserRepository userRepository) {
        this.followService = followService;
        this.userRepository = userRepository;
    }

    @PostMapping("/{targetUserId}/follow")
    public ResponseEntity<?> follow(
            @PathVariable String targetUserId,
            HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(request);

            if (currentUser == null) {
                return ResponseEntity.status(401).body(
                        new ApiResponse<>(401, "Unauthorized", null));
            }

            FollowStatusDTO result = followService.follow(
                    currentUser.getId(),
                    targetUserId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Follow user success",
                            result));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new ApiResponse<>(400, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{targetUserId}/follow")
    public ResponseEntity<?> unfollow(
            @PathVariable String targetUserId,
            HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(request);

            if (currentUser == null) {
                return ResponseEntity.status(401).body(
                        new ApiResponse<>(401, "Unauthorized", null));
            }

            FollowStatusDTO result = followService.unfollow(
                    currentUser.getId(),
                    targetUserId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Unfollow user success",
                            result));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new ApiResponse<>(400, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    @GetMapping("/{targetUserId}/follow-status")
    public ResponseEntity<?> getFollowStatus(
            @PathVariable String targetUserId,
            HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(request);

            FollowStatusDTO result = followService.getFollowStatus(
                    currentUser == null ? null : currentUser.getId(),
                    targetUserId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch follow status success",
                            result));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(
                    new ApiResponse<>(404, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<?> getFollowers(
            @PathVariable String userId,
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int pageSize) {
        try {
            Pageable pageable = createPageable(current, pageSize);

            Page<FollowUserDTO> page = followService.getFollowers(userId, pageable);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch followers success",
                            pageResponse(page, current, pageSize)));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(
                    new ApiResponse<>(404, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<?> getFollowing(
            @PathVariable String userId,
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int pageSize) {
        try {
            Pageable pageable = createPageable(current, pageSize);

            Page<FollowUserDTO> page = followService.getFollowing(userId, pageable);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch following success",
                            pageResponse(page, current, pageSize)));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(
                    new ApiResponse<>(404, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    private User getCurrentUser(HttpServletRequest request) {
        try {
            String authorization = request.getHeader("Authorization");

            if (authorization == null ||
                    !authorization.startsWith("Bearer ")) {
                return null;
            }

            String token = authorization.substring(7);

            Claims claims = JwtHelper.verifyToken(token);

            return userRepository.findByEmail(claims.getSubject());

        } catch (Exception e) {
            return null;
        }
    }

    private Pageable createPageable(int current, int pageSize) {
        int safeCurrent = Math.max(current, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);

        return PageRequest.of(
                safeCurrent - 1,
                safePageSize);
    }

    private Map<String, Object> pageResponse(
            Page<?> page,
            int current,
            int pageSize) {
        Map<String, Object> meta = new LinkedHashMap<>();

        meta.put("current", Math.max(current, 1));
        meta.put("pageSize", Math.min(Math.max(pageSize, 1), 100));
        meta.put("pages", page.getTotalPages());
        meta.put("total", page.getTotalElements());

        Map<String, Object> data = new LinkedHashMap<>();

        data.put("meta", meta);
        data.put("result", page.getContent());

        return data;
    }
}