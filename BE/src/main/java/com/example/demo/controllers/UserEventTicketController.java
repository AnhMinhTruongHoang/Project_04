package com.example.demo.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.CheckInTicketDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.UserEventTicketService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api/tickets",
        "/api/v1/tickets"
})
public class UserEventTicketController {

    private final UserEventTicketService userEventTicketService;

    private final UserRepository userRepository;

    public UserEventTicketController(
            UserEventTicketService userEventTicketService,
            UserRepository userRepository) {

        this.userEventTicketService = userEventTicketService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * MY TICKET COLLECTION
     * =========================
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyTickets(
            @RequestParam(defaultValue = "1") int current,

            @RequestParam(defaultValue = "10") int pageSize,

            HttpServletRequest request) {

        try {

            User user = requireCurrentUser(
                    request);

            Map<String, Object> data = userEventTicketService
                    .getMyTickets(
                            user.getId(),
                            current,
                            pageSize);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Ticket collection retrieved successfully",
                            data));

        } catch (UnauthorizedException e) {

            return unauthorized();

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to retrieve ticket collection");
        }
    }

    /*
     * =========================
     * MY TICKET DETAIL
     * =========================
     */
    @GetMapping("/{ticketId}")
    public ResponseEntity<?> getMyTicket(
            @PathVariable String ticketId,

            HttpServletRequest request) {

        try {

            User user = requireCurrentUser(
                    request);

            Map<String, Object> data = userEventTicketService
                    .getMyTicket(
                            user.getId(),
                            ticketId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Ticket retrieved successfully",
                            data));

        } catch (UnauthorizedException e) {

            return unauthorized();

        } catch (IllegalArgumentException e) {

            return notFound(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to retrieve ticket");
        }
    }

    /*
     * =========================
     * MY TICKET QR
     * =========================
     */
    @GetMapping("/{ticketId}/qr")
    public ResponseEntity<?> getMyTicketQr(
            @PathVariable String ticketId,

            HttpServletRequest request) {

        try {

            User user = requireCurrentUser(
                    request);

            Map<String, Object> data = userEventTicketService
                    .getMyTicketQr(
                            user.getId(),
                            ticketId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Ticket QR retrieved successfully",
                            data));

        } catch (UnauthorizedException e) {

            return unauthorized();

        } catch (IllegalArgumentException e) {

            return notFound(
                    e.getMessage());

        } catch (IllegalStateException e) {

            return conflict(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to retrieve ticket QR");
        }
    }

    /*
     * =========================
     * ARTIST / ADMIN CHECK-IN
     * =========================
     */
    @PostMapping("/check-in")
    public ResponseEntity<?> checkInTicket(
            @RequestBody CheckInTicketDTO dto,

            HttpServletRequest request) {

        try {

            User operator = requireCurrentUser(
                    request);

            String qrToken = dto == null
                    ? null
                    : dto.getQrToken();

            Map<String, Object> data = userEventTicketService
                    .checkInTicket(
                            operator,
                            qrToken);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Ticket checked in successfully",
                            data));

        } catch (UnauthorizedException e) {

            return unauthorized();

        } catch (SecurityException e) {

            return forbidden(
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
                    "Unable to check in ticket");
        }
    }

    /*
     * =========================
     * AUTH
     * =========================
     */
    private User requireCurrentUser(
            HttpServletRequest request) {

        try {

            String authorization = request.getHeader(
                    "Authorization");

            if (authorization == null
                    || !authorization
                            .startsWith(
                                    "Bearer ")) {

                throw new UnauthorizedException();
            }

            String token = authorization
                    .substring(7)
                    .trim();

            if (token.isBlank()) {

                throw new UnauthorizedException();
            }

            Claims claims = JwtHelper.verifyToken(
                    token);

            String email = claims.getSubject();

            if (email == null
                    || email.isBlank()) {

                throw new UnauthorizedException();
            }

            User user = userRepository
                    .findByEmail(
                            email);

            if (user == null) {

                throw new UnauthorizedException();
            }

            return user;

        } catch (UnauthorizedException e) {

            throw e;

        } catch (Exception e) {

            throw new UnauthorizedException();
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