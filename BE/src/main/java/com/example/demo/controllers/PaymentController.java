package com.example.demo.controllers;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dtos.CreatePaymentDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.PaymentService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
                "/api/payments",
                "/api/v1/payments"
})
public class PaymentController {

        private final PaymentService paymentService;

        private final UserRepository userRepository;

        public PaymentController(
                        PaymentService paymentService,
                        UserRepository userRepository) {

                this.paymentService = paymentService;

                this.userRepository = userRepository;
        }

        /*
         * =========================
         * CREATE VNPAY PAYMENT
         * =========================
         */
        @PostMapping({
                        "/vnpay/create",
                        "/create"
        })
        public ResponseEntity<?> createPayment(
                        @RequestBody CreatePaymentDTO dto,
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = paymentService.createPayment(
                                        user.getId(),
                                        dto,
                                        request);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "VNPAY payment created successfully",
                                                        data));

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
                                        .status(503)
                                        .body(
                                                        new ApiResponse<>(
                                                                        503,
                                                                        e.getMessage(),
                                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to create VNPAY payment",
                                                                        null));
                }
        }

        /*
         * =========================
         * VNPAY IPN CALLBACK
         * =========================
         */
        @GetMapping("/vnpay/ipn")
        public ResponseEntity<Map<String, String>> processIpn(
                        HttpServletRequest request) {

                try {
                        Map<String, String> parameters = getRequestParameters(
                                        request);

                        Map<String, String> result = paymentService.processIpn(
                                        parameters);

                        return ResponseEntity.ok(
                                        result);

                } catch (Exception e) {

                        e.printStackTrace();

                        Map<String, String> error = new LinkedHashMap<>();

                        error.put(
                                        "RspCode",
                                        "99");

                        error.put(
                                        "Message",
                                        "Unknown error");

                        return ResponseEntity.ok(
                                        error);
                }
        }

        /*
         * =========================
         * VNPAY RETURN URL
         * =========================
         */
        @GetMapping("/vnpay/return")
        public ResponseEntity<?> handleReturn(
                        HttpServletRequest request) {

                try {
                        Map<String, String> parameters = getRequestParameters(
                                        request);

                        Map<String, Object> data = paymentService.handleReturn(
                                        parameters);

                        boolean signatureValid = Boolean.TRUE.equals(
                                        data.get(
                                                        "signatureValid"));

                        boolean orderFound = Boolean.TRUE.equals(
                                        data.get(
                                                        "orderFound"));

                        boolean amountValid = Boolean.TRUE.equals(
                                        data.get(
                                                        "amountValid"));

                        if (!signatureValid
                                        || !orderFound
                                        || !amountValid) {

                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                new ApiResponse<>(
                                                                                400,
                                                                                "Invalid VNPAY return data",
                                                                                data));
                        }

                        /*
                         * Lưu ý:
                         * paymentConfirmed chỉ true sau khi IPN
                         * đã xác nhận giao dịch thành công.
                         */
                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "VNPAY payment result received",
                                                        data));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        "Unable to process VNPAY return",
                                                                        null));
                }
        }

        /*
         * =========================
         * GET MY PAYMENT HISTORY
         * =========================
         */
        @GetMapping({
                        "/me",
                        "/history"
        })
        public ResponseEntity<?> getMyPayments(
                        @RequestParam(defaultValue = "1") int current,

                        @RequestParam(defaultValue = "10") int pageSize,

                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = paymentService
                                        .getUserPayments(
                                                        user.getId(),
                                                        current,
                                                        pageSize);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch payment history successfully",
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
                                                                        "Unable to fetch payment history",
                                                                        null));
                }
        }
        ///

        /*
         * =========================
         * GET PAYMENT STATUS
         * =========================
         */
        @GetMapping("/{orderCode}")
        public ResponseEntity<?> getPaymentStatus(
                        @PathVariable String orderCode,
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        Map<String, Object> data = paymentService.getUserPayment(
                                        user.getId(),
                                        orderCode);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch payment status successfully",
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
                                                                        "Unable to fetch payment status",
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

        /*
         * =========================
         * REQUEST PARAMETERS
         * =========================
         */
        private Map<String, String> getRequestParameters(
                        HttpServletRequest request) {

                Map<String, String> result = new LinkedHashMap<>();

                request.getParameterMap()
                                .forEach(
                                                (key, values) -> {

                                                        if (key == null
                                                                        || values == null
                                                                        || values.length == 0) {

                                                                return;
                                                        }

                                                        result.put(
                                                                        key,
                                                                        values[0]);
                                                });

                return result;
        }
}