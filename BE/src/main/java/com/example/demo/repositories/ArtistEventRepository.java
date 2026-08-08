package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistEvent;

public interface ArtistEventRepository
                extends JpaRepository<ArtistEvent, String> {

        /*
         * =========================
         * ARTIST MANAGEMENT
         * =========================
         */

        Page<ArtistEvent> findByArtistIdOrderByCreatedAtDesc(
                        String artistId,
                        Pageable pageable);

        Optional<ArtistEvent> findByIdAndArtistId(
                        String id,
                        String artistId);

        /*
         * =========================
         * ADMIN MODERATION
         * =========================
         */

        Page<ArtistEvent> findByApprovalStatusOrderByCreatedAtDesc(
                        String approvalStatus,
                        Pageable pageable);

        /*
         * =========================
         * PUBLIC ARTIST EVENTS
         * =========================
         */

        Page<ArtistEvent> findByArtistIdAndApprovalStatusAndStatusOrderByEventStartAtAsc(
                        String artistId,
                        String approvalStatus,
                        String status,
                        Pageable pageable);

        /*
         * =========================
         * UPCOMING EVENTS
         * =========================
         */

        List<ArtistEvent> findByApprovalStatusAndStatusAndEventStartAtAfterOrderByEventStartAtAsc(
                        String approvalStatus,
                        String status,
                        LocalDateTime eventStartAt);

        /*
         * =========================
         * PUBLIC UPCOMING EVENTS
         * =========================
         */
        Page<ArtistEvent> findByArtistIdAndApprovalStatusAndStatusAndEventStartAtAfterOrderByEventStartAtAsc(
                        String artistId,
                        String approvalStatus,
                        String status,
                        LocalDateTime eventStartAt,
                        Pageable pageable);

        /*
         * =========================
         * PUBLIC EVENT DETAIL
         * =========================
         */
        Optional<ArtistEvent> findByIdAndApprovalStatusAndStatus(
                        String id,
                        String approvalStatus,
                        String status);

        /*
         * =========================
         * LOCK EVENT INVENTORY
         * =========================
         *
         * Dùng khi:
         * - reserve ticket
         * - confirm sale
         * - release reservation
         */
        @Query(value = """
                        SELECT *
                        FROM artist_events
                        WHERE id = :eventId
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<ArtistEvent> findByIdForUpdate(
                        @Param("eventId") String eventId);
}