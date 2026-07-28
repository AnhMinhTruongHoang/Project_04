package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.demo.dtos.NotificationDTO;
import com.example.demo.entities.SubscriptionPlan;
import com.example.demo.entities.UserSubscription;
import com.example.demo.repositories.SubscriptionPlanRepository;
import com.example.demo.repositories.UserSubscriptionRepository;

@Service
public class SubscriptionMaintenanceService {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            SubscriptionMaintenanceService.class);

    private static final ZoneId VIETNAM_ZONE = ZoneId.of(
            "Asia/Ho_Chi_Minh");

    private static final String STATUS_ACTIVE = "ACTIVE";

    private static final String PLAN_BASIC = "BASIC";

    private final UserSubscriptionRepository userSubscriptionRepository;

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    private final NotificationService notificationService;

    /*
     * Cảnh báo trước mặc định 3 ngày.
     */
    @Value("${subscription.maintenance.expiring-warning-days:3}")
    private long expiringWarningDays;

    public SubscriptionMaintenanceService(
            UserSubscriptionRepository userSubscriptionRepository,
            SubscriptionPlanRepository subscriptionPlanRepository,
            NotificationService notificationService) {

        this.userSubscriptionRepository = userSubscriptionRepository;

        this.subscriptionPlanRepository = subscriptionPlanRepository;

        this.notificationService = notificationService;
    }

    /*
     * =========================
     * NOTIFY EXPIRING SUBSCRIPTIONS
     * =========================
     */
    @Scheduled(fixedDelayString = "${subscription.maintenance.expiring-delay-ms:3600000}")
    public void notifyExpiringSubscriptions() {

        LocalDateTime now = LocalDateTime.now(
                VIETNAM_ZONE);

        long safeWarningDays = Math.min(
                Math.max(
                        expiringWarningDays,
                        1L),
                30L);

        LocalDateTime warningEnd = now.plusDays(
                safeWarningDays);

        List<UserSubscription> candidates = userSubscriptionRepository
                .findTop100ByStatusAndCurrentPeriodEndBetweenOrderByCurrentPeriodEndAsc(
                        STATUS_ACTIVE,
                        now,
                        warningEnd);

        if (candidates.isEmpty()) {
            return;
        }

        int processedCount = 0;

        for (UserSubscription candidate : candidates) {

            if (candidate == null
                    || candidate.getId() == null
                    || candidate.getId().isBlank()) {

                continue;
            }

            /*
             * Đọc lại dữ liệu mới nhất vì subscription
             * có thể vừa được thanh toán, đổi gói hoặc hết hạn.
             */
            UserSubscription subscription = userSubscriptionRepository
                    .findById(
                            candidate.getId())
                    .orElse(null);

            if (subscription == null
                    || !STATUS_ACTIVE.equalsIgnoreCase(
                            subscription.getStatus())) {

                continue;
            }

            LocalDateTime periodEnd = subscription.getCurrentPeriodEnd();

            if (periodEnd == null
                    || !periodEnd.isAfter(now)
                    || periodEnd.isAfter(
                            warningEnd)) {

                continue;
            }

            /*
             * User đã chủ động lên lịch hủy thì không gửi
             * thông báo kêu gọi gia hạn gây mâu thuẫn.
             */
            if (Boolean.TRUE.equals(
                    subscription.getCancelAtPeriodEnd())) {

                continue;
            }

            SubscriptionPlan plan = subscriptionPlanRepository
                    .findById(
                            subscription.getPlanId())
                    .orElse(null);

            if (plan == null
                    || PLAN_BASIC.equalsIgnoreCase(
                            plan.getCode())) {

                continue;
            }

            try {

                NotificationDTO notification = notificationService
                        .notifySubscriptionExpiring(
                                subscription,
                                plan.getName());

                if (notification != null) {
                    processedCount++;
                }

            } catch (Exception notificationException) {

                LOGGER.error(
                        "Cannot process expiring notification for subscription {}",
                        subscription.getId(),
                        notificationException);
            }
        }

        if (processedCount > 0) {

            LOGGER.info(
                    "Processed {} expiring subscription notification(s) at {}",
                    processedCount,
                    now);
        }
    }
}