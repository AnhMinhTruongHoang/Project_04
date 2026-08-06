package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.MembershipPaymentTransaction;

public interface MembershipPaymentTransactionRepository
        extends JpaRepository<MembershipPaymentTransaction, String> {

    Optional<MembershipPaymentTransaction> findByOrderCode(
            String orderCode);

    boolean existsByOrderCode(
            String orderCode);

    Optional<MembershipPaymentTransaction> findByProviderAndProviderTransactionId(
            String provider,
            String providerTransactionId);

    Optional<MembershipPaymentTransaction> findFirstByMemberIdAndArtistIdAndPlanIdAndStatusOrderByCreatedAtDesc(
            String memberId,
            String artistId,
            String planId,
            String status);

    Page<MembershipPaymentTransaction> findByMemberIdOrderByCreatedAtDesc(
            String memberId,
            Pageable pageable);

    Page<MembershipPaymentTransaction> findByArtistIdOrderByCreatedAtDesc(
            String artistId,
            Pageable pageable);

    Page<MembershipPaymentTransaction> findByArtistIdAndStatusOrderByCreatedAtDesc(
            String artistId,
            String status,
            Pageable pageable);

    List<MembershipPaymentTransaction> findTop100ByStatusInAndExpiresAtLessThanEqualOrderByExpiresAtAsc(
            List<String> statuses,
            LocalDateTime expiresAt);

    /*
     * =========================
     * LOCK PAYMENT CALLBACK
     * =========================
     */
    @Query(value = """
            SELECT *
            FROM membership_payment_transactions
            WHERE orderCode = :orderCode
            FOR UPDATE
            """, nativeQuery = true)
    Optional<MembershipPaymentTransaction> findByOrderCodeForUpdate(
            @Param("orderCode") String orderCode);

    @Query(value = """
            SELECT *
            FROM membership_payment_transactions
            WHERE id = :paymentId
            FOR UPDATE
            """, nativeQuery = true)
    Optional<MembershipPaymentTransaction> findByIdForUpdate(
            @Param("paymentId") String paymentId);
}