package com.example.demo.controllers.admin;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.ArtistBenefitDTO;
import com.example.demo.entities.ArtistBenefit;
import com.example.demo.repositories.ArtistBenefitRepository;
import com.example.demo.responses.ApiResponse;
import com.example.demo.responses.ArtistBenefitResponse;

@RestController
@RequestMapping("/api/v1/admin/artist-benefits")
public class AdminArtistBenefitController {

    private final ArtistBenefitRepository artistBenefitRepository;

    public AdminArtistBenefitController(
            ArtistBenefitRepository artistBenefitRepository) {

        this.artistBenefitRepository = artistBenefitRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {

        List<ArtistBenefitDTO> benefits = artistBenefitRepository
                .findAllByOrderBySortOrderAscCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .toList();

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Get artist benefits successfully",
                        benefits));
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody ArtistBenefitResponse request) {

        String validationMessage = validateRequest(request);

        if (validationMessage != null) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiResponse<>(
                                    400,
                                    validationMessage,
                                    null));
        }

        LocalDateTime now = LocalDateTime.now();

        ArtistBenefit benefit = new ArtistBenefit();

        benefit.setId(
                UUID.randomUUID()
                        .toString()
                        .replace("-", ""));

        applyRequest(
                benefit,
                request);

        benefit.setCreatedAt(now);
        benefit.setUpdatedAt(now);

        ArtistBenefit savedBenefit = artistBenefitRepository.save(
                benefit);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Artist benefit created successfully",
                        toDTO(savedBenefit)));
    }

    @PutMapping("/{benefitId}")
    public ResponseEntity<?> update(
            @PathVariable String benefitId,

            @RequestBody ArtistBenefitResponse request) {

        String validationMessage = validateRequest(request);

        if (validationMessage != null) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            new ApiResponse<>(
                                    400,
                                    validationMessage,
                                    null));
        }

        ArtistBenefit benefit = artistBenefitRepository
                .findById(benefitId)
                .orElse(null);

        if (benefit == null) {
            return ResponseEntity
                    .status(404)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    "Artist benefit not found",
                                    null));
        }

        applyRequest(
                benefit,
                request);

        benefit.setUpdatedAt(
                LocalDateTime.now());

        ArtistBenefit savedBenefit = artistBenefitRepository.save(
                benefit);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Artist benefit updated successfully",
                        toDTO(savedBenefit)));
    }

    @PatchMapping("/{benefitId}/toggle")
    public ResponseEntity<?> toggle(
            @PathVariable String benefitId) {

        ArtistBenefit benefit = artistBenefitRepository
                .findById(benefitId)
                .orElse(null);

        if (benefit == null) {
            return ResponseEntity
                    .status(404)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    "Artist benefit not found",
                                    null));
        }

        boolean currentActive = Boolean.TRUE.equals(
                benefit.getActive());

        benefit.setActive(
                !currentActive);

        benefit.setUpdatedAt(
                LocalDateTime.now());

        ArtistBenefit savedBenefit = artistBenefitRepository.save(
                benefit);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Artist benefit status updated successfully",
                        toDTO(savedBenefit)));
    }

    @DeleteMapping("/{benefitId}")
    public ResponseEntity<?> delete(
            @PathVariable String benefitId) {

        ArtistBenefit benefit = artistBenefitRepository
                .findById(benefitId)
                .orElse(null);

        if (benefit == null) {
            return ResponseEntity
                    .status(404)
                    .body(
                            new ApiResponse<>(
                                    404,
                                    "Artist benefit not found",
                                    null));
        }

        artistBenefitRepository.delete(
                benefit);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        "Artist benefit deleted successfully",
                        null));
    }

    private void applyRequest(
            ArtistBenefit benefit,
            ArtistBenefitResponse request) {

        benefit.setTitle(
                request.getTitle().trim());

        benefit.setDescription(
                cleanText(
                        request.getDescription()));

        benefit.setSaveLabel(
                cleanText(
                        request.getSaveLabel()));

        benefit.setImageUrl(
                cleanText(
                        request.getImageUrl()));

        benefit.setSortOrder(
                request.getSortOrder() == null
                        ? 0
                        : Math.max(
                                request.getSortOrder(),
                                0));

        benefit.setActive(
                request.getActive() == null
                        ? true
                        : request.getActive());
    }

    private String validateRequest(
            ArtistBenefitResponse request) {

        if (request == null) {
            return "Request body is required";
        }

        if (request.getTitle() == null
                || request.getTitle()
                        .trim()
                        .isEmpty()) {

            return "Benefit title is required";
        }

        return null;
    }

    private String cleanText(
            String value) {

        if (value == null
                || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private ArtistBenefitDTO toDTO(
            ArtistBenefit benefit) {

        ArtistBenefitDTO dto = new ArtistBenefitDTO();

        dto.setId(
                benefit.getId());

        dto.setTitle(
                benefit.getTitle());

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