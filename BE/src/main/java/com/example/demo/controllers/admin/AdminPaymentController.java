package com.example.demo.controllers.admin;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.PaymentService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api/admin/payments",
        "/api/v1/admin/payments"
})
public class AdminPaymentController {

    private final PaymentService paymentService;

    private final UserRepository userRepository;

    public AdminPaymentController(
            PaymentService paymentService,
            UserRepository userRepository) {

        this.paymentService = paymentService;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * GET ADMIN PAYMENT LIST
     * =========================
     */
    @GetMapping
    public ResponseEntity<?> getPayments(
            @RequestParam(required = false, defaultValue = "") String status,

            @RequestParam(defaultValue = "1") int current,

            @RequestParam(defaultValue = "10") int pageSize,

            HttpServletRequest request) {

        try {
            User admin = getCurrentUser(
                    request);

            if (admin == null) {
                return ResponseEntity
                        .status(401)
                        .body(
                                new ApiResponse<>(
                                        401,
                                        "Unauthorized",
                                        null));
            }

            if (!isAdmin(admin)) {
                return ResponseEntity
                        .status(403)
                        .body(
                                new ApiResponse<>(
                                        403,
                                        "Admin access required",
                                        null));
            }

            Map<String, Object> data = paymentService
                    .getAdminPayments(
                            status,
                            current,
                            pageSize);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch payment transactions successfully",
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
                                    "Unable to fetch payment transactions",
                                    null));
        }
    }

    /*
     * =========================
     * AUTH HELPERS
     * =========================
     */
    private boolean isAdmin(
            User user) {

        return user != null
                && "ADMIN".equalsIgnoreCase(
                        user.getRole());
    }

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