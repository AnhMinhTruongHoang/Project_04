package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dtos.CreateArtistMembershipPostDTO;
import com.example.demo.dtos.SubscriptionAccessDTO;
import com.example.demo.entities.ArtistMembershipPlan;
import com.example.demo.entities.ArtistMembershipPost;
import com.example.demo.entities.ArtistMembershipPostComment;
import com.example.demo.entities.ArtistMembershipSubscription;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;
import com.example.demo.repositories.ArtistMembershipPlanRepository;
import com.example.demo.repositories.ArtistMembershipPostCommentRepository;
import com.example.demo.repositories.ArtistMembershipPostRepository;
import com.example.demo.repositories.ArtistMembershipSubscriptionRepository;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.example.demo.dtos.UpdateArtistMembershipPostDTO;
import com.example.demo.repositories.ArtistMembershipPollOptionRepository;
import com.example.demo.repositories.ArtistMembershipPollVoteRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class ArtistMembershipPostService {

        private final ArtistMembershipPostRepository artistMembershipPostRepository;

        private final ArtistMembershipPlanRepository artistMembershipPlanRepository;

        private final ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository;

        private final TrackRepository trackRepository;

        private final UserRepository userRepository;

        private final SubscriptionService subscriptionService;

        private final CloudinaryService cloudinaryService;

        private final ArtistMembershipPollService artistMembershipPollService;

        private final ArtistMembershipPostCommentRepository artistMembershipPostCommentRepository;

        private final ArtistMembershipPollOptionRepository artistMembershipPollOptionRepository;

        private final ArtistMembershipPollVoteRepository artistMembershipPollVoteRepository;

        public ArtistMembershipPostService(
                        ArtistMembershipPostRepository artistMembershipPostRepository,

                        ArtistMembershipPlanRepository artistMembershipPlanRepository,

                        ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository,

                        TrackRepository trackRepository,

                        UserRepository userRepository,

                        SubscriptionService subscriptionService,

                        CloudinaryService cloudinaryService, ArtistMembershipPollService artistMembershipPollService,
                        ArtistMembershipPostCommentRepository artistMembershipPostCommentRepository,

                        ArtistMembershipPollOptionRepository artistMembershipPollOptionRepository,
                        ArtistMembershipPollVoteRepository artistMembershipPollVoteRepository

        ) {

                this.artistMembershipPostRepository = artistMembershipPostRepository;

                this.artistMembershipPlanRepository = artistMembershipPlanRepository;

                this.artistMembershipSubscriptionRepository = artistMembershipSubscriptionRepository;

                this.trackRepository = trackRepository;

                this.userRepository = userRepository;

                this.subscriptionService = subscriptionService;

                this.cloudinaryService = cloudinaryService;

                this.artistMembershipPollService = artistMembershipPollService;

                this.artistMembershipPostCommentRepository = artistMembershipPostCommentRepository;

                this.artistMembershipPollOptionRepository = artistMembershipPollOptionRepository;

                this.artistMembershipPollVoteRepository = artistMembershipPollVoteRepository;
        }

        /*
         * =========================
         * CREATE TEXT / TRACK POST
         * =========================
         */
        @Transactional
        public Map<String, Object> createPost(
                        String artistId,
                        CreateArtistMembershipPostDTO dto) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                validateDTO(
                                dto);

                String type = normalizeType(
                                dto.getType());

                if (ArtistMembershipPost.TYPE_IMAGE
                                .equals(type)) {

                        throw new IllegalArgumentException(
                                        "Use the image post endpoint to create an image post");
                }

                if (ArtistMembershipPost.TYPE_POLL
                                .equals(type)) {

                        throw new IllegalArgumentException(
                                        "Poll posts use a separate endpoint");
                }

                ArtistMembershipPost post = buildBasePost(
                                artist,
                                dto,
                                type);

                if (ArtistMembershipPost.TYPE_TEXT
                                .equals(type)) {

                        post.setContent(
                                        normalizeRequiredText(
                                                        dto.getContent(),
                                                        "Post content",
                                                        10000));

                } else if (ArtistMembershipPost.TYPE_TRACK_PREVIEW
                                .equals(type)) {

                        configureTrackPreview(
                                        post,
                                        artist.getId(),
                                        dto);
                }

                ArtistMembershipPost savedPost = artistMembershipPostRepository
                                .saveAndFlush(
                                                post);

                return buildPostResponse(
                                savedPost,
                                artist.getId(),
                                true);
        }

        /*
         * =========================
         * CREATE IMAGE POST
         * =========================
         */
        @Transactional
        public Map<String, Object> createImagePost(
                        String artistId,
                        CreateArtistMembershipPostDTO dto,
                        MultipartFile image) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                if (dto == null) {
                        dto = new CreateArtistMembershipPostDTO();
                }

                ArtistMembershipPost post = buildBasePost(
                                artist,
                                dto,
                                ArtistMembershipPost.TYPE_IMAGE);

                post.setContent(
                                normalizeOptionalText(
                                                dto.getContent(),
                                                5000));

                String uploadedImageUrl = null;

                try {
                        uploadedImageUrl = cloudinaryService
                                        .uploadCommunityImage(
                                                        image);

                        post.setImageUrl(
                                        uploadedImageUrl);

                        ArtistMembershipPost savedPost = artistMembershipPostRepository
                                        .saveAndFlush(
                                                        post);

                        return buildPostResponse(
                                        savedPost,
                                        artist.getId(),
                                        true);

                } catch (IllegalArgumentException e) {

                        throw e;

                } catch (Exception e) {

                        if (uploadedImageUrl != null) {
                                cloudinaryService
                                                .deleteCommunityImage(
                                                                uploadedImageUrl);
                        }

                        throw new IllegalStateException(
                                        "Unable to upload community image",
                                        e);
                }
        }

        /*
         * =========================
         * PUBLIC ARTIST FEED
         * =========================
         *
         * Anonymous user vẫn thấy post card.
         * Nội dung bị khóa không trả imageUrl
         * hoặc trackUrl.
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getArtistFeed(
                        String artistId,
                        String viewerId,
                        int current,
                        int pageSize) {

                User artist = getArtist(
                                artistId);

                int normalizedCurrent = Math.max(
                                current,
                                1);

                int normalizedPageSize = Math.min(
                                Math.max(
                                                pageSize,
                                                1),
                                50);

                Page<ArtistMembershipPost> page = artistMembershipPostRepository
                                .findByArtistIdAndStatusOrderByPublishedAtDescCreatedAtDesc(
                                                artist.getId(),
                                                ArtistMembershipPost.STATUS_PUBLISHED,
                                                PageRequest.of(
                                                                normalizedCurrent - 1,
                                                                normalizedPageSize));

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "current",
                                normalizedCurrent);

                result.put(
                                "pageSize",
                                normalizedPageSize);

                result.put(
                                "total",
                                page.getTotalElements());

                result.put(
                                "totalPages",
                                page.getTotalPages());

                result.put(
                                "items",
                                page.getContent()
                                                .stream()
                                                .map(
                                                                post -> buildPostResponse(
                                                                                post,
                                                                                viewerId,
                                                                                false))
                                                .toList());

                return result;
        }

        /*
         * =========================
         * ARTIST MANAGE POSTS
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getMyPosts(
                        String artistId,
                        int current,
                        int pageSize) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                int normalizedCurrent = Math.max(
                                current,
                                1);

                int normalizedPageSize = Math.min(
                                Math.max(
                                                pageSize,
                                                1),
                                50);

                Page<ArtistMembershipPost> page = artistMembershipPostRepository
                                .findByArtistIdOrderByCreatedAtDesc(
                                                artist.getId(),
                                                PageRequest.of(
                                                                normalizedCurrent - 1,
                                                                normalizedPageSize));

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "current",
                                normalizedCurrent);

                result.put(
                                "pageSize",
                                normalizedPageSize);

                result.put(
                                "total",
                                page.getTotalElements());

                result.put(
                                "totalPages",
                                page.getTotalPages());

                result.put(
                                "items",
                                page.getContent()
                                                .stream()
                                                .map(
                                                                post -> buildPostResponse(
                                                                                post,
                                                                                artist.getId(),
                                                                                true))
                                                .toList());

                return result;
        }

        /*
         * =========================
         * BUILD BASE POST
         * =========================
         */
        private ArtistMembershipPost buildBasePost(
                        User artist,
                        CreateArtistMembershipPostDTO dto,
                        String type) {

                ArtistMembershipPost post = new ArtistMembershipPost();

                post.setArtistId(
                                artist.getId());

                post.setType(
                                type);

                String visibility = normalizeVisibility(
                                dto == null
                                                ? null
                                                : dto.getVisibility());

                post.setVisibility(
                                visibility);

                configureRequiredPlan(
                                post,
                                artist.getId(),
                                dto == null
                                                ? null
                                                : dto.getRequiredPlanId());

                post.setAllowComments(
                                dto == null
                                                || dto.getAllowComments() == null
                                                                ? true
                                                                : dto.getAllowComments());

                String status = normalizeStatus(
                                dto == null
                                                ? null
                                                : dto.getStatus());

                post.setStatus(
                                status);

                if (ArtistMembershipPost.STATUS_PUBLISHED
                                .equals(status)) {

                        post.setPublishedAt(
                                        LocalDateTime.now());
                }

                return post;
        }

        /*
         * =========================
         * CONFIGURE REQUIRED PLAN
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
         * CONFIGURE TRACK PREVIEW
         * =========================
         */
        private void configureTrackPreview(
                        ArtistMembershipPost post,
                        String artistId,
                        CreateArtistMembershipPostDTO dto) {

                String trackId = normalizeRequiredText(
                                dto.getTrackId(),
                                "Track ID",
                                24);

                Track track = trackRepository
                                .findByIdAndUploaderIdAndIsDeletedFalse(
                                                trackId,
                                                artistId)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Track not found or does not belong to this artist"));

                long startSeconds = dto.getPreviewStartSeconds() == null
                                ? 0L
                                : dto.getPreviewStartSeconds();

                if (startSeconds < 0L) {
                        throw new IllegalArgumentException(
                                        "Preview start time cannot be negative");
                }

                if (track.getDurationSeconds() != null
                                && startSeconds >= track.getDurationSeconds()) {

                        throw new IllegalArgumentException(
                                        "Preview start time must be before the end of the track");
                }

                Integer previewDuration = dto.getPreviewDurationSeconds();

                if (previewDuration != null
                                && (previewDuration < 10
                                                || previewDuration > 600)) {

                        throw new IllegalArgumentException(
                                        "Preview duration must be between 10 and 600 seconds");
                }

                if (previewDuration != null
                                && track.getDurationSeconds() != null
                                && startSeconds + previewDuration > track.getDurationSeconds()) {

                        throw new IllegalArgumentException(
                                        "Preview duration exceeds the track duration");
                }

                post.setTrackId(
                                track.getId());

                post.setPreviewStartSeconds(
                                startSeconds);

                post.setPreviewDurationSeconds(
                                previewDuration);

                post.setContent(
                                normalizeOptionalText(
                                                dto.getContent(),
                                                5000));
        }

        /*
         * =========================
         * POST RESPONSE
         * =========================
         */
        private Map<String, Object> buildPostResponse(
                        ArtistMembershipPost post,
                        String viewerId,
                        boolean ownerMode) {

                PostAccess access = resolvePostAccess(
                                post,
                                viewerId,
                                ownerMode);

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
                                "locked",
                                !access.canView());

                result.put(
                                "lockReason",
                                access.reason());

                result.put(
                                "content",
                                access.canView()
                                                ? post.getContent()
                                                : null);

                result.put(
                                "imageUrl",
                                access.canView()
                                                ? post.getImageUrl()
                                                : null);

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
                                "track",
                                access.canView()
                                                ? buildTrackResponse(
                                                                post)
                                                : null);

                /*
                 * =========================
                 * POLL RESPONSE
                 * =========================
                 */
                result.put(
                                "poll",
                                ArtistMembershipPost.TYPE_POLL
                                                .equalsIgnoreCase(
                                                                post.getType())
                                                                                ? artistMembershipPollService
                                                                                                .buildPollData(
                                                                                                                post,
                                                                                                                viewerId,
                                                                                                                ownerMode)
                                                                                : null);

                /*
                 * =========================
                 * COMMENT SUMMARY
                 * =========================
                 */
                result.put(
                                "commentCount",
                                artistMembershipPostCommentRepository
                                                .countByPostIdAndStatus(
                                                                post.getId(),
                                                                ArtistMembershipPostComment.STATUS_ACTIVE));

                return result;
        }

        /*
         * =========================
         * TRACK RESPONSE
         * =========================
         *
         * trackUrl chỉ xuất hiện khi viewer
         * đã được xác minh quyền xem post.
         */
        private Map<String, Object> buildTrackResponse(
                        ArtistMembershipPost post) {

                if (!ArtistMembershipPost.TYPE_TRACK_PREVIEW
                                .equals(
                                                post.getType())
                                || post.getTrackId() == null) {

                        return null;
                }

                Track track = trackRepository
                                .findById(
                                                post.getTrackId())
                                .orElse(null);

                if (track == null
                                || Boolean.TRUE.equals(
                                                track.getIsDeleted())) {

                        return null;
                }

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                track.getId());

                result.put(
                                "title",
                                track.getTitle());

                result.put(
                                "imgUrl",
                                track.getImgUrl());

                result.put(
                                "trackUrl",
                                track.getTrackUrl());

                result.put(
                                "durationSeconds",
                                track.getDurationSeconds());

                result.put(
                                "previewStartSeconds",
                                post.getPreviewStartSeconds());

                result.put(
                                "previewDurationSeconds",
                                post.getPreviewDurationSeconds());

                return result;
        }

        /*
         * =========================
         * ACCESS CONTROL
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
                                .equals(
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

                ArtistMembershipSubscription subscription = artistMembershipSubscriptionRepository
                                .findByMemberIdAndArtistId(
                                                viewerId,
                                                post.getArtistId())
                                .orElse(null);

                boolean activeMembership = subscription != null
                                && ArtistMembershipSubscription.STATUS_ACTIVE
                                                .equalsIgnoreCase(
                                                                subscription.getStatus())
                                && subscription
                                                .getCurrentPeriodEnd() != null
                                && subscription
                                                .getCurrentPeriodEnd()
                                                .isAfter(
                                                                LocalDateTime.now());

                if (!activeMembership) {

                        return new PostAccess(
                                        false,
                                        "MEMBERSHIP_REQUIRED");
                }

                if (ArtistMembershipPost.VISIBILITY_MEMBERS_ONLY
                                .equals(
                                                post.getVisibility())) {

                        return new PostAccess(
                                        true,
                                        null);
                }

                boolean correctTier = ArtistMembershipPost.VISIBILITY_TIER_ONLY
                                .equals(
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
         * ARTIST ACCESS
         * =========================
         */
        private User assertArtistCanManageMembership(
                        String artistId) {

                User artist = getArtist(
                                artistId);

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

        private User getArtist(
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

                        throw new IllegalArgumentException(
                                        "The selected account is not an artist");
                }

                return artist;
        }

        /*
         * =========================
         * UPDATE MEMBERSHIP POST
         * =========================
         */
        @Transactional
        public Map<String, Object> updatePost(
                        String artistId,
                        String postId,
                        UpdateArtistMembershipPostDTO dto) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Membership post update information is required");
                }

                ArtistMembershipPost post = artistMembershipPostRepository
                                .findByIdAndArtistIdForUpdate(
                                                normalizeRequiredText(
                                                                postId,
                                                                "Membership post ID",
                                                                24),
                                                artist.getId())
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Membership post not found"));

                /*
                 * =========================
                 * UPDATE VISIBILITY
                 * =========================
                 */
                String nextVisibility = dto.getVisibility() == null
                                || dto.getVisibility().isBlank()
                                                ? post.getVisibility()
                                                : normalizeVisibility(
                                                                dto.getVisibility());

                post.setVisibility(
                                nextVisibility);

                if (dto.getRequiredPlanId() != null
                                && !ArtistMembershipPost.VISIBILITY_TIER_ONLY
                                                .equals(nextVisibility)) {

                        throw new IllegalArgumentException(
                                        "Required plan ID can only be used with TIER_ONLY visibility");
                }

                String nextRequiredPlanId = dto.getRequiredPlanId() != null
                                ? dto.getRequiredPlanId()
                                : post.getRequiredPlanId();

                configureRequiredPlan(
                                post,
                                artist.getId(),
                                nextRequiredPlanId);

                /*
                 * =========================
                 * UPDATE CONTENT
                 * =========================
                 */
                if (dto.getContent() != null) {

                        if (ArtistMembershipPost.TYPE_TEXT
                                        .equalsIgnoreCase(
                                                        post.getType())) {

                                post.setContent(
                                                normalizeRequiredText(
                                                                dto.getContent(),
                                                                "Post content",
                                                                10000));

                        } else if (ArtistMembershipPost.TYPE_POLL
                                        .equalsIgnoreCase(
                                                        post.getType())) {

                                post.setContent(
                                                normalizeRequiredText(
                                                                dto.getContent(),
                                                                "Poll question",
                                                                1000));

                        } else {

                                /*
                                 * IMAGE và TRACK_PREVIEW:
                                 * content là caption nên có thể để trống.
                                 */
                                post.setContent(
                                                normalizeOptionalText(
                                                                dto.getContent(),
                                                                5000));
                        }
                }

                /*
                 * =========================
                 * UPDATE COMMENT SETTING
                 * =========================
                 */
                if (dto.getAllowComments() != null) {

                        post.setAllowComments(
                                        dto.getAllowComments());
                }

                /*
                 * =========================
                 * UPDATE TRACK PREVIEW
                 * =========================
                 */
                boolean hasTrackUpdate = dto.getTrackId() != null
                                || dto.getPreviewStartSeconds() != null
                                || dto.getPreviewDurationSeconds() != null;

                if (hasTrackUpdate
                                && !ArtistMembershipPost.TYPE_TRACK_PREVIEW
                                                .equalsIgnoreCase(
                                                                post.getType())) {

                        throw new IllegalArgumentException(
                                        "Track preview fields can only be updated on TRACK_PREVIEW posts");
                }

                if (hasTrackUpdate) {

                        updateTrackPreview(
                                        post,
                                        artist.getId(),
                                        dto);
                }

                /*
                 * =========================
                 * UPDATE STATUS
                 * =========================
                 */
                if (dto.getStatus() != null
                                && !dto.getStatus().isBlank()) {

                        String previousStatus = post.getStatus();

                        String nextStatus = normalizeStatus(
                                        dto.getStatus());

                        post.setStatus(
                                        nextStatus);

                        if (ArtistMembershipPost.STATUS_PUBLISHED
                                        .equals(nextStatus)
                                        && !ArtistMembershipPost.STATUS_PUBLISHED
                                                        .equalsIgnoreCase(
                                                                        previousStatus)) {

                                post.setPublishedAt(
                                                LocalDateTime.now());
                        }

                        if (ArtistMembershipPost.STATUS_DRAFT
                                        .equals(nextStatus)) {

                                post.setPublishedAt(
                                                null);
                        }
                }

                ArtistMembershipPost savedPost = artistMembershipPostRepository
                                .saveAndFlush(
                                                post);

                return buildPostResponse(
                                savedPost,
                                artist.getId(),
                                true);
        }

        /*
         * =========================
         * REPLACE COMMUNITY IMAGE
         * =========================
         */
        @Transactional
        public Map<String, Object> replacePostImage(
                        String artistId,
                        String postId,
                        MultipartFile image) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                ArtistMembershipPost post = artistMembershipPostRepository
                                .findByIdAndArtistIdForUpdate(
                                                normalizeRequiredText(
                                                                postId,
                                                                "Membership post ID",
                                                                24),
                                                artist.getId())
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Membership post not found"));

                if (!ArtistMembershipPost.TYPE_IMAGE
                                .equalsIgnoreCase(
                                                post.getType())) {

                        throw new IllegalArgumentException(
                                        "Only IMAGE posts can replace their image");
                }

                String oldImageUrl = post.getImageUrl();

                String newImageUrl = null;

                try {

                        newImageUrl = cloudinaryService
                                        .uploadCommunityImage(
                                                        image);

                        post.setImageUrl(
                                        newImageUrl);

                        ArtistMembershipPost savedPost = artistMembershipPostRepository
                                        .saveAndFlush(
                                                        post);

                        /*
                         * Chỉ xóa ảnh cũ sau khi transaction
                         * database commit thành công.
                         */
                        deleteCommunityImageAfterCommit(
                                        oldImageUrl);

                        return buildPostResponse(
                                        savedPost,
                                        artist.getId(),
                                        true);

                } catch (IllegalArgumentException e) {

                        if (newImageUrl != null) {
                                cloudinaryService
                                                .deleteCommunityImage(
                                                                newImageUrl);
                        }

                        throw e;

                } catch (Exception e) {

                        if (newImageUrl != null) {
                                cloudinaryService
                                                .deleteCommunityImage(
                                                                newImageUrl);
                        }

                        throw new IllegalStateException(
                                        "Unable to replace community post image",
                                        e);
                }
        }

        /*
         * =========================
         * PUBLISH POST
         * =========================
         */
        @Transactional
        public Map<String, Object> publishPost(
                        String artistId,
                        String postId) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                ArtistMembershipPost post = artistMembershipPostRepository
                                .findByIdAndArtistIdForUpdate(
                                                normalizeRequiredText(
                                                                postId,
                                                                "Membership post ID",
                                                                24),
                                                artist.getId())
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Membership post not found"));

                if (!ArtistMembershipPost.STATUS_PUBLISHED
                                .equalsIgnoreCase(
                                                post.getStatus())) {

                        post.setStatus(
                                        ArtistMembershipPost.STATUS_PUBLISHED);

                        post.setPublishedAt(
                                        LocalDateTime.now());
                }

                ArtistMembershipPost savedPost = artistMembershipPostRepository
                                .saveAndFlush(
                                                post);

                return buildPostResponse(
                                savedPost,
                                artist.getId(),
                                true);
        }

        /*
         * =========================
         * ARCHIVE POST
         * =========================
         */
        @Transactional
        public Map<String, Object> archivePost(
                        String artistId,
                        String postId) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                ArtistMembershipPost post = artistMembershipPostRepository
                                .findByIdAndArtistIdForUpdate(
                                                normalizeRequiredText(
                                                                postId,
                                                                "Membership post ID",
                                                                24),
                                                artist.getId())
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Membership post not found"));

                post.setStatus(
                                ArtistMembershipPost.STATUS_ARCHIVED);

                ArtistMembershipPost savedPost = artistMembershipPostRepository
                                .saveAndFlush(
                                                post);

                return buildPostResponse(
                                savedPost,
                                artist.getId(),
                                true);
        }

        /*
         * =========================
         * DELETE POST
         * =========================
         */
        @Transactional
        public Map<String, Object> deletePost(
                        String artistId,
                        String postId) {

                User artist = assertArtistCanManageMembership(
                                artistId);

                ArtistMembershipPost post = artistMembershipPostRepository
                                .findByIdAndArtistIdForUpdate(
                                                normalizeRequiredText(
                                                                postId,
                                                                "Membership post ID",
                                                                24),
                                                artist.getId())
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Membership post not found"));

                String imageUrl = ArtistMembershipPost.TYPE_IMAGE
                                .equalsIgnoreCase(
                                                post.getType())
                                                                ? post.getImageUrl()
                                                                : null;

                /*
                 * Poll votes phải xóa trước options.
                 */
                artistMembershipPollVoteRepository
                                .deleteByPostId(
                                                post.getId());

                artistMembershipPollOptionRepository
                                .deleteByPostId(
                                                post.getId());

                /*
                 * Xóa cả comment ACTIVE và DELETED.
                 */
                artistMembershipPostCommentRepository
                                .deleteByPostId(
                                                post.getId());

                artistMembershipPostRepository
                                .delete(
                                                post);

                artistMembershipPostRepository
                                .flush();

                deleteCommunityImageAfterCommit(
                                imageUrl);

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                post.getId());

                result.put(
                                "artistId",
                                post.getArtistId());

                result.put(
                                "deleted",
                                true);

                return result;
        }

        /*
         * =========================
         * UPDATE TRACK PREVIEW DATA
         * =========================
         */
        private void updateTrackPreview(
                        ArtistMembershipPost post,
                        String artistId,
                        UpdateArtistMembershipPostDTO dto) {

                String nextTrackId = dto.getTrackId() != null
                                ? dto.getTrackId()
                                : post.getTrackId();

                Track track = trackRepository
                                .findByIdAndUploaderIdAndIsDeletedFalse(
                                                normalizeRequiredText(
                                                                nextTrackId,
                                                                "Track ID",
                                                                24),
                                                artistId)
                                .orElseThrow(
                                                () -> new NoSuchElementException(
                                                                "Track not found or does not belong to this artist"));

                long startSeconds = dto.getPreviewStartSeconds() != null
                                ? dto.getPreviewStartSeconds()
                                : post.getPreviewStartSeconds() == null
                                                ? 0L
                                                : post.getPreviewStartSeconds();

                Integer previewDuration = dto.getPreviewDurationSeconds() != null
                                ? dto.getPreviewDurationSeconds()
                                : post.getPreviewDurationSeconds();

                if (startSeconds < 0L) {
                        throw new IllegalArgumentException(
                                        "Preview start time cannot be negative");
                }

                if (track.getDurationSeconds() != null
                                && startSeconds >= track.getDurationSeconds()) {

                        throw new IllegalArgumentException(
                                        "Preview start time must be before the end of the track");
                }

                if (previewDuration != null
                                && (previewDuration < 10
                                                || previewDuration > 600)) {

                        throw new IllegalArgumentException(
                                        "Preview duration must be between 10 and 600 seconds");
                }

                if (previewDuration != null
                                && track.getDurationSeconds() != null
                                && startSeconds + previewDuration > track.getDurationSeconds()) {

                        throw new IllegalArgumentException(
                                        "Preview duration exceeds the track duration");
                }

                post.setTrackId(
                                track.getId());

                post.setPreviewStartSeconds(
                                startSeconds);

                post.setPreviewDurationSeconds(
                                previewDuration);
        }

        /*
         * =========================
         * VALIDATION
         * =========================
         */
        private void validateDTO(
                        CreateArtistMembershipPostDTO dto) {

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Membership post information is required");
                }
        }

        private String normalizeType(
                        String value) {

                String normalized = normalizeRequiredText(
                                value,
                                "Post type",
                                30)
                                .toUpperCase(
                                                Locale.ROOT);

                boolean supported = ArtistMembershipPost.TYPE_TEXT
                                .equals(normalized)
                                || ArtistMembershipPost.TYPE_IMAGE
                                                .equals(normalized)
                                || ArtistMembershipPost.TYPE_POLL
                                                .equals(normalized)
                                || ArtistMembershipPost.TYPE_TRACK_PREVIEW
                                                .equals(normalized);

                if (!supported) {
                        throw new IllegalArgumentException(
                                        "Post type must be TEXT, IMAGE, POLL or TRACK_PREVIEW");
                }

                return normalized;
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
                                        "Post status must be DRAFT or PUBLISHED");
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
                                        "Post content must not exceed "
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

        /*
         * =========================
         * DELETE CLOUDINARY AFTER COMMIT
         * =========================
         */
        private void deleteCommunityImageAfterCommit(
                        String imageUrl) {

                if (imageUrl == null
                                || imageUrl.isBlank()) {

                        return;
                }

                if (!TransactionSynchronizationManager
                                .isActualTransactionActive()) {

                        cloudinaryService
                                        .deleteCommunityImage(
                                                        imageUrl);

                        return;
                }

                TransactionSynchronizationManager
                                .registerSynchronization(
                                                new TransactionSynchronization() {

                                                        @Override
                                                        public void afterCommit() {

                                                                cloudinaryService
                                                                                .deleteCommunityImage(
                                                                                                imageUrl);
                                                        }
                                                });
        }
}