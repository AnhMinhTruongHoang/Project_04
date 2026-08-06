package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistMembershipPlan;
import com.example.demo.entities.ArtistMembershipSubscription;
import com.example.demo.entities.User;
import com.example.demo.repositories.ArtistMembershipPlanRepository;
import com.example.demo.repositories.ArtistMembershipSubscriptionRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class ArtistMembershipSubscriptionService {

    private final ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository;

    private final ArtistMembershipPlanRepository artistMembershipPlanRepository;

    private final UserRepository userRepository;

    public ArtistMembershipSubscriptionService(
            ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository,

            ArtistMembershipPlanRepository artistMembershipPlanRepository,

            UserRepository userRepository) {

        this.artistMembershipSubscriptionRepository = artistMembershipSubscriptionRepository;

        this.artistMembershipPlanRepository = artistMembershipPlanRepository;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * GET MEMBERSHIP ACCESS
     * =========================
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMembershipAccess(
            String memberId,
            String artistId) {

        validateRequired(
                memberId,
                "Member ID");

        validateRequired(
                artistId,
                "Artist ID");

        User member = userRepository
                .findById(
                        memberId.trim())
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Member account not found"));

        User artist = userRepository
                .findById(
                        artistId.trim())
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Artist account not found"));

        if (!"ACTIVE".equalsIgnoreCase(
                member.getAccountStatus())) {

            throw new SecurityException(
                    "Member account is not active");
        }

        if (!"ARTIST".equalsIgnoreCase(
                artist.getType())) {

            throw new IllegalArgumentException(
                    "The selected account is not an artist");
        }

        ArtistMembershipSubscription subscription = artistMembershipSubscriptionRepository
                .findByMemberIdAndArtistId(
                        member.getId(),
                        artist.getId())
                .orElse(null);

        return buildAccessResponse(
                artist.getId(),
                subscription);
    }

    /*
     * =========================
     * GET MY MEMBERSHIPS
     * =========================
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyMemberships(
            String memberId) {

        validateRequired(
                memberId,
                "Member ID");

        return artistMembershipSubscriptionRepository
                .findByMemberIdOrderByCreatedAtDesc(
                        memberId.trim())
                .stream()
                .map(this::buildSubscriptionResponse)
                .toList();
    }

    /*
     * =========================
     * CANCEL AT PERIOD END
     * =========================
     *
     * User vẫn có quyền membership tới
     * currentPeriodEnd vì kỳ hiện tại đã thanh toán.
     */
    @Transactional
    public Map<String, Object> cancelAtPeriodEnd(
            String memberId,
            String subscriptionId) {

        validateRequired(
                memberId,
                "Member ID");

        validateRequired(
                subscriptionId,
                "Membership subscription ID");

        ArtistMembershipSubscription subscription = artistMembershipSubscriptionRepository
                .findByIdForUpdate(
                        subscriptionId.trim())
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Membership subscription not found"));

        if (!memberId.trim().equals(
                subscription.getMemberId())) {

            throw new NoSuchElementException(
                    "Membership subscription not found");
        }

        LocalDateTime now = LocalDateTime.now();

        boolean periodExpired = subscription.getCurrentPeriodEnd() == null
                || !subscription
                        .getCurrentPeriodEnd()
                        .isAfter(now);

        if (periodExpired) {

            subscription.setStatus(
                    ArtistMembershipSubscription.STATUS_EXPIRED);

            subscription.setExpiredAt(
                    now);

            subscription.setCancelAtPeriodEnd(
                    false);

            ArtistMembershipSubscription saved = artistMembershipSubscriptionRepository
                    .saveAndFlush(
                            subscription);

            return buildSubscriptionResponse(
                    saved);
        }

        if (!ArtistMembershipSubscription.STATUS_ACTIVE
                .equalsIgnoreCase(
                        subscription.getStatus())) {

            throw new IllegalStateException(
                    "Only active memberships can be canceled");
        }

        /*
         * Idempotency:
         * gọi lại nhiều lần vẫn trả cùng kết quả.
         */
        if (!Boolean.TRUE.equals(
                subscription.getCancelAtPeriodEnd())) {

            subscription.setCancelAtPeriodEnd(
                    true);

            subscription.setCanceledAt(
                    now);
        }

        ArtistMembershipSubscription saved = artistMembershipSubscriptionRepository
                .saveAndFlush(
                        subscription);

        return buildSubscriptionResponse(
                saved);
    }

    /*
     * =========================
     * ACCESS RESPONSE
     * =========================
     */
    private Map<String, Object> buildAccessResponse(
            String artistId,
            ArtistMembershipSubscription subscription) {

        Map<String, Object> result = new LinkedHashMap<>();

        result.put(
                "artistId",
                artistId);

        if (subscription == null) {

            result.put(
                    "hasMembership",
                    false);

            result.put(
                    "active",
                    false);

            result.put(
                    "status",
                    null);

            result.put(
                    "subscriptionId",
                    null);

            result.put(
                    "planId",
                    null);

            result.put(
                    "currentPeriodEnd",
                    null);

            result.put(
                    "cancelAtPeriodEnd",
                    false);

            return result;
        }

        LocalDateTime now = LocalDateTime.now();

        boolean periodActive = subscription.getCurrentPeriodEnd() != null
                && subscription
                        .getCurrentPeriodEnd()
                        .isAfter(now);

        boolean active = ArtistMembershipSubscription.STATUS_ACTIVE
                .equalsIgnoreCase(
                        subscription.getStatus())
                && periodActive;

        String effectiveStatus = active
                ? ArtistMembershipSubscription.STATUS_ACTIVE
                : periodActive
                        ? subscription.getStatus()
                        : ArtistMembershipSubscription.STATUS_EXPIRED;

        ArtistMembershipPlan plan = artistMembershipPlanRepository
                .findById(
                        subscription.getPlanId())
                .orElse(null);

        result.put(
                "hasMembership",
                true);

        result.put(
                "active",
                active);

        result.put(
                "status",
                effectiveStatus);

        result.put(
                "subscriptionId",
                subscription.getId());

        result.put(
                "memberId",
                subscription.getMemberId());

        result.put(
                "planId",
                subscription.getPlanId());

        result.put(
                "planCode",
                plan == null
                        ? null
                        : plan.getCode());

        result.put(
                "planName",
                plan == null
                        ? null
                        : plan.getName());

        result.put(
                "badgeName",
                plan == null
                        ? null
                        : plan.getBadgeName());

        result.put(
                "badgeColor",
                plan == null
                        ? null
                        : plan.getBadgeColor());

        result.put(
                "startedAt",
                subscription.getStartedAt());

        result.put(
                "currentPeriodStart",
                subscription.getCurrentPeriodStart());

        result.put(
                "currentPeriodEnd",
                subscription.getCurrentPeriodEnd());

        result.put(
                "cancelAtPeriodEnd",
                Boolean.TRUE.equals(
                        subscription.getCancelAtPeriodEnd()));

        return result;
    }

    /*
     * =========================
     * SUBSCRIPTION RESPONSE
     * =========================
     */
    private Map<String, Object> buildSubscriptionResponse(
            ArtistMembershipSubscription subscription) {

        Map<String, Object> result = buildAccessResponse(
                subscription.getArtistId(),
                subscription);

        User artist = userRepository
                .findById(
                        subscription.getArtistId())
                .orElse(null);

        result.put(
                "artistName",
                artist == null
                        ? null
                        : artist.getName());

        result.put(
                "artistUsername",
                artist == null
                        ? null
                        : artist.getUsername());

        result.put(
                "artistAvatarUrl",
                artist == null
                        ? null
                        : artist.getAvatarUrl());

        result.put(
                "latestPaymentId",
                subscription.getLatestPaymentId());

        result.put(
                "canceledAt",
                subscription.getCanceledAt());

        result.put(
                "expiredAt",
                subscription.getExpiredAt());

        result.put(
                "createdAt",
                subscription.getCreatedAt());

        result.put(
                "updatedAt",
                subscription.getUpdatedAt());

        return result;
    }

    /*
     * =========================
     * VALIDATION
     * =========================
     */
    private void validateRequired(
            String value,
            String fieldName) {

        if (value == null
                || value.isBlank()) {

            throw new IllegalArgumentException(
                    fieldName + " is required");
        }
    }
}