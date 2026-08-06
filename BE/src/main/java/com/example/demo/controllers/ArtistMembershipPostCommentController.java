package com.example.demo.controllers;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.CreateArtistMembershipPostCommentDTO;
import com.example.demo.dtos.UpdateArtistMembershipPostCommentDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistMembershipPostCommentService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api",
        "/api/v1"
})
public class ArtistMembershipPostCommentController {

    private final ArtistMembershipPostCommentService artistMembershipPostCommentService;

    private final UserRepository userRepository;

    public ArtistMembershipPostCommentController(
            ArtistMembershipPostCommentService artistMembershipPostCommentService,

            UserRepository userRepository) {

        this.artistMembershipPostCommentService = artistMembershipPostCommentService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * GET COMMENTS
     * =========================
     */
    @GetMapping("/membership-posts/{postId}/comments")
    public ResponseEntity<?> getComments(
            @PathVariable String postId,

            @RequestParam(defaultValue = "1") int current,

            @RequestParam(defaultValue = "10") int pageSize,

            HttpServletRequest request) {

        try {
            User viewer = getCurrentUser(
                    request);

            Map<String, Object> data = artistMembershipPostCommentService
                    .getComments(
                            postId,
                            viewer == null
                                    ? null
                                    : viewer.getId(),
                            current,
                            pageSize);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch membership post comments successfully",
                            data));

        } catch (SecurityException e) {

            return forbidden(
                    e.getMessage());

        } catch (NoSuchElementException e) {

            return notFound(
                    e.getMessage());

        } catch (IllegalArgumentException e) {

            return badRequest(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to fetch membership post comments");
        }
    }

    /*
     * =========================
     * GET REPLIES
     * =========================
     */
    @GetMapping("/membership-posts/{postId}/comments/{commentId}/replies")
    public ResponseEntity<?> getReplies(
            @PathVariable String postId,

            @PathVariable String commentId,

            HttpServletRequest request) {

        try {
            User viewer = getCurrentUser(
                    request);

            List<Map<String, Object>> data = artistMembershipPostCommentService
                    .getReplies(
                            postId,
                            commentId,
                            viewer == null
                                    ? null
                                    : viewer.getId());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch comment replies successfully",
                            data));

        } catch (SecurityException e) {

            return forbidden(
                    e.getMessage());

        } catch (NoSuchElementException e) {

            return notFound(
                    e.getMessage());

        } catch (IllegalArgumentException e) {

            return badRequest(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to fetch comment replies");
        }
    }

    /*
     * =========================
     * CREATE COMMENT OR REPLY
     * =========================
     */
    @PostMapping("/membership-posts/{postId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable String postId,

            @RequestBody CreateArtistMembershipPostCommentDTO dto,

            HttpServletRequest request) {

        try {
            User user = requireCurrentUser(
                    request);

            Map<String, Object> data = artistMembershipPostCommentService
                    .createComment(
                            user.getId(),
                            postId,
                            dto);

            return ResponseEntity
                    .status(201)
                    .body(
                            new ApiResponse<>(
                                    201,
                                    "Comment created successfully",
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
                    "Unable to create comment");
        }
    }

    /*
     * =========================
     * UPDATE COMMENT
     * =========================
     */
    @PatchMapping("/membership-posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable String postId,

            @PathVariable String commentId,

            @RequestBody UpdateArtistMembershipPostCommentDTO dto,

            HttpServletRequest request) {

        try {
            User user = requireCurrentUser(
                    request);

            Map<String, Object> data = artistMembershipPostCommentService
                    .updateComment(
                            user.getId(),
                            postId,
                            commentId,
                            dto);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Comment updated successfully",
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
                    "Unable to update comment");
        }
    }

    /*
     * =========================
     * DELETE COMMENT
     * =========================
     */
    @DeleteMapping("/membership-posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable String postId,

            @PathVariable String commentId,

            HttpServletRequest request) {

        try {
            User user = requireCurrentUser(
                    request);

            Map<String, Object> data = artistMembershipPostCommentService
                    .deleteComment(
                            user.getId(),
                            postId,
                            commentId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Comment deleted successfully",
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

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to delete comment");
        }
    }

    /*
     * =========================
     * AUTH HELPERS
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
     * RESPONSE HELPERS
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