package com.example.demo.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.NotificationDTO;
import com.example.demo.dtos.NotificationPageDTO;
import com.example.demo.dtos.UnreadNotificationCountDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.NotificationService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository) {

        this.notificationService = notificationService;

        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "20") int size,

            @RequestParam(defaultValue = "all") String status,

            HttpServletRequest request) {

        User user = getCurrentUser(request);

        if (user == null) {
            return unauthorized();
        }

        NotificationPageDTO result = notificationService
                .getNotifications(
                        user.getId(),
                        status,
                        page,
                        size);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Get notifications successfully",
                        result));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(
            HttpServletRequest request) {

        User user = getCurrentUser(request);

        if (user == null) {
            return unauthorized();
        }

        long unreadCount = notificationService
                .countUnread(
                        user.getId());

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Get unread notification count successfully",
                        new UnreadNotificationCountDTO(
                                unreadCount)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable String notificationId,

            HttpServletRequest request) {

        User user = getCurrentUser(request);

        if (user == null) {
            return unauthorized();
        }

        try {
            NotificationDTO notification = notificationService
                    .markAsRead(
                            notificationId,
                            user.getId());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Notification marked as read",
                            notification));

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(404)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    e.getMessage(),
                                    null));
        }
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            HttpServletRequest request) {

        User user = getCurrentUser(request);

        if (user == null) {
            return unauthorized();
        }

        int updatedCount = notificationService
                .markAllAsRead(
                        user.getId());

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "All notifications marked as read",
                        updatedCount));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> delete(
            @PathVariable String notificationId,

            HttpServletRequest request) {

        User user = getCurrentUser(request);

        if (user == null) {
            return unauthorized();
        }

        try {
            notificationService.delete(
                    notificationId,
                    user.getId());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Notification deleted successfully",
                            null));

        } catch (IllegalArgumentException e) {

            return ResponseEntity
                    .status(404)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    e.getMessage(),
                                    null));
        }
    }

    @DeleteMapping("/clear-read")
    public ResponseEntity<?> clearRead(
            HttpServletRequest request) {

        User user = getCurrentUser(request);

        if (user == null) {
            return unauthorized();
        }

        long deletedCount = notificationService
                .clearRead(
                        user.getId());

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Read notifications cleared successfully",
                        deletedCount));
    }

    private ResponseEntity<?> unauthorized() {

        return ResponseEntity
                .status(401)
                .body(
                        new ApiResponse<>(
                                401,
                                "Unauthorized",
                                null));
    }

    private String getBearerToken(
            HttpServletRequest request) {

        String authorization = request.getHeader(
                "Authorization");

        if (authorization == null
                || !authorization.startsWith(
                        "Bearer ")) {

            return null;
        }

        String token = authorization
                .substring(7)
                .trim();

        return token.isEmpty()
                ? null
                : token;
    }

    private User getCurrentUser(
            HttpServletRequest request) {

        try {
            String token = getBearerToken(request);

            if (token == null) {
                return null;
            }

            Claims claims = JwtHelper.verifyToken(
                    token);

            String email = claims.getSubject();

            if (email == null
                    || email.isBlank()) {

                return null;
            }

            return userRepository
                    .findByEmail(email);

        } catch (Exception e) {
            return null;
        }
    }
}