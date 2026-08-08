package com.example.demo.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.CreateTicketPaymentDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.TicketPaymentService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api/ticket-payments",
        "/api/v1/ticket-payments"
})
public class TicketPaymentController {

    private final TicketPaymentService ticketPaymentService;

    private final UserRepository userRepository;

    public TicketPaymentController(
            TicketPaymentService ticketPaymentService,
            UserRepository userRepository) {

        this.ticketPaymentService = ticketPaymentService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * CREATE VNPAY TICKET PAYMENT
     * =========================
     */
    @PostMapping("/vnpay/create")
    public ResponseEntity<?> createVNPayPayment(
            @RequestBody CreateTicketPaymentDTO dto,

            HttpServletRequest request) {

        try {

            User buyer = requireCurrentUser(
                    request);

            Map<String, Object> data = ticketPaymentService
                    .createPayment(
                            buyer.getId(),
                            dto,
                            request);

            return ResponseEntity
                    .status(201)
                    .body(
                            new ApiResponse<>(
                                    201,
                                    "Ticket payment created successfully",
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

        } catch (ArithmeticException e) {

            return conflict(
                    "Ticket payment amount is invalid");

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to create ticket payment");
        }
    }

    /*
     * =========================
     * GET BUYER TICKET PAYMENT
     * =========================
     */
    @GetMapping("/{orderCode}")
    public ResponseEntity<?> getPayment(
            @PathVariable String orderCode,

            HttpServletRequest request) {

        try {

            User buyer = requireCurrentUser(
                    request);

            Map<String, Object> data = ticketPaymentService
                    .getBuyerPayment(
                            buyer.getId(),
                            orderCode);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Ticket payment retrieved successfully",
                            data));

        } catch (UnauthorizedException e) {

            return unauthorized();

        } catch (IllegalArgumentException e) {

            return notFound(
                    e.getMessage());

        } catch (Exception e) {

            e.printStackTrace();

            return serverError(
                    "Unable to retrieve ticket payment");
        }
    }

    /*
     * =========================
     * CURRENT USER
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