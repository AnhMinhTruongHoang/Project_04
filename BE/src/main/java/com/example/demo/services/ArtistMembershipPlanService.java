package com.example.demo.services;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.CreateArtistMembershipPlanDTO;
import com.example.demo.dtos.SubscriptionAccessDTO;
import com.example.demo.dtos.UpdateArtistMembershipPlanDTO;
import com.example.demo.entities.ArtistMembershipPlan;
import com.example.demo.entities.User;
import com.example.demo.repositories.ArtistMembershipPlanRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class ArtistMembershipPlanService {

        private static final int MAXIMUM_PLANS_PER_ARTIST = 2;

        private static final String CURRENCY_VND = "VND";

        private final ArtistMembershipPlanRepository artistMembershipPlanRepository;

        private final UserRepository userRepository;

        private final SubscriptionService subscriptionService;

        @Value("${membership.minimum-plan-price:10000}")
        private long minimumPlanPrice;

        @Value("${membership.maximum-plan-price:10000000}")
        private long maximumPlanPrice;

        public ArtistMembershipPlanService(
                        ArtistMembershipPlanRepository artistMembershipPlanRepository,
                        UserRepository userRepository,
                        SubscriptionService subscriptionService) {

                this.artistMembershipPlanRepository = artistMembershipPlanRepository;

                this.userRepository = userRepository;

                this.subscriptionService = subscriptionService;
        }

        /*
         * =========================
         * PUBLIC ACTIVE PLANS
         * =========================
         */
        @Transactional(readOnly = true)
        public List<Map<String, Object>> getPublicPlans(
                        String artistId) {

                validateArtistId(
                                artistId);

                return artistMembershipPlanRepository
                                .findByArtistIdAndActiveTrueOrderByDisplayOrderAscMonthlyPriceAsc(
                                                artistId.trim())
                                .stream()
                                .map(this::toPlanResponse)
                                .toList();
        }

        /*
         * =========================
         * ARTIST GET ALL PLANS
         * =========================
         */
        @Transactional(readOnly = true)
        public List<Map<String, Object>> getArtistPlans(
                        String artistId) {

                assertActiveArtist(
                                artistId);

                return artistMembershipPlanRepository
                                .findByArtistIdOrderByDisplayOrderAscMonthlyPriceAsc(
                                                artistId.trim())
                                .stream()
                                .map(this::toPlanResponse)
                                .toList();
        }

        /*
         * =========================
         * CREATE PLAN
         * =========================
         */
        @Transactional
        public Map<String, Object> createPlan(
                        String artistId,
                        CreateArtistMembershipPlanDTO dto) {

                assertMembershipFeatureAccess(
                                artistId);

                validateCreateDTO(
                                dto);

                String normalizedArtistId = artistId.trim();

                long currentPlanCount = artistMembershipPlanRepository.countByArtistId(
                                normalizedArtistId);

                if (currentPlanCount >= MAXIMUM_PLANS_PER_ARTIST) {
                        throw new IllegalStateException(
                                        "An artist can create a maximum of two membership plans");
                }

                String code = normalizeCode(
                                dto.getCode());

                boolean duplicatedCode = artistMembershipPlanRepository
                                .existsByArtistIdAndCodeIgnoreCase(
                                                normalizedArtistId,
                                                code);

                if (duplicatedCode) {
                        throw new IllegalStateException(
                                        "A membership plan with this code already exists");
                }

                ArtistMembershipPlan plan = new ArtistMembershipPlan();

                plan.setArtistId(
                                normalizedArtistId);

                plan.setCode(
                                code);

                plan.setName(
                                normalizeRequiredText(
                                                dto.getName(),
                                                "Plan name",
                                                100));

                plan.setDescription(
                                normalizeOptionalText(
                                                dto.getDescription(),
                                                1000));

                plan.setMonthlyPrice(
                                validatePrice(
                                                dto.getMonthlyPrice()));

                plan.setCurrency(
                                CURRENCY_VND);

                plan.setBadgeName(
                                normalizeRequiredText(
                                                dto.getBadgeName(),
                                                "Badge name",
                                                100));

                plan.setBadgeColor(
                                normalizeBadgeColor(
                                                dto.getBadgeColor()));

                plan.setDisplayOrder(
                                normalizeDisplayOrder(
                                                dto.getDisplayOrder()));

                plan.setActive(
                                true);

                ArtistMembershipPlan savedPlan = artistMembershipPlanRepository.saveAndFlush(
                                plan);

                return toPlanResponse(
                                savedPlan);
        }

        /*
         * =========================
         * UPDATE PLAN
         * =========================
         */
        @Transactional
        public Map<String, Object> updatePlan(
                        String artistId,
                        String planId,
                        UpdateArtistMembershipPlanDTO dto) {

                assertMembershipFeatureAccess(
                                artistId);

                validatePlanId(
                                planId);

                validateUpdateDTO(
                                dto);

                ArtistMembershipPlan plan = artistMembershipPlanRepository
                                .findByIdAndArtistIdForUpdate(
                                                planId.trim(),
                                                artistId.trim())
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Membership plan not found"));

                if (dto.getName() != null) {
                        plan.setName(
                                        normalizeRequiredText(
                                                        dto.getName(),
                                                        "Plan name",
                                                        100));
                }

                /*
                 * Chuỗi rỗng được dùng để xóa description.
                 */
                if (dto.getDescription() != null) {
                        plan.setDescription(
                                        normalizeOptionalText(
                                                        dto.getDescription(),
                                                        1000));
                }

                if (dto.getMonthlyPrice() != null) {
                        plan.setMonthlyPrice(
                                        validatePrice(
                                                        dto.getMonthlyPrice()));
                }

                if (dto.getBadgeName() != null) {
                        plan.setBadgeName(
                                        normalizeRequiredText(
                                                        dto.getBadgeName(),
                                                        "Badge name",
                                                        100));
                }

                if (dto.getBadgeColor() != null) {
                        plan.setBadgeColor(
                                        normalizeBadgeColor(
                                                        dto.getBadgeColor()));
                }

                if (dto.getDisplayOrder() != null) {
                        plan.setDisplayOrder(
                                        normalizeDisplayOrder(
                                                        dto.getDisplayOrder()));
                }

                if (dto.getActive() != null) {
                        plan.setActive(
                                        dto.getActive());
                }

                ArtistMembershipPlan savedPlan = artistMembershipPlanRepository.saveAndFlush(
                                plan);

                return toPlanResponse(
                                savedPlan);
        }

        /*
         * =========================
         * ARTIST ACCESS
         * =========================
         */
        private User assertActiveArtist(
                        String artistId) {

                validateArtistId(
                                artistId);

                User artist = userRepository
                                .findById(
                                                artistId.trim())
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Artist not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                artist.getAccountStatus())) {

                        throw new SecurityException(
                                        "Artist account is not active");
                }

                if (!"ARTIST".equalsIgnoreCase(
                                artist.getType())) {

                        throw new SecurityException(
                                        "Only artist accounts can manage membership plans");
                }

                return artist;
        }

        private void assertMembershipFeatureAccess(
                        String artistId) {

                assertActiveArtist(
                                artistId);

                SubscriptionAccessDTO access = subscriptionService.getAccessForUser(
                                artistId.trim());

                if (!Boolean.TRUE.equals(
                                access.getHasMembershipBenefits())) {

                        throw new SecurityException(
                                        "Your SoundClone plan does not include membership features");
                }
        }

        /*
         * =========================
         * VALIDATION
         * =========================
         */
        private void validateCreateDTO(
                        CreateArtistMembershipPlanDTO dto) {

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Membership plan information is required");
                }

                normalizeCode(
                                dto.getCode());

                normalizeRequiredText(
                                dto.getName(),
                                "Plan name",
                                100);

                normalizeOptionalText(
                                dto.getDescription(),
                                1000);

                validatePrice(
                                dto.getMonthlyPrice());

                normalizeRequiredText(
                                dto.getBadgeName(),
                                "Badge name",
                                100);

                normalizeBadgeColor(
                                dto.getBadgeColor());

                normalizeDisplayOrder(
                                dto.getDisplayOrder());
        }

        private void validateUpdateDTO(
                        UpdateArtistMembershipPlanDTO dto) {

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Membership plan update information is required");
                }

                boolean hasChanges = dto.getName() != null
                                || dto.getDescription() != null
                                || dto.getMonthlyPrice() != null
                                || dto.getBadgeName() != null
                                || dto.getBadgeColor() != null
                                || dto.getDisplayOrder() != null
                                || dto.getActive() != null;

                if (!hasChanges) {
                        throw new IllegalArgumentException(
                                        "No membership plan changes were provided");
                }
        }

        private void validateArtistId(
                        String artistId) {

                if (artistId == null
                                || artistId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Artist ID is required");
                }
        }

        private void validatePlanId(
                        String planId) {

                if (planId == null
                                || planId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Membership plan ID is required");
                }
        }

        private String normalizeCode(
                        String value) {

                if (value == null
                                || value.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Plan code is required");
                }

                String normalized = value
                                .trim()
                                .toUpperCase(
                                                Locale.ROOT);

                if (!normalized.matches(
                                "^[A-Z][A-Z0-9_]{2,49}$")) {

                        throw new IllegalArgumentException(
                                        "Plan code must contain 3 to 50 uppercase letters, numbers or underscores");
                }

                return normalized;
        }

        private String normalizeRequiredText(
                        String value,
                        String fieldName,
                        int maximumLength) {

                if (value == null
                                || value.isBlank()) {

                        throw new IllegalArgumentException(
                                        fieldName + " is required");
                }

                String normalized = value.trim();

                if (normalized.length() > maximumLength) {
                        throw new IllegalArgumentException(
                                        fieldName
                                                        + " must not exceed "
                                                        + maximumLength
                                                        + " characters");
                }

                return normalized;
        }

        private String normalizeOptionalText(
                        String value,
                        int maximumLength) {

                if (value == null
                                || value.isBlank()) {

                        return null;
                }

                String normalized = value.trim();

                if (normalized.length() > maximumLength) {
                        throw new IllegalArgumentException(
                                        "Description must not exceed "
                                                        + maximumLength
                                                        + " characters");
                }

                return normalized;
        }

        private Long validatePrice(
                        Long value) {

                if (value == null) {
                        throw new IllegalArgumentException(
                                        "Monthly price is required");
                }

                long minimumPrice = Math.max(
                                minimumPlanPrice,
                                1L);

                long maximumPrice = Math.max(
                                maximumPlanPrice,
                                minimumPrice);

                if (value < minimumPrice) {
                        throw new IllegalArgumentException(
                                        "Minimum membership price is "
                                                        + minimumPrice
                                                        + " VND");
                }

                if (value > maximumPrice) {
                        throw new IllegalArgumentException(
                                        "Maximum membership price is "
                                                        + maximumPrice
                                                        + " VND");
                }

                return value;
        }

        private String normalizeBadgeColor(
                        String value) {

                String normalized = value == null || value.isBlank()
                                ? "#FF5500"
                                : value.trim().toUpperCase(
                                                Locale.ROOT);

                if (!normalized.matches(
                                "^#[0-9A-F]{6}$")) {

                        throw new IllegalArgumentException(
                                        "Badge color must use hexadecimal format, for example #FF5500");
                }

                return normalized;
        }

        private Integer normalizeDisplayOrder(
                        Integer value) {

                int normalized = value == null
                                ? 0
                                : value;

                if (normalized < 0
                                || normalized > 100) {

                        throw new IllegalArgumentException(
                                        "Display order must be between 0 and 100");
                }

                return normalized;
        }

        /*
         * =========================
         * RESPONSE
         * =========================
         */
        private Map<String, Object> toPlanResponse(
                        ArtistMembershipPlan plan) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                plan.getId());

                result.put(
                                "artistId",
                                plan.getArtistId());

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
                                "currency",
                                plan.getCurrency());

                result.put(
                                "badgeName",
                                plan.getBadgeName());

                result.put(
                                "badgeColor",
                                plan.getBadgeColor());

                result.put(
                                "displayOrder",
                                plan.getDisplayOrder());

                result.put(
                                "active",
                                Boolean.TRUE.equals(
                                                plan.getActive()));

                result.put(
                                "createdAt",
                                plan.getCreatedAt());

                result.put(
                                "updatedAt",
                                plan.getUpdatedAt());

                return result;
        }
}