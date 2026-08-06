package com.example.demo.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.responses.ApiResponse;
import com.example.demo.services.BadgeService;

@RestController
@RequestMapping("/api/v1")
public class BadgeController {

    private final BadgeService badgeService;

    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    /*
     * =========================
     * PUBLIC ACTIVE BADGES
     * =========================
     */
    @GetMapping("/badges")
    public ResponseEntity<?> getActiveBadges() {

        try {
            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch active badges successfully",
                            badgeService.getActiveBadges()));

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
     * PUBLIC USER BADGES
     * =========================
     */
    @GetMapping("/users/{userId}/badges")
    public ResponseEntity<?> getUserBadges(
            @PathVariable String userId) {

        try {
            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch user badges successfully",
                            badgeService.getUserBadges(userId)));

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    e.getMessage(),
                                    null));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to fetch user badges.",
                                    null));
        }
    }
}