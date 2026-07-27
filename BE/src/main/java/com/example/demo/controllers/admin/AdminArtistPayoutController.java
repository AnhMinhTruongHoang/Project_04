package com.example.demo.controllers.admin;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.AdminArtistPayoutActionDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.AuthHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistPayoutService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
                "/api/admin/artist-payouts",
                "/api/v1/admin/artist-payouts"
})
public class AdminArtistPayoutController {

        private final ArtistPayoutService artistPayoutService;

        private final UserRepository userRepository;

        public AdminArtistPayoutController(
                        ArtistPayoutService artistPayoutService,
                        UserRepository userRepository) {

                this.artistPayoutService = artistPayoutService;

                this.userRepository = userRepository;
        }

        /*
         * =========================
         * GET PAYOUT LIST
         * =========================
         */
        @GetMapping
        public ResponseEntity<?> getPayoutRequests(
                        @RequestParam(required = false) String status,

                        @RequestParam(defaultValue = "1") int current,

                        @RequestParam(defaultValue = "10") int pageSize,

                        HttpServletRequest request) {

                try {
                        User admin = getCurrentAdmin(request);

                        if (admin == null) {
                                return forbiddenResponse();
                        }

                        Map<String, Object> data = artistPayoutService
                                        .getAdminPayoutRequests(
                                                        status,
                                                        current,
                                                        pageSize);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch artist payout requests successfully",
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
                                                                        "Unable to fetch payout requests",
                                                                        null));
                }
        }

        /*
         * =========================
         * GET PAYOUT DETAIL
         * =========================
         */
        @GetMapping("/{payoutRequestId}")
        public ResponseEntity<?> getPayoutRequestDetail(
                        @PathVariable String payoutRequestId,
                        HttpServletRequest request) {

                try {
                        User admin = getCurrentAdmin(request);

                        if (admin == null) {
                                return forbiddenResponse();
                        }

                        Map<String, Object> data = artistPayoutService
                                        .getAdminPayoutRequestDetail(
                                                        payoutRequestId);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch artist payout request detail successfully",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .status(404)
                                        .body(
                                                        new ApiResponse<>(
                                                                        404,
                                                                        e.getMessage(),
                                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to fetch payout request detail",
                                                                        null));
                }
        }

        /*
         * =========================
         * APPROVE PAYOUT
         * =========================
         */
        @PatchMapping("/{payoutRequestId}/approve")
        public ResponseEntity<?> approvePayoutRequest(
                        @PathVariable String payoutRequestId,

                        @RequestBody(required = false) AdminArtistPayoutActionDTO dto,

                        HttpServletRequest request) {

                try {
                        User admin = getCurrentAdmin(request);

                        if (admin == null) {
                                return forbiddenResponse();
                        }

                        Map<String, Object> data = artistPayoutService
                                        .approvePayoutRequest(
                                                        admin.getId(),
                                                        payoutRequestId,
                                                        dto);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Artist payout request approved successfully",
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
                                                                        "Unable to approve payout request",
                                                                        null));
                }
        }

        /*
         * =========================
         * REJECT PAYOUT
         * =========================
         */
        @PatchMapping("/{payoutRequestId}/reject")
        public ResponseEntity<?> rejectPayoutRequest(
                        @PathVariable String payoutRequestId,

                        @RequestBody(required = false) AdminArtistPayoutActionDTO dto,

                        HttpServletRequest request) {

                try {
                        User admin = getCurrentAdmin(request);

                        if (admin == null) {
                                return forbiddenResponse();
                        }

                        Map<String, Object> data = artistPayoutService
                                        .rejectPayoutRequest(
                                                        admin.getId(),
                                                        payoutRequestId,
                                                        dto);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Artist payout request rejected successfully",
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
                                                                        "Unable to reject payout request",
                                                                        null));
                }
        }

        /*
         * =========================
         * MARK PAYOUT AS PAID
         * =========================
         */
        @PatchMapping("/{payoutRequestId}/paid")
        public ResponseEntity<?> markPayoutAsPaid(
                        @PathVariable String payoutRequestId,

                        @RequestBody(required = false) AdminArtistPayoutActionDTO dto,

                        HttpServletRequest request) {

                try {
                        User admin = getCurrentAdmin(request);

                        if (admin == null) {
                                return forbiddenResponse();
                        }

                        Map<String, Object> data = artistPayoutService
                                        .markPayoutAsPaid(
                                                        admin.getId(),
                                                        payoutRequestId,
                                                        dto);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Artist payout marked as paid successfully",
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
                                                                        "Unable to mark payout as paid",
                                                                        null));
                }
        }

        /*
         * =========================
         * ADMIN AUTH
         * =========================
         */
        private User getCurrentAdmin(
                        HttpServletRequest request) {

                try {
                        String token = getBearerToken(request);

                        if (token == null
                                        || !AuthHelper.isAdmin(token)) {

                                return null;
                        }

                        Claims claims = JwtHelper.verifyToken(token);

                        String email = claims.getSubject();

                        if (email == null
                                        || email.isBlank()) {

                                return null;
                        }

                        User admin = userRepository.findByEmail(
                                        email);

                        if (admin == null
                                        || !"ADMIN".equalsIgnoreCase(
                                                        admin.getRole())
                                        || !"ACTIVE".equalsIgnoreCase(
                                                        admin.getAccountStatus())) {

                                return null;
                        }

                        return admin;

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

        private ResponseEntity<ApiResponse<Object>> forbiddenResponse() {

                return ResponseEntity
                                .status(403)
                                .body(
                                                new ApiResponse<>(
                                                                403,
                                                                "Administrator permission is required",
                                                                null));
        }
}