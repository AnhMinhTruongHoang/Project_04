package com.example.demo.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.ArtistBenefitDTO;
import com.example.demo.dtos.ArtistStudioStatsDTO;
import com.example.demo.entities.ArtistBenefit;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.ArtistBenefitRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.ArtistStudioService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/artist-studio")
public class ArtistStudioController {

        private final ArtistBenefitRepository artistBenefitRepository;

        private final ArtistStudioService artistStudioService;

        private final UserRepository userRepository;

        public ArtistStudioController(
                        ArtistBenefitRepository artistBenefitRepository,
                        ArtistStudioService artistStudioService,
                        UserRepository userRepository) {

                this.artistBenefitRepository = artistBenefitRepository;
                this.artistStudioService = artistStudioService;
                this.userRepository = userRepository;
        }

        @GetMapping("/benefits")
        public ResponseEntity<?> getBenefits() {

                try {
                        List<ArtistBenefitDTO> benefits = artistBenefitRepository
                                        .findByActiveTrueOrderBySortOrderAscCreatedAtDesc()
                                        .stream()
                                        .map(this::toDTO)
                                        .toList();

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Get artist benefits successfully",
                                                        benefits));

                } catch (Exception e) {
                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        e.getMessage(),
                                                                        null));
                }
        }

        @GetMapping("/stats")
        public ResponseEntity<?> getStats(
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

                        ArtistStudioStatsDTO stats = artistStudioService
                                        .getStats(user.getId());

                        return ResponseEntity.ok(
                                        new ApiResponse<>(
                                                        200,
                                                        "Get artist studio stats successfully",
                                                        stats));

                } catch (Exception e) {
                        e.printStackTrace();

                        return ResponseEntity
                                        .internalServerError()
                                        .body(
                                                        new ApiResponse<>(
                                                                        500,
                                                                        e.getMessage(),
                                                                        null));
                }
        }

        private String getBearerToken(
                        HttpServletRequest request) {

                String authorization = request.getHeader(
                                "Authorization");

                if (authorization == null
                                || !authorization.startsWith("Bearer ")) {

                        return null;
                }

                String token = authorization
                                .substring(7)
                                .trim();

                return token.isEmpty()
                                ? null
                                : token;
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

                        if (email == null
                                        || email.isBlank()) {

                                return null;
                        }

                        return userRepository.findByEmail(email);

                } catch (Exception e) {
                        return null;
                }
        }

        private ArtistBenefitDTO toDTO(
                        ArtistBenefit benefit) {

                ArtistBenefitDTO dto = new ArtistBenefitDTO();

                dto.setId(benefit.getId());

                dto.setTitle(benefit.getTitle());

                dto.setDescription(
                                benefit.getDescription());

                dto.setSaveLabel(
                                benefit.getSaveLabel());

                dto.setImageUrl(
                                benefit.getImageUrl());

                dto.setSortOrder(
                                benefit.getSortOrder());

                dto.setActive(
                                benefit.getActive());

                dto.setCreatedAt(
                                benefit.getCreatedAt());

                dto.setUpdatedAt(
                                benefit.getUpdatedAt());

                return dto;
        }
}