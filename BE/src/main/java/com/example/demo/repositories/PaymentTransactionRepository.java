package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.demo.entities.PaymentTransaction;

public interface PaymentTransactionRepository
                extends JpaRepository<PaymentTransaction, String> {

        /*
         * =========================
         * FIND PAYMENT BY ORDER CODE
         * =========================
         */
        Optional<PaymentTransaction> findByOrderCode(
                        String orderCode);

        /*
         * =========================
         * LOCK PAYMENT FOR CALLBACK
         * =========================
         */
        @Query(value = """
                        SELECT *
                        FROM payment_transactions
                        WHERE orderCode = :orderCode
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<PaymentTransaction> findByOrderCodeForUpdate(
                        @Param("orderCode") String orderCode);

        /*
         * =========================
         * FIND VNPAY TRANSACTION
         * =========================
         */
        Optional<PaymentTransaction> findByProviderAndProviderTransactionId(
                        String provider,
                        String providerTransactionId);

        /*
         * =========================
         * CHECK DUPLICATED ORDER CODE
         * =========================
         */
        boolean existsByOrderCode(
                        String orderCode);

        /*
         * =========================
         * LATEST USER PAYMENT
         * =========================
         */
        Optional<PaymentTransaction> findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                        String userId,
                        String status);

        /*
         * =========================
         * USER PAYMENT HISTORY
         * =========================
         */
        Page<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(
                        String userId,
                        Pageable pageable);

        /*
         * =========================
         * ADMIN PAYMENT LIST
         * =========================
         */
        Page<PaymentTransaction> findAllByOrderByCreatedAtDesc(
                        Pageable pageable);

        Page<PaymentTransaction> findByStatusOrderByCreatedAtDesc(
                        String status,
                        Pageable pageable);

        /*
         * =========================
         * FIND EXPIRED PAYMENT CANDIDATES
         * =========================
         */
        List<PaymentTransaction> findTop100ByStatusInAndExpiresAtLessThanEqualOrderByExpiresAtAsc(
                        List<String> statuses,
                        LocalDateTime now);

        /*
         * =========================
         * LOCK PAYMENT FOR MAINTENANCE
         * =========================
         */
        @Query(value = """
                        SELECT *
                        FROM payment_transactions
                        WHERE id = :paymentId
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<PaymentTransaction> findByIdForUpdate(
                        @Param("paymentId") String paymentId);
}