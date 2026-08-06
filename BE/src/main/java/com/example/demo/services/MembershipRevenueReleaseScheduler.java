package com.example.demo.services;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MembershipRevenueReleaseScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            MembershipRevenueReleaseScheduler.class);

    private final MembershipRevenueReleaseService membershipRevenueReleaseService;

    public MembershipRevenueReleaseScheduler(
            MembershipRevenueReleaseService membershipRevenueReleaseService) {

        this.membershipRevenueReleaseService = membershipRevenueReleaseService;
    }

    /*
     * =========================
     * RELEASE MEMBERSHIP REVENUE
     * =========================
     *
     * Mặc định:
     * - chờ 30 giây sau khi Backend khởi động;
     * - kiểm tra mỗi 60 giây;
     * - tối đa 100 ledger mỗi lần.
     */
    @Scheduled(initialDelayString = "${membership.revenue-release.initial-delay-ms:30000}",

            fixedDelayString = "${membership.revenue-release.fixed-delay-ms:60000}")
    public void releaseDueRevenue() {

        List<String> ledgerIds = membershipRevenueReleaseService
                .findDueLedgerIds();

        if (ledgerIds.isEmpty()) {
            return;
        }

        int releasedCount = 0;

        for (String ledgerId : ledgerIds) {

            try {
                boolean released = membershipRevenueReleaseService
                        .releaseLedger(
                                ledgerId);

                if (released) {
                    releasedCount++;
                }

            } catch (Exception e) {

                /*
                 * Một ledger lỗi không làm scheduler
                 * dừng xử lý các ledger còn lại.
                 */
                LOGGER.error(
                        "Unable to release membership revenue ledger {}",
                        ledgerId,
                        e);
            }
        }

        LOGGER.info(
                "Membership revenue release completed: {} of {} ledger(s) released",
                releasedCount,
                ledgerIds.size());
    }
}