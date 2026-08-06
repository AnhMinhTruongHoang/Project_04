package com.example.demo.services;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ArtistMembershipExpirationScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            ArtistMembershipExpirationScheduler.class);

    private final ArtistMembershipExpirationService artistMembershipExpirationService;

    public ArtistMembershipExpirationScheduler(
            ArtistMembershipExpirationService artistMembershipExpirationService) {

        this.artistMembershipExpirationService = artistMembershipExpirationService;
    }

    /*
     * =========================
     * EXPIRE MEMBERSHIPS
     * =========================
     *
     * - Bắt đầu sau 45 giây.
     * - Kiểm tra mỗi 60 giây.
     * - Tối đa 100 membership mỗi lượt.
     */
    @Scheduled(initialDelayString = "${membership.expiration.initial-delay-ms:45000}",

            fixedDelayString = "${membership.expiration.fixed-delay-ms:60000}")
    public void expireMemberships() {

        List<String> subscriptionIds = artistMembershipExpirationService
                .findExpiredSubscriptionIds();

        if (subscriptionIds.isEmpty()) {
            return;
        }

        int expiredCount = 0;

        for (String subscriptionId : subscriptionIds) {

            try {
                boolean expired = artistMembershipExpirationService
                        .expireSubscription(
                                subscriptionId);

                if (expired) {
                    expiredCount++;
                }

            } catch (Exception e) {

                LOGGER.error(
                        "Unable to expire artist membership subscription {}",
                        subscriptionId,
                        e);
            }
        }

        LOGGER.info(
                "Artist membership expiration completed: {} of {} subscription(s) expired",
                expiredCount,
                subscriptionIds.size());
    }
}