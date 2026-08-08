package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistEvent;
import com.example.demo.entities.User;
import com.example.demo.entities.UserEventTicket;
import com.example.demo.repositories.ArtistEventRepository;
import com.example.demo.repositories.UserEventTicketRepository;

@Service
public class UserEventTicketService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of(
            "Asia/Ho_Chi_Minh");

    private final UserEventTicketRepository userEventTicketRepository;

    private final ArtistEventRepository artistEventRepository;

    private final TicketFulfillmentService ticketFulfillmentService;

    public UserEventTicketService(
            UserEventTicketRepository userEventTicketRepository,
            ArtistEventRepository artistEventRepository,
            TicketFulfillmentService ticketFulfillmentService) {

        this.userEventTicketRepository = userEventTicketRepository;

        this.artistEventRepository = artistEventRepository;

        this.ticketFulfillmentService = ticketFulfillmentService;
    }

    /*
     * =========================
     * MY TICKET COLLECTION
     * =========================
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMyTickets(
            String buyerId,
            int current,
            int pageSize) {

        String normalizedBuyerId = normalizeRequired(
                buyerId,
                "Buyer ID");

        int normalizedCurrent = Math.max(
                current,
                1);

        int normalizedPageSize = Math.min(
                Math.max(
                        pageSize,
                        1),
                50);

        Page<UserEventTicket> page = userEventTicketRepository
                .findByBuyerIdOrderByPurchasedAtDesc(
                        normalizedBuyerId,
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
                                this::buildTicketResponse)
                        .toList());

        return result;
    }

    /*
     * =========================
     * MY TICKET DETAIL
     * =========================
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMyTicket(
            String buyerId,
            String ticketId) {

        String normalizedBuyerId = normalizeRequired(
                buyerId,
                "Buyer ID");

        String normalizedTicketId = normalizeRequired(
                ticketId,
                "Ticket ID");

        UserEventTicket ticket = userEventTicketRepository
                .findByIdAndBuyerId(
                        normalizedTicketId,
                        normalizedBuyerId)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "Ticket not found"));

        return buildTicketResponse(
                ticket);
    }

    /*
     * =========================
     * GET MY TICKET QR
     * =========================
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMyTicketQr(
            String buyerId,
            String ticketId) {

        String normalizedBuyerId = normalizeRequired(
                buyerId,
                "Buyer ID");

        String normalizedTicketId = normalizeRequired(
                ticketId,
                "Ticket ID");

        UserEventTicket ticket = userEventTicketRepository
                .findByIdAndBuyerId(
                        normalizedTicketId,
                        normalizedBuyerId)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "Ticket not found"));

        if (UserEventTicket.STATUS_CANCELLED
                .equalsIgnoreCase(
                        ticket.getStatus())) {

            throw new IllegalStateException(
                    "This ticket has been cancelled");
        }

        String qrToken = ticketFulfillmentService
                .buildQrToken(
                        ticket);

        Map<String, Object> result = new LinkedHashMap<>();

        result.put(
                "ticketId",
                ticket.getId());

        result.put(
                "ticketCode",
                ticket.getTicketCode());

        result.put(
                "eventId",
                ticket.getEventId());

        result.put(
                "eventName",
                ticket.getEventNameSnapshot());

        result.put(
                "status",
                ticket.getStatus());

        /*
         * FE sẽ dùng value này để render QR.
         */
        result.put(
                "qrValue",
                qrToken);

        return result;
    }

    /*
     * =========================
     * CHECK-IN TICKET
     * =========================
     */
    @Transactional
    public Map<String, Object> checkInTicket(
            User operator,
            String rawQrToken) {

        if (operator == null) {

            throw new SecurityException(
                    "Authentication is required");
        }

        String normalizedToken = normalizeRequired(
                rawQrToken,
                "QR token");

        /*
         * Token format:
         *
         * SCT-XXXXXXXXXX.signature
         */
        int separatorIndex = normalizedToken
                .indexOf('.');

        if (separatorIndex <= 0) {

            throw new IllegalArgumentException(
                    "Ticket QR code is invalid");
        }

        String ticketCode = normalizedToken
                .substring(
                        0,
                        separatorIndex)
                .trim()
                .toUpperCase(
                        Locale.ROOT);

        UserEventTicket ticket = userEventTicketRepository
                .findByTicketCodeForUpdate(
                        ticketCode)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "Ticket not found"));

        /*
         * =========================
         * OPERATOR PERMISSION
         * =========================
         *
         * Admin:
         * can scan any ticket.
         *
         * Artist:
         * only tickets for their event.
         */
        boolean admin = operator.getRole() != null
                && "ADMIN"
                        .equalsIgnoreCase(
                                operator.getRole());

        boolean eventArtist = operator.getId() != null
                && operator.getId()
                        .equals(
                                ticket.getArtistId());

        if (!admin
                && !eventArtist) {

            throw new SecurityException(
                    "You do not have permission to check in this ticket");
        }

        /*
         * =========================
         * VERIFY QR SECURITY
         * =========================
         */
        boolean qrValid = ticketFulfillmentService
                .verifyQrToken(
                        ticket,
                        normalizedToken);

        if (!qrValid) {

            throw new IllegalArgumentException(
                    "Ticket QR code is invalid");
        }

        /*
         * =========================
         * TICKET STATE
         * =========================
         */
        if (UserEventTicket.STATUS_USED
                .equalsIgnoreCase(
                        ticket.getStatus())) {

            throw new IllegalStateException(
                    "This ticket has already been used");
        }

        if (UserEventTicket.STATUS_CANCELLED
                .equalsIgnoreCase(
                        ticket.getStatus())) {

            throw new IllegalStateException(
                    "This ticket has been cancelled");
        }

        if (!UserEventTicket.STATUS_VALID
                .equalsIgnoreCase(
                        ticket.getStatus())) {

            throw new IllegalStateException(
                    "This ticket cannot be checked in");
        }

        /*
         * =========================
         * EVENT STATE
         * =========================
         */
        ArtistEvent event = artistEventRepository
                .findById(
                        ticket.getEventId())
                .orElseThrow(
                        () -> new IllegalStateException(
                                "Ticket event not found"));

        if (ArtistEvent.STATUS_CANCELLED
                .equalsIgnoreCase(
                        event.getStatus())) {

            throw new IllegalStateException(
                    "This event has been cancelled");
        }

        /*
         * =========================
         * MARK USED
         * =========================
         */
        LocalDateTime now = LocalDateTime.now(
                VIETNAM_ZONE);

        ticket.setStatus(
                UserEventTicket.STATUS_USED);

        ticket.setCheckedInAt(
                now);

        ticket.setCheckedInBy(
                operator.getId());

        UserEventTicket savedTicket = userEventTicketRepository
                .saveAndFlush(
                        ticket);

        return buildTicketResponse(
                savedTicket);
    }

    /*
     * =========================
     * TICKET RESPONSE
     * =========================
     */
    private Map<String, Object> buildTicketResponse(
            UserEventTicket ticket) {

        Map<String, Object> result = new LinkedHashMap<>();

        result.put(
                "id",
                ticket.getId());

        result.put(
                "ticketCode",
                ticket.getTicketCode());

        result.put(
                "eventId",
                ticket.getEventId());

        result.put(
                "artistId",
                ticket.getArtistId());

        result.put(
                "eventName",
                ticket.getEventNameSnapshot());

        result.put(
                "venueName",
                ticket.getVenueNameSnapshot());

        result.put(
                "venueAddress",
                ticket.getVenueAddressSnapshot());

        result.put(
                "eventStartAt",
                ticket.getEventStartAtSnapshot());

        result.put(
                "ticketImageUrl",
                ticket.getTicketImageUrl());

        result.put(
                "purchasePrice",
                ticket.getPurchasePrice());

        result.put(
                "currency",
                ticket.getCurrency());

        result.put(
                "status",
                ticket.getStatus());

        result.put(
                "collectionStatus",
                resolveCollectionStatus(
                        ticket));

        result.put(
                "purchasedAt",
                ticket.getPurchasedAt());

        result.put(
                "checkedInAt",
                ticket.getCheckedInAt());

        return result;
    }

    /*
     * =========================
     * COLLECTION STATUS
     * =========================
     */
    private String resolveCollectionStatus(
            UserEventTicket ticket) {

        if (UserEventTicket.STATUS_CANCELLED
                .equalsIgnoreCase(
                        ticket.getStatus())) {

            return "CANCELLED";
        }

        if (UserEventTicket.STATUS_USED
                .equalsIgnoreCase(
                        ticket.getStatus())) {

            return "USED";
        }

        LocalDateTime eventStartAt = ticket.getEventStartAtSnapshot();

        if (eventStartAt != null
                && eventStartAt.isBefore(
                        LocalDateTime.now(
                                VIETNAM_ZONE))) {

            return "PAST";
        }

        return "UPCOMING";
    }

    private String normalizeRequired(
            String value,
            String fieldName) {

        if (value == null
                || value.isBlank()) {

            throw new IllegalArgumentException(
                    fieldName
                            + " is required");
        }

        return value.trim();
    }
}