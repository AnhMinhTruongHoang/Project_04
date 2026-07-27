package com.example.demo.repositories;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistEarning;

public interface ArtistEarningRepository
        extends JpaRepository<ArtistEarning, String> {

    /*
     * Một ListeningSession chỉ được sinh
     * tối đa một ArtistEarning.
     */
    boolean existsByListeningSessionId(
            String listeningSessionId);

    Optional<ArtistEarning> findByListeningSessionId(
            String listeningSessionId);

    /*
     * Một listener chỉ tạo một earning
     * cho cùng track trong một ngày.
     */
    boolean existsByListenerIdAndTrackIdAndEarningDate(
            String listenerId,
            String trackId,
            LocalDate earningDate);

    /*
     * Lịch sử earnings của artist.
     */
    Page<ArtistEarning> findByArtistIdOrderByCreatedAtDesc(
            String artistId,
            Pageable pageable);

    Page<ArtistEarning> findByArtistIdAndStatusOrderByCreatedAtDesc(
            String artistId,
            String status,
            Pageable pageable);

    /*
     * Scheduler lấy tối đa 100 earning
     * đã hết thời gian giữ tiền.
     */
    List<ArtistEarning> findTop100ByStatusAndAvailableAtLessThanEqualOrderByAvailableAtAsc(
            String status,
            LocalDateTime availableAt);

    /*
     * Native FOR UPDATE để tránh lỗi:
     * FOR UPDATE OF alias trên MySQL/TiDB.
     */
    @Query(value = """
            SELECT *
            FROM artist_earnings
            WHERE id = :earningId
            FOR UPDATE
            """, nativeQuery = true)
    Optional<ArtistEarning> findByIdForUpdate(
            @Param("earningId") String earningId);

    long countByArtistIdAndStatus(
            String artistId,
            String status);

    long countByArtistId(
            String artistId);

    /*
     * Tổng thu nhập theo trạng thái.
     */
    @Query("""
            SELECT COALESCE(SUM(earning.amount), 0)
            FROM ArtistEarning earning
            WHERE earning.artistId = :artistId
              AND earning.status = :status
            """)
    Long sumAmountByArtistIdAndStatus(
            @Param("artistId") String artistId,
            @Param("status") String status);

    /*
     * Tổng earnings trong một khoảng thời gian.
     */
    @Query("""
            SELECT COALESCE(SUM(earning.amount), 0)
            FROM ArtistEarning earning
            WHERE earning.artistId = :artistId
              AND earning.createdAt >= :fromTime
              AND earning.createdAt < :toTime
              AND earning.status <> :rejectedStatus
            """)
    Long sumArtistEarningsBetween(
            @Param("artistId") String artistId,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            @Param("rejectedStatus") String rejectedStatus);
}