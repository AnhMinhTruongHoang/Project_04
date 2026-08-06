package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.MembershipRevenueLedger;

public interface MembershipRevenueLedgerRepository
        extends JpaRepository<MembershipRevenueLedger, String> {

    boolean existsByMembershipPaymentId(
            String membershipPaymentId);

    Optional<MembershipRevenueLedger> findByMembershipPaymentId(
            String membershipPaymentId);

    Page<MembershipRevenueLedger> findByArtistIdOrderByCreatedAtDesc(
            String artistId,
            Pageable pageable);

    Page<MembershipRevenueLedger> findByArtistIdAndStatusOrderByCreatedAtDesc(
            String artistId,
            String status,
            Pageable pageable);

    long countByArtistIdAndStatus(
            String artistId,
            String status);

    /*
     * Scheduler lấy những khoản đã hết
     * thời gian giữ doanh thu.
     */
    List<MembershipRevenueLedger> findTop100ByStatusAndAvailableAtLessThanEqualOrderByAvailableAtAsc(
            String status,
            LocalDateTime availableAt);

    @Query(value = """
            SELECT *
            FROM membership_revenue_ledgers
            WHERE id = :ledgerId
            FOR UPDATE
            """, nativeQuery = true)
    Optional<MembershipRevenueLedger> findByIdForUpdate(
            @Param("ledgerId") String ledgerId);
}