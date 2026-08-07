package com.example.demo.controllers;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.demo.dtos.CreatePaymentDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.MembershipPaymentService;
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

        private final MembershipPaymentService membershipPaymentService;

        @Value("${app.frontend-url}")

        private String frontendUrl;

        public PaymentController(
                        PaymentService paymentService,
                        UserRepository userRepository,
                        MembershipPaymentService membershipPaymentService) {

                this.paymentService = paymentService;

                this.userRepository = userRepository;

                this.membershipPaymentService = membershipPaymentService;
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
         * VNPAY IPN CALLBACK ROUTER
         * =========================
         */
        @GetMapping("/vnpay/ipn")
        public ResponseEntity<Map<String, String>> processIpn(
                        HttpServletRequest request) {

                try {
                        Map<String, String> parameters = getRequestParameters(
                                        request);

                        String orderCode = parameters.getOrDefault(
                                        "vnp_TxnRef",
                                        "");

                        /*
                         * Phải kiểm tra SCM trước SC vì
                         * SCM cũng bắt đầu bằng hai ký tự SC.
                         */
                        Map<String, String> result = orderCode.startsWith("SCM")
                                        ? membershipPaymentService
                                                        .processIpn(
                                                                        parameters)
                                        : paymentService
                                                        .processIpn(
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
         * VNPAY RETURN URL ROUTER
         * =========================
         */
        @GetMapping("/vnpay/return")
        public ResponseEntity<Void> handleReturn(
                        HttpServletRequest request) {

                Map<String, String> parameters = getRequestParameters(
                                request);

                String orderCode = parameters.getOrDefault(
                                "vnp_TxnRef",
                                "");

                String responseCode = parameters.getOrDefault(
                                "vnp_ResponseCode",
                                "");

                String transactionStatus = parameters.getOrDefault(
                                "vnp_TransactionStatus",
                                "");

                try {
                        Map<String, Object> data = orderCode.startsWith("SCM")
                                        ? membershipPaymentService
                                                        .handleReturn(
                                                                        parameters)
                                        : paymentService
                                                        .handleReturn(
                                                                        parameters);

                        URI redirectUri = buildPaymentResultRedirect(
                                        data);

                        return ResponseEntity
                                        .status(302)
                                        .location(
                                                        redirectUri)
                                        .build();

                } catch (Exception e) {

                        e.printStackTrace();

                        URI redirectUri = UriComponentsBuilder
                                        .fromUriString(
                                                        normalizeFrontendUrl())
                                        .path(
                                                        "/payment/result")
                                        .queryParam(
                                                        "orderCode",
                                                        orderCode)
                                        .queryParam(
                                                        "status",
                                                        "ERROR")
                                        .queryParam(
                                                        "responseCode",
                                                        responseCode)
                                        .queryParam(
                                                        "transactionStatus",
                                                        transactionStatus)
                                        .build()
                                        .encode()
                                        .toUri();

                        return ResponseEntity
                                        .status(302)
                                        .location(
                                                        redirectUri)
                                        .build();
                }
        }
        ///

        private URI buildPaymentResultRedirect(
                        Map<String, Object> data) {

                boolean signatureValid = Boolean.TRUE.equals(
                                data.get("signatureValid"));

                boolean merchantValid = Boolean.TRUE.equals(
                                data.get("merchantValid"));

                boolean orderFound = Boolean.TRUE.equals(
                                data.get("orderFound"));

                boolean amountValid = Boolean.TRUE.equals(
                                data.get("amountValid"));

                boolean paymentConfirmed = Boolean.TRUE.equals(
                                data.get("paymentConfirmed"));

                String status;

                if (!signatureValid
                                || !merchantValid
                                || !orderFound
                                || !amountValid) {

                        status = "INVALID";

                } else {

                        status = getStringValue(
                                        data,
                                        "status",
                                        "PENDING");
                }

                return UriComponentsBuilder
                                .fromUriString(normalizeFrontendUrl())
                                .path("/payment/result")
                                .queryParam(
                                                "orderCode",
                                                getStringValue(
                                                                data,
                                                                "orderCode",
                                                                ""))
                                .queryParam(
                                                "status",
                                                status)
                                .queryParam(
                                                "signatureValid",
                                                signatureValid)
                                .queryParam(
                                                "merchantValid",
                                                merchantValid)
                                .queryParam(
                                                "paymentConfirmed",
                                                paymentConfirmed)
                                .queryParam(
                                                "responseCode",
                                                getStringValue(
                                                                data,
                                                                "responseCode",
                                                                ""))
                                .queryParam(
                                                "transactionStatus",
                                                getStringValue(
                                                                data,
                                                                "transactionStatus",
                                                                ""))

                                .queryParam(
                                                "paymentType",
                                                getStringValue(
                                                                data,
                                                                "paymentType",
                                                                "SUBSCRIPTION"))
                                .build()
                                .encode()
                                .toUri();
        }

        private String normalizeFrontendUrl() {

                if (frontendUrl == null
                                || frontendUrl.isBlank()) {

                        return "http://localhost:3000";
                }

                return frontendUrl
                                .trim()
                                .replaceAll(
                                                "/+$",
                                                "");
        }

        private String getStringValue(
                        Map<String, Object> data,
                        String key,
                        String defaultValue) {

                Object value = data.get(
                                key);

                if (value == null) {
                        return defaultValue;
                }

                String text = String.valueOf(
                                value);

                return text.isBlank()
                                ? defaultValue
                                : text;
        }
        ////

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

                        /*
                         * =========================
                         * ROUTE PAYMENT STATUS
                         * =========================
                         */
                        Map<String, Object> data = orderCode.startsWith("SCM")
                                        ? membershipPaymentService
                                                        .getMemberPayment(
                                                                        user.getId(),
                                                                        orderCode)
                                        : paymentService
                                                        .getUserPayment(
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