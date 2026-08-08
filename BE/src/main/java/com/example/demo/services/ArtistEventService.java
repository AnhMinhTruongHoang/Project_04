package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dtos.CreateArtistEventDTO;
import com.example.demo.dtos.SubscriptionAccessDTO;
import com.example.demo.entities.ArtistEvent;
import com.example.demo.entities.User;
import com.example.demo.repositories.ArtistEventRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class ArtistEventService {

        private static final long MAX_TICKET_IMAGE_SIZE = 10L * 1024L * 1024L;

        private static final Set<String> SUPPORTED_EVENT_TYPES = Set.of(
                        ArtistEvent.TYPE_CONCERT,
                        ArtistEvent.TYPE_TOUR,
                        ArtistEvent.TYPE_FAN_MEETING,
                        ArtistEvent.TYPE_OTHER);

        private final ArtistEventRepository artistEventRepository;

        private final UserRepository userRepository;

        private final SubscriptionService subscriptionService;

        private final CloudinaryService cloudinaryService;

        public ArtistEventService(
                        ArtistEventRepository artistEventRepository,
                        UserRepository userRepository,
                        SubscriptionService subscriptionService,
                        CloudinaryService cloudinaryService) {

                this.artistEventRepository = artistEventRepository;

                this.userRepository = userRepository;

                this.subscriptionService = subscriptionService;

                this.cloudinaryService = cloudinaryService;
        }

        /*
         * =========================
         * CREATE EVENT REQUEST
         * =========================
         */
        @Transactional
        public Map<String, Object> createEvent(
                        String artistId,
                        CreateArtistEventDTO dto,
                        MultipartFile ticketImage) {

                User artist = assertTicketingAccess(
                                artistId);

                validateCreateDTO(
                                dto);

                validateTicketImage(
                                ticketImage);

                String eventName = normalizeRequiredText(
                                dto.getEventName(),
                                "Event name",
                                200);

                String eventType = normalizeEventType(
                                dto.getEventType());

                String description = normalizeOptionalText(
                                dto.getDescription(),
                                5000);

                String venueName = normalizeRequiredText(
                                dto.getVenueName(),
                                "Venue name",
                                200);

                String venueAddress = normalizeRequiredText(
                                dto.getVenueAddress(),
                                "Venue address",
                                500);

                validateTimes(
                                dto);

                long ticketPrice = validateTicketPrice(
                                dto.getTicketPrice());

                int totalQuantity = validateTotalQuantity(
                                dto.getTotalQuantity());

                String uploadedImageUrl = null;

                try {

                        /*
                         * =========================
                         * UPLOAD REQUIRED ARTWORK
                         * =========================
                         */
                        uploadedImageUrl = cloudinaryService
                                        .uploadImage(
                                                        ticketImage);

                        ArtistEvent event = new ArtistEvent();

                        event.setArtistId(
                                        artist.getId());

                        event.setEventName(
                                        eventName);

                        event.setEventType(
                                        eventType);

                        event.setDescription(
                                        description);

                        event.setVenueName(
                                        venueName);

                        event.setVenueAddress(
                                        venueAddress);

                        event.setEventStartAt(
                                        dto.getEventStartAt());

                        event.setEventEndAt(
                                        dto.getEventEndAt());

                        event.setSaleStartAt(
                                        dto.getSaleStartAt());

                        event.setSaleEndAt(
                                        dto.getSaleEndAt());

                        event.setTicketPrice(
                                        ticketPrice);

                        event.setCurrency(
                                        ArtistEvent.CURRENCY_VND);

                        event.setTotalQuantity(
                                        totalQuantity);

                        event.setSoldQuantity(
                                        0);

                        event.setTicketImageUrl(
                                        uploadedImageUrl);

                        /*
                         * Artist cannot self-approve.
                         */
                        event.setApprovalStatus(
                                        ArtistEvent.APPROVAL_PENDING_REVIEW);

                        event.setRejectionReason(
                                        null);

                        event.setReviewedBy(
                                        null);

                        event.setReviewedAt(
                                        null);

                        event.setStatus(
                                        ArtistEvent.STATUS_ACTIVE);

                        ArtistEvent savedEvent = artistEventRepository
                                        .saveAndFlush(
                                                        event);

                        return buildEventResponse(
                                        savedEvent);

                } catch (Exception createError) {

                        /*
                         * =========================
                         * SAFE CLOUDINARY CLEANUP
                         * =========================
                         */
                        if (uploadedImageUrl != null
                                        && !uploadedImageUrl.isBlank()) {

                                try {

                                        cloudinaryService
                                                        .deleteImage(
                                                                        uploadedImageUrl);

                                } catch (Exception cleanupError) {

                                        System.err.println(
                                                        "Cannot clean up ticket artwork: "
                                                                        + cleanupError.getMessage());
                                }
                        }

                        if (createError instanceof RuntimeException runtimeException) {
                                throw runtimeException;
                        }

                        throw new IllegalStateException(
                                        "Unable to upload ticket artwork",
                                        createError);
                }
        }

        /*
         * =========================
         * ARTIST ACCESS
         * =========================
         */
        private User assertTicketingAccess(
                        String artistId) {

                String normalizedArtistId = normalizeRequiredText(
                                artistId,
                                "Artist ID",
                                24);

                User artist = userRepository
                                .findById(
                                                normalizedArtistId)
                                .orElseThrow(
                                                () -> new java.util.NoSuchElementException(
                                                                "Artist account not found"));

                if (!"ACTIVE".equalsIgnoreCase(
                                artist.getAccountStatus())) {

                        throw new SecurityException(
                                        "Artist account is not active");
                }

                if (!"ARTIST".equalsIgnoreCase(
                                artist.getType())) {

                        throw new SecurityException(
                                        "Only artist accounts can create ticket events");
                }

                SubscriptionAccessDTO access = subscriptionService
                                .getAccessForUser(
                                                artist.getId());

                if (!Boolean.TRUE.equals(
                                access.getHasTicketingBenefits())) {

                        throw new SecurityException(
                                        "Your SoundClone plan does not include ticketing features");
                }

                return artist;
        }

        /*
         * =========================
         * ADMIN GET EVENTS
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getAdminEvents(
                        String approvalStatus,
                        int current,
                        int pageSize) {

                int normalizedCurrent = Math.max(
                                current,
                                1);

                int normalizedPageSize = Math.min(
                                Math.max(
                                                pageSize,
                                                1),
                                50);

                org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                                normalizedCurrent - 1,
                                normalizedPageSize);

                org.springframework.data.domain.Page<ArtistEvent> page;

                String normalizedApprovalStatus = approvalStatus == null
                                ? ""
                                : approvalStatus
                                                .trim()
                                                .toUpperCase(
                                                                Locale.ROOT);

                if (normalizedApprovalStatus.isBlank()) {

                        page = artistEventRepository
                                        .findAll(
                                                        pageable);

                } else {

                        validateApprovalStatus(
                                        normalizedApprovalStatus);

                        page = artistEventRepository
                                        .findByApprovalStatusOrderByCreatedAtDesc(
                                                        normalizedApprovalStatus,
                                                        pageable);
                }

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
                                                                this::buildAdminEventResponse)
                                                .toList());

                return result;
        }

        /*
         * =========================
         * ADMIN APPROVE EVENT
         * =========================
         */
        @Transactional
        public Map<String, Object> approveEvent(
                        String adminId,
                        String eventId) {

                String normalizedAdminId = normalizeRequiredText(
                                adminId,
                                "Admin ID",
                                24);

                String normalizedEventId = normalizeRequiredText(
                                eventId,
                                "Event ID",
                                24);

                ArtistEvent event = artistEventRepository
                                .findById(
                                                normalizedEventId)
                                .orElseThrow(
                                                () -> new java.util.NoSuchElementException(
                                                                "Ticket event not found"));

                if (!ArtistEvent.APPROVAL_PENDING_REVIEW
                                .equalsIgnoreCase(
                                                event.getApprovalStatus())) {

                        throw new IllegalStateException(
                                        "Only pending ticket events can be approved");
                }

                LocalDateTime now = LocalDateTime.now();

                /*
                 * Prevent approving an event
                 * that is already no longer usable.
                 */
                if (event.getEventStartAt() == null
                                || !event.getEventStartAt()
                                                .isAfter(now)) {

                        throw new IllegalStateException(
                                        "The event has already started or ended");
                }

                if (event.getSaleEndAt() == null
                                || !event.getSaleEndAt()
                                                .isAfter(now)) {

                        throw new IllegalStateException(
                                        "The ticket sale period has already ended");
                }

                event.setApprovalStatus(
                                ArtistEvent.APPROVAL_APPROVED);

                event.setRejectionReason(
                                null);

                event.setReviewedBy(
                                normalizedAdminId);

                event.setReviewedAt(
                                now);

                ArtistEvent savedEvent = artistEventRepository
                                .saveAndFlush(
                                                event);

                return buildAdminEventResponse(
                                savedEvent);
        }

        /*
         * =========================
         * ADMIN REJECT EVENT
         * =========================
         */
        @Transactional
        public Map<String, Object> rejectEvent(
                        String adminId,
                        String eventId,
                        String reason) {

                String normalizedAdminId = normalizeRequiredText(
                                adminId,
                                "Admin ID",
                                24);

                String normalizedEventId = normalizeRequiredText(
                                eventId,
                                "Event ID",
                                24);

                String normalizedReason = normalizeRequiredText(
                                reason,
                                "Rejection reason",
                                2000);

                ArtistEvent event = artistEventRepository
                                .findById(
                                                normalizedEventId)
                                .orElseThrow(
                                                () -> new java.util.NoSuchElementException(
                                                                "Ticket event not found"));

                if (!ArtistEvent.APPROVAL_PENDING_REVIEW
                                .equalsIgnoreCase(
                                                event.getApprovalStatus())) {

                        throw new IllegalStateException(
                                        "Only pending ticket events can be rejected");
                }

                LocalDateTime now = LocalDateTime.now();

                event.setApprovalStatus(
                                ArtistEvent.APPROVAL_REJECTED);

                event.setRejectionReason(
                                normalizedReason);

                event.setReviewedBy(
                                normalizedAdminId);

                event.setReviewedAt(
                                now);

                ArtistEvent savedEvent = artistEventRepository
                                .saveAndFlush(
                                                event);

                return buildAdminEventResponse(
                                savedEvent);
        }

        /*
         * =========================
         * APPROVAL STATUS VALIDATION
         * =========================
         */
        private void validateApprovalStatus(
                        String value) {

                boolean supported = ArtistEvent.APPROVAL_PENDING_REVIEW
                                .equals(value)
                                || ArtistEvent.APPROVAL_APPROVED
                                                .equals(value)
                                || ArtistEvent.APPROVAL_REJECTED
                                                .equals(value);

                if (!supported) {

                        throw new IllegalArgumentException(
                                        "Approval status must be PENDING_REVIEW, APPROVED or REJECTED");
                }
        }

        /*
         * =========================
         * CREATE VALIDATION
         * =========================
         */
        private void validateCreateDTO(
                        CreateArtistEventDTO dto) {

                if (dto == null) {

                        throw new IllegalArgumentException(
                                        "Event information is required");
                }

                normalizeRequiredText(
                                dto.getEventName(),
                                "Event name",
                                200);

                normalizeEventType(
                                dto.getEventType());

                normalizeOptionalText(
                                dto.getDescription(),
                                5000);

                normalizeRequiredText(
                                dto.getVenueName(),
                                "Venue name",
                                200);

                normalizeRequiredText(
                                dto.getVenueAddress(),
                                "Venue address",
                                500);

                validateTimes(
                                dto);

                validateTicketPrice(
                                dto.getTicketPrice());

                validateTotalQuantity(
                                dto.getTotalQuantity());
        }

        /*
         * =========================
         * DATE VALIDATION
         * =========================
         */
        private void validateTimes(
                        CreateArtistEventDTO dto) {

                LocalDateTime now = LocalDateTime.now();

                LocalDateTime eventStart = dto.getEventStartAt();

                LocalDateTime eventEnd = dto.getEventEndAt();

                LocalDateTime saleStart = dto.getSaleStartAt();

                LocalDateTime saleEnd = dto.getSaleEndAt();

                if (eventStart == null) {

                        throw new IllegalArgumentException(
                                        "Event start time is required");
                }

                if (!eventStart.isAfter(
                                now)) {

                        throw new IllegalArgumentException(
                                        "Event start time must be in the future");
                }

                if (eventEnd != null
                                && !eventEnd.isAfter(
                                                eventStart)) {

                        throw new IllegalArgumentException(
                                        "Event end time must be after the event start time");
                }

                if (saleStart == null) {

                        throw new IllegalArgumentException(
                                        "Ticket sale start time is required");
                }

                if (saleEnd == null) {

                        throw new IllegalArgumentException(
                                        "Ticket sale end time is required");
                }

                if (!saleEnd.isAfter(
                                saleStart)) {

                        throw new IllegalArgumentException(
                                        "Ticket sale end time must be after the sale start time");
                }

                if (saleEnd.isAfter(
                                eventStart)) {

                        throw new IllegalArgumentException(
                                        "Ticket sales must end before or when the event starts");
                }
        }

        /*
         * =========================
         * IMAGE VALIDATION
         * =========================
         */
        private void validateTicketImage(
                        MultipartFile ticketImage) {

                if (ticketImage == null
                                || ticketImage.isEmpty()) {

                        throw new IllegalArgumentException(
                                        "Ticket artwork is required");
                }

                if (ticketImage.getSize() > MAX_TICKET_IMAGE_SIZE) {

                        throw new IllegalArgumentException(
                                        "Ticket artwork must not exceed 10 MB");
                }

                String contentType = ticketImage.getContentType();

                if (contentType == null
                                || !contentType
                                                .toLowerCase(
                                                                Locale.ROOT)
                                                .startsWith(
                                                                "image/")) {

                        throw new IllegalArgumentException(
                                        "Ticket artwork must be a valid image");
                }
        }

        /*
         * =========================
         * EVENT TYPE
         * =========================
         */
        private String normalizeEventType(
                        String value) {

                String normalized = normalizeRequiredText(
                                value,
                                "Event type",
                                30)
                                .toUpperCase(
                                                Locale.ROOT);

                if (!SUPPORTED_EVENT_TYPES.contains(
                                normalized)) {

                        throw new IllegalArgumentException(
                                        "Event type must be CONCERT, TOUR, FAN_MEETING or OTHER");
                }

                return normalized;
        }

        /*
         * =========================
         * PRICE
         * =========================
         */
        private long validateTicketPrice(
                        Long value) {

                if (value == null) {

                        throw new IllegalArgumentException(
                                        "Ticket price is required");
                }

                if (value <= 0L) {

                        throw new IllegalArgumentException(
                                        "Ticket price must be greater than 0");
                }

                return value;
        }

        /*
         * =========================
         * INVENTORY
         * =========================
         */
        private int validateTotalQuantity(
                        Integer value) {

                if (value == null) {

                        throw new IllegalArgumentException(
                                        "Ticket quantity is required");
                }

                if (value <= 0) {

                        throw new IllegalArgumentException(
                                        "Ticket quantity must be greater than 0");
                }

                return value;
        }

        /*
         * =========================
         * TEXT HELPERS
         * =========================
         */
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
                                                        + " cannot exceed "
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
                                        "Text cannot exceed "
                                                        + maximumLength
                                                        + " characters");
                }

                return normalized;
        }

        /*
         * =========================
         * RESPONSE
         * =========================
         */
        private Map<String, Object> buildEventResponse(
                        ArtistEvent event) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                event.getId());

                result.put(
                                "artistId",
                                event.getArtistId());

                result.put(
                                "eventName",
                                event.getEventName());

                result.put(
                                "eventType",
                                event.getEventType());

                result.put(
                                "description",
                                event.getDescription());

                result.put(
                                "venueName",
                                event.getVenueName());

                result.put(
                                "venueAddress",
                                event.getVenueAddress());

                result.put(
                                "eventStartAt",
                                event.getEventStartAt());

                result.put(
                                "eventEndAt",
                                event.getEventEndAt());

                result.put(
                                "saleStartAt",
                                event.getSaleStartAt());

                result.put(
                                "saleEndAt",
                                event.getSaleEndAt());

                result.put(
                                "ticketPrice",
                                event.getTicketPrice());

                result.put(
                                "currency",
                                event.getCurrency());

                result.put(
                                "totalQuantity",
                                event.getTotalQuantity());

                result.put(
                                "soldQuantity",
                                event.getSoldQuantity());

                int totalQuantity = event.getTotalQuantity() == null
                                ? 0
                                : event.getTotalQuantity();

                int soldQuantity = event.getSoldQuantity() == null
                                ? 0
                                : event.getSoldQuantity();

                int reservedQuantity = event.getReservedQuantity() == null
                                ? 0
                                : event.getReservedQuantity();

                int remainingQuantity = Math.max(
                                totalQuantity
                                                - soldQuantity
                                                - reservedQuantity,
                                0);

                result.put(
                                "reservedQuantity",
                                reservedQuantity);

                result.put(
                                "remainingQuantity",
                                remainingQuantity);

                result.put(
                                "ticketImageUrl",
                                event.getTicketImageUrl());

                result.put(
                                "approvalStatus",
                                event.getApprovalStatus());

                result.put(
                                "rejectionReason",
                                event.getRejectionReason());

                result.put(
                                "reviewedBy",
                                event.getReviewedBy());

                result.put(
                                "reviewedAt",
                                event.getReviewedAt());

                result.put(
                                "status",
                                event.getStatus());

                result.put(
                                "createdAt",
                                event.getCreatedAt());

                result.put(
                                "updatedAt",
                                event.getUpdatedAt());

                return result;
        }

        /*
         * =========================
         * GET MY EVENTS
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getMyEvents(
                        String artistId,
                        int current,
                        int pageSize) {

                User artist = assertTicketingAccess(
                                artistId);

                int normalizedCurrent = Math.max(
                                current,
                                1);

                int normalizedPageSize = Math.min(
                                Math.max(
                                                pageSize,
                                                1),
                                50);

                org.springframework.data.domain.Page<ArtistEvent> page = artistEventRepository
                                .findByArtistIdOrderByCreatedAtDesc(
                                                artist.getId(),
                                                org.springframework.data.domain.PageRequest.of(
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
                                                                this::buildEventResponse)
                                                .toList());

                return result;
        }

        /*
         * =========================
         * ADMIN EVENT RESPONSE
         * =========================
         */
        private Map<String, Object> buildAdminEventResponse(
                        ArtistEvent event) {

                Map<String, Object> result = buildEventResponse(
                                event);

                User artist = userRepository
                                .findById(
                                                event.getArtistId())
                                .orElse(null);

                result.put(
                                "artistName",
                                artist == null
                                                ? null
                                                : artist.getName());

                result.put(
                                "artistUsername",
                                artist == null
                                                ? null
                                                : artist.getUsername());

                result.put(
                                "artistEmail",
                                artist == null
                                                ? null
                                                : artist.getEmail());

                return result;
        }

        /*
         * =========================
         * PUBLIC ARTIST EVENTS
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getPublicArtistEvents(
                        String artistId,
                        int current,
                        int pageSize) {

                String normalizedArtistId = normalizeRequiredText(
                                artistId,
                                "Artist ID",
                                24);

                /*
                 * Confirm artist exists.
                 */
                User artist = userRepository
                                .findById(
                                                normalizedArtistId)
                                .orElseThrow(
                                                () -> new java.util.NoSuchElementException(
                                                                "Artist not found"));

                if (!"ARTIST".equalsIgnoreCase(
                                artist.getType())) {

                        throw new java.util.NoSuchElementException(
                                        "Artist not found");
                }

                int normalizedCurrent = Math.max(
                                current,
                                1);

                int normalizedPageSize = Math.min(
                                Math.max(
                                                pageSize,
                                                1),
                                50);

                LocalDateTime now = LocalDateTime.now();

                org.springframework.data.domain.Page<ArtistEvent> page = artistEventRepository
                                .findByArtistIdAndApprovalStatusAndStatusAndEventStartAtAfterOrderByEventStartAtAsc(
                                                artist.getId(),
                                                ArtistEvent.APPROVAL_APPROVED,
                                                ArtistEvent.STATUS_ACTIVE,
                                                now,
                                                org.springframework.data.domain.PageRequest.of(
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
                                                                this::buildPublicEventResponse)
                                                .toList());

                return result;
        }

        /*
         * =========================
         * PUBLIC EVENT DETAIL
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getPublicEvent(
                        String eventId) {

                String normalizedEventId = normalizeRequiredText(
                                eventId,
                                "Event ID",
                                24);

                ArtistEvent event = artistEventRepository
                                .findByIdAndApprovalStatusAndStatus(
                                                normalizedEventId,
                                                ArtistEvent.APPROVAL_APPROVED,
                                                ArtistEvent.STATUS_ACTIVE)
                                .orElseThrow(
                                                () -> new java.util.NoSuchElementException(
                                                                "Ticket event not found"));

                /*
                 * Do not expose expired events
                 * through the public purchase API.
                 */
                if (event.getEventStartAt() == null
                                || !event.getEventStartAt()
                                                .isAfter(
                                                                LocalDateTime.now())) {

                        throw new java.util.NoSuchElementException(
                                        "Ticket event not found");
                }

                return buildPublicEventResponse(
                                event);
        }

        /*
         * =========================
         * TICKET SALE STATUS
         * =========================
         */
        private String resolveSaleStatus(
                        ArtistEvent event) {

                LocalDateTime now = LocalDateTime.now();

                if (ArtistEvent.STATUS_CANCELLED
                                .equalsIgnoreCase(
                                                event.getStatus())) {

                        return "CANCELLED";
                }

                if (event.getEventStartAt() != null
                                && !now.isBefore(
                                                event.getEventStartAt())) {

                        return "ENDED";
                }

                int total = event.getTotalQuantity() == null
                                ? 0
                                : event.getTotalQuantity();

                int sold = event.getSoldQuantity() == null
                                ? 0
                                : event.getSoldQuantity();

                if (total > 0
                                && sold >= total) {

                        return "SOLD_OUT";
                }

                if (event.getSaleStartAt() != null
                                && now.isBefore(
                                                event.getSaleStartAt())) {

                        return "UPCOMING";
                }

                if (event.getSaleEndAt() != null
                                && now.isAfter(
                                                event.getSaleEndAt())) {

                        return "SALE_ENDED";
                }

                return "ON_SALE";
        }

        /*
         * =========================
         * PUBLIC EVENT RESPONSE
         * =========================
         */
        private Map<String, Object> buildPublicEventResponse(
                        ArtistEvent event) {

                Map<String, Object> result = new LinkedHashMap<>();

                int totalQuantity = event.getTotalQuantity() == null
                                ? 0
                                : event.getTotalQuantity();

                int soldQuantity = event.getSoldQuantity() == null
                                ? 0
                                : event.getSoldQuantity();

                int reservedQuantity = event.getReservedQuantity() == null
                                ? 0
                                : event.getReservedQuantity();

                int remainingQuantity = Math.max(
                                totalQuantity
                                                - soldQuantity
                                                - reservedQuantity,
                                0);

                String saleStatus = resolveSaleStatus(
                                event);

                result.put(
                                "id",
                                event.getId());

                result.put(
                                "artistId",
                                event.getArtistId());

                result.put(
                                "eventName",
                                event.getEventName());

                result.put(
                                "eventType",
                                event.getEventType());

                result.put(
                                "description",
                                event.getDescription());

                result.put(
                                "venueName",
                                event.getVenueName());

                result.put(
                                "venueAddress",
                                event.getVenueAddress());

                result.put(
                                "eventStartAt",
                                event.getEventStartAt());

                result.put(
                                "eventEndAt",
                                event.getEventEndAt());

                result.put(
                                "saleStartAt",
                                event.getSaleStartAt());

                result.put(
                                "saleEndAt",
                                event.getSaleEndAt());

                result.put(
                                "ticketPrice",
                                event.getTicketPrice());

                result.put(
                                "currency",
                                event.getCurrency());

                result.put(
                                "totalQuantity",
                                totalQuantity);

                result.put(
                                "soldQuantity",
                                soldQuantity);

                result.put(
                                "remainingQuantity",
                                remainingQuantity);

                result.put(
                                "ticketImageUrl",
                                event.getTicketImageUrl());

                result.put(
                                "saleStatus",
                                saleStatus);

                result.put(
                                "canPurchase",
                                "ON_SALE".equals(
                                                saleStatus)
                                                && remainingQuantity > 0);

                return result;
        }
}