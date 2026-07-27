package com.example.demo.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistEarningService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.example.demo.dtos.CreateArtistPayoutRequestDTO;
import com.example.demo.services.ArtistPayoutService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
                "/api/artist/earnings",
                "/api/v1/artist/earnings"
})
public class ArtistEarningController {

        private final ArtistEarningService artistEarningService;

        private final UserRepository userRepository;

        private final ArtistPayoutService artistPayoutService;

        public ArtistEarningController(
                        ArtistEarningService artistEarningService,
                        ArtistPayoutService artistPayoutService,
                        UserRepository userRepository) {

                this.artistEarningService = artistEarningService;

                this.artistPayoutService = artistPayoutService;

                this.userRepository = userRepository;
        }

        /*
         * =========================
         * GET MY ARTIST WALLET
         * =========================
         */
        @GetMapping("/wallet")
        public ResponseEntity<?> getMyWallet(
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = artistEarningService
                                        .getArtistWallet(
                                                        user.getId());

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch artist wallet successfully",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        e.getMessage(),
                                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to fetch artist wallet",
                                                                        null));
                }
        }

        /*
         * =========================
         * GET MY EARNING HISTORY
         * =========================
         */
        @GetMapping("/history")
        public ResponseEntity<?> getMyEarningHistory(
                        @RequestParam(required = false) String status,

                        @RequestParam(defaultValue = "1") int current,

                        @RequestParam(defaultValue = "10") int pageSize,

                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = artistEarningService
                                        .getArtistEarningHistory(
                                                        user.getId(),
                                                        status,
                                                        current,
                                                        pageSize);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch artist earning history successfully",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        e.getMessage(),
                                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to fetch artist earning history",
                                                                        null));
                }
        }

        /*
         * =========================
         * GET MY EARNING SUMMARY
         * =========================
         */
        @GetMapping("/summary")
        public ResponseEntity<?> getMyEarningSummary(
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = artistEarningService
                                        .getArtistEarningSummary(
                                                        user.getId());

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch artist earning summary successfully",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        e.getMessage(),
                                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to fetch artist earning summary",
                                                                        null));
                }
        }

        /*
         * =========================
         * CREATE PAYOUT REQUEST
         * =========================
         */
        @PostMapping("/payouts")
        public ResponseEntity<?> createPayoutRequest(
                        @RequestBody(required = false) CreateArtistPayoutRequestDTO dto,

                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = artistPayoutService
                                        .createPayoutRequest(
                                                        user.getId(),
                                                        dto);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Artist payout request created successfully",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        e.getMessage(),
                                                                        null));

                } catch (IllegalStateException e) {

                        return ResponseEntity
                                        .status(409)
                                        .body(
                                                        new ApiResponse<>(
                                                                        409,
                                                                        e.getMessage(),
                                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to create payout request",
                                                                        null));
                }
        }

        /*
         * =========================
         * AUTH HELPERS
         * =========================
         */
        private User getCurrentUser(
                        HttpServletRequest request) {

                try {
                        String token = getBearerToken(
                                        request);

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

                        User user = userRepository.findByEmail(
                                        email);

                        if (user == null
                                        || !"ACTIVE".equalsIgnoreCase(
                                                        user.getAccountStatus())) {

                                return null;
                        }

                        return user;

                } catch (Exception e) {
                        return null;
                }
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

                return token.isBlank()
                                ? null
                                : token;
        }

        /*
         * =========================
         * GET MY PAYOUT HISTORY
         * =========================
         */
        @GetMapping("/payouts")
        public ResponseEntity<?> getMyPayoutHistory(
                        @RequestParam(required = false) String status,

                        @RequestParam(defaultValue = "1") int current,

                        @RequestParam(defaultValue = "10") int pageSize,

                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = artistPayoutService
                                        .getArtistPayoutHistory(
                                                        user.getId(),
                                                        status,
                                                        current,
                                                        pageSize);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch artist payout history successfully",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        e.getMessage(),
                                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to fetch payout history",
                                                                        null));
                }
        }

        /*
         * =========================
         * CANCEL PAYOUT REQUEST
         * =========================
         */
        @PostMapping("/payouts/{payoutRequestId}/cancel")
        public ResponseEntity<?> cancelPayoutRequest(
                        @PathVariable String payoutRequestId,
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = artistPayoutService
                                        .cancelPayoutRequest(
                                                        user.getId(),
                                                        payoutRequestId);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Artist payout request canceled successfully",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .status(404)
                                        .body(
                                                        new ApiResponse<>(
                                                                        404,
                                                                        e.getMessage(),
                                                                        null));

                } catch (IllegalStateException e) {

                        return ResponseEntity
                                        .status(409)
                                        .body(
                                                        new ApiResponse<>(
                                                                        409,
                                                                        e.getMessage(),
                                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to cancel payout request",
                                                                        null));
                }
        }
}