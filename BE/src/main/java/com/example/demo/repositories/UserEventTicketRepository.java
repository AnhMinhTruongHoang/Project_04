package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.entities.UserEventTicket;

public interface UserEventTicketRepository
                extends JpaRepository<UserEventTicket, String> {

        boolean existsByTicketCode(
                        String ticketCode);

        boolean existsByQrTokenHash(
                        String qrTokenHash);

        Optional<UserEventTicket> findByTicketCode(
                        String ticketCode);

        Optional<UserEventTicket> findByIdAndBuyerId(
                        String id,
                        String buyerId);

        List<UserEventTicket> findByBuyerIdOrderByPurchasedAtDesc(
                        String buyerId);

        List<UserEventTicket> findByPaymentIdOrderByCreatedAtAsc(
                        String paymentId);

        @Query(value = """
                        SELECT *
                        FROM user_event_tickets
                        WHERE ticketCode = :ticketCode
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<UserEventTicket> findByTicketCodeForUpdate(
                        @Param("ticketCode") String ticketCode);

        /*
         * =========================
         * BUYER TICKET COLLECTION
         * =========================
         */
        Page<UserEventTicket> findByBuyerIdOrderByPurchasedAtDesc(
                        String buyerId,
                        Pageable pageable);
}