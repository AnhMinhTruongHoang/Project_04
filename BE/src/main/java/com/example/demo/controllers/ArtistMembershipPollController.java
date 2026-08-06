package com.example.demo.controllers;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.CreateArtistMembershipPollDTO;
import com.example.demo.dtos.VoteArtistMembershipPollDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistMembershipPollService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api",
        "/api/v1"
})
public class ArtistMembershipPollController {

    private final ArtistMembershipPollService artistMembershipPollService;

    private final UserRepository userRepository;

    public ArtistMembershipPollController(
            ArtistMembershipPollService artistMembershipPollService,

            UserRepository userRepository) {

        this.artistMembershipPollService = artistMembershipPollService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * CREATE POLL
     * =========================
     */
    @PostMapping("/artist/membership-posts/poll")
    public ResponseEntity<?> createPoll(
            @RequestBody CreateArtistMembershipPollDTO dto,

            HttpServletRequest request) {

        try {
            User artist = requireCurrentUser(
                    request);

            Map<String, Object> data = artistMembershipPollService
                    .createPoll(
                            artist.getId(),
                            dto);

            return ResponseEntity
                    .status(201)
                    .body(
                            new ApiResponse<>(
                                    201,
                                    "Membership poll created successfully",
                                    data));

        } catch (UnauthorizedException e) {

            return unauthorized();

        } catch (SecurityException e) {

            return forbidden(
                    e.getMessage());

        } catch (NoSuchElementException e) {

            return notFound(
                    e.getMessage());

        } catch (IllegalArgumentException e) {

            return badRequest(
                    e.getMessage());

        } catch (IllegalStateException e) {

            return conflict(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to create membership poll");
        }
    }

    /*
     * =========================
     * GET POLL
     * =========================
     */
    @GetMapping("/membership-posts/{postId}/poll")
    public ResponseEntity<?> getPoll(
            @PathVariable String postId,

            HttpServletRequest request) {

        try {
            User viewer = getCurrentUser(
                    request);

            Map<String, Object> data = artistMembershipPollService
                    .getPoll(
                            postId,
                            viewer == null
                                    ? null
                                    : viewer.getId());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch membership poll successfully",
                            data));

        } catch (NoSuchElementException e) {

            return notFound(
                    e.getMessage());

        } catch (IllegalArgumentException e) {

            return badRequest(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to fetch membership poll");
        }
    }

    /*
     * =========================
     * VOTE OR CHANGE VOTE
     * =========================
     */
    @PostMapping("/membership-posts/{postId}/poll/vote")
    public ResponseEntity<?> vote(
            @PathVariable String postId,

            @RequestBody VoteArtistMembershipPollDTO dto,

            HttpServletRequest request) {

        try {
            User member = requireCurrentUser(
                    request);

            Map<String, Object> data = artistMembershipPollService
                    .vote(
                            member.getId(),
                            postId,
                            dto);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Poll vote saved successfully",
                            data));

        } catch (UnauthorizedException e) {

            return unauthorized();

        } catch (SecurityException e) {

            return forbidden(
                    e.getMessage());

        } catch (NoSuchElementException e) {

            return notFound(
                    e.getMessage());

        } catch (IllegalArgumentException e) {

            return badRequest(
                    e.getMessage());

        } catch (IllegalStateException e) {

            return conflict(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to save poll vote");
        }
    }

    /*
     * =========================
     * AUTH
     * =========================
     */
    private User requireCurrentUser(
            HttpServletRequest request) {

        User user = getCurrentUser(
                request);

        if (user == null) {
            throw new UnauthorizedException();
        }

        return user;
    }

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

            return userRepository
                    .findByEmail(
                            email);

        } catch (Exception e) {
            return null;
        }
    }

    /*
     * =========================
     * RESPONSES
     * =========================
     */
    private ResponseEntity<?> unauthorized() {

        return ResponseEntity
                .status(401)
                .body(
                        new ApiResponse<>(
                                401,
                                "Unauthorized",
                                null));
    }

    private ResponseEntity<?> forbidden(
            String message) {

        return ResponseEntity
                .status(403)
                .body(
                        new ApiResponse<>(
                                403,
                                message,
                                null));
    }

    private ResponseEntity<?> notFound(
            String message) {

        return ResponseEntity
                .status(404)
                .body(
                        new ApiResponse<>(
                                404,
                                message,
                                null));
    }

    private ResponseEntity<?> badRequest(
            String message) {

        return ResponseEntity
                .badRequest()
                .body(
                        new ApiResponse<>(
                                400,
                                message,
                                null));
    }

    private ResponseEntity<?> conflict(
            String message) {

        return ResponseEntity
                .status(409)
                .body(
                        new ApiResponse<>(
                                409,
                                message,
                                null));
    }

    private ResponseEntity<?> serverError(
            String message) {

        return ResponseEntity
                .internalServerError()
                .body(
                        new ApiResponse<>(
                                500,
                                message,
                                null));
    }

    private static class UnauthorizedException
            extends RuntimeException {
    }
}