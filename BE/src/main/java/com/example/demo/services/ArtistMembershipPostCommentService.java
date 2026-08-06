package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.CreateArtistMembershipPostCommentDTO;
import com.example.demo.dtos.UpdateArtistMembershipPostCommentDTO;
import com.example.demo.entities.ArtistMembershipPost;
import com.example.demo.entities.ArtistMembershipPostComment;
import com.example.demo.entities.ArtistMembershipSubscription;
import com.example.demo.entities.User;
import com.example.demo.repositories.ArtistMembershipPostCommentRepository;
import com.example.demo.repositories.ArtistMembershipPostRepository;
import com.example.demo.repositories.ArtistMembershipSubscriptionRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class ArtistMembershipPostCommentService {

    private final ArtistMembershipPostCommentRepository artistMembershipPostCommentRepository;

    private final ArtistMembershipPostRepository artistMembershipPostRepository;

    private final ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository;

    private final UserRepository userRepository;

    public ArtistMembershipPostCommentService(
            ArtistMembershipPostCommentRepository artistMembershipPostCommentRepository,

            ArtistMembershipPostRepository artistMembershipPostRepository,

            ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository,

            UserRepository userRepository) {

        this.artistMembershipPostCommentRepository = artistMembershipPostCommentRepository;

        this.artistMembershipPostRepository = artistMembershipPostRepository;

        this.artistMembershipSubscriptionRepository = artistMembershipSubscriptionRepository;

        this.userRepository = userRepository;
    }

    /*
     * =========================
     * GET TOP-LEVEL COMMENTS
     * =========================
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getComments(
            String postId,
            String viewerId,
            int current,
            int pageSize) {

        ArtistMembershipPost post = getPublishedPost(
                postId);

        assertCanViewPost(
                post,
                viewerId);

        int normalizedCurrent = Math.max(
                current,
                1);

        int normalizedPageSize = Math.min(
                Math.max(
                        pageSize,
                        1),
                50);

        Page<ArtistMembershipPostComment> page = artistMembershipPostCommentRepository
                .findByPostIdAndParentCommentIdIsNullOrderByCreatedAtDesc(
                        post.getId(),
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
                                comment -> buildCommentResponse(
                                        comment,
                                        post,
                                        viewerId))
                        .toList());

        return result;
    }

    /*
     * =========================
     * GET COMMENT REPLIES
     * =========================
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getReplies(
            String postId,
            String commentId,
            String viewerId) {

        ArtistMembershipPost post = getPublishedPost(
                postId);

        assertCanViewPost(
                post,
                viewerId);

        ArtistMembershipPostComment parentComment = artistMembershipPostCommentRepository
                .findByIdAndPostId(
                        normalizeRequired(
                                commentId,
                                "Comment ID"),
                        post.getId())
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Comment not found"));

        /*
         * Chỉ bình luận cấp cao nhất mới có
         * danh sách replies.
         */
        if (parentComment.getParentCommentId() != null) {
            throw new IllegalArgumentException(
                    "The selected comment is already a reply");
        }

        return artistMembershipPostCommentRepository
                .findByPostIdAndParentCommentIdOrderByCreatedAtAsc(
                        post.getId(),
                        parentComment.getId())
                .stream()
                .map(
                        reply -> buildCommentResponse(
                                reply,
                                post,
                                viewerId))
                .toList();
    }

    /*
     * =========================
     * CREATE COMMENT OR REPLY
     * =========================
     */
    @Transactional
    public Map<String, Object> createComment(
            String userId,
            String postId,
            CreateArtistMembershipPostCommentDTO dto) {

        User user = getActiveUser(
                userId);

        ArtistMembershipPost post = getPublishedPost(
                postId);

        assertCanViewPost(
                post,
                user.getId());

        if (!Boolean.TRUE.equals(
                post.getAllowComments())) {

            throw new IllegalStateException(
                    "Comments are disabled for this post");
        }

        if (dto == null) {
            throw new IllegalArgumentException(
                    "Comment information is required");
        }

        String content = normalizeContent(
                dto.getContent());

        String parentCommentId = normalizeOptionalId(
                dto.getParentCommentId());

        if (parentCommentId != null) {

            ArtistMembershipPostComment parentComment = artistMembershipPostCommentRepository
                    .findByIdAndPostId(
                            parentCommentId,
                            post.getId())
                    .orElseThrow(
                            () -> new NoSuchElementException(
                                    "Parent comment not found"));

            if (ArtistMembershipPostComment.STATUS_DELETED
                    .equalsIgnoreCase(
                            parentComment.getStatus())) {

                throw new IllegalStateException(
                        "Cannot reply to a deleted comment");
            }

            /*
             * [Dự án] Community hiện hỗ trợ
             * tối đa hai cấp:
             *
             * comment → reply
             */
            if (parentComment.getParentCommentId() != null) {
                throw new IllegalArgumentException(
                        "Replies cannot contain nested replies");
            }
        }

        ArtistMembershipPostComment comment = new ArtistMembershipPostComment();

        comment.setPostId(
                post.getId());

        comment.setUserId(
                user.getId());

        comment.setParentCommentId(
                parentCommentId);

        comment.setContent(
                content);

        comment.setStatus(
                ArtistMembershipPostComment.STATUS_ACTIVE);

        ArtistMembershipPostComment savedComment = artistMembershipPostCommentRepository
                .saveAndFlush(
                        comment);

        return buildCommentResponse(
                savedComment,
                post,
                user.getId());
    }

    /*
     * =========================
     * UPDATE COMMENT
     * =========================
     */
    @Transactional
    public Map<String, Object> updateComment(
            String userId,
            String postId,
            String commentId,
            UpdateArtistMembershipPostCommentDTO dto) {

        User user = getActiveUser(
                userId);

        ArtistMembershipPost post = getPublishedPost(
                postId);

        assertCanViewPost(
                post,
                user.getId());

        if (dto == null) {
            throw new IllegalArgumentException(
                    "Comment update information is required");
        }

        String content = normalizeContent(
                dto.getContent());

        ArtistMembershipPostComment comment = artistMembershipPostCommentRepository
                .findByIdAndPostIdForUpdate(
                        normalizeRequired(
                                commentId,
                                "Comment ID"),
                        post.getId())
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Comment not found"));

        if (!user.getId().equals(
                comment.getUserId())) {

            throw new SecurityException(
                    "You can only edit your own comment");
        }

        if (!ArtistMembershipPostComment.STATUS_ACTIVE
                .equalsIgnoreCase(
                        comment.getStatus())) {

            throw new IllegalStateException(
                    "Deleted comments cannot be edited");
        }

        comment.setContent(
                content);

        comment.setEditedAt(
                LocalDateTime.now());

        ArtistMembershipPostComment savedComment = artistMembershipPostCommentRepository
                .saveAndFlush(
                        comment);

        return buildCommentResponse(
                savedComment,
                post,
                user.getId());
    }

    /*
     * =========================
     * SOFT DELETE COMMENT
     * =========================
     *
     * Có quyền xóa:
     * - người viết comment;
     * - artist sở hữu bài đăng;
     * - ADMIN.
     */
    @Transactional
    public Map<String, Object> deleteComment(
            String actorId,
            String postId,
            String commentId) {

        User actor = getActiveUser(
                actorId);

        ArtistMembershipPost post = getPublishedPost(
                postId);

        ArtistMembershipPostComment comment = artistMembershipPostCommentRepository
                .findByIdAndPostIdForUpdate(
                        normalizeRequired(
                                commentId,
                                "Comment ID"),
                        post.getId())
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Comment not found"));

        boolean commentOwner = actor.getId().equals(
                comment.getUserId());

        boolean postOwner = actor.getId().equals(
                post.getArtistId());

        boolean administrator = "ADMIN".equalsIgnoreCase(
                actor.getRole());

        if (!commentOwner
                && !postOwner
                && !administrator) {

            throw new SecurityException(
                    "You cannot delete this comment");
        }

        /*
         * Idempotency:
         * gọi DELETE lần nữa không gây lỗi.
         */
        if (!ArtistMembershipPostComment.STATUS_DELETED
                .equalsIgnoreCase(
                        comment.getStatus())) {

            comment.setStatus(
                    ArtistMembershipPostComment.STATUS_DELETED);

            comment.setContent(
                    "");

            comment.setDeletedAt(
                    LocalDateTime.now());

            comment.setDeletedBy(
                    actor.getId());
        }

        ArtistMembershipPostComment savedComment = artistMembershipPostCommentRepository
                .saveAndFlush(
                        comment);

        return buildCommentResponse(
                savedComment,
                post,
                actor.getId());
    }

    /*
     * =========================
     * COMMENT RESPONSE
     * =========================
     */
    private Map<String, Object> buildCommentResponse(
            ArtistMembershipPostComment comment,
            ArtistMembershipPost post,
            String viewerId) {

        boolean deleted = ArtistMembershipPostComment.STATUS_DELETED
                .equalsIgnoreCase(
                        comment.getStatus());

        User author = userRepository
                .findById(
                        comment.getUserId())
                .orElse(null);

        boolean commentOwner = viewerId != null
                && viewerId.equals(
                        comment.getUserId());

        boolean postOwner = viewerId != null
                && viewerId.equals(
                        post.getArtistId());

        User viewer = viewerId == null
                ? null
                : userRepository
                        .findById(
                                viewerId)
                        .orElse(null);

        boolean administrator = viewer != null
                && "ADMIN".equalsIgnoreCase(
                        viewer.getRole());

        long replyCount = comment.getParentCommentId() == null
                ? artistMembershipPostCommentRepository
                        .countByParentCommentIdAndStatus(
                                comment.getId(),
                                ArtistMembershipPostComment.STATUS_ACTIVE)
                : 0L;

        Map<String, Object> authorData = new LinkedHashMap<>();

        authorData.put(
                "id",
                author == null
                        ? comment.getUserId()
                        : author.getId());

        authorData.put(
                "name",
                author == null
                        ? null
                        : author.getName());

        authorData.put(
                "username",
                author == null
                        ? null
                        : author.getUsername());

        authorData.put(
                "avatarUrl",
                author == null
                        ? null
                        : author.getAvatarUrl());

        authorData.put(
                "type",
                author == null
                        ? null
                        : author.getType());

        Map<String, Object> result = new LinkedHashMap<>();

        result.put(
                "id",
                comment.getId());

        result.put(
                "postId",
                comment.getPostId());

        result.put(
                "parentCommentId",
                comment.getParentCommentId());

        result.put(
                "author",
                authorData);

        result.put(
                "content",
                deleted
                        ? null
                        : comment.getContent());

        result.put(
                "status",
                comment.getStatus());

        result.put(
                "deleted",
                deleted);

        result.put(
                "edited",
                comment.getEditedAt() != null);

        result.put(
                "editedAt",
                comment.getEditedAt());

        result.put(
                "deletedAt",
                comment.getDeletedAt());

        result.put(
                "replyCount",
                replyCount);

        result.put(
                "canEdit",
                !deleted
                        && commentOwner);

        result.put(
                "canDelete",
                !deleted
                        && (commentOwner
                                || postOwner
                                || administrator));

        result.put(
                "createdAt",
                comment.getCreatedAt());

        result.put(
                "updatedAt",
                comment.getUpdatedAt());

        return result;
    }

    /*
     * =========================
     * POST ACCESS
     * =========================
     */
    private void assertCanViewPost(
            ArtistMembershipPost post,
            String viewerId) {

        if (post.getArtistId().equals(
                viewerId)) {

            return;
        }

        if (ArtistMembershipPost.VISIBILITY_PUBLIC
                .equalsIgnoreCase(
                        post.getVisibility())) {

            return;
        }

        if (viewerId == null
                || viewerId.isBlank()) {

            throw new SecurityException(
                    "Membership is required to view these comments");
        }

        User viewer = userRepository
                .findById(
                        viewerId)
                .orElse(null);

        if (viewer == null
                || !"ACTIVE".equalsIgnoreCase(
                        viewer.getAccountStatus())) {

            throw new SecurityException(
                    "Membership is required to view these comments");
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
            throw new SecurityException(
                    "Membership is required to view these comments");
        }

        if (ArtistMembershipPost.VISIBILITY_MEMBERS_ONLY
                .equalsIgnoreCase(
                        post.getVisibility())) {

            return;
        }

        boolean correctTier = ArtistMembershipPost.VISIBILITY_TIER_ONLY
                .equalsIgnoreCase(
                        post.getVisibility())
                && post.getRequiredPlanId() != null
                && post.getRequiredPlanId()
                        .equals(
                                subscription.getPlanId());

        if (!correctTier) {
            throw new SecurityException(
                    "The required membership tier is needed to view these comments");
        }
    }

    /*
     * =========================
     * LOOKUPS
     * =========================
     */
    private ArtistMembershipPost getPublishedPost(
            String postId) {

        ArtistMembershipPost post = artistMembershipPostRepository
                .findById(
                        normalizeRequired(
                                postId,
                                "Membership post ID"))
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Membership post not found"));

        if (!ArtistMembershipPost.STATUS_PUBLISHED
                .equalsIgnoreCase(
                        post.getStatus())) {

            throw new NoSuchElementException(
                    "Membership post not found");
        }

        return post;
    }

    private User getActiveUser(
            String userId) {

        User user = userRepository
                .findById(
                        normalizeRequired(
                                userId,
                                "User ID"))
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "User account not found"));

        if (!"ACTIVE".equalsIgnoreCase(
                user.getAccountStatus())) {

            throw new SecurityException(
                    "User account is not active");
        }

        return user;
    }

    /*
     * =========================
     * VALIDATION
     * =========================
     */
    private String normalizeContent(
            String value) {

        if (value == null
                || value.isBlank()) {

            throw new IllegalArgumentException(
                    "Comment content is required");
        }

        String normalized = value.trim();

        if (normalized.length() > 2000) {
            throw new IllegalArgumentException(
                    "Comment content must not exceed 2000 characters");
        }

        return normalized;
    }

    private String normalizeRequired(
            String value,
            String fieldName) {

        if (value == null
                || value.isBlank()) {

            throw new IllegalArgumentException(
                    fieldName + " is required");
        }

        return value.trim();
    }

    private String normalizeOptionalId(
            String value) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        String normalized = value.trim();

        if (normalized.length() != 24) {
            throw new IllegalArgumentException(
                    "Parent comment ID is invalid");
        }

        return normalized;
    }
}