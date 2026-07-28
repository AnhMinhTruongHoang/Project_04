package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;
import com.example.demo.dtos.NotificationCreateDTO;
import com.example.demo.dtos.NotificationDTO;
import com.example.demo.dtos.NotificationPageDTO;
import com.example.demo.entities.Comment;
import com.example.demo.entities.Notification;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;
import com.example.demo.repositories.NotificationRepository;
import com.example.demo.types.NotificationEntityType;
import com.example.demo.types.NotificationType;
import com.example.demo.entities.ArtistPayoutRequest;
import com.example.demo.entities.PaymentTransaction;
import com.example.demo.entities.UserSubscription;

@Service
public class NotificationService {

        private final NotificationRepository notificationRepository;

        public NotificationService(
                        NotificationRepository notificationRepository) {

                this.notificationRepository = notificationRepository;
        }

        @Transactional
        public NotificationDTO create(
                        NotificationCreateDTO request) {

                validateCreateRequest(request);

                if (request.getActorId() != null
                                && request.getActorId().equals(
                                                request.getRecipientId())) {

                        return null;
                }

                LocalDateTime now = LocalDateTime.now();

                String deduplicationKey = cleanText(
                                request.getDeduplicationKey());

                /*
                 * Cùng một nghiệp vụ có cùng deduplicationKey
                 * chỉ được tạo notification một lần.
                 *
                 * Không đưa notification cũ về unread,
                 * tránh scheduler hoặc callback lặp lại
                 * làm thông báo xuất hiện nhiều lần.
                 */
                if (deduplicationKey != null) {

                        Notification existingNotification = notificationRepository
                                        .findByDeduplicationKey(
                                                        deduplicationKey)
                                        .orElse(null);

                        if (existingNotification != null) {
                                return toDTO(
                                                existingNotification);
                        }
                }

                Notification notification = new Notification();

                notification.setId(
                                generateId());

                notification.setRecipientId(
                                request.getRecipientId());

                notification.setCreatedAt(
                                now);

                notification.setActorId(
                                cleanText(
                                                request.getActorId()));

                notification.setType(
                                request.getType());

                notification.setTitle(
                                request.getTitle().trim());

                notification.setMessage(
                                request.getMessage().trim());

                notification.setEntityType(
                                request.getEntityType());

                notification.setEntityId(
                                cleanText(
                                                request.getEntityId()));

                notification.setRedirectUrl(
                                cleanText(
                                                request.getRedirectUrl()));

                notification.setMetadataJson(
                                cleanText(
                                                request.getMetadataJson()));

                notification.setDeduplicationKey(
                                deduplicationKey);

                /*
                 * Nếu cùng event xảy ra lại,
                 * notification được đưa về unread.
                 */
                notification.setIsRead(false);
                notification.setReadAt(null);

                notification.setCreatedAt(now);
                notification.setUpdatedAt(now);

                Notification savedNotification = notificationRepository.save(
                                notification);

                return toDTO(savedNotification);
        }

        @Transactional(readOnly = true)
        public NotificationPageDTO getNotifications(
                        String recipientId,
                        String status,
                        int page,
                        int size) {

                int safePage = Math.max(page, 0);

                int safeSize = Math.min(
                                Math.max(size, 1),
                                100);

                PageRequest pageable = PageRequest.of(
                                safePage,
                                safeSize,
                                Sort.by(
                                                Sort.Direction.DESC,
                                                "createdAt"));

                Page<Notification> result;

                if ("unread".equalsIgnoreCase(
                                status)) {

                        result = notificationRepository
                                        .findByRecipientIdAndIsReadFalse(
                                                        recipientId,
                                                        pageable);

                } else {
                        result = notificationRepository
                                        .findByRecipientId(
                                                        recipientId,
                                                        pageable);
                }

                NotificationPageDTO response = new NotificationPageDTO();

                response.setContent(
                                result.getContent()
                                                .stream()
                                                .map(this::toDTO)
                                                .toList());

                response.setPage(
                                result.getNumber());

                response.setSize(
                                result.getSize());

                response.setTotalElements(
                                result.getTotalElements());

                response.setTotalPages(
                                result.getTotalPages());

                response.setFirst(
                                result.isFirst());

                response.setLast(
                                result.isLast());

                return response;
        }

