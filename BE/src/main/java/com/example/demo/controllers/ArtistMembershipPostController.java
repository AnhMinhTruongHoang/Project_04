package com.example.demo.controllers;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.PathVariable;

import com.example.demo.dtos.CreateArtistMembershipPostDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistMembershipPostService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import com.example.demo.dtos.UpdateArtistMembershipPostDTO;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
                "/api",
                "/api/v1"
})
public class ArtistMembershipPostController {

        private final ArtistMembershipPostService artistMembershipPostService;

        private final UserRepository userRepository;

        public ArtistMembershipPostController(
                        ArtistMembershipPostService artistMembershipPostService,

                        UserRepository userRepository) {

                this.artistMembershipPostService = artistMembershipPostService;

                this.userRepository = userRepository;
        }

        /*
         * =========================
         * CREATE TEXT / TRACK POST
         * =========================
         */
        @PostMapping("/artist/membership-posts")
        public ResponseEntity<?> createPost(
                        @RequestBody CreateArtistMembershipPostDTO dto,

                        HttpServletRequest request) {

                try {
                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .createPost(
                                                        artist.getId(),
                                                        dto);

                        return ResponseEntity
                                        .status(201)
                                        .body(
                                                        new ApiResponse<>(
                                                                        201,
                                                                        "Membership post created successfully",
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
                                        "Unable to create membership post");
                }
        }

        /*
         * =========================
         * CREATE IMAGE POST
         * =========================
         */
        @PostMapping(value = "/artist/membership-posts/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<?> createImagePost(
                        @ModelAttribute CreateArtistMembershipPostDTO dto,

                        @RequestParam("image") MultipartFile image,

                        HttpServletRequest request) {

                try {
                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .createImagePost(
                                                        artist.getId(),
                                                        dto,
                                                        image);

                        return ResponseEntity
                                        .status(201)
                                        .body(
                                                        new ApiResponse<>(
                                                                        201,
                                                                        "Membership image post created successfully",
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
                                        "Unable to create membership image post");
                }
        }

        /*
         * =========================
         * PUBLIC ARTIST FEED
         * =========================
         */
        @GetMapping("/artists/{artistId}/membership-posts")
        public ResponseEntity<?> getArtistFeed(
                        @PathVariable String artistId,

                        @RequestParam(defaultValue = "1") int current,

                        @RequestParam(defaultValue = "10") int pageSize,

                        HttpServletRequest request) {

                try {
                        User viewer = getCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .getArtistFeed(
                                                        artistId,
                                                        viewer == null
                                                                        ? null
                                                                        : viewer.getId(),
                                                        current,
                                                        pageSize);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch membership posts successfully",
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
                                        "Unable to fetch membership posts");
                }
        }

        /*
         * =========================
         * ARTIST MANAGE POSTS
         * =========================
         */
        @GetMapping("/artist/membership-posts")
        public ResponseEntity<?> getMyPosts(
                        @RequestParam(defaultValue = "1") int current,

                        @RequestParam(defaultValue = "10") int pageSize,

                        HttpServletRequest request) {

                try {
                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .getMyPosts(
                                                        artist.getId(),
                                                        current,
                                                        pageSize);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch your membership posts successfully",
                                                        data));

                } catch (UnauthorizedException e) {

                        return unauthorized();

                } catch (SecurityException e) {

                        return forbidden(
                                        e.getMessage());

                } catch (IllegalArgumentException e) {

                        return badRequest(
                                        e.getMessage());

                } catch (Exception e) {

                        e.printStackTrace();

                        return serverError(
                                        "Unable to fetch membership posts");
                }
        }

        /*
         * =========================
         * UPDATE POST
         * =========================
         */
        @PatchMapping("/artist/membership-posts/{postId}")
        public ResponseEntity<?> updatePost(
                        @PathVariable String postId,

                        @RequestBody UpdateArtistMembershipPostDTO dto,

                        HttpServletRequest request) {

                try {
                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .updatePost(
                                                        artist.getId(),
                                                        postId,
                                                        dto);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Membership post updated successfully",
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
                                        "Unable to update membership post");
                }
        }

        /*
         * =========================
         * REPLACE POST IMAGE
         * =========================
         */
        @PatchMapping(value = "/artist/membership-posts/{postId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<?> replacePostImage(
                        @PathVariable String postId,

                        @RequestParam("image") MultipartFile image,

                        HttpServletRequest request) {

                try {
                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .replacePostImage(
                                                        artist.getId(),
                                                        postId,
                                                        image);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Membership post image replaced successfully",
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
                                        "Unable to replace membership post image");
                }
        }

        /*
         * =========================
         * PUBLISH POST
         * =========================
         */
        @PatchMapping("/artist/membership-posts/{postId}/publish")
        public ResponseEntity<?> publishPost(
                        @PathVariable String postId,
                        HttpServletRequest request) {

                try {
                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .publishPost(
                                                        artist.getId(),
                                                        postId);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Membership post published successfully",
                                                        data));

                } catch (UnauthorizedException e) {

                        return unauthorized();

                } catch (SecurityException e) {

                        return forbidden(
                                        e.getMessage());

                } catch (NoSuchElementException e) {

                        return notFound(
                                        e.getMessage());

                } catch (Exception e) {

                        e.printStackTrace();

                        return serverError(
                                        "Unable to publish membership post");
                }
        }

        /*
         * =========================
         * ARCHIVE POST
         * =========================
         */
        @PatchMapping("/artist/membership-posts/{postId}/archive")
        public ResponseEntity<?> archivePost(
                        @PathVariable String postId,
                        HttpServletRequest request) {

                try {
                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .archivePost(
                                                        artist.getId(),
                                                        postId);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Membership post archived successfully",
                                                        data));

                } catch (UnauthorizedException e) {

                        return unauthorized();

                } catch (SecurityException e) {

                        return forbidden(
                                        e.getMessage());

                } catch (NoSuchElementException e) {

                        return notFound(
                                        e.getMessage());

                } catch (Exception e) {

                        e.printStackTrace();

                        return serverError(
                                        "Unable to archive membership post");
                }
        }

        /*
         * =========================
         * DELETE POST
         * =========================
         */
        @DeleteMapping("/artist/membership-posts/{postId}")
        public ResponseEntity<?> deletePost(
                        @PathVariable String postId,
                        HttpServletRequest request) {

                try {
                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistMembershipPostService
                                        .deletePost(
                                                        artist.getId(),
                                                        postId);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Membership post deleted successfully",
                                                        data));

                } catch (UnauthorizedException e) {

                        return unauthorized();

                } catch (SecurityException e) {

                        return forbidden(
                                        e.getMessage());

                } catch (NoSuchElementException e) {

                        return notFound(
                                        e.getMessage());

                } catch (Exception e) {

                        e.printStackTrace();

                        return serverError(
                                        "Unable to delete membership post");
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
                                        || !authorization
                                                        .startsWith(
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