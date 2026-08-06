package com.example.demo.controllers.admin;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Date;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.entities.User;
import com.example.demo.helpers.AuthHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.BadgeService;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminBadgeController {

    private final BadgeService badgeService;
    private final UserRepository userRepository;

    public AdminBadgeController(
            BadgeService badgeService,
            UserRepository userRepository) {

        this.badgeService = badgeService;
        this.userRepository = userRepository;
    }

    private boolean isAdminRequest(String authorization) {

        try {
            if (authorization == null ||
                    !authorization.startsWith("Bearer ")) {
                return false;
            }

            String token = authorization
                    .substring(7)
                    .trim();

            return !token.isEmpty() &&
                    AuthHelper.isAdmin(token);

        } catch (Exception e) {
            return false;
        }
    }

    private User getCurrentAdmin(String authorization) {

        try {
            if (authorization == null ||
                    !authorization.startsWith("Bearer ")) {
                return null;
            }

            String token = authorization
                    .substring(7)
                    .trim();

            if (token.isEmpty()) {
                return null;
            }

            Claims claims = JwtHelper.verifyToken(token);

            String email = claims.getSubject();

            if (email == null || email.isBlank()) {
                return null;
            }

            User user = userRepository.findByEmail(email);

            if (user == null ||
                    !"ADMIN".equalsIgnoreCase(user.getRole())) {
                return null;
            }

            return user;

        } catch (Exception e) {
            return null;
        }
    }

    private String getString(
            Map<String, Object> body,
            String key) {

        if (body == null) {
            return null;
        }

        Object value = body.get(key);

        if (value == null) {
            return null;
        }

        String result = String.valueOf(value).trim();

        return result.isEmpty() ? null : result;
    }

    private Date parseExpiresAt(
            Map<String, Object> body) {

        String expiresAt = getString(body, "expiresAt");

        if (expiresAt == null) {
            return null;
        }

        try {
            return Date.from(
                    Instant.parse(expiresAt));

        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "expiresAt must use ISO-8601 format, for example 2026-12-31T23:59:59Z.");
        }
    }

    /*
     * =========================
     * ADMIN GET ALL BADGES
     * =========================
     */
    @GetMapping("/badges")
    public ResponseEntity<?> getAllBadges(
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        if (!isAdminRequest(authorization)) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            new ApiResponse<>(
                                    403,
                                    "You do not have permission to manage badges.",
                                    null));
        }

        try {
            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch all badges successfully",
                            badgeService.getAllBadges()));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to fetch badges.",
                                    null));
        }
    }

    /*
     * =========================
     * ADMIN AWARD USER BADGE
     * =========================
     */
    @PostMapping("/users/{userId}/badges/{badgeId}")
    public ResponseEntity<?> awardBadge(
            @PathVariable String userId,
            @PathVariable String badgeId,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        if (!isAdminRequest(authorization)) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            new ApiResponse<>(
                                    403,
                                    "You do not have permission to award badges.",
                                    null));
        }

        User currentAdmin = getCurrentAdmin(authorization);

        if (currentAdmin == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            new ApiResponse<>(
                                    401,
                                    "Your administrator session is invalid or has expired.",
                                    null));
        }

        String note = getString(body, "note");

        if (note != null && note.length() > 1000) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiResponse<>(
                                    400,
                                    "Badge note cannot exceed 1000 characters.",
                                    null));
        }

        Date expiresAt;

        try {
            expiresAt = parseExpiresAt(body);

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiResponse<>(
                                    400,
                                    e.getMessage(),
                                    null));
        }

        if (expiresAt != null &&
                !expiresAt.after(new Date())) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiResponse<>(
                                    400,
                                    "Badge expiration time must be in the future.",
                                    null));
        }

        try {
            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Badge awarded successfully",
                            badgeService.awardBadge(
                                    userId,
                                    badgeId,
                                    currentAdmin,
                                    note,
                                    expiresAt)));

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    e.getMessage(),
                                    null));

        } catch (IllegalStateException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            new ApiResponse<>(
                                    409,
                                    e.getMessage(),
                                    null));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to award this badge.",
                                    null));
        }
    }

    /*
     * =========================
     * ADMIN REVOKE USER BADGE
     * =========================
     */
    @DeleteMapping("/users/{userId}/badges/{badgeId}")
    public ResponseEntity<?> revokeBadge(
            @PathVariable String userId,
            @PathVariable String badgeId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        if (!isAdminRequest(authorization)) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            new ApiResponse<>(
                                    403,
                                    "You do not have permission to revoke badges.",
                                    null));
        }

        if (getCurrentAdmin(authorization) == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                            new ApiResponse<>(
                                    401,
                                    "Your administrator session is invalid or has expired.",
                                    null));
        }

        try {
            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Badge revoked successfully",
                            badgeService.revokeBadge(
                                    userId,
                                    badgeId)));

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    e.getMessage(),
                                    null));

        } catch (IllegalStateException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            new ApiResponse<>(
                                    409,
                                    e.getMessage(),
                                    null));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to revoke this badge.",
                                    null));
        }
    }
}