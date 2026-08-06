package com.example.demo.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.CreateMembershipPaymentDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.MembershipPaymentService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api/membership-payments",
        "/api/v1/membership-payments"
})
public class MembershipPaymentController {

    private final MembershipPaymentService membershipPaymentService;

    private final UserRepository userRepository;

    public MembershipPaymentController(
            MembershipPaymentService membershipPaymentService,

            UserRepository userRepository) {

        this.membershipPaymentService = membershipPaymentService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * CREATE MEMBERSHIP PAYMENT
     * =========================
     */
    @PostMapping({
            "/vnpay/create",
            "/create"
    })
    public ResponseEntity<?> createPayment(
            @RequestBody CreateMembershipPaymentDTO dto,

            HttpServletRequest request) {

        try {
            User member = getCurrentUser(
                    request);

            if (member == null) {
                return ResponseEntity
                        .status(401)
                        .body(
                                new ApiResponse<>(
                                        401,
                                        "Unauthorized",
                                        null));
            }

            Map<String, Object> data = membershipPaymentService
                    .createPayment(
                            member.getId(),
                            dto,
                            request);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Membership VNPAY payment created successfully",
                            data));

        } catch (SecurityException e) {

            return ResponseEntity
                    .status(403)
                    .body(
                            new ApiResponse<>(
                                    403,
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
                                    "Unable to create membership payment",
                                    null));
        }
    }

    /*
     * =========================
     * GET MEMBERSHIP PAYMENT
     * =========================
     */
    @GetMapping("/{orderCode}")
    public ResponseEntity<?> getPayment(
            @PathVariable String orderCode,

            HttpServletRequest request) {

        try {
            User member = getCurrentUser(
                    request);

            if (member == null) {
                return ResponseEntity
                        .status(401)
                        .body(
                                new ApiResponse<>(
                                        401,
                                        "Unauthorized",
                                        null));
            }

            Map<String, Object> data = membershipPaymentService
                    .getMemberPayment(
                            member.getId(),
                            orderCode);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch membership payment successfully",
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
                                    "Unable to fetch membership payment",
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
}