package com.example.demo.controllers.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.AdminDashboardOverviewDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.AdminDashboardService;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

        private final AdminDashboardService dashboardService;

        private final UserRepository userRepository;

        public AdminDashboardController(
                        AdminDashboardService dashboardService,
                        UserRepository userRepository) {

                this.dashboardService = dashboardService;

                this.userRepository = userRepository;
        }

        @GetMapping("/overview")
        public ResponseEntity<?> getOverview(
                        @RequestHeader(value = "Authorization", required = false) String authorization) {

                try {

                        if (authorization == null
                                        || !authorization.startsWith("Bearer ")) {

                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        String token = authorization
                                        .substring(7)
                                        .trim();

                        Claims claims = JwtHelper.verifyToken(token);

                        User user = userRepository.findByEmail(
                                        claims.getSubject());

                        if (user == null) {

                                return ResponseEntity
                                                .status(401)
                                                .body(
                                                                new ApiResponse<>(
                                                                                401,
                                                                                "Unauthorized",
                                                                                null));
                        }

                        if (!"ADMIN".equalsIgnoreCase(
                                        user.getRole())) {

                                return ResponseEntity
                                                .status(403)
                                                .body(
                                                                new ApiResponse<>(
                                                                                403,
                                                                                "Access denied",
                                                                                null));
                        }

                        AdminDashboardOverviewDTO data = dashboardService.getOverview();

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Fetch dashboard overview success",
                                                        data));

                } catch (Exception e) {

                        e.printStackTrace();

                        return ResponseEntity
                                        .status(401)
                                        .body(
                                                        new ApiResponse<>(
                                                                        401,
                                                                        "Invalid token",
                                                                        null));
                }
        }
}