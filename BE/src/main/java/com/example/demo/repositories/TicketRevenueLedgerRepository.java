package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.TicketRevenueLedger;

public interface TicketRevenueLedgerRepository
        extends JpaRepository<TicketRevenueLedger, String> {

    boolean existsByTicketPaymentId(
            String ticketPaymentId);

    Optional<TicketRevenueLedger> findByTicketPaymentId(
            String ticketPaymentId);

    List<TicketRevenueLedger> findTop100ByStatusAndAvailableAtLessThanEqualOrderByAvailableAtAsc(
            String status,
            LocalDateTime availableAt);

    @Query(value = """
            SELECT *
            FROM ticket_revenue_ledgers
            WHERE id = :ledgerId
            FOR UPDATE
            """, nativeQuery = true)
    Optional<TicketRevenueLedger> findByIdForUpdate(
            @Param("ledgerId") String ledgerId);
}