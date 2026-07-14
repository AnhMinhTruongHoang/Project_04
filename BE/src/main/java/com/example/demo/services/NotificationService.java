package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
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
                                request
                                                .getDeduplicationKey());

                Notification notification = null;

                if (deduplicationKey != null) {
                        notification = notificationRepository
                                        .findByDeduplicationKey(
                                                        deduplicationKey)
                                        .orElse(null);
                }

                if (notification == null) {
                        notification = new Notification();

                        notification.setId(
                                        generateId());

                        notification.setRecipientId(
                                        request.getRecipientId());

                        notification.setCreatedAt(
                                        now);
                }

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