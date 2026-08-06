package com.example.demo.controllers;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.CreateArtistMembershipPlanDTO;
import com.example.demo.dtos.UpdateArtistMembershipPlanDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistMembershipPlanService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api",
        "/api/v1"
})
public class ArtistMembershipPlanController {

    private final ArtistMembershipPlanService artistMembershipPlanService;

    private final UserRepository userRepository;

    public ArtistMembershipPlanController(
            ArtistMembershipPlanService artistMembershipPlanService,
            UserRepository userRepository) {

        this.artistMembershipPlanService = artistMembershipPlanService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * PUBLIC ACTIVE PLANS
     * =========================
     */
    @GetMapping("/artists/{artistId}/membership-plans")
    public ResponseEntity<?> getPublicPlans(
            @PathVariable String artistId) {

        try {
            List<Map<String, Object>> data = artistMembershipPlanService
                    .getPublicPlans(
                            artistId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch artist membership plans successfully",
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
                                    "Unable to fetch artist membership plans",
                                    null));
        }
    }

    /*
     * =========================
     * ARTIST GET OWN PLANS
     * =========================
     */
    @GetMapping("/artist/membership-plans")
    public ResponseEntity<?> getMyPlans(
            HttpServletRequest request) {

        try {
            User artist = getCurrentUser(
                    request);

            if (artist == null) {
                return unauthorizedResponse();
            }

            List<Map<String, Object>> data = artistMembershipPlanService
                    .getArtistPlans(
                            artist.getId());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch your membership plans successfully",
                            data));

        } catch (SecurityException e) {

            return forbiddenResponse(
                    e.getMessage());

        } catch (NoSuchElementException e) {

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
                                    "Unable to fetch your membership plans",
                                    null));
        }
    }

    /*
     * =========================
     * CREATE PLAN
     * =========================
     */
    @PostMapping("/artist/membership-plans")
    public ResponseEntity<?> createPlan(
            @RequestBody CreateArtistMembershipPlanDTO dto,
            HttpServletRequest request) {

        try {
            User artist = getCurrentUser(
                    request);

            if (artist == null) {
                return unauthorizedResponse();
            }

            Map<String, Object> data = artistMembershipPlanService
                    .createPlan(
                            artist.getId(),
                            dto);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Artist membership plan created successfully",
                            data));

        } catch (SecurityException e) {

            return forbiddenResponse(
                    e.getMessage());

        } catch (NoSuchElementException e) {

            return ResponseEntity
                    .status(404)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    e.getMessage(),
                                    null));

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
                                    "Unable to create artist membership plan",
                                    null));
        }
    }

    /*
     * =========================
     * UPDATE / ACTIVATE / DISABLE
     * =========================
     */
    @PatchMapping("/artist/membership-plans/{planId}")
    public ResponseEntity<?> updatePlan(
            @PathVariable String planId,
            @RequestBody UpdateArtistMembershipPlanDTO dto,
            HttpServletRequest request) {

        try {
            User artist = getCurrentUser(
                    request);

            if (artist == null) {
                return unauthorizedResponse();
            }

            Map<String, Object> data = artistMembershipPlanService
                    .updatePlan(
                            artist.getId(),
                            planId,
                            dto);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Artist membership plan updated successfully",
                            data));

        } catch (SecurityException e) {

            return forbiddenResponse(
                    e.getMessage());

        } catch (NoSuchElementException e) {

            return ResponseEntity
                    .status(404)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    e.getMessage(),
                                    null));

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
                                    "Unable to update artist membership plan",
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

            return userRepository.findByEmail(
                    email);

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

    private ResponseEntity<ApiResponse<Object>> unauthorizedResponse() {

        return ResponseEntity
                .status(401)
                .body(
                        new ApiResponse<>(
                                401,
                                "Unauthorized",
                                null));
    }

    private ResponseEntity<ApiResponse<Object>> forbiddenResponse(
            String message) {

        return ResponseEntity
                .status(403)
                .body(
                        new ApiResponse<>(
                                403,
                                message,
                                null));
    }
}