package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.Optional;
import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("""
                        SELECT payment
                        FROM PaymentTransaction payment
                        WHERE payment.orderCode = :orderCode
                        """)
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
         * EXPIRE PENDING PAYMENTS
         * =========================
         */
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("""
                        UPDATE PaymentTransaction payment
                        SET payment.status = :expiredStatus,
                            payment.failureReason = :failureReason,
                            payment.updatedAt = :now
                        WHERE payment.status = :pendingStatus
                          AND payment.expiresAt IS NOT NULL
                          AND payment.expiresAt <= :now
                        """)
        int expirePendingPayments(
                        @Param("pendingStatus") String pendingStatus,
                        @Param("expiredStatus") String expiredStatus,
                        @Param("failureReason") String failureReason,
                        @Param("now") LocalDateTime now);
}