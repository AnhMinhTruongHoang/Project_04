package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistMembershipPlan;

public interface ArtistMembershipPlanRepository
        extends JpaRepository<ArtistMembershipPlan, String> {

    /*
     * =========================
     * PUBLIC ACTIVE PLANS
     * =========================
     */
    List<ArtistMembershipPlan> findByArtistIdAndActiveTrueOrderByDisplayOrderAscMonthlyPriceAsc(
            String artistId);

    /*
     * =========================
     * ARTIST PLAN MANAGEMENT
     * =========================
     */
    List<ArtistMembershipPlan> findByArtistIdOrderByDisplayOrderAscMonthlyPriceAsc(
            String artistId);

    Optional<ArtistMembershipPlan> findByIdAndArtistId(
            String id,
            String artistId);

    Optional<ArtistMembershipPlan> findByArtistIdAndCodeIgnoreCase(
            String artistId,
            String code);

    boolean existsByArtistIdAndCodeIgnoreCase(
            String artistId,
            String code);

    long countByArtistId(
            String artistId);

    /*
     * =========================
     * LOCK PLAN
     * =========================
     */
    @Query(value = """
            SELECT *
            FROM artist_membership_plans
            WHERE id = :planId
              AND artistId = :artistId
            FOR UPDATE
            """, nativeQuery = true)
    Optional<ArtistMembershipPlan> findByIdAndArtistIdForUpdate(
            @Param("planId") String planId,
            @Param("artistId") String artistId);
}