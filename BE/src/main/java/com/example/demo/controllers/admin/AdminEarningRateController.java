package com.example.demo.controllers.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.CreateEarningRateDTO;
import com.example.demo.entities.EarningRate;
import com.example.demo.entities.User;
import com.example.demo.helpers.AuthHelper;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.EarningRateService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping({
        "/api/admin/earning-rates",
        "/api/v1/admin/earning-rates"
})
public class AdminEarningRateController {

    private final EarningRateService earningRateService;

    private final UserRepository userRepository;

    public AdminEarningRateController(
            EarningRateService earningRateService,
            UserRepository userRepository) {

        this.earningRateService = earningRateService;

        this.userRepository = userRepository;
    }

    /*
     * =========================================================
     * GET EARNING RATE HISTORY
     * =========================================================
     */

    @GetMapping
    public ResponseEntity<?> getRateHistory(
            @RequestParam(defaultValue = "1") int current,

            @RequestParam(defaultValue = "10") int pageSize,

            HttpServletRequest request) {

        try {

            User admin = getCurrentAdmin(
                    request);

            if (admin == null) {
                return forbiddenResponse();
            }

            int normalizedCurrent = Math.max(
                    current,
                    1);

            int normalizedPageSize = Math.min(
                    Math.max(
                            pageSize,
                            1),
                    100);

            Page<EarningRate> ratePage = earningRateService
                    .getRateHistory(
                            PageRequest.of(
                                    normalizedCurrent - 1,
                                    normalizedPageSize));

            List<Map<String, Object>> result = ratePage
                    .getContent()
                    .stream()
                    .map(this::toRateResponse)
                    .toList();

            Map<String, Object> meta = new LinkedHashMap<>();

            meta.put(
                    "current",
                    normalizedCurrent);

            meta.put(
                    "pageSize",
                    normalizedPageSize);

            meta.put(
                    "pages",
                    ratePage.getTotalPages());

            meta.put(
                    "total",
                    ratePage.getTotalElements());

            Map<String, Object> data = new LinkedHashMap<>();

            data.put(
                    "meta",
                    meta);

            data.put(
                    "result",
                    result);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch earning rate history successfully",
                            data));

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiResponse<>(
                                    400,
                                    exception.getMessage(),
                                    null));

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to fetch earning rate history",
                                    null));
        }
    }

    /*
     * =========================================================
     * GET ACTIVE EARNING RATE
     * =========================================================
     */

    @GetMapping("/active")
    public ResponseEntity<?> getActiveRate(
            HttpServletRequest request) {

        try {

            User admin = getCurrentAdmin(
                    request);

            if (admin == null) {
                return forbiddenResponse();
            }

            EarningRate activeRate = earningRateService
                    .getActiveRate();

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch active earning rate successfully",
                            toRateResponse(
                                    activeRate)));

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to fetch active earning rate",
                                    null));
        }
    }

    /*
     * =========================================================
     * CREATE NEW EARNING RATE
     * =========================================================
     */

    @PostMapping
    public ResponseEntity<?> createRate(
            @RequestBody CreateEarningRateDTO dto,

            HttpServletRequest request) {

        try {

            User admin = getCurrentAdmin(
                    request);

            if (admin == null) {
                return forbiddenResponse();
            }

            if (dto == null) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                new ApiResponse<>(
                                        400,
                                        "Earning rate data is required",
                                        null));
            }

            EarningRate createdRate = earningRateService
                    .createRate(
                            dto.getAmountPerStream(),
                            dto.getCurrency(),
                            dto.getEffectiveFrom(),
                            dto.getReason(),
                            admin.getId());

            String message = EarningRate.STATUS_SCHEDULED.equalsIgnoreCase(
                    createdRate.getStatus())
                            ? "Earning rate scheduled successfully"
                            : "Earning rate activated successfully";

            return ResponseEntity
                    .status(201)
                    .body(
                            new ApiResponse<>(
                                    201,
                                    message,
                                    toRateResponse(
                                            createdRate)));

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiResponse<>(
                                    400,
                                    exception.getMessage(),
                                    null));

        } catch (IllegalStateException exception) {

            return ResponseEntity
                    .status(409)
                    .body(
                            new ApiResponse<>(
                                    409,
                                    exception.getMessage(),
                                    null));

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            new ApiResponse<>(
                                    500,
                                    "Unable to create earning rate",
                                    null));
        }
    }

    /*
     * =========================================================
     * RESPONSE MAPPER
     * =========================================================
     */

    private Map<String, Object> toRateResponse(
            EarningRate rate) {

        Map<String, Object> result = new LinkedHashMap<>();

        if (rate == null) {
            return result;
        }

        result.put(
                "id",
                rate.getId());

        result.put(
                "amountPerStream",
                rate.getAmountPerStream());

        result.put(
                "currency",
                rate.getCurrency());

        result.put(
                "effectiveFrom",
                rate.getEffectiveFrom());

        result.put(
                "effectiveTo",
                rate.getEffectiveTo());

        result.put(
                "status",
                rate.getStatus());

        result.put(
                "reason",
                rate.getReason());

        result.put(
                "createdBy",
                rate.getCreatedBy());

        result.put(
                "createdAt",
                rate.getCreatedAt());

        result.put(
                "updatedAt",
                rate.getUpdatedAt());

        return result;
    }

    /*
     * =========================================================
     * ADMIN AUTH
     * =========================================================
     */

    private User getCurrentAdmin(
            HttpServletRequest request) {

        try {

            String token = getBearerToken(
                    request);

            if (token == null
                    || !AuthHelper.isAdmin(
                            token)) {

                return null;
            }

            Claims claims = JwtHelper.verifyToken(
                    token);

            String email = claims.getSubject();

            if (email == null
                    || email.isBlank()) {

                return null;
            }

            User admin = userRepository.findByEmail(
                    email);

            if (admin == null
                    || !"ADMIN".equalsIgnoreCase(
                            admin.getRole())) {

                return null;
            }

            /*
             * Chỉ kiểm tra accountStatus khi có giá trị.
             *
             * Hỗ trợ dữ liệu cũ chưa được gán trạng thái.
             */
            String accountStatus = admin.getAccountStatus();

            if (accountStatus != null
                    && !accountStatus.isBlank()
                    && !"ACTIVE".equalsIgnoreCase(
                            accountStatus)) {

                return null;
            }

            return admin;

        } catch (Exception exception) {
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

    private ResponseEntity<ApiResponse<Object>> forbiddenResponse() {

        return ResponseEntity
                .status(403)
                .body(
                        new ApiResponse<>(
                                403,
                                "Administrator permission is required",
                                null));
    }
}