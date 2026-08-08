package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.TicketPaymentTransaction;

public interface TicketPaymentTransactionRepository
                extends JpaRepository<TicketPaymentTransaction, String> {

        /*
         * =========================
         * ORDER
         * =========================
         */

        Optional<TicketPaymentTransaction> findByOrderCode(
                        String orderCode);

        boolean existsByOrderCode(
                        String orderCode);

        /*
         * =========================
         * PENDING ORDER REUSE
         * =========================
         *
         * Chống double-click Buy Ticket.
         */
        Optional<TicketPaymentTransaction> findFirstByBuyerIdAndEventIdAndStatusOrderByCreatedAtDesc(
                        String buyerId,
                        String eventId,
                        String status);

        /*
         * =========================
         * PROVIDER TRANSACTION
         * =========================
         */

        Optional<TicketPaymentTransaction> findByProviderAndProviderTransactionId(
                        String provider,
                        String providerTransactionId);

        /*
         * =========================
         * BUYER PAYMENT HISTORY
         * =========================
         */

        List<TicketPaymentTransaction> findByBuyerIdOrderByCreatedAtDesc(
                        String buyerId);

        /*
         * =========================
         * LOCK PAYMENT
         * =========================
         *
         * VNPay có thể gửi callback nhiều lần.
         * Lock row trước khi:
         *
         * PENDING
         * → PROCESSING
         * → PAID / FAILED
         */
        @Query(value = """
                        SELECT *
                        FROM ticket_payment_transactions
                        WHERE orderCode = :orderCode
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<TicketPaymentTransaction> findByOrderCodeForUpdate(
                        @Param("orderCode") String orderCode);

        /*
         * =========================
         * EXPIRED PAYMENT CANDIDATES
         * =========================
         */
        List<TicketPaymentTransaction> findTop100ByStatusAndExpiresAtLessThanEqualOrderByExpiresAtAsc(
                        String status,
                        LocalDateTime expiresAt);

        /*
         * =========================
         * LOCK PAYMENT BY ID
         * =========================
         */
        @Query(value = """
                        SELECT *
                        FROM ticket_payment_transactions
                        WHERE id = :paymentId
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<TicketPaymentTransaction> findByIdForUpdate(
                        @Param("paymentId") String paymentId);
}