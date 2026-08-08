package com.example.demo.controllers.admin;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.RejectArtistEventDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistEventService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api/admin/ticket-events",
        "/api/v1/admin/ticket-events"
})
public class AdminArtistEventController {

    private final ArtistEventService artistEventService;

    private final UserRepository userRepository;

    public AdminArtistEventController(
            ArtistEventService artistEventService,
            UserRepository userRepository) {

        this.artistEventService = artistEventService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * GET TICKET EVENTS
     * =========================
     */
    @GetMapping
    public ResponseEntity<?> getEvents(
            @RequestParam(required = false, defaultValue = "") String approvalStatus,

            @RequestParam(defaultValue = "1") int current,

            @RequestParam(defaultValue = "10") int pageSize,

            HttpServletRequest request) {

        try {

            User admin = getCurrentAdmin(
                    request);

            if (admin == null) {

                return forbidden();
            }

            Map<String, Object> data = artistEventService
                    .getAdminEvents(
                            approvalStatus,
                            current,
                            pageSize);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Ticket events retrieved successfully",
                            data));

        } catch (IllegalArgumentException e) {

            return badRequest(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to retrieve ticket events");
        }
    }

    /*
     * =========================
     * APPROVE TICKET EVENT
     * =========================
     */
    @PatchMapping("/{eventId}/approve")
    public ResponseEntity<?> approveEvent(
            @PathVariable String eventId,

            HttpServletRequest request) {

        try {

            User admin = getCurrentAdmin(
                    request);

            if (admin == null) {

                return forbidden();
            }

            Map<String, Object> data = artistEventService
                    .approveEvent(
                            admin.getId(),
                            eventId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Ticket event approved successfully",
                            data));

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
                    "Unable to approve ticket event");
        }
    }

    /*
     * =========================
     * REJECT TICKET EVENT
     * =========================
     */
    @PatchMapping("/{eventId}/reject")
    public ResponseEntity<?> rejectEvent(
            @PathVariable String eventId,

            @RequestBody(required = false) RejectArtistEventDTO dto,

            HttpServletRequest request) {

        try {

            User admin = getCurrentAdmin(
                    request);

            if (admin == null) {

                return forbidden();
            }

            String reason = dto == null
                    ? null
                    : dto.getReason();

            Map<String, Object> data = artistEventService
                    .rejectEvent(
                            admin.getId(),
                            eventId,
                            reason);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Ticket event rejected successfully",
                            data));

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
                    "Unable to reject ticket event");
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

            User admin = userRepository
                    .findByEmail(
                            email);

            if (admin == null
                    || admin.getRole() == null
                    || !"ADMIN"
                            .equalsIgnoreCase(
                                    admin.getRole())
                    || !"ACTIVE"
                            .equalsIgnoreCase(
                                    admin.getAccountStatus())) {

                return null;
            }

            return admin;

        } catch (Exception e) {

            return null;
        }
    }

    /*
     * =========================
     * RESPONSE HELPERS
     * =========================
     */
    private ResponseEntity<?> forbidden() {

        return ResponseEntity
                .status(403)
                .body(
                        new ApiResponse<>(
                                403,
                                "Administrator permission is required",
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
}