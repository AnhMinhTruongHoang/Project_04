package com.example.demo.controllers;

import java.util.Map;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dtos.SubscribePlanDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.SubscriptionService;

@RestController
@RequestMapping({
                "/api/subscriptions",
                "/api/v1/subscriptions"
})
public class SubscriptionController {

        @Autowired
        private SubscriptionService subscriptionService;

        @Autowired
        private UserRepository userRepository;

        private String getBearerToken(
                        HttpServletRequest request) {

                String authorization = request.getHeader(
                                "Authorization");

                if (authorization == null
                                || !authorization.startsWith(
                                                "Bearer ")) {
                        return null;
                }

                return authorization.substring(7);
        }

        private User getCurrentUser(
                        HttpServletRequest request) {

                try {
                        String token = getBearerToken(request);

                        if (token == null) {
                                return null;
                        }

                        Claims claims = JwtHelper.verifyToken(token);

                        String email = claims.getSubject();

                        return userRepository.findByEmail(
                                        email);

                } catch (Exception e) {
                        return null;
                }
        }

        @GetMapping("/plans")
        public ResponseEntity<?> getPlans() {

                try {
                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch subscription plans",
                                                        subscriptionService.getPlans()));

                } catch (Exception e) {
                        e.printStackTrace();

                        return ResponseEntity
                                        .status(500)
                                        .body(new ApiResponse<>(
                                                        500,
                                                        e.getMessage(),
                                                        null));
                }
        }

        @GetMapping("/me")
        public ResponseEntity<?> getMySubscription(
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(new ApiResponse<>(
                                                                401,
                                                                "Unauthorized",
                                                                null));
                        }

                        Map<String, Object> data = subscriptionService
                                        .getMySubscription(
                                                        user.getId());

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch current subscription",
                                                        data));

                } catch (Exception e) {
                        e.printStackTrace();

                        return ResponseEntity
                                        .status(500)
                                        .body(new ApiResponse<>(
                                                        500,
                                                        e.getMessage(),
                                                        null));
                }
        }

        @GetMapping("/me/usage")
        public ResponseEntity<?> getMyUsage(
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(new ApiResponse<>(
                                                                401,
                                                                "Unauthorized",
                                                                null));
                        }

                        Map<String, Object> fullData = subscriptionService
                                        .getMySubscription(
                                                        user.getId());

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch subscription usage",
                                                        fullData.get("usage")));

                } catch (Exception e) {
                        e.printStackTrace();

                        return ResponseEntity
                                        .status(500)
                                        .body(new ApiResponse<>(
                                                        500,
                                                        e.getMessage(),
                                                        null));
                }
        }

        /*
         * =========================
         * SUBSCRIPTION CHANGE PLAN
         * =========================
         *
         * BASIC:
         * → assigned automatically
         *
         * ARTIST / ARTIST_PRO:
         * → must purchase through VNPay
         *
         * ARTIST_PRO_DEMO:
         * → activate directly
         * → no VNPay
         * → SubscriptionService controls 7-day duration
         */
        @PostMapping({
                        "/subscribe",
                        "/change-plan"
        })
        public ResponseEntity<?> subscribe(
                        @RequestBody(required = false) SubscribePlanDTO dto,
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        String planCode = dto == null
                                        || dto.getPlanCode() == null
                                                        ? ""
                                                        : dto.getPlanCode()
                                                                        .trim()
                                                                        .toUpperCase();

                        if (planCode.isBlank()) {
                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                new ApiResponse<>(
                                                                                400,
                                                                                "Subscription plan code is required.",
                                                                                null));
                        }

                        /*
                         * =========================
                         * BASIC PLAN
                         * =========================
                         *
                         * BASIC is assigned automatically after
                         * cancellation or subscription expiration.
                         */
                        if ("BASIC".equals(planCode)) {
                                return ResponseEntity
                                                .badRequest()
                                                .body(
                                                                new ApiResponse<>(
                                                                                400,
                                                                                "Basic plan is assigned automatically. Use /api/v1/subscriptions/cancel to cancel a paid subscription.",
                                                                                null));
                        }

                        /*
                         * =========================
                         * PAID PLANS
                         * =========================
                         *
                         * ARTIST and ARTIST_PRO must still use VNPay.
                         */
                        if ("ARTIST".equals(planCode)
                                        || "ARTIST_PRO".equals(planCode)) {

                                return ResponseEntity
                                                .status(409)
                                                .body(
                                                                new ApiResponse<>(
                                                                                409,
                                                                                "Paid subscription plans must be purchased through VNPAY.",
                                                                                Map.of(
                                                                                                "paymentEndpoint",
                                                                                                "/api/v1/payments/vnpay/create",
                                                                                                "requestedPlan",
                                                                                                planCode)));
                        }

                        /*
                         * =========================
                         * ARTIST PRO DEMO
                         * =========================
                         *
                         * Direct activation.
                         * No VNPay.
                         */
                        if ("ARTIST_PRO_DEMO".equals(planCode)) {

                                Map<String, Object> data = subscriptionService.subscribe(
                                                user.getId(),
                                                planCode);

                                return ResponseEntity.ok(
                                                new ApiResponse<>(
                                                                200,
                                                                "Artist Pro Demo activated successfully.",
                                                                data));
                        }

                        /*
                         * =========================
                         * UNKNOWN PLAN
                         * =========================
                         */
                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        "Subscription plan is invalid.",
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
                                                                        "Unable to change subscription plan.",
                                                                        null));
                }
        }
        ///

        @PostMapping("/cancel")
        public ResponseEntity<?> cancel(
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(new ApiResponse<>(
                                                                401,
                                                                "Unauthorized",
                                                                null));
                        }

                        Map<String, Object> data = subscriptionService
                                        .cancel(
                                                        user.getId());

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Subscription will be canceled at period end",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(new ApiResponse<>(
                                                        400,
                                                        e.getMessage(),
                                                        null));

                } catch (Exception e) {
                        e.printStackTrace();

                        return ResponseEntity
                                        .status(500)
                                        .body(new ApiResponse<>(
                                                        500,
                                                        e.getMessage(),
                                                        null));
                }
        }

        /// overview chart
        @GetMapping("/insights")
        public ResponseEntity<?> getInsights(
                        @RequestParam(defaultValue = "monthly") String period,
                        HttpServletRequest request) {

                try {
                        User user = getCurrentUser(
                                        request);

                        if (user == null) {
                                return ResponseEntity
                                                .status(401)
                                                .body(new ApiResponse<>(
                                                                401,
                                                                "Unauthorized",
                                                                null));
                        }

                        if (user.getRole() == null
                                        || !"ADMIN".equalsIgnoreCase(
                                                        user.getRole())) {

                                return ResponseEntity
                                                .status(403)
                                                .body(new ApiResponse<>(
                                                                403,
                                                                "Admin access required",
                                                                null));
                        }

                        Map<String, Object> data = subscriptionService
                                        .getInsights(
                                                        period);

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch subscription insights",
                                                        data));

                } catch (IllegalArgumentException e) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(new ApiResponse<>(
                                                        400,
                                                        e.getMessage(),
                                                        null));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(500)
                                        .body(new ApiResponse<>(
                                                        500,
                                                        e.getMessage(),
                                                        null));
                }
        }
        ///
}