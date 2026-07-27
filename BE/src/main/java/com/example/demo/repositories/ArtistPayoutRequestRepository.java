package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistPayoutRequest;

public interface ArtistPayoutRequestRepository
        extends JpaRepository<ArtistPayoutRequest, String> {

    /*
     * =========================
     * ARTIST PAYOUT HISTORY
     * =========================
     */
    Page<ArtistPayoutRequest> findByArtistIdOrderByRequestedAtDesc(
            String artistId,
            Pageable pageable);

    Page<ArtistPayoutRequest> findByArtistIdAndStatusOrderByRequestedAtDesc(
            String artistId,
            String status,
            Pageable pageable);

    /*
     * Artist chỉ được có một yêu cầu
     * PENDING hoặc APPROVED tại một thời điểm.
     */
    boolean existsByArtistIdAndStatusIn(
            String artistId,
            List<String> statuses);

    Optional<ArtistPayoutRequest> findByIdAndArtistId(
            String id,
            String artistId);

    /*
     * =========================
     * ADMIN PAYOUT LIST
     * =========================
     */
    Page<ArtistPayoutRequest> findAllByOrderByRequestedAtDesc(
            Pageable pageable);

    Page<ArtistPayoutRequest> findByStatusOrderByRequestedAtDesc(
            String status,
            Pageable pageable);

    /*
     * =========================
     * LOCK PAYOUT REQUEST
     * =========================
     *
     * Dùng native FOR UPDATE để tương thích
     * MySQL/TiDB và tránh Hibernate sinh:
     * FOR UPDATE OF alias.
     */
    @Query(value = """
            SELECT *
            FROM artist_payout_requests
            WHERE id = :payoutRequestId
            FOR UPDATE
            """, nativeQuery = true)
    Optional<ArtistPayoutRequest> findByIdForUpdate(
            @Param("payoutRequestId") String payoutRequestId);

    /*
     * Khóa yêu cầu nhưng đồng thời xác nhận
     * yêu cầu thuộc đúng Artist hiện tại.
     */
    @Query(value = """
            SELECT *
            FROM artist_payout_requests
            WHERE id = :payoutRequestId
              AND artistId = :artistId
            FOR UPDATE
            """, nativeQuery = true)
    Optional<ArtistPayoutRequest> findByIdAndArtistIdForUpdate(
            @Param("payoutRequestId") String payoutRequestId,

            @Param("artistId") String artistId);

    long countByArtistIdAndStatus(
            String artistId,
            String status);

    long countByStatus(
            String status);
}