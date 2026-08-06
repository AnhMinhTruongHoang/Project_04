package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.CreateArtistMembershipPollDTO;
import com.example.demo.dtos.SubscriptionAccessDTO;
import com.example.demo.dtos.VoteArtistMembershipPollDTO;
import com.example.demo.entities.ArtistMembershipPlan;
import com.example.demo.entities.ArtistMembershipPollOption;
import com.example.demo.entities.ArtistMembershipPollVote;
import com.example.demo.entities.ArtistMembershipPost;
import com.example.demo.entities.ArtistMembershipSubscription;
import com.example.demo.entities.User;
import com.example.demo.repositories.ArtistMembershipPlanRepository;
import com.example.demo.repositories.ArtistMembershipPollOptionRepository;
import com.example.demo.repositories.ArtistMembershipPollVoteRepository;
import com.example.demo.repositories.ArtistMembershipPostRepository;
import com.example.demo.repositories.ArtistMembershipSubscriptionRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class ArtistMembershipPollService {

        private final ArtistMembershipPostRepository artistMembershipPostRepository;

        private final ArtistMembershipPollOptionRepository artistMembershipPollOptionRepository;

        private final ArtistMembershipPollVoteRepository artistMembershipPollVoteRepository;

        private final ArtistMembershipPlanRepository artistMembershipPlanRepository;

        private final ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository;

        private final UserRepository userRepository;

        private final SubscriptionService subscriptionService;

        public ArtistMembershipPollService(
                        ArtistMembershipPostRepository artistMembershipPostRepository,

                        ArtistMembershipPollOptionRepository artistMembershipPollOptionRepository,

                        ArtistMembershipPollVoteRepository artistMembershipPollVoteRepository,

                        ArtistMembershipPlanRepository artistMembershipPlanRepository,

                        ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository,

                        UserRepository userRepository,

                        SubscriptionService subscriptionService) {

                this.artistMembershipPostRepository = artistMembershipPostRepository;

                this.artistMembershipPollOptionRepository = artistMembershipPollOptionRepository;

                this.artistMembershipPollVoteRepository = artistMembershipPollVoteRepository;

                this.artistMembershipPlanRepository = artistMembershipPlanRepository;

                this.artistMembershipSubscriptionRepository = artistMembershipSubscriptionRepository;

                this.userRepository = userRepository;

                this.subscriptionService = subscriptionService;
        }

        /*
         * =========================
         * CREATE POLL
         * =========================
         */
        @Transactional
        public Map<String, Object> createPoll(
                        String artistId,
                        CreateArtistMembershipPollDTO dto) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Poll information is required");
                }

                String question = normalizeRequiredText(
                                dto.getQuestion(),
                                "Poll question",
                                1000);

                List<String> normalizedOptions = normalizeOptions(
                                dto.getOptions());

                String visibility = normalizeVisibility(
                                dto.getVisibility());

                String status = normalizeStatus(
                                dto.getStatus());

                ArtistMembershipPost post = new ArtistMembershipPost();

                post.setArtistId(
                                artist.getId());

                post.setType(
                                ArtistMembershipPost.TYPE_POLL);

                post.setVisibility(
                                visibility);

                post.setContent(
                                question);

                post.setAllowComments(
                                dto.getAllowComments() == null
                                                ? true
                                                : dto.getAllowComments());

                post.setStatus(
                                status);

                configureRequiredPlan(
                                post,
                                artist.getId(),
                                dto.getRequiredPlanId());

                if (ArtistMembershipPost.STATUS_PUBLISHED
                                .equals(status)) {

                        post.setPublishedAt(
                                        LocalDateTime.now());
                }

                ArtistMembershipPost savedPost = artistMembershipPostRepository
                                .saveAndFlush(
                                                post);

                List<ArtistMembershipPollOption> options = new ArrayList<>();

                for (int index = 0; index < normalizedOptions.size(); index++) {

                        ArtistMembershipPollOption option = new ArtistMembershipPollOption();

                        option.setPostId(
                                        savedPost.getId());

                        option.setOptionText(
                                        normalizedOptions.get(
                                                        index));

                        option.setDisplayOrder(
                                        index + 1);

                        options.add(
                                        option);
                }

                artistMembershipPollOptionRepository
                                .saveAllAndFlush(
                                                options);

                return buildPollPostResponse(
                                savedPost,
                                artist.getId(),
                                true);
        }

        /*
         * =========================
         * GET POLL
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getPoll(
                        String postId,
                        String viewerId) {

                String normalizedPostId = normalizeRequiredText(
                                postId,
                                "Poll post ID",
                                24);

                ArtistMembershipPost post = artistMembershipPostRepository
                                .findById(
                                                normalizedPostId)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Poll post not found"));

                assertPollPost(
                                post);

                if (!ArtistMembershipPost.STATUS_PUBLISHED
                                .equalsIgnoreCase(
                                                post.getStatus())) {

                        throw new NoSuchElementException(
                                        "Poll post not found");
                }

                return buildPollPostResponse(
                                post,
                                viewerId,
                                false);
        }

        /*
         * =========================
         * VOTE OR CHANGE VOTE
         * =========================
         */
        @Transactional
        public Map<String, Object> vote(
                        String memberId,
                        String postId,
                        VoteArtistMembershipPollDTO dto) {

                User member = getActiveMember(
                                memberId);

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Poll vote information is required");
                }

                String normalizedPostId = normalizeRequiredText(
                                postId,
                                "Poll post ID",
                                24);

                String optionId = normalizeRequiredText(
                                dto.getOptionId(),
                                "Poll option ID",
                                24);

                /*
                 * Khóa Poll post trước khi đọc hoặc ghi vote.
                 *
                 * Việc này bảo vệ trường hợp cùng user gửi
                 * hai request bình chọn đầu tiên đồng thời.
                 */
                ArtistMembershipPost post = artistMembershipPostRepository
                                .findByIdForUpdate(
                                                normalizedPostId)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Poll post not found"));

                assertPollPost(
                                post);

                if (!ArtistMembershipPost.STATUS_PUBLISHED
                                .equalsIgnoreCase(
                                                post.getStatus())) {

                        throw new IllegalStateException(
                                        "This poll is not published");
                }

                PostAccess access = resolvePostAccess(
                                post,
                                member.getId(),
                                false);

                if (!access.canView()) {

                        throw new SecurityException(
                                        "You do not have access to this poll");
                }

                ArtistMembershipPollOption option = artistMembershipPollOptionRepository
                                .findByIdAndPostId(
                                                optionId,
                                                post.getId())
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Poll option not found"));

                ArtistMembershipPollVote vote = artistMembershipPollVoteRepository
                                .findByPostIdAndMemberIdForUpdate(
                                                post.getId(),
                                                member.getId())
                                .orElse(null);

                if (vote == null) {

                        vote = new ArtistMembershipPollVote();

                        vote.setPostId(
                                        post.getId());

                        vote.setMemberId(
                                        member.getId());

                        vote.setOptionId(
                                        option.getId());

                } else if (!option.getId()
                                .equals(
                                                vote.getOptionId())) {

                        /*
                         * User được phép đổi lựa chọn.
                         */
                        vote.setOptionId(
                                        option.getId());
                }

                artistMembershipPollVoteRepository
                                .saveAndFlush(
                                                vote);

                return buildPollPostResponse(
                                post,
                                member.getId(),
                                false);
        }

        /*
         * =========================
         * POLL DATA FOR COMMUNITY FEED
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> buildPollData(
                        ArtistMembershipPost post,
                        String viewerId,
                        boolean ownerMode) {

                if (post == null
                                || !ArtistMembershipPost.TYPE_POLL
                                                .equalsIgnoreCase(
                                                                post.getType())) {

                        return null;
                }

                PostAccess access = resolvePostAccess(
                                post,
                                viewerId,
                                ownerMode);

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "locked",
                                !access.canView());

                result.put(
                                "lockReason",
                                access.reason());

                if (!access.canView()) {

                        result.put(
                                        "question",
                                        null);

                        result.put(
                                        "options",
                                        List.of());

                        result.put(
                                        "totalVotes",
                                        null);

                        result.put(
                                        "viewerOptionId",
                                        null);

                        return result;
                }

                List<ArtistMembershipPollOption> options = artistMembershipPollOptionRepository
                                .findByPostIdOrderByDisplayOrderAscCreatedAtAsc(
                                                post.getId());

                ArtistMembershipPollVote viewerVote = viewerId == null
                                || viewerId.isBlank()
                                                ? null
                                                : artistMembershipPollVoteRepository
                                                                .findByPostIdAndMemberId(
                                                                                post.getId(),
                                                                                viewerId)
                                                                .orElse(null);

                long totalVotes = artistMembershipPollVoteRepository
                                .countByPostId(
                                                post.getId());

                List<Map<String, Object>> optionItems = options.stream()
                                .map(
                                                option -> buildOptionResponse(
                                                                option,
                                                                viewerVote,
                                                                totalVotes))
                                .toList();

                result.put(
                                "question",
                                post.getContent());

                result.put(
                                "options",
                                optionItems);

                result.put(
                                "totalVotes",
                                totalVotes);

                result.put(
                                "viewerOptionId",
                                viewerVote == null
                                                ? null
                                                : viewerVote.getOptionId());

                return result;
        }

        /*
         * =========================
         * POST RESPONSE
         * =========================
         */
        private Map<String, Object> buildPollPostResponse(
                        ArtistMembershipPost post,
                        String viewerId,
                        boolean ownerMode) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                post.getId());

                result.put(
                                "artistId",
                                post.getArtistId());

                result.put(
                                "type",
                                post.getType());

                result.put(
                                "visibility",
                                post.getVisibility());

                result.put(
                                "requiredPlanId",
                                post.getRequiredPlanId());

                ArtistMembershipPlan requiredPlan = post.getRequiredPlanId() == null
                                ? null
                                : artistMembershipPlanRepository
                                                .findById(
                                                                post.getRequiredPlanId())
                                                .orElse(null);

                result.put(
                                "requiredPlanName",
                                requiredPlan == null
                                                ? null
                                                : requiredPlan.getName());

                result.put(
                                "requiredBadgeName",
                                requiredPlan == null
                                                ? null
                                                : requiredPlan.getBadgeName());

                result.put(
                                "requiredBadgeColor",
                                requiredPlan == null
                                                ? null
                                                : requiredPlan.getBadgeColor());

                result.put(
                                "allowComments",
                                Boolean.TRUE.equals(
                                                post.getAllowComments()));

                result.put(
                                "status",
                                post.getStatus());

                result.put(
                                "publishedAt",
                                post.getPublishedAt());

                result.put(
                                "createdAt",
                                post.getCreatedAt());

                result.put(
                                "updatedAt",
                                post.getUpdatedAt());

                result.put(
                                "poll",
                                buildPollData(
                                                post,
                                                viewerId,
                                                ownerMode));

                return result;
        }

        /*
         * =========================
         * OPTION RESPONSE
         * =========================
         */
        private Map<String, Object> buildOptionResponse(
                        ArtistMembershipPollOption option,
                        ArtistMembershipPollVote viewerVote,
                        long totalVotes) {

                long voteCount = artistMembershipPollVoteRepository
                                .countByOptionId(
                                                option.getId());

                double percentage = totalVotes <= 0L
                                ? 0D
                                : Math.round(
                                                voteCount
                                                                * 1000D
                                                                / totalVotes)
                                                / 10D;

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                option.getId());

                result.put(
                                "text",
                                option.getOptionText());

                result.put(
                                "displayOrder",
                                option.getDisplayOrder());

                result.put(
                                "voteCount",
                                voteCount);

                result.put(
                                "percentage",
                                percentage);

                result.put(
                                "selected",
                                viewerVote != null
                                                && option.getId()
                                                                .equals(
                                                                                viewerVote.getOptionId()));

                return result;
        }

        /*
         * =========================
         * POST ACCESS
         * =========================
         */
        private PostAccess resolvePostAccess(
                        ArtistMembershipPost post,
                        String viewerId,
                        boolean ownerMode) {

                if (ownerMode
                                || post.getArtistId()
                                                .equals(
                                                                viewerId)) {

                        return new PostAccess(
                                        true,
                                        null);
                }

                if (ArtistMembershipPost.VISIBILITY_PUBLIC
                                .equalsIgnoreCase(
                                                post.getVisibility())) {

                        return new PostAccess(
                                        true,
                                        null);
                }

                if (viewerId == null
                                || viewerId.isBlank()) {

                        return new PostAccess(
                                        false,
                                        "MEMBERSHIP_REQUIRED");
                }

                User viewer = userRepository
                                .findById(
                                                viewerId)
                                .orElse(null);

                if (viewer == null
                                || !"ACTIVE".equalsIgnoreCase(
                                                viewer.getAccountStatus())) {

                        return new PostAccess(
                                        false,
                                        "MEMBERSHIP_REQUIRED");
                }

                ArtistMembershipSubscription subscription = artistMembershipSubscriptionRepository
                                .findByMemberIdAndArtistId(
                                                viewerId,
                                                post.getArtistId())
                                .orElse(null);

                boolean activeMembership = subscription != null
                                && ArtistMembershipSubscription.STATUS_ACTIVE
                                                .equalsIgnoreCase(
                                                                subscription.getStatus())
                                && subscription.getCurrentPeriodEnd() != null
                                && subscription.getCurrentPeriodEnd()
                                                .isAfter(
                                                                LocalDateTime.now());

                if (!activeMembership) {

                        return new PostAccess(
                                        false,
                                        "MEMBERSHIP_REQUIRED");
                }

                if (ArtistMembershipPost.VISIBILITY_MEMBERS_ONLY
                                .equalsIgnoreCase(
                                                post.getVisibility())) {

                        return new PostAccess(
                                        true,
                                        null);
                }

                boolean correctTier = ArtistMembershipPost.VISIBILITY_TIER_ONLY
                                .equalsIgnoreCase(
                                                post.getVisibility())
                                && post.getRequiredPlanId() != null
                                && post.getRequiredPlanId()
                                                .equals(
                                                                subscription.getPlanId());

                return correctTier
                                ? new PostAccess(
                                                true,
                                                null)
                                : new PostAccess(
                                                false,
                                                "TIER_REQUIRED");
        }

        /*
         * =========================
         * REQUIRED PLAN
         * =========================
         */
        private void configureRequiredPlan(
                        ArtistMembershipPost post,
                        String artistId,
                        String requiredPlanId) {

                if (!ArtistMembershipPost.VISIBILITY_TIER_ONLY
                                .equals(
                                                post.getVisibility())) {

                        post.setRequiredPlanId(
                                        null);

                        return;
                }

                String normalizedPlanId = normalizeRequiredText(
                                requiredPlanId,
                                "Required membership plan ID",
                                24);

                ArtistMembershipPlan plan = artistMembershipPlanRepository
                                .findByIdAndArtistId(
                                                normalizedPlanId,
                                                artistId)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Required membership plan not found"));

                if (!Boolean.TRUE.equals(
                                plan.getActive())) {

                        throw new IllegalStateException(
                                        "Required membership plan is not active");
                }

                post.setRequiredPlanId(
                                plan.getId());
        }

        /*
         * =========================
         * ARTIST ACCESS
         * =========================
         */
        private User assertArtistCanManageMembership(
                        String artistId) {

                String normalizedArtistId = normalizeRequiredText(
                                artistId,
                                "Artist ID",
                                24);

                User artist = userRepository
                                .findById(
                                                normalizedArtistId)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Artist account not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                artist.getAccountStatus())) {

                        throw new SecurityException(
                                        "Artist account is not active");
                }

                if (!"ARTIST".equalsIgnoreCase(
                                artist.getType())) {

                        throw new SecurityException(
                                        "Only artist accounts can create membership polls");
                }

                SubscriptionAccessDTO access = subscriptionService
                                .getAccessForUser(
                                                artist.getId());

                if (!Boolean.TRUE.equals(
                                access.getHasMembershipBenefits())) {

                        throw new SecurityException(
                                        "Your SoundClone plan does not include membership features");
                }

                return artist;
        }

        private User getActiveMember(
                        String memberId) {

                String normalizedMemberId = normalizeRequiredText(
                                memberId,
                                "Member ID",
                                24);

                User member = userRepository
                                .findById(
                                                normalizedMemberId)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Member account not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                member.getAccountStatus())) {

                        throw new SecurityException(
                                        "Member account is not active");
                }

                return member;
        }

        /*
         * =========================
         * POLL VALIDATION
         * =========================
         */
        private void assertPollPost(
                        ArtistMembershipPost post) {

                if (!ArtistMembershipPost.TYPE_POLL
                                .equalsIgnoreCase(
                                                post.getType())) {

                        throw new IllegalArgumentException(
                                        "The selected post is not a poll");
                }
        }

        private List<String> normalizeOptions(
                        List<String> options) {

                if (options == null
                                || options.size() < 2
                                || options.size() > 6) {

                        throw new IllegalArgumentException(
                                        "A poll must contain between 2 and 6 options");
                }

                List<String> normalizedOptions = new ArrayList<>();

                Set<String> uniqueOptions = new HashSet<>();

                for (String option : options) {

                        String normalized = normalizeRequiredText(
                                        option,
                                        "Poll option",
                                        500);

                        String uniquenessKey = normalized.toLowerCase(
                                        Locale.ROOT);

                        if (!uniqueOptions.add(
                                        uniquenessKey)) {

                                throw new IllegalArgumentException(
                                                "Poll options must be unique");
                        }

                        normalizedOptions.add(
                                        normalized);
                }

                return normalizedOptions;
        }

        private String normalizeVisibility(
                        String value) {

                String normalized = value == null
                                || value.isBlank()
                                                ? ArtistMembershipPost.VISIBILITY_PUBLIC
                                                : value.trim()
                                                                .toUpperCase(
                                                                                Locale.ROOT);

                boolean supported = ArtistMembershipPost.VISIBILITY_PUBLIC
                                .equals(normalized)
                                || ArtistMembershipPost.VISIBILITY_MEMBERS_ONLY
                                                .equals(normalized)
                                || ArtistMembershipPost.VISIBILITY_TIER_ONLY
                                                .equals(normalized);

                if (!supported) {
                        throw new IllegalArgumentException(
                                        "Visibility must be PUBLIC, MEMBERS_ONLY or TIER_ONLY");
                }

                return normalized;
        }

        private String normalizeStatus(
                        String value) {

                String normalized = value == null
                                || value.isBlank()
                                                ? ArtistMembershipPost.STATUS_PUBLISHED
                                                : value.trim()
                                                                .toUpperCase(
                                                                                Locale.ROOT);

                if (!ArtistMembershipPost.STATUS_DRAFT
                                .equals(normalized)
                                && !ArtistMembershipPost.STATUS_PUBLISHED
                                                .equals(normalized)) {

                        throw new IllegalArgumentException(
                                        "Poll status must be DRAFT or PUBLISHED");
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

        /*
         * =========================
         * INTERNAL ACCESS RESULT
         * =========================
         */
        private record PostAccess(
                        boolean canView,
                        String reason) {
        }
}