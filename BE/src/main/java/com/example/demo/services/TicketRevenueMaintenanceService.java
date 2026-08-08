package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.demo.entities.TicketRevenueLedger;
import com.example.demo.repositories.TicketRevenueLedgerRepository;

@Service
public class TicketRevenueMaintenanceService {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            TicketRevenueMaintenanceService.class);

    private static final ZoneId VIETNAM_ZONE = ZoneId.of(
            "Asia/Ho_Chi_Minh");

    private final TicketRevenueLedgerRepository ticketRevenueLedgerRepository;

    private final TicketRevenueReleaseService ticketRevenueReleaseService;

    public TicketRevenueMaintenanceService(
            TicketRevenueLedgerRepository ticketRevenueLedgerRepository,
            TicketRevenueReleaseService ticketRevenueReleaseService) {

        this.ticketRevenueLedgerRepository = ticketRevenueLedgerRepository;

        this.ticketRevenueReleaseService = ticketRevenueReleaseService;
    }

    /*
     * =========================
     * RELEASE MATURE TICKET REVENUE
     * =========================
     */
    @Scheduled(fixedDelayString = "${ticketing.revenue.release-delay-ms:60000}")
    public void releaseAvailableTicketRevenue() {

        LocalDateTime now = LocalDateTime.now(
                VIETNAM_ZONE);

        List<TicketRevenueLedger> candidates = ticketRevenueLedgerRepository
                .findTop100ByStatusAndAvailableAtLessThanEqualOrderByAvailableAtAsc(
                        TicketRevenueLedger.STATUS_PENDING,
                        now);

        if (candidates.isEmpty()) {
            return;
        }

        int releasedCount = 0;

        for (TicketRevenueLedger candidate : candidates) {

            if (candidate == null
                    || candidate.getId() == null
                    || candidate.getId().isBlank()) {

                continue;
            }

            try {

                boolean released = ticketRevenueReleaseService
                        .releaseRevenue(
                                candidate.getId(),
                                now);

                if (released) {
                    releasedCount++;
                }

            } catch (Exception e) {

                LOGGER.error(
                        "Unable to release ticket revenue ledger {}",
                        candidate.getId(),
                        e);
            }
        }

        if (releasedCount > 0) {

            LOGGER.info(
                    "Released {} ticket revenue ledger(s)",
                    releasedCount);
        }
    }
}