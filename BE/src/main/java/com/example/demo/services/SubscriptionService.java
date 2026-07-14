package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

@Service
public class SubscriptionService {

        private static final String PLAN_BASIC = "BASIC";

        private static final String STATUS_ACTIVE = "ACTIVE";

        private static final String STATUS_EXPIRED = "EXPIRED";

        @Autowired
        private SubscriptionPlanRepository subscriptionPlanRepository;

        @Autowired
        private UserSubscriptionRepository userSubscriptionRepository;

        @Autowired
        private SubscriptionUsageRepository subscriptionUsageRepository;

        @Autowired
        private UserRepository userRepository;

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

        /*
         * =========================
         * Giữ nguyên chu kỳ hiện tại.
         * Giữ nguyên uploadedSeconds.
         * Chỉ thay quyền và giới hạn của gói mới.
         * Không thể đổi gói liên tục để lấy lại quota.
         * =========================
         */
        ///
        @Transactional
        public Map<String, Object> subscribe(
                        String userId,
                        String planCode) {

                String normalizedPlanCode = planCode == null
                                ? ""
                                : planCode
                                                .trim()
                                                .toUpperCase();

                if (normalizedPlanCode.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "Plan code is required");
                }

                SubscriptionPlan newPlan = subscriptionPlanRepository
                                .findByCodeAndIsActiveTrue(
                                                normalizedPlanCode);

                if (newPlan == null) {
                        throw new IllegalArgumentException(
                                        "Subscription plan not found");
                }

                /*
                 * Chống upload và đổi gói
                 * đồng thời cho cùng một user.
                 */
                lockUser(userId);

                /*
                 * Đảm bảo user luôn có một
                 * subscription ACTIVE hợp lệ.
                 */
                UserSubscription currentSubscription = getOrCreateCurrentSubscription(
                                userId);

                SubscriptionPlan currentPlan = getPlan(
                                currentSubscription.getPlanId());

                SubscriptionUsage currentUsage = getOrCreateUsage(
                                currentSubscription);

                /*
                 * Đang sử dụng đúng gói thì
                 * không tạo subscription mới.
                 */
                if (newPlan.getId().equals(
                                currentPlan.getId())) {
                        return buildSubscriptionResponse(
                                        currentSubscription,
                                        currentPlan,
                                        currentUsage);
                }

                LocalDateTime now = LocalDateTime.now();

                long carriedUploadedSeconds = currentUsage.getUploadedSeconds() == null
                                ? 0
                                : currentUsage.getUploadedSeconds();

                LocalDateTime currentPeriodStart = currentSubscription
                                .getCurrentPeriodStart();

                LocalDateTime currentPeriodEnd = currentSubscription
                                .getCurrentPeriodEnd();

                /*
                 * Subscription cũ giữ lại
                 * làm lịch sử.
                 */
                currentSubscription.setStatus(
                                STATUS_EXPIRED);

                currentSubscription.setUpdatedAt(
                                now);

                userSubscriptionRepository.save(
                                currentSubscription);

                /*
                 * Subscription mới dùng đúng
                 * chu kỳ hiện tại, không tạo
                 * chu kỳ một tháng mới.
                 */
                UserSubscription newSubscription = createSubscriptionForPeriod(
                                userId,
                                newPlan,
                                now,
                                currentPeriodStart,
                                currentPeriodEnd);

                /*
                 * Chuyển toàn bộ usage đã dùng
                 * sang subscription mới.
                 */
                SubscriptionUsage newUsage = createUsage(
                                newSubscription,
                                carriedUploadedSeconds);

                return buildSubscriptionResponse(
                                newSubscription,
                                newPlan,
                                newUsage);
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

        private UserSubscription getOrCreateCurrentSubscription(
                        String userId) {

                LocalDateTime now = LocalDateTime.now();

                UserSubscription subscription = userSubscriptionRepository
                                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                                                userId,
                                                STATUS_ACTIVE)
                                .orElse(null);

                if (subscription == null) {
                        SubscriptionPlan basicPlan = subscriptionPlanRepository
                                        .findByCodeAndIsActiveTrue(
                                                        PLAN_BASIC);

                        if (basicPlan == null) {
                                throw new IllegalStateException(
                                                "Basic subscription plan is missing");
                        }

                        return createSubscription(
                                        userId,
                                        basicPlan,
                                        now);
                }

                if (subscription.getCurrentPeriodEnd() != null
                                && !now.isBefore(
                                                subscription.getCurrentPeriodEnd())) {

                        if (Boolean.TRUE.equals(
                                        subscription.getCancelAtPeriodEnd())) {

                                subscription.setStatus(
                                                STATUS_EXPIRED);

                                subscription.setUpdatedAt(now);

                                userSubscriptionRepository.save(
                                                subscription);

                                SubscriptionPlan basicPlan = subscriptionPlanRepository
                                                .findByCodeAndIsActiveTrue(
                                                                PLAN_BASIC);

                                if (basicPlan == null) {
                                        throw new IllegalStateException(
                                                        "Basic subscription plan is missing");
                                }

                                return createSubscription(
                                                userId,
                                                basicPlan,
                                                now);
                        }

                        subscription.setCurrentPeriodStart(
                                        now);

                        subscription.setCurrentPeriodEnd(
                                        now.plusMonths(1));

                        subscription.setUpdatedAt(now);

                        userSubscriptionRepository.save(
                                        subscription);
                }

                return subscription;
        }

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
        ///
}