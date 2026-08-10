package com.example.demo.configs;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.example.demo.entities.SubscriptionPlan;
import com.example.demo.repositories.SubscriptionPlanRepository;

@Component
public class SubscriptionPlanSeeder
                implements CommandLineRunner {

        @Autowired
        private SubscriptionPlanRepository subscriptionPlanRepository;

        private String generateId() {
                return UUID.randomUUID()
                                .toString()
                                .replace("-", "")
                                .substring(0, 24);
        }

        @Override
        public void run(
                        String... args) {

                upsertPlan(
                                "BASIC",
                                "Basic",
                                "Free plan for listeners and new creators.",
                                0L,
                                180,
                                false,
                                7,
                                false,
                                false,
                                false,
                                false,
                                false);

                upsertPlan(
                                "ARTIST",
                                "Artist",
                                "More uploads, distribution and extended insights.",
                                49000L,
                                600,
                                false,
                                30,
                                true,
                                false,
                                true,
                                false,
                                false);

                upsertPlan(
                                "ARTIST_PRO",
                                "Artist Pro",
                                "Unlimited uploads and full creator tools.",
                                99000L,
                                0,
                                true,
                                0,
                                true,
                                true,
                                true,
                                true,
                                true);
        }

        private void upsertPlan(
                        String code,
                        String name,
                        String description,
                        Long monthlyPrice,
                        Integer uploadMinutesLimit,
                        Boolean unlimitedUploads,
                        Integer advancedInsightsDays,
                        Boolean canDistribute,
                        Boolean canMonetize,
                        Boolean canScheduleRelease,
                        Boolean hasMembershipBenefits,
                        Boolean hasTicketingBenefits) {

                SubscriptionPlan plan = subscriptionPlanRepository
                                .findByCode(code);

                LocalDateTime now = LocalDateTime.now();

                if (plan == null) {
                        plan = new SubscriptionPlan();

                        plan.setId(
                                        generateId());

                        plan.setCode(code);

                        plan.setCreatedAt(now);
                }

                plan.setName(name);

                plan.setDescription(
                                description);

                plan.setMonthlyPrice(
                                monthlyPrice);

                plan.setUploadMinutesLimit(
                                uploadMinutesLimit);

                plan.setUnlimitedUploads(
                                unlimitedUploads);

                plan.setAdvancedInsightsDays(
                                advancedInsightsDays);

                plan.setCanDistribute(
                                canDistribute);

                plan.setCanMonetize(
                                canMonetize);

                plan.setCanScheduleRelease(
                                canScheduleRelease);

                plan.setHasMembershipBenefits(
                                hasMembershipBenefits);

                plan.setHasTicketingBenefits(
                                hasTicketingBenefits);

                plan.setIsActive(true);

                plan.setUpdatedAt(now);

                subscriptionPlanRepository.save(
                                plan);
        }

        /*
         * =========================
         * ARTIST PRO DEMO
         * =========================
         *
         * Same benefits as Artist Pro.
         * Free direct activation.
         * Subscription duration is controlled by SubscriptionService.
         */
        private void upsertArtistProDemo() {

                SubscriptionPlan artistPro = subscriptionPlanRepository.findByCode(
                                "ARTIST_PRO");

                if (artistPro == null) {
                        throw new IllegalStateException(
                                        "ARTIST_PRO plan must exist before creating demo plan");
                }

                SubscriptionPlan demo = subscriptionPlanRepository.findByCode(
                                "ARTIST_PRO_DEMO");

                LocalDateTime now = LocalDateTime.now();

                if (demo == null) {

                        demo = new SubscriptionPlan();

                        demo.setId(
                                        generateId());

                        demo.setCode(
                                        "ARTIST_PRO_DEMO");

                        demo.setCreatedAt(
                                        now);
                }

                demo.setName(
                                "Artist Pro Demo");

                demo.setDescription(
                                "Try all Artist Pro creator tools free for 7 days.");

                /*
                 * Demo does not require VNPay.
                 */
                demo.setMonthlyPrice(
                                0L);

                /*
                 * Copy Artist Pro permissions.
                 */
                demo.setUploadMinutesLimit(
                                artistPro.getUploadMinutesLimit());

                demo.setUnlimitedUploads(
                                artistPro.getUnlimitedUploads());

                demo.setAdvancedInsightsDays(
                                artistPro.getAdvancedInsightsDays());

                demo.setCanDistribute(
                                artistPro.getCanDistribute());

                demo.setCanMonetize(
                                artistPro.getCanMonetize());

                demo.setCanScheduleRelease(
                                artistPro.getCanScheduleRelease());

                demo.setHasMembershipBenefits(
                                artistPro.getHasMembershipBenefits());

                demo.setHasTicketingBenefits(
                                artistPro.getHasTicketingBenefits());

                demo.setIsActive(
                                true);

                demo.setUpdatedAt(
                                now);

                subscriptionPlanRepository.save(
                                demo);
        }
}