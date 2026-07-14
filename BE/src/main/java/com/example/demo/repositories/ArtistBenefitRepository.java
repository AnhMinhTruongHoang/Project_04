package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.entities.ArtistBenefit;

@Repository
public interface ArtistBenefitRepository
        extends JpaRepository<ArtistBenefit, String> {

    List<ArtistBenefit> findByActiveTrueOrderBySortOrderAscCreatedAtDesc();
}