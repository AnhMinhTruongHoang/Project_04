package com.example.demo.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dtos.ArtistBenefitDTO;
import com.example.demo.entities.ArtistBenefit;
import com.example.demo.repositories.ArtistBenefitRepository;
import com.example.demo.responses.ApiResponse;

@RestController
@RequestMapping("/api/v1/artist-studio")
public class ArtistStudioController {

    @Autowired
    private ArtistBenefitRepository artistBenefitRepository;

    @GetMapping("/benefits")
    public ResponseEntity<?> getBenefits() {

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

        return dto;
    }
}