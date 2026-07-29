package com.example.demo.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.Date;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.SubscriptionAccessDTO;
import com.example.demo.entities.SubscriptionPlan;
import com.example.demo.entities.SubscriptionUsage;
import com.example.demo.entities.User;
import com.example.demo.entities.UserSubscription;
import com.example.demo.exceptions.UploadQuotaExceededException;
import com.example.demo.repositories.SubscriptionPlanRepository;
import com.example.demo.repositories.SubscriptionUsageRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.repositories.UserSubscriptionRepository;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class SubscriptionService {

        private static final String PLAN_BASIC = "BASIC";

        private static final String STATUS_ACTIVE = "ACTIVE";

        private static final String STATUS_EXPIRED = "EXPIRED";

        private static final String PLAN_ARTIST = "ARTIST";

        private static final String PLAN_ARTIST_PRO = "ARTIST_PRO";

        @Autowired
        private SubscriptionPlanRepository subscriptionPlanRepository;

        @Autowired
        private UserSubscriptionRepository userSubscriptionRepository;

        @Autowired
        private SubscriptionUsageRepository subscriptionUsageRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private NotificationService notificationService;

        private String generateId() {
                return UUID.randomUUID()
                                .toString()
                                .replace("-", "")
                                .substring(0, 24);
        }

        public List<Map<String, Object>> getPlans() {
                return subscriptionPlanRepository
                                .findByIsActiveTrueOrderByMonthlyPriceAsc()
                                .stream()
                                .map(this::toPlanResponse)
                                .collect(Collectors.toList());
        }

        /// overview chart
        @Transactional(readOnly = true)
        public Map<String, Object> getInsights(
                        String period) {

                String normalizedPeriod = period == null
                                ? "monthly"
                                : period.trim().toLowerCase();

                LocalDateTime now = LocalDateTime.now();

                List<InsightBucket> buckets = buildInsightBuckets(
                                normalizedPeriod,
                                now);

                LocalDateTime rangeStart = buckets.get(0).getStart();

                LocalDateTime rangeEnd = now.plusSeconds(1);

                List<UserSubscription> subscriptions = userSubscriptionRepository
                                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
                                                rangeStart,
                                                rangeEnd);

                Map<String, String> planCodeById = new HashMap<>();

                for (SubscriptionPlan plan : subscriptionPlanRepository.findAll()) {

                        planCodeById.put(
                                        plan.getId(),
                                        plan.getCode());
                }

                List<Map<String, Object>> points = new ArrayList<>();

                for (InsightBucket bucket : buckets) {

                        long artistCount = 0;
                        long artistProCount = 0;

                        for (UserSubscription subscription : subscriptions) {

                                LocalDateTime createdAt = subscription.getCreatedAt();

                                if (createdAt == null) {
                                        continue;
                                }

                                boolean insideBucket = !createdAt.isBefore(
                                                bucket.getStart())
                                                && createdAt.isBefore(
                                                                bucket.getEnd());

                                if (!insideBucket) {
                                        continue;
                                }

                                String planCode = planCodeById.get(
                                                subscription.getPlanId());

                                if (PLAN_ARTIST.equals(
                                                planCode)) {

                                        artistCount++;

                                } else if (PLAN_ARTIST_PRO.equals(
                                                planCode)) {

                                        artistProCount++;
                                }
                        }

                        Map<String, Object> point = new LinkedHashMap<>();

                        point.put(
                                        "label",
                                        bucket.getLabel());

                        point.put(
                                        "artist",
                                        artistCount);

                        point.put(
                                        "artistPro",
                                        artistProCount);

                        points.add(point);
                }

                long activeArtist = 0;
                long activeArtistPro = 0;

                List<UserSubscription> activeSubscriptions = userSubscriptionRepository
                                .findByStatus(
                                                STATUS_ACTIVE);

                for (UserSubscription subscription : activeSubscriptions) {

                        String planCode = planCodeById.get(
                                        subscription.getPlanId());

                        if (PLAN_ARTIST.equals(
                                        planCode)) {

                                activeArtist++;

                        } else if (PLAN_ARTIST_PRO.equals(
                                        planCode)) {

                                activeArtistPro++;
                        }
                }

                Map<String, Object> totals = new LinkedHashMap<>();

                totals.put(
                                "artist",
                                activeArtist);

                totals.put(
                                "artistPro",
                                activeArtistPro);

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "period",
                                normalizedPeriod);

                result.put(
                                "metric",
                                "PLAN_ACTIVATIONS");

                result.put(
                                "points",
                                points);

                result.put(
                                "totals",
                                totals);

                return result;
        }

        ///

        @Transactional
        public Map<String, Object> getMySubscription(
                        String userId) {

                lockUser(userId);

                UserSubscription subscription = getOrCreateCurrentSubscription(
                                userId);

                SubscriptionPlan plan = getPlan(subscription.getPlanId());

                SubscriptionUsage usage = getOrCreateUsage(subscription);

                return buildSubscriptionResponse(
                                subscription,
                                plan,
                                usage);
        }

        ///
        private List<InsightBucket> buildInsightBuckets(
                        String period,
                        LocalDateTime now) {

                List<InsightBucket> buckets = new ArrayList<>();

                switch (period) {

                        case "weekly": {

                                LocalDate firstDate = now.toLocalDate()
                                                .minusDays(6);

                                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                                                "EEE",
                                                Locale.ENGLISH);

                                for (int index = 0; index < 7; index++) {

                                        LocalDateTime start = firstDate
                                                        .plusDays(index)
                                                        .atStartOfDay();

                                        LocalDateTime end = index == 6
                                                        ? now.plusSeconds(1)
                                                        : start.plusDays(1);

                                        String label = start.toLocalDate()
                                                        .format(formatter);

                                        buckets.add(
                                                        new InsightBucket(
                                                                        label,
                                                                        start,
                                                                        end));
                                }

                                break;
                        }

                        case "yearly": {

                                LocalDate firstMonth = now.toLocalDate()
                                                .withDayOfMonth(1)
                                                .minusMonths(11);

                                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                                                "MMM",
                                                Locale.ENGLISH);

                                for (int index = 0; index < 12; index++) {

                                        LocalDateTime start = firstMonth
                                                        .plusMonths(index)
                                                        .atStartOfDay();

                                        LocalDateTime end = index == 11
                                                        ? now.plusSeconds(1)
                                                        : firstMonth
                                                                        .plusMonths(
                                                                                        index + 1)
                                                                        .atStartOfDay();

                                        String label = start.toLocalDate()
                                                        .format(formatter);

                                        buckets.add(
                                                        new InsightBucket(
                                                                        label,
                                                                        start,
                                                                        end));
                                }

                                break;
                        }

                        case "monthly": {

                                LocalDateTime firstWeek = now.minusWeeks(4)
                                                .toLocalDate()
                                                .atStartOfDay();

                                for (int index = 0; index < 4; index++) {

                                        LocalDateTime start = firstWeek.plusWeeks(
                                                        index);

                                        LocalDateTime end = index == 3
                                                        ? now.plusSeconds(1)
                                                        : firstWeek.plusWeeks(
                                                                        index + 1);

                                        buckets.add(
                                                        new InsightBucket(
                                                                        "Week " + (index + 1),
                                                                        start,
                                                                        end));
                                }

                                break;
                        }

                        default:
                                throw new IllegalArgumentException(
                                                "Period must be weekly, monthly, or yearly");
                }

                return buckets;
        }

        /*
         * =========================
         * LEGACY DIRECT SUBSCRIPTION
         * =========================
         */
        @Deprecated(forRemoval = true)
        @Transactional(readOnly = true)
        public Map<String, Object> subscribe(
                        String userId,
                        String planCode) {

                String normalizedPlanCode = planCode == null
                                ? ""
                                : planCode.trim().toUpperCase();

                if (userId == null || userId.isBlank()) {
                        throw new IllegalArgumentException(
                                        "User ID is required");
                }

                if (normalizedPlanCode.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Plan code is required");
                }

                /*
                 * Không cho bất kỳ controller/service nào
                 * kích hoạt subscription trực tiếp.
                 *
                 * BASIC được hệ thống tự tạo.
                 * ARTIST và ARTIST_PRO phải qua VNPAY.
                 */
                throw new IllegalStateException(
                                "Direct subscription activation is disabled. "
                                                + "Paid plans must be activated through a verified VNPAY IPN.");
        }

        ///
        @Transactional
        public Map<String, Object> cancel(
                        String userId) {

                lockUser(userId);

                UserSubscription subscription = getOrCreateCurrentSubscription(
                                userId);

                SubscriptionPlan plan = getPlan(subscription.getPlanId());

                if (PLAN_BASIC.equals(plan.getCode())) {
                        throw new IllegalArgumentException(
                                        "Basic plan cannot be canceled");
                }

                subscription.setCancelAtPeriodEnd(
                                true);

                subscription.setUpdatedAt(
                                LocalDateTime.now());

                userSubscriptionRepository.save(
                                subscription);

                scheduleNotificationAfterCommit(
                                () -> notificationService
                                                .notifySubscriptionCancelScheduled(
                                                                subscription,
                                                                plan.getName()),
                                subscription.getId(),
                                "cancel scheduled");

                SubscriptionUsage usage = getOrCreateUsage(subscription);

                return buildSubscriptionResponse(
                                subscription,
                                plan,
                                usage);
        }

        @Transactional
        public SubscriptionAccessDTO getAccessForUser(
                        String userId) {

                UserSubscription subscription = getOrCreateCurrentSubscription(
                                userId);

                SubscriptionPlan plan = getPlan(subscription.getPlanId());

                SubscriptionUsage usage = getOrCreateUsage(subscription);

                long uploadedSeconds = usage.getUploadedSeconds() == null
                                ? 0
                                : usage.getUploadedSeconds();

                long uploadLimitSeconds = plan.getUploadMinutesLimit() == null
                                ? 0
                                : plan.getUploadMinutesLimit()
                                                * 60L;

                long remainingSeconds = Boolean.TRUE.equals(
                                plan.getUnlimitedUploads())
                                                ? Long.MAX_VALUE
                                                : Math.max(
                                                                uploadLimitSeconds
                                                                                - uploadedSeconds,
                                                                0);

                SubscriptionAccessDTO access = new SubscriptionAccessDTO();

                access.setPlanCode(
                                plan.getCode());

                access.setUnlimitedUploads(
                                Boolean.TRUE.equals(
                                                plan.getUnlimitedUploads()));

                access.setUploadLimitSeconds(
                                uploadLimitSeconds);

                access.setUploadedSeconds(
                                uploadedSeconds);

                access.setRemainingSeconds(
                                remainingSeconds);

                access.setCanDistribute(
                                Boolean.TRUE.equals(
                                                plan.getCanDistribute()));

                access.setCanMonetize(
                                Boolean.TRUE.equals(
                                                plan.getCanMonetize()));

                access.setCanScheduleRelease(
                                Boolean.TRUE.equals(
                                                plan.getCanScheduleRelease()));

                access.setHasMembershipBenefits(
                                Boolean.TRUE.equals(
                                                plan.getHasMembershipBenefits()));

                access.setAdvancedInsightsDays(
                                plan.getAdvancedInsightsDays());

                return access;
        }

        @Transactional
        public void addUploadedSeconds(
                        String userId,
                        long uploadedSeconds) {

                if (uploadedSeconds <= 0) {
                        return;
                }

                UserSubscription subscription = getOrCreateCurrentSubscription(
                                userId);

                SubscriptionUsage usage = getOrCreateUsage(subscription);

                long currentSeconds = usage.getUploadedSeconds() == null
                                ? 0
                                : usage.getUploadedSeconds();

                usage.setUploadedSeconds(
                                currentSeconds
                                                + uploadedSeconds);

                usage.setUpdatedAt(
                                LocalDateTime.now());

                subscriptionUsageRepository.save(
                                usage);
        }

        ///
        private UserSubscription getOrCreateCurrentSubscription(
                        String userId) {

                LocalDateTime now = LocalDateTime.now();

                UserSubscription subscription = userSubscriptionRepository
                                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                                                userId,
                                                STATUS_ACTIVE)
                                .orElse(null);

                /*
                 * User chưa có subscription:
                 * tự tạo gói BASIC/FREE.
                 */
                if (subscription == null) {

                        SubscriptionPlan basicPlan = subscriptionPlanRepository
                                        .findByCodeAndIsActiveTrue(
                                                        PLAN_BASIC);

                        if (basicPlan == null) {
                                throw new IllegalStateException(
                                                "Basic subscription plan is missing");
                        }

                        UserSubscription basicSubscription = createSubscription(
                                        userId,
                                        basicPlan,
                                        now);

                        syncUserSubscriptionTier(
                                        userId,
                                        PLAN_BASIC);

                        return basicSubscription;
                }

                /*
                 * Subscription vẫn còn hạn.
                 */
                if (subscription.getCurrentPeriodEnd() == null
                                || now.isBefore(
                                                subscription.getCurrentPeriodEnd())) {

                        return subscription;
                }

                SubscriptionPlan currentPlan = getPlan(
                                subscription.getPlanId());

                /*
                 * BASIC là gói miễn phí:
                 * được tạo chu kỳ usage mới mỗi tháng.
                 */
                if (PLAN_BASIC.equals(
                                currentPlan.getCode())) {

                        subscription.setCurrentPeriodStart(
                                        now);

                        subscription.setCurrentPeriodEnd(
                                        now.plusMonths(1));

                        subscription.setCancelAtPeriodEnd(
                                        false);

                        subscription.setUpdatedAt(
                                        now);

                        UserSubscription renewedBasic = userSubscriptionRepository
                                        .save(subscription);

                        syncUserSubscriptionTier(
                                        userId,
                                        PLAN_BASIC);

                        return renewedBasic;
                }

                /*
                 * ARTIST / ARTIST_PRO hết hạn:
                 * tuyệt đối không tự gia hạn miễn phí.
                 */
                subscription.setStatus(
                                STATUS_EXPIRED);

                subscription.setUpdatedAt(
                                now);

                userSubscriptionRepository.save(
                                subscription);

                scheduleNotificationAfterCommit(
                                () -> notificationService
                                                .notifySubscriptionExpired(
                                                                subscription,
                                                                currentPlan.getName()),
                                subscription.getId(),
                                "expired");

                SubscriptionPlan basicPlan = subscriptionPlanRepository
                                .findByCodeAndIsActiveTrue(
                                                PLAN_BASIC);

                if (basicPlan == null) {
                        throw new IllegalStateException(
                                        "Basic subscription plan is missing");
                }

                UserSubscription basicSubscription = createSubscription(
                                userId,
                                basicPlan,
                                now);

                syncUserSubscriptionTier(
                                userId,
                                PLAN_BASIC);

                return basicSubscription;
        }

        //// helper
        private void syncUserSubscriptionTier(
                        String userId,
                        String planCode) {

                User user = userRepository
                                .findById(userId)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "User not found"));

                String subscriptionTier = PLAN_BASIC.equals(
                                planCode)
                                                ? "FREE"
                                                : planCode;

                if (subscriptionTier.equalsIgnoreCase(
                                String.valueOf(
                                                user.getSubscriptionTier()))) {
                        return;
                }

                user.setSubscriptionTier(
                                subscriptionTier);

                user.setUpdatedAt(
                                new Date());

                userRepository.save(
                                user);
        }

        ///

        private UserSubscription createSubscription(

                        String userId,
                        SubscriptionPlan plan,
                        LocalDateTime now) {

                UserSubscription subscription = new UserSubscription();

                subscription.setId(
                                generateId());

                subscription.setUserId(
                                userId);

                subscription.setPlanId(
                                plan.getId());

                subscription.setStatus(
                                STATUS_ACTIVE);

                subscription.setStartedAt(
                                now);

                subscription.setCurrentPeriodStart(
                                now);

                subscription.setCurrentPeriodEnd(
                                now.plusMonths(1));

                subscription.setCancelAtPeriodEnd(
                                false);

                subscription.setCreatedAt(
                                now);

                subscription.setUpdatedAt(
                                now);

                return userSubscriptionRepository.save(
                                subscription);
        }

        private UserSubscription createSubscriptionForPeriod(
                        String userId,
                        SubscriptionPlan plan,
                        LocalDateTime now,
                        LocalDateTime periodStart,
                        LocalDateTime periodEnd) {

                LocalDateTime safePeriodStart = periodStart == null
                                ? now
                                : periodStart;

                LocalDateTime safePeriodEnd = periodEnd == null
                                || !periodEnd.isAfter(
                                                safePeriodStart)
                                                                ? safePeriodStart
                                                                                .plusMonths(1)
                                                                : periodEnd;

                UserSubscription subscription = new UserSubscription();

                subscription.setId(
                                generateId());

                subscription.setUserId(
                                userId);

                subscription.setPlanId(
                                plan.getId());

                subscription.setStatus(
                                STATUS_ACTIVE);

                /*
                 * startedAt là thời điểm user
                 * bắt đầu dùng gói mới.
                 */
                subscription.setStartedAt(
                                now);

                /*
                 * Chu kỳ thanh toán vẫn giữ
                 * theo subscription cũ.
                 */
                subscription.setCurrentPeriodStart(
                                safePeriodStart);

                subscription.setCurrentPeriodEnd(
                                safePeriodEnd);

                subscription.setCancelAtPeriodEnd(
                                false);

                subscription.setCreatedAt(
                                now);

                subscription.setUpdatedAt(
                                now);

                return userSubscriptionRepository.save(
                                subscription);
        }

        private SubscriptionUsage createUsage(
                        UserSubscription subscription,
                        long uploadedSeconds) {

                LocalDateTime now = LocalDateTime.now();

                SubscriptionUsage usage = new SubscriptionUsage();

                usage.setId(
                                generateId());

                usage.setUserId(
                                subscription.getUserId());

                usage.setSubscriptionId(
                                subscription.getId());

                usage.setPeriodStart(
                                subscription.getCurrentPeriodStart());

                usage.setPeriodEnd(
                                subscription.getCurrentPeriodEnd());

                usage.setUploadedSeconds(
                                Math.max(
                                                uploadedSeconds,
                                                0));

                usage.setCreatedAt(
                                now);

                usage.setUpdatedAt(
                                now);

                return subscriptionUsageRepository.save(
                                usage);
        }

        private SubscriptionUsage getOrCreateUsage(
                        UserSubscription subscription) {

                LocalDateTime now = LocalDateTime.now();

                SubscriptionUsage usage = subscriptionUsageRepository
                                .findCurrentUsage(
                                                subscription.getUserId(),
                                                subscription.getId(),
                                                now)
                                .orElse(null);

                if (usage != null) {
                        return usage;
                }

                return createUsage(
                                subscription,
                                0L);
        }

        private SubscriptionPlan getPlan(
                        String planId) {

                return subscriptionPlanRepository
                                .findById(planId)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Subscription plan not found"));
        }

        private Map<String, Object> buildSubscriptionResponse(
                        UserSubscription subscription,
                        SubscriptionPlan plan,
                        SubscriptionUsage usage) {

                Map<String, Object> subscriptionData = new LinkedHashMap<>();

                subscriptionData.put(
                                "id",
                                subscription.getId());

                subscriptionData.put(
                                "status",
                                subscription.getStatus());

                subscriptionData.put(
                                "startedAt",
                                subscription.getStartedAt());

                subscriptionData.put(
                                "currentPeriodStart",
                                subscription.getCurrentPeriodStart());

                subscriptionData.put(
                                "currentPeriodEnd",
                                subscription.getCurrentPeriodEnd());

                subscriptionData.put(
                                "cancelAtPeriodEnd",
                                Boolean.TRUE.equals(
                                                subscription.getCancelAtPeriodEnd()));

                long uploadedSeconds = usage.getUploadedSeconds() == null
                                ? 0
                                : usage.getUploadedSeconds();

                boolean unlimited = Boolean.TRUE.equals(
                                plan.getUnlimitedUploads());

                int limitMinutes = plan.getUploadMinutesLimit() == null
                                ? 0
                                : plan.getUploadMinutesLimit();

                double uploadedMinutes = uploadedSeconds / 60.0;

                double percentage = unlimited || limitMinutes <= 0
                                ? 0
                                : Math.min(
                                                uploadedMinutes
                                                                / limitMinutes
                                                                * 100,
                                                100);

                double remainingMinutes = unlimited
                                ? -1
                                : Math.max(
                                                limitMinutes
                                                                - uploadedMinutes,
                                                0);

                Map<String, Object> usageData = new LinkedHashMap<>();

                usageData.put(
                                "uploadedSeconds",
                                uploadedSeconds);

                usageData.put(
                                "uploadedMinutes",
                                uploadedMinutes);

                usageData.put(
                                "limitMinutes",
                                limitMinutes);

                usageData.put(
                                "remainingMinutes",
                                remainingMinutes);

                usageData.put(
                                "percentage",
                                percentage);

                usageData.put(
                                "unlimited",
                                unlimited);

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "plan",
                                toPlanResponse(plan));

                result.put(
                                "subscription",
                                subscriptionData);

                result.put(
                                "usage",
                                usageData);

                return result;
        }

        private Map<String, Object> toPlanResponse(
                        SubscriptionPlan plan) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                plan.getId());

                result.put(
                                "code",
                                plan.getCode());

                result.put(
                                "name",
                                plan.getName());

                result.put(
                                "description",
                                plan.getDescription());

                result.put(
                                "monthlyPrice",
                                plan.getMonthlyPrice());

                result.put(
                                "uploadMinutesLimit",
                                plan.getUploadMinutesLimit());

                result.put(
                                "unlimitedUploads",
                                Boolean.TRUE.equals(
                                                plan.getUnlimitedUploads()));

                result.put(
                                "advancedInsightsDays",
                                plan.getAdvancedInsightsDays());

                result.put(
                                "canDistribute",
                                Boolean.TRUE.equals(
                                                plan.getCanDistribute()));

                result.put(
                                "canMonetize",
                                Boolean.TRUE.equals(
                                                plan.getCanMonetize()));

                result.put(
                                "canScheduleRelease",
                                Boolean.TRUE.equals(
                                                plan.getCanScheduleRelease()));

                result.put(
                                "hasMembershipBenefits",
                                Boolean.TRUE.equals(
                                                plan.getHasMembershipBenefits()));

                result.put(
                                "isActive",
                                Boolean.TRUE.equals(
                                                plan.getIsActive()));

                return result;
        }

        /// method khóa user
        private User lockUser(
                        String userId) {

                return userRepository
                                .findByIdForUpdate(userId)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "User not found"));
        }

        /// method trừ quota nguyên tử
        @Transactional(propagation = Propagation.MANDATORY)
        public void consumeUploadQuota(
                        String userId,
                        long requiredSeconds) {

                if (requiredSeconds <= 0) {
                        throw new IllegalArgumentException(
                                        "Audio duration must be greater than zero");
                }

                /*
                 * Khóa user trong transaction hiện tại.
                 * Các request upload/change plan của cùng user
                 * phải chờ nhau.
                 */
                lockUser(userId);

                UserSubscription subscription = getOrCreateCurrentSubscription(
                                userId);

                SubscriptionPlan plan = getPlan(
                                subscription.getPlanId());

                SubscriptionUsage usage = getOrCreateUsage(
                                subscription);

                long uploadedSeconds = usage.getUploadedSeconds() == null
                                ? 0
                                : usage.getUploadedSeconds();

                boolean unlimitedUploads = Boolean.TRUE.equals(
                                plan.getUnlimitedUploads());

                long uploadLimitSeconds = plan.getUploadMinutesLimit() == null
                                ? 0
                                : plan.getUploadMinutesLimit()
                                                * 60L;

                long remainingSeconds = unlimitedUploads
                                ? Long.MAX_VALUE
                                : Math.max(
                                                uploadLimitSeconds
                                                                - uploadedSeconds,
                                                0);

                if (!unlimitedUploads
                                && requiredSeconds > remainingSeconds) {

                        throw new UploadQuotaExceededException(
                                        plan.getCode(),
                                        requiredSeconds,
                                        remainingSeconds);
                }

                usage.setUploadedSeconds(
                                Math.addExact(
                                                uploadedSeconds,
                                                requiredSeconds));

                usage.setUpdatedAt(
                                LocalDateTime.now());

                subscriptionUsageRepository.save(
                                usage);
        }

        /*
         * =========================
         * ADJUST UPLOAD QUOTA
         * =========================
         */

        /*
         * Điều chỉnh quota khi user thay audio của một track.
         *
         * durationDeltaSeconds > 0:
         * Audio mới dài hơn audio cũ → trừ thêm phần chênh lệch.
         *
         * durationDeltaSeconds < 0:
         * Audio mới ngắn hơn audio cũ → hoàn lại phần chênh lệch.
         *
         * durationDeltaSeconds = 0:
         * Không thay đổi quota.
         */
        @Transactional(propagation = Propagation.MANDATORY)
        public void adjustUploadQuota(
                        String userId,
                        long durationDeltaSeconds) {

                if (userId == null
                                || userId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "User ID is required");
                }

                if (durationDeltaSeconds == 0) {
                        return;
                }

                /*
                 * Khóa user để tránh hai request upload/update
                 * cùng lúc làm sai uploadedSeconds.
                 */
                lockUser(userId);

                UserSubscription subscription = getOrCreateCurrentSubscription(
                                userId);

                SubscriptionPlan plan = getPlan(
                                subscription.getPlanId());

                SubscriptionUsage usage = getOrCreateUsage(
                                subscription);

                long uploadedSeconds = usage.getUploadedSeconds() == null
                                ? 0L
                                : usage.getUploadedSeconds();

                /*
                 * Audio mới dài hơn audio cũ.
                 */
                if (durationDeltaSeconds > 0) {

                        boolean unlimitedUploads = Boolean.TRUE.equals(
                                        plan.getUnlimitedUploads());

                        long uploadLimitSeconds = plan.getUploadMinutesLimit() == null
                                        ? 0L
                                        : plan.getUploadMinutesLimit()
                                                        * 60L;

                        long remainingSeconds = unlimitedUploads
                                        ? Long.MAX_VALUE
                                        : Math.max(
                                                        uploadLimitSeconds
                                                                        - uploadedSeconds,
                                                        0L);

                        if (!unlimitedUploads
                                        && durationDeltaSeconds > remainingSeconds) {

                                throw new UploadQuotaExceededException(
                                                plan.getCode(),
                                                durationDeltaSeconds,
                                                remainingSeconds);
                        }

                        usage.setUploadedSeconds(
                                        Math.addExact(
                                                        uploadedSeconds,
                                                        durationDeltaSeconds));
                }

                /*
                 * Audio mới ngắn hơn audio cũ.
                 */
                else {

                        long releasedSeconds;

                        if (durationDeltaSeconds == Long.MIN_VALUE) {

                                releasedSeconds = Long.MAX_VALUE;

                        } else {

                                releasedSeconds = Math.abs(
                                                durationDeltaSeconds);
                        }

                        usage.setUploadedSeconds(
                                        Math.max(
                                                        uploadedSeconds
                                                                        - Math.min(
                                                                                        uploadedSeconds,
                                                                                        releasedSeconds),
                                                        0L));
                }

                usage.setUpdatedAt(
                                LocalDateTime.now());

                subscriptionUsageRepository.save(
                                usage);
        }

        /// overview chart
        private static class InsightBucket {

                private final String label;

                private final LocalDateTime start;

                private final LocalDateTime end;

                private InsightBucket(
                                String label,
                                LocalDateTime start,
                                LocalDateTime end) {

                        this.label = label;
                        this.start = start;
                        this.end = end;
                }

                public String getLabel() {
                        return label;
                }

                public LocalDateTime getStart() {
                        return start;
                }

                public LocalDateTime getEnd() {
                        return end;
                }
        }

        ///
        /*
         * =========================
         * ACTIVATE PAID SUBSCRIPTION
         * =========================
         */
        @Transactional
        public Map<String, Object> activatePaidPlan(
                        String userId,
                        String planCode,
                        LocalDateTime paidAt) {

                String normalizedPlanCode = planCode == null
                                ? ""
                                : planCode.trim().toUpperCase();

                if (userId == null || userId.isBlank()) {
                        throw new IllegalArgumentException(
                                        "User ID is required");
                }

                if (normalizedPlanCode.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Plan code is required");
                }

                if (PLAN_BASIC.equals(normalizedPlanCode)) {
                        throw new IllegalArgumentException(
                                        "Basic plan does not require payment");
                }

                if (!PLAN_ARTIST.equals(normalizedPlanCode)
                                && !PLAN_ARTIST_PRO.equals(normalizedPlanCode)) {

                        throw new IllegalArgumentException(
                                        "Paid subscription plan is invalid");
                }

                SubscriptionPlan paidPlan = subscriptionPlanRepository
                                .findByCodeAndIsActiveTrue(
                                                normalizedPlanCode);

                if (paidPlan == null) {
                        throw new IllegalArgumentException(
                                        "Subscription plan not found");
                }

                /*
                 * Khóa user để ngăn:
                 *
                 * - IPN thanh toán chạy đồng thời
                 * - upload đồng thời
                 * - đổi plan đồng thời
                 * - hủy subscription đồng thời
                 */
                User user = lockUser(userId);

                LocalDateTime now = LocalDateTime.now();

                LocalDateTime activationTime = paidAt == null
                                ? now
                                : paidAt;

                /*
                 * Hết hạn subscription ACTIVE hiện tại.
                 *
                 * Kể cả user đang dùng cùng một plan,
                 * giao dịch thanh toán mới vẫn tạo một
                 * chu kỳ subscription mới.
                 */
                UserSubscription currentSubscription = userSubscriptionRepository
                                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                                                userId,
                                                STATUS_ACTIVE)
                                .orElse(null);

                if (currentSubscription != null) {
                        currentSubscription.setStatus(
                                        STATUS_EXPIRED);

                        currentSubscription.setCancelAtPeriodEnd(
                                        false);

                        currentSubscription.setUpdatedAt(
                                        now);

                        userSubscriptionRepository.save(
                                        currentSubscription);
                }

                /*
                 * Tạo chu kỳ trả phí mới:
                 *
                 * currentPeriodStart = thời điểm thanh toán
                 * currentPeriodEnd = sau một tháng
                 */
                UserSubscription paidSubscription = createSubscription(
                                userId,
                                paidPlan,
                                activationTime);

                /*
                 * Chu kỳ thanh toán mới có quota upload mới.
                 * Không chuyển usage của subscription cũ sang.
                 */
                SubscriptionUsage paidUsage = createUsage(
                                paidSubscription,
                                0L);

                /*
                 * Đồng bộ field dùng cho danh sách user FE.
                 */
                user.setSubscriptionTier(
                                normalizedPlanCode);

                user.setUpdatedAt(
                                new Date());

                userRepository.save(user);

                scheduleNotificationAfterCommit(
                                () -> notificationService
                                                .notifySubscriptionActivated(
                                                                paidSubscription,
                                                                paidPlan.getName()),
                                paidSubscription.getId(),
                                "activated");

                return buildSubscriptionResponse(
                                paidSubscription,
                                paidPlan,
                                paidUsage);
        }

        /*
         * =========================
         * SUBSCRIPTION NOTIFICATION
         * =========================
         */
        private void scheduleNotificationAfterCommit(
                        Runnable notificationTask,
                        String subscriptionId,
                        String eventName) {

                if (notificationTask == null) {
                        return;
                }

                Runnable safeNotificationTask = () -> {

                        try {

                                notificationTask.run();

                        } catch (Exception notificationException) {

                                System.err.println(
                                                "Cannot create subscription "
                                                                + eventName
                                                                + " notification for subscription "
                                                                + subscriptionId
                                                                + ": "
                                                                + notificationException.getMessage());
                        }
                };

                if (TransactionSynchronizationManager
                                .isActualTransactionActive()
                                && TransactionSynchronizationManager
                                                .isSynchronizationActive()) {

                        TransactionSynchronizationManager
                                        .registerSynchronization(
                                                        new TransactionSynchronization() {

                                                                @Override
                                                                public void afterCommit() {

                                                                        safeNotificationTask.run();
                                                                }
                                                        });

                        return;
                }

                safeNotificationTask.run();
        }
        ///
}