        @Transactional(readOnly = true)
        public long countUnread(
                        String recipientId) {

                return notificationRepository
                                .countByRecipientIdAndIsReadFalse(
                                                recipientId);
        }

        @Transactional
        public NotificationDTO markAsRead(
                        String notificationId,
                        String recipientId) {

                Notification notification = notificationRepository
                                .findByIdAndRecipientId(
                                                notificationId,
                                                recipientId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Notification not found"));

                if (!Boolean.TRUE.equals(
                                notification.getIsRead())) {

                        LocalDateTime now = LocalDateTime.now();

                        notification.setIsRead(true);
                        notification.setReadAt(now);
                        notification.setUpdatedAt(now);

                        notification = notificationRepository.save(
                                        notification);
                }

                return toDTO(notification);
        }

        @Transactional
        public int markAllAsRead(
                        String recipientId) {

                return notificationRepository
                                .markAllAsRead(
                                                recipientId,
                                                LocalDateTime.now());
        }

        @Transactional
        public void delete(
                        String notificationId,
                        String recipientId) {

                Notification notification = notificationRepository
                                .findByIdAndRecipientId(
                                                notificationId,
                                                recipientId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Notification not found"));

                notificationRepository.delete(
                                notification);
        }

        @Transactional
        public long clearRead(
                        String recipientId) {

                return notificationRepository
                                .deleteByRecipientIdAndIsReadTrue(
                                                recipientId);
        }

        private void validateCreateRequest(
                        NotificationCreateDTO request) {

                if (request == null) {
                        throw new IllegalArgumentException(
                                        "Notification request is required");
                }

                if (request.getRecipientId() == null
                                || request.getRecipientId()
                                                .isBlank()) {

                        throw new IllegalArgumentException(
                                        "Notification recipient is required");
                }

                if (request.getType() == null) {
                        throw new IllegalArgumentException(
                                        "Notification type is required");
                }

                if (request.getTitle() == null
                                || request.getTitle()
                                                .isBlank()) {

                        throw new IllegalArgumentException(
                                        "Notification title is required");
                }

                if (request.getMessage() == null
                                || request.getMessage()
                                                .isBlank()) {

                        throw new IllegalArgumentException(
                                        "Notification message is required");
                }
        }

        private NotificationDTO toDTO(
                        Notification notification) {

                NotificationDTO dto = new NotificationDTO();

                dto.setId(
                                notification.getId());

                dto.setRecipientId(
                                notification.getRecipientId());

                dto.setActorId(
                                notification.getActorId());

                dto.setType(
                                notification.getType());

                dto.setTitle(
                                notification.getTitle());

                dto.setMessage(
                                notification.getMessage());

                dto.setEntityType(
                                notification.getEntityType());

                dto.setEntityId(
                                notification.getEntityId());

                dto.setRedirectUrl(
                                notification.getRedirectUrl());

                dto.setMetadataJson(
                                notification.getMetadataJson());

                dto.setIsRead(
                                notification.getIsRead());

                dto.setReadAt(
                                notification.getReadAt());

                dto.setCreatedAt(
                                notification.getCreatedAt());

                return dto;
        }

        private String generateId() {
                return UUID.randomUUID()
                                .toString()
                                .replace("-", "");
        }

        private String cleanText(
                        String value) {

                if (value == null
                                || value.trim().isEmpty()) {
                        return null;
                }

                return value.trim();
        }

        /// helper
        @Transactional
        public NotificationDTO notifyTrackComment(
                        User actor,
                        Track track,
                        Comment comment) {

                if (actor == null
                                || track == null
                                || comment == null) {

                        return null;
                }

                String recipientId = track.getUploaderId();

                if (recipientId == null
                                || recipientId.isBlank()) {

                        return null;
                }

                /*
                 * Chủ track tự comment thì không tạo thông báo.
                 */
                if (recipientId.equals(
                                actor.getId())) {
                        return null;
                }

                String actorName = actor.getName();

                if (actorName == null
                                || actorName.isBlank()) {

                        actorName = actor.getEmail() == null
                                        ? "A user"
                                        : actor.getEmail();
                }

                String trackTitle = track.getTitle() == null
                                ? "your track"
                                : track.getTitle();

                NotificationCreateDTO request = new NotificationCreateDTO();

                request.setRecipientId(
                                recipientId);

                request.setActorId(
                                actor.getId());

                request.setType(
                                NotificationType.TRACK_COMMENT);

                request.setTitle(
                                "New comment");

                request.setMessage(
                                actorName
                                                + " commented on "
                                                + trackTitle);

                request.setEntityType(
                                NotificationEntityType.TRACK);

                request.setEntityId(
                                track.getId());

                String redirectUrl = track.getSlug() == null
                                || track.getSlug().isBlank()
                                                ? "/artist-studio"
                                                : "/track/"
                                                                + track.getSlug();

                request.setRedirectUrl(
                                redirectUrl);

                request.setMetadataJson(
                                buildCommentMetadata(
                                                actor,
                                                track,
                                                comment));

                request.setDeduplicationKey(
                                "TRACK_COMMENT:"
                                                + comment.getId());

                return create(request);
        }

        /*
         * =========================
         * PAYMENT NOTIFICATIONS
         * =========================
         */
        @Transactional
        public NotificationDTO notifyPaymentPaid(
                        PaymentTransaction payment,
                        String planName) {

                if (payment == null
                                || payment.getUserId() == null
                                || payment.getUserId().isBlank()) {

                        return null;
                }

                String normalizedPlanName = cleanText(
                                planName);

                if (normalizedPlanName == null) {
                        normalizedPlanName = "your subscription";
                }

                Map<String, Object> metadata = buildPaymentMetadata(
                                payment);

                metadata.put(
                                "planName",
                                normalizedPlanName);

                return createBusinessNotification(
                                payment.getUserId(),
                                null,
                                NotificationType.PAYMENT_PAID,
                                "Payment successful",
                                "Your payment of "
                                                + formatMoney(
                                                                payment.getAmount(),
                                                                payment.getCurrency())
                                                + " for "
                                                + normalizedPlanName
                                                + " was successful.",
                                NotificationEntityType.PAYMENT,
                                payment.getId(),
                                "/plans",
                                metadata,
                                "PAYMENT_PAID:"
                                                + payment.getId());
        }

        @Transactional
        public NotificationDTO notifyPaymentFailed(
                        PaymentTransaction payment) {

                if (payment == null
                                || payment.getUserId() == null
                                || payment.getUserId().isBlank()) {

                        return null;
                }

                Map<String, Object> metadata = buildPaymentMetadata(
                                payment);

                metadata.put(
                                "failureReason",
                                payment.getFailureReason());

                return createBusinessNotification(
                                payment.getUserId(),
                                null,
                                NotificationType.PAYMENT_FAILED,
                                "Payment failed",
                                "Your payment of "
                                                + formatMoney(
                                                                payment.getAmount(),
                                                                payment.getCurrency())
                                                + " could not be completed.",
                                NotificationEntityType.PAYMENT,
                                payment.getId(),
                                "/plans",
                                metadata,
                                "PAYMENT_FAILED:"
                                                + payment.getId());
        }

        @Transactional
        public NotificationDTO notifyPaymentCanceled(
                        PaymentTransaction payment) {

                if (payment == null
                                || payment.getUserId() == null
                                || payment.getUserId().isBlank()) {

                        return null;
                }

                return createBusinessNotification(
                                payment.getUserId(),
                                null,
                                NotificationType.PAYMENT_CANCELED,
                                "Payment canceled",
                                "Your payment of "
                                                + formatMoney(
                                                                payment.getAmount(),
                                                                payment.getCurrency())
                                                + " was canceled.",
                                NotificationEntityType.PAYMENT,
                                payment.getId(),
                                "/plans",
                                buildPaymentMetadata(
                                                payment),
                                "PAYMENT_CANCELED:"
                                                + payment.getId());
        }

        @Transactional
        public NotificationDTO notifyPaymentExpired(
                        PaymentTransaction payment) {

                if (payment == null
                                || payment.getUserId() == null
                                || payment.getUserId().isBlank()) {

                        return null;
                }

                return createBusinessNotification(
                                payment.getUserId(),
                                null,
                                NotificationType.PAYMENT_EXPIRED,
                                "Payment session expired",
                                "Your payment session for "
                                                + formatMoney(
                                                                payment.getAmount(),
                                                                payment.getCurrency())
                                                + " has expired. Please create a new payment.",
                                NotificationEntityType.PAYMENT,
                                payment.getId(),
                                "/plans",
                                buildPaymentMetadata(
                                                payment),
                                "PAYMENT_EXPIRED:"
                                                + payment.getId());
        }

        /*
         * =========================
         * SUBSCRIPTION NOTIFICATIONS
         * =========================
         */

        @Transactional
        public NotificationDTO notifySubscriptionExpiring(
                        UserSubscription subscription,
                        String planName) {

                if (subscription == null
                                || subscription.getId() == null
                                || subscription.getId().isBlank()
                                || subscription.getUserId() == null
                                || subscription.getUserId().isBlank()
                                || subscription.getCurrentPeriodEnd() == null) {

                        return null;
                }

                String normalizedPlanName = cleanText(
                                planName);

                if (normalizedPlanName == null) {
                        normalizedPlanName = "Your subscription";
                }

                Map<String, Object> metadata = buildSubscriptionMetadata(
                                subscription);

                metadata.put(
                                "planName",
                                normalizedPlanName);

                metadata.put(
                                "daysRemaining",
                                calculateRemainingDays(
                                                subscription.getCurrentPeriodEnd()));

                return createBusinessNotification(
                                subscription.getUserId(),
                                null,
                                NotificationType.SUBSCRIPTION_EXPIRING,
                                "Subscription expiring soon",
                                normalizedPlanName
                                                + " will expire on "
                                                + formatNotificationDate(
                                                                subscription.getCurrentPeriodEnd())
                                                + ". Renew your plan to keep your Artist Studio features.",
                                NotificationEntityType.SUBSCRIPTION,
                                subscription.getId(),
                                "/artist-studio?tab=subscription",
                                metadata,
                                "SUBSCRIPTION_EXPIRING:"
                                                + subscription.getId()
                                                + ":"
                                                + subscription.getCurrentPeriodEnd());
        }

        private long calculateRemainingDays(
                        LocalDateTime periodEnd) {

                if (periodEnd == null) {
                        return 0L;
                }

                LocalDateTime now = LocalDateTime.now();

                if (!periodEnd.isAfter(
                                now)) {

                        return 0L;
                }

                long remainingHours = java.time.Duration
                                .between(
                                                now,
                                                periodEnd)
                                .toHours();

                return Math.max(
                                (remainingHours + 23L) / 24L,
                                1L);
        }

        @Transactional
        public NotificationDTO notifySubscriptionActivated(
                        UserSubscription subscription,
                        String planName) {

                if (subscription == null
                                || subscription.getUserId() == null
                                || subscription.getUserId().isBlank()) {

                        return null;
                }

                String normalizedPlanName = cleanText(
                                planName);

                if (normalizedPlanName == null) {
                        normalizedPlanName = "Your subscription";
                }

                Map<String, Object> metadata = buildSubscriptionMetadata(
                                subscription);

                metadata.put(
                                "planName",
                                normalizedPlanName);

                return createBusinessNotification(
                                subscription.getUserId(),
                                null,
                                NotificationType.SUBSCRIPTION_ACTIVATED,
                                "Subscription activated",
                                normalizedPlanName
                                                + " is now active until "
                                                + formatNotificationDate(
                                                                subscription.getCurrentPeriodEnd())
                                                + ".",
                                NotificationEntityType.SUBSCRIPTION,
                                subscription.getId(),
                                "/artist-studio?tab=subscription",
                                metadata,
                                "SUBSCRIPTION_ACTIVATED:"
                                                + subscription.getId());
        }

        @Transactional
        public NotificationDTO notifySubscriptionCancelScheduled(
                        UserSubscription subscription,
                        String planName) {

                if (subscription == null
                                || subscription.getUserId() == null
                                || subscription.getUserId().isBlank()) {

                        return null;
                }

                String normalizedPlanName = cleanText(
                                planName);

                if (normalizedPlanName == null) {
                        normalizedPlanName = "Your subscription";
                }

                Map<String, Object> metadata = buildSubscriptionMetadata(
                                subscription);

                metadata.put(
                                "planName",
                                normalizedPlanName);

                return createBusinessNotification(
                                subscription.getUserId(),
                                null,
                                NotificationType.SUBSCRIPTION_CANCEL_SCHEDULED,
                                "Cancellation scheduled",
                                normalizedPlanName
                                                + " remains active until "
                                                + formatNotificationDate(
                                                                subscription.getCurrentPeriodEnd())
                                                + ". After that, your account will return to Basic.",
                                NotificationEntityType.SUBSCRIPTION,
                                subscription.getId(),
                                "/artist-studio?tab=subscription",
                                metadata,
                                "SUBSCRIPTION_CANCEL_SCHEDULED:"
                                                + subscription.getId());
        }

        @Transactional
        public NotificationDTO notifySubscriptionExpired(
                        UserSubscription subscription,
                        String planName) {

                if (subscription == null
                                || subscription.getUserId() == null
                                || subscription.getUserId().isBlank()) {

                        return null;
                }

                String normalizedPlanName = cleanText(
                                planName);

                if (normalizedPlanName == null) {
                        normalizedPlanName = "Your paid subscription";
                }

                Map<String, Object> metadata = buildSubscriptionMetadata(
                                subscription);

                metadata.put(
                                "planName",
                                normalizedPlanName);

                return createBusinessNotification(
                                subscription.getUserId(),
                                null,
                                NotificationType.SUBSCRIPTION_EXPIRED,
                                "Subscription expired",
                                normalizedPlanName
                                                + " has expired. Your account is now using the Basic plan.",
                                NotificationEntityType.SUBSCRIPTION,
                                subscription.getId(),
                                "/artist-studio?tab=subscription",
                                metadata,
                                "SUBSCRIPTION_EXPIRED:"
                                                + subscription.getId());
        }

        /*
         * =========================
         * EARNING NOTIFICATIONS
         * =========================
         */
        @Transactional
        public NotificationDTO notifyEarningAvailable(
                        String artistId,
                        String walletId,
                        long releasedAmount,
                        String currency,
                        int releasedEarningCount,
                        String batchKey) {

                if (artistId == null
                                || artistId.isBlank()
                                || releasedAmount <= 0L) {

                        return null;
                }

                Map<String, Object> metadata = new LinkedHashMap<>();

                metadata.put(
                                "artistId",
                                artistId);

                metadata.put(
                                "walletId",
                                walletId);

                metadata.put(
                                "releasedAmount",
                                releasedAmount);

                metadata.put(
                                "currency",
                                normalizeCurrency(
                                                currency));

                metadata.put(
                                "releasedEarningCount",
                                Math.max(
                                                releasedEarningCount,
                                                1));

                String normalizedBatchKey = cleanText(
                                batchKey);

                if (normalizedBatchKey == null) {
                        normalizedBatchKey = artistId
                                        + ":"
                                        + LocalDateTime.now();
                }

                return createBusinessNotification(
                                artistId,
                                null,
                                NotificationType.EARNING_AVAILABLE,
                                "Earnings available",
                                formatMoney(
                                                releasedAmount,
                                                currency)
                                                + " has been moved to your available balance.",
                                NotificationEntityType.EARNING,
                                walletId,
                                "/artist-studio?tab=earnings",
                                metadata,
                                "EARNING_AVAILABLE:"
                                                + normalizedBatchKey);
        }

        /*
         * =========================
         * PAYOUT NOTIFICATIONS
         * =========================
         */
        @Transactional
        public NotificationDTO notifyPayoutRequested(
                        ArtistPayoutRequest payoutRequest) {

                if (!isValidPayoutRequest(
                                payoutRequest)) {

                        return null;
                }

                return createPayoutNotification(
                                payoutRequest,
                                null,
                                NotificationType.PAYOUT_REQUESTED,
                                "Payout request submitted",
                                "Your payout request for "
                                                + formatMoney(
                                                                payoutRequest.getAmount(),
                                                                payoutRequest.getCurrency())
                                                + " has been submitted.",
                                "PAYOUT_REQUESTED");
        }

        @Transactional
        public NotificationDTO notifyPayoutCanceled(
                        ArtistPayoutRequest payoutRequest) {

                if (!isValidPayoutRequest(
                                payoutRequest)) {

                        return null;
                }

                return createPayoutNotification(
                                payoutRequest,
                                null,
                                NotificationType.PAYOUT_CANCELED,
                                "Payout request canceled",
                                "Your payout request for "
                                                + formatMoney(
                                                                payoutRequest.getAmount(),
                                                                payoutRequest.getCurrency())
                                                + " was canceled. The reserved amount has been returned to your available balance.",
                                "PAYOUT_CANCELED");
        }

        @Transactional
        public NotificationDTO notifyPayoutApproved(
                        ArtistPayoutRequest payoutRequest,
                        String adminId) {

                if (!isValidPayoutRequest(
                                payoutRequest)) {

                        return null;
                }

                return createPayoutNotification(
                                payoutRequest,
                                adminId,
                                NotificationType.PAYOUT_APPROVED,
                                "Payout request approved",
                                "Your payout request for "
                                                + formatMoney(
                                                                payoutRequest.getAmount(),
                                                                payoutRequest.getCurrency())
                                                + " has been approved.",
                                "PAYOUT_APPROVED");
        }

        @Transactional
        public NotificationDTO notifyPayoutRejected(
                        ArtistPayoutRequest payoutRequest,
                        String adminId) {

                if (!isValidPayoutRequest(
                                payoutRequest)) {

                        return null;
                }

                String message = "Your payout request for "
                                + formatMoney(
                                                payoutRequest.getAmount(),
                                                payoutRequest.getCurrency())
                                + " was rejected.";

                String adminNote = cleanText(
                                payoutRequest.getAdminNote());

                if (adminNote != null) {
                        message += " Reason: "
                                        + adminNote;
                }

                return createPayoutNotification(
                                payoutRequest,
                                adminId,
                                NotificationType.PAYOUT_REJECTED,
                                "Payout request rejected",
                                message,
                                "PAYOUT_REJECTED");
        }

        @Transactional
        public NotificationDTO notifyPayoutPaid(
                        ArtistPayoutRequest payoutRequest,
                        String adminId) {

                if (!isValidPayoutRequest(
                                payoutRequest)) {

                        return null;
                }

                String message = "Your payout of "
                                + formatMoney(
                                                payoutRequest.getAmount(),
                                                payoutRequest.getCurrency())
                                + " has been marked as paid.";

                String transactionReference = cleanText(
                                payoutRequest.getTransactionReference());

                if (transactionReference != null) {
                        message += " Reference: "
                                        + transactionReference
                                        + ".";
                }

                return createPayoutNotification(
                                payoutRequest,
                                adminId,
                                NotificationType.PAYOUT_PAID,
                                "Payout completed",
                                message,
                                "PAYOUT_PAID");
        }

        /*
         * =========================
         * BUSINESS NOTIFICATION HELPERS
         * =========================
         */
        private NotificationDTO createPayoutNotification(
                        ArtistPayoutRequest payoutRequest,
                        String actorId,
                        NotificationType type,
                        String title,
                        String message,
                        String deduplicationPrefix) {

                Map<String, Object> metadata = new LinkedHashMap<>();

                metadata.put(
                                "payoutRequestId",
                                payoutRequest.getId());

                metadata.put(
                                "artistId",
                                payoutRequest.getArtistId());

                metadata.put(
                                "amount",
                                payoutRequest.getAmount());

                metadata.put(
                                "currency",
                                payoutRequest.getCurrency());

                metadata.put(
                                "status",
                                payoutRequest.getStatus());

                metadata.put(
                                "bankCode",
                                payoutRequest.getBankCode());

                metadata.put(
                                "bankName",
                                payoutRequest.getBankName());

                metadata.put(
                                "transactionReference",
                                payoutRequest.getTransactionReference());

                metadata.put(
                                "adminNote",
                                payoutRequest.getAdminNote());

                return createBusinessNotification(
                                payoutRequest.getArtistId(),
                                actorId,
                                type,
                                title,
                                message,
                                NotificationEntityType.PAYOUT,
                                payoutRequest.getId(),
                                "/artist-studio?tab=earnings",
                                metadata,
                                deduplicationPrefix
                                                + ":"
                                                + payoutRequest.getId());
        }

        private NotificationDTO createBusinessNotification(
                        String recipientId,
                        String actorId,
                        NotificationType type,
                        String title,
                        String message,
                        NotificationEntityType entityType,
                        String entityId,
                        String redirectUrl,
                        Map<String, Object> metadata,
                        String deduplicationKey) {

                NotificationCreateDTO request = new NotificationCreateDTO();

                request.setRecipientId(
                                recipientId);

                request.setActorId(
                                cleanText(
                                                actorId));

                request.setType(
                                type);

                request.setTitle(
                                title);

                request.setMessage(
                                message);

                request.setEntityType(
                                entityType);

                request.setEntityId(
                                cleanText(
                                                entityId));

                request.setRedirectUrl(
                                cleanText(
                                                redirectUrl));

                request.setMetadataJson(
                                buildMetadataJson(
                                                metadata));

                request.setDeduplicationKey(
                                cleanText(
                                                deduplicationKey));

                return create(
                                request);
        }

        private Map<String, Object> buildPaymentMetadata(
                        PaymentTransaction payment) {

                Map<String, Object> metadata = new LinkedHashMap<>();

                metadata.put(
                                "paymentId",
                                payment.getId());

                metadata.put(
                                "orderCode",
                                payment.getOrderCode());

                metadata.put(
                                "amount",
                                payment.getAmount());

                metadata.put(
                                "currency",
                                payment.getCurrency());

                metadata.put(
                                "status",
                                payment.getStatus());

                metadata.put(
                                "responseCode",
                                payment.getResponseCode());

                metadata.put(
                                "transactionStatus",
                                payment.getTransactionStatus());

                metadata.put(
                                "providerTransactionId",
                                payment.getProviderTransactionId());

                return metadata;
        }

        private Map<String, Object> buildSubscriptionMetadata(
                        UserSubscription subscription) {

                Map<String, Object> metadata = new LinkedHashMap<>();

                metadata.put(
                                "subscriptionId",
                                subscription.getId());

                metadata.put(
                                "status",
                                subscription.getStatus());

                metadata.put(
                                "currentPeriodStart",
                                subscription.getCurrentPeriodStart());

                metadata.put(
                                "currentPeriodEnd",
                                subscription.getCurrentPeriodEnd());

                metadata.put(
                                "cancelAtPeriodEnd",
                                subscription.getCancelAtPeriodEnd());

                return metadata;
        }

        private boolean isValidPayoutRequest(
                        ArtistPayoutRequest payoutRequest) {

                return payoutRequest != null
                                && payoutRequest.getId() != null
                                && !payoutRequest.getId().isBlank()
                                && payoutRequest.getArtistId() != null
                                && !payoutRequest.getArtistId().isBlank();
        }

        private String formatMoney(
                        Long amount,
                        String currency) {

                long safeAmount = amount == null
                                ? 0L
                                : Math.max(
                                                amount,
                                                0L);

                return String.format(
                                Locale.US,
                                "%,d %s",
                                safeAmount,
                                normalizeCurrency(
                                                currency));
        }

        private String normalizeCurrency(
                        String currency) {

                String normalizedCurrency = cleanText(
                                currency);

                return normalizedCurrency == null
                                ? "VND"
                                : normalizedCurrency.toUpperCase(
                                                Locale.ROOT);
        }

        private String formatNotificationDate(
                        LocalDateTime value) {

                if (value == null) {
                        return "the end of the current period";
                }

                return value.format(
                                DateTimeFormatter.ofPattern(
                                                "dd/MM/yyyy HH:mm"));
        }

        private String buildMetadataJson(
                        Map<String, Object> metadata) {

                if (metadata == null
                                || metadata.isEmpty()) {

                        return null;
                }

                StringBuilder json = new StringBuilder(
                                "{");

                boolean first = true;

                for (Map.Entry<String, Object> entry : metadata.entrySet()) {

                        String key = cleanText(
                                        entry.getKey());

                        Object value = entry.getValue();

                        if (key == null
                                        || value == null) {

                                continue;
                        }

                        if (!first) {
                                json.append(",");
                        }

                        json.append("\"")
                                        .append(
                                                        escapeJson(
                                                                        key))
                                        .append("\":");

                        if (value instanceof Number
                                        || value instanceof Boolean) {

                                json.append(
                                                value);

                        } else {

                                json.append("\"")
                                                .append(
                                                                escapeJson(
                                                                                String.valueOf(
                                                                                                value)))
                                                .append("\"");
                        }

                        first = false;
                }

                json.append("}");

                return first
                                ? null
                                : json.toString();
        }

        /// meta data
        private String buildCommentMetadata(
                        User actor,
                        Track track,
                        Comment comment) {

                try {
                        String actorName = actor.getName() == null
                                        ? ""
                                        : actor.getName();

                        String trackTitle = track.getTitle() == null
                                        ? ""
                                        : track.getTitle();

                        return "{"
                                        + "\"actorId\":\""
                                        + escapeJson(actor.getId())
                                        + "\","

                                        + "\"actorName\":\""
                                        + escapeJson(actorName)
                                        + "\","

                                        + "\"trackId\":\""
                                        + escapeJson(track.getId())
                                        + "\","

                                        + "\"trackTitle\":\""
                                        + escapeJson(trackTitle)
                                        + "\","

                                        + "\"commentId\":\""
                                        + escapeJson(comment.getId())
                                        + "\""
                                        + "}";

                } catch (Exception e) {
                        return null;
                }
        }

        private String escapeJson(
                        String value) {

                if (value == null) {
                        return "";
                }

                return value
                                .replace("\\", "\\\\")
                                .replace("\"", "\\\"")
                                .replace("\n", "\\n")
                                .replace("\r", "\\r");
        }
        ///

}