package com.example.demo.controllers;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dtos.CreateArtistEventDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistEventService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
                "/api",
                "/api/v1"
})
public class ArtistEventController {

        private final ArtistEventService artistEventService;

        private final UserRepository userRepository;

        public ArtistEventController(
                        ArtistEventService artistEventService,
                        UserRepository userRepository) {

                this.artistEventService = artistEventService;

                this.userRepository = userRepository;
        }

        /*
         * =========================
         * CREATE EVENT REQUEST
         * =========================
         */
        @PostMapping(value = "/artist/events", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<?> createEvent(
                        @ModelAttribute CreateArtistEventDTO dto,

                        @RequestParam("ticketImage") MultipartFile ticketImage,

                        HttpServletRequest request) {

                try {

                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistEventService
                                        .createEvent(
                                                        artist.getId(),
                                                        dto,
                                                        ticketImage);

                        return ResponseEntity
                                        .status(201)
                                        .body(
                                                        new ApiResponse<>(
                                                                        201,
                                                                        "Ticket event submitted for review successfully",
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
                                        "Unable to create ticket event");
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

        /*
         * =========================
         * GET MY EVENTS
         * =========================
         */
        @GetMapping("/artist/events")
        public ResponseEntity<?> getMyEvents(
                        @RequestParam(defaultValue = "1") int current,

                        @RequestParam(defaultValue = "10") int pageSize,

                        HttpServletRequest request) {

                try {

                        User artist = requireCurrentUser(
                                        request);

                        Map<String, Object> data = artistEventService
                                        .getMyEvents(
                                                        artist.getId(),
                                                        current,
                                                        pageSize);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Artist ticket events retrieved successfully",
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
                                        "Unable to retrieve artist ticket events");
                }
        }

        /*
         * =========================
         * PUBLIC ARTIST EVENTS
         * =========================
         */
        @GetMapping("/artists/{artistId}/events")
        public ResponseEntity<?> getPublicArtistEvents(
                        @PathVariable String artistId,

                        @RequestParam(defaultValue = "1") int current,

                        @RequestParam(defaultValue = "10") int pageSize) {

                try {

                        Map<String, Object> data = artistEventService
                                        .getPublicArtistEvents(
                                                        artistId,
                                                        current,
                                                        pageSize);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Artist events retrieved successfully",
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
                                        "Unable to retrieve artist events");
                }
        }

        /*
         * =========================
         * PUBLIC EVENT DETAIL
         * =========================
         */
        @GetMapping("/events/{eventId}")
        public ResponseEntity<?> getPublicEvent(
                        @PathVariable String eventId) {

                try {

                        Map<String, Object> data = artistEventService
                                        .getPublicEvent(
                                                        eventId);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Ticket event retrieved successfully",
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
                                        "Unable to retrieve ticket event");
                }
        }
}