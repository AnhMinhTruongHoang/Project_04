package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistMembershipSubscription;
import com.example.demo.repositories.ArtistMembershipSubscriptionRepository;

@Service
public class ArtistMembershipExpirationService {

    private final ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository;

    public ArtistMembershipExpirationService(
            ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository) {

        this.artistMembershipSubscriptionRepository = artistMembershipSubscriptionRepository;
    }

    /*
     * =========================
     * FIND EXPIRED MEMBERSHIP IDS
     * =========================
     */
    @Transactional(readOnly = true)
    public List<String> findExpiredSubscriptionIds() {

        return artistMembershipSubscriptionRepository
                .findTop100ByStatusAndCurrentPeriodEndLessThanEqualOrderByCurrentPeriodEndAsc(
                        ArtistMembershipSubscription.STATUS_ACTIVE,
                        LocalDateTime.now())
                .stream()
                .map(
                        ArtistMembershipSubscription::getId)
                .toList();
    }

    /*
     * =========================
     * EXPIRE ONE MEMBERSHIP
     * =========================
     *
     * Mỗi membership chạy trong transaction riêng.
     * Một bản ghi lỗi không ảnh hưởng bản ghi khác.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expireSubscription(
            String subscriptionId) {

        if (subscriptionId == null
                || subscriptionId.isBlank()) {

            return false;
        }

        ArtistMembershipSubscription subscription = artistMembershipSubscriptionRepository
                .findByIdForUpdate(
                        subscriptionId.trim())
                .orElse(null);

        if (subscription == null) {
            return false;
        }

        /*
         * Idempotency:
         * chỉ xử lý membership đang ACTIVE.
         */
        if (!ArtistMembershipSubscription.STATUS_ACTIVE
                .equalsIgnoreCase(
                        subscription.getStatus())) {

            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        if (subscription.getCurrentPeriodEnd() == null
                || subscription
                        .getCurrentPeriodEnd()
                        .isAfter(now)) {

            return false;
        }

        subscription.setStatus(
                ArtistMembershipSubscription.STATUS_EXPIRED);

        subscription.setExpiredAt(
                now);

        subscription.setCancelAtPeriodEnd(
                false);

        artistMembershipSubscriptionRepository
                .saveAndFlush(
                        subscription);

        return true;
    }
}