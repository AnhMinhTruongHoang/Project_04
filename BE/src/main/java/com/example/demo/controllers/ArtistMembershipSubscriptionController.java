package com.example.demo.controllers;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistMembershipSubscriptionService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api",
        "/api/v1"
})
public class ArtistMembershipSubscriptionController {

    private final ArtistMembershipSubscriptionService artistMembershipSubscriptionService;

    private final UserRepository userRepository;

    public ArtistMembershipSubscriptionController(
            ArtistMembershipSubscriptionService artistMembershipSubscriptionService,

            UserRepository userRepository) {

        this.artistMembershipSubscriptionService = artistMembershipSubscriptionService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * GET MY MEMBERSHIPS
     * =========================
     */
    @GetMapping("/memberships/me")
    public ResponseEntity<?> getMyMemberships(
            HttpServletRequest request) {

        try {
            User member = getCurrentUser(
                    request);

            if (member == null) {
                return unauthorized();
            }

            List<Map<String, Object>> data = artistMembershipSubscriptionService
                    .getMyMemberships(
                            member.getId());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch memberships successfully",
                            data));

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to fetch memberships",
                                    null));
        }
    }

    /*
     * =========================
     * CHECK ARTIST MEMBERSHIP ACCESS
     * =========================
     */
    @GetMapping("/artists/{artistId}/membership/access")
    public ResponseEntity<?> getMembershipAccess(
            @PathVariable String artistId,
            HttpServletRequest request) {

        try {
            User member = getCurrentUser(
                    request);

            if (member == null) {
                return unauthorized();
            }

            Map<String, Object> data = artistMembershipSubscriptionService
                    .getMembershipAccess(
                            member.getId(),
                            artistId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch membership access successfully",
                            data));

        } catch (SecurityException e) {

            return ResponseEntity
                    .status(403)
                    .body(
                            new ApiResponse<>(
                                    403,
                                    e.getMessage(),
                                    null));

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

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to fetch membership access",
                                    null));
        }
    }

    /*
     * =========================
     * CANCEL MEMBERSHIP
     * =========================
     */
    @PatchMapping("/memberships/{subscriptionId}/cancel")
    public ResponseEntity<?> cancelMembership(
            @PathVariable String subscriptionId,
            HttpServletRequest request) {

        try {
            User member = getCurrentUser(
                    request);

            if (member == null) {
                return unauthorized();
            }

            Map<String, Object> data = artistMembershipSubscriptionService
                    .cancelAtPeriodEnd(
                            member.getId(),
                            subscriptionId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Membership will end at the current period end",
                            data));

        } catch (NoSuchElementException e) {

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
                                    "Unable to cancel membership",
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

            if (token.isBlank()) {
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

    private ResponseEntity<ApiResponse<Object>> unauthorized() {

        return ResponseEntity
                .status(401)
                .body(
                        new ApiResponse<>(
                                401,
                                "Unauthorized",
                                null));
    }
}