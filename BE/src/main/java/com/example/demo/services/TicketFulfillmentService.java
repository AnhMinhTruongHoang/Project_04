package com.example.demo.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistEvent;
import com.example.demo.entities.ArtistWallet;
import com.example.demo.entities.TicketPaymentTransaction;
import com.example.demo.entities.TicketRevenueLedger;
import com.example.demo.entities.UserEventTicket;
import com.example.demo.repositories.ArtistEventRepository;
import com.example.demo.repositories.ArtistWalletRepository;
import com.example.demo.repositories.TicketRevenueLedgerRepository;
import com.example.demo.repositories.UserEventTicketRepository;

@Service
public class TicketFulfillmentService {

        private final ArtistEventRepository artistEventRepository;

        private final UserEventTicketRepository userEventTicketRepository;

        private final TicketRevenueLedgerRepository ticketRevenueLedgerRepository;

        private final ArtistWalletRepository artistWalletRepository;

        @Value("${ticketing.revenue-hold-days:7}")
        private int revenueHoldDays;

        @Value("${ticketing.qr-secret}")
        private String qrSecret;

        public TicketFulfillmentService(
                        ArtistEventRepository artistEventRepository,
                        UserEventTicketRepository userEventTicketRepository,
                        TicketRevenueLedgerRepository ticketRevenueLedgerRepository,
                        ArtistWalletRepository artistWalletRepository) {

                this.artistEventRepository = artistEventRepository;

                this.userEventTicketRepository = userEventTicketRepository;

                this.ticketRevenueLedgerRepository = ticketRevenueLedgerRepository;

                this.artistWalletRepository = artistWalletRepository;
        }

        /*
         * =========================
         * FULFILL PAID TICKET PAYMENT
         * =========================
         */
        @Transactional
        public List<UserEventTicket> fulfillPaidPayment(
                        TicketPaymentTransaction payment,
                        LocalDateTime paidAt) {

                if (payment == null) {

                        throw new IllegalArgumentException(
                                        "Ticket payment is required");
                }

                if (paidAt == null) {

                        throw new IllegalArgumentException(
                                        "Ticket payment time is required");
                }

                int quantity = payment.getQuantity() == null
                                ? 0
                                : payment.getQuantity();

                if (quantity <= 0) {

                        throw new IllegalStateException(
                                        "Ticket payment quantity is invalid");
                }

                /*
                 * =========================
                 * IDEMPOTENCY
                 * =========================
                 *
                 * Nếu ticket đã được issue cho
                 * payment này thì không issue lại.
                 */
                List<UserEventTicket> existingTickets = userEventTicketRepository
                                .findByPaymentIdOrderByCreatedAtAsc(
                                                payment.getId());

                if (!existingTickets.isEmpty()) {

                        if (existingTickets.size() != quantity) {

                                throw new IllegalStateException(
                                                "Issued ticket quantity does not match the payment");
                        }

                        return existingTickets;
                }

                /*
                 * =========================
                 * LOCK EVENT INVENTORY
                 * =========================
                 */
                ArtistEvent event = artistEventRepository
                                .findByIdForUpdate(
                                                payment.getEventId())
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Ticket event not found"));

                if (!payment.getArtistId()
                                .equals(
                                                event.getArtistId())) {

                        throw new IllegalStateException(
                                        "Ticket payment artist does not match the event");
                }

                /*
                 * Payment phải đang giữ inventory.
                 */
                if (!Boolean.TRUE.equals(
                                payment.getInventoryReserved())) {

                        throw new IllegalStateException(
                                        "Ticket inventory reservation is no longer active");
                }

                int reserved = event.getReservedQuantity() == null
                                ? 0
                                : event.getReservedQuantity();

                int sold = event.getSoldQuantity() == null
                                ? 0
                                : event.getSoldQuantity();

                int total = event.getTotalQuantity() == null
                                ? 0
                                : event.getTotalQuantity();

                if (reserved < quantity) {

                        throw new IllegalStateException(
                                        "Reserved ticket inventory is inconsistent");
                }

                if (sold + quantity > total) {

                        throw new IllegalStateException(
                                        "Ticket inventory would exceed the event capacity");
                }

                /*
                 * =========================
                 * RESERVED → SOLD
                 * =========================
                 */
                event.setReservedQuantity(
                                reserved - quantity);

                event.setSoldQuantity(
                                Math.addExact(
                                                sold,
                                                quantity));

                artistEventRepository
                                .saveAndFlush(
                                                event);

                payment.setInventoryReserved(
                                false);

                /*
                 * =========================
                 * ISSUE UNIQUE TICKETS
                 * =========================
                 */
                List<UserEventTicket> issuedTickets = new ArrayList<>();

                long unitPrice = payment.getUnitPrice() == null
                                ? 0L
                                : payment.getUnitPrice();

                if (unitPrice <= 0L) {

                        throw new IllegalStateException(
                                        "Ticket purchase price is invalid");
                }

                for (int index = 0; index < quantity; index++) {

                        UserEventTicket ticket = new UserEventTicket();

                        String ticketCode = generateUniqueTicketCode();

                        String rawQrToken = generateQrToken(
                                        ticketCode,
                                        payment.getBuyerId(),
                                        event.getId());

                        ticket.setTicketCode(
                                        ticketCode);

                        ticket.setEventId(
                                        event.getId());

                        ticket.setArtistId(
                                        event.getArtistId());

                        ticket.setBuyerId(
                                        payment.getBuyerId());

                        ticket.setPaymentId(
                                        payment.getId());

                        /*
                         * =========================
                         * EVENT SNAPSHOT
                         * =========================
                         */
                        ticket.setEventNameSnapshot(
                                        event.getEventName());

                        ticket.setVenueNameSnapshot(
                                        event.getVenueName());

                        ticket.setVenueAddressSnapshot(
                                        event.getVenueAddress());

                        ticket.setEventStartAtSnapshot(
                                        event.getEventStartAt());

                        ticket.setTicketImageUrl(
                                        event.getTicketImageUrl());

                        ticket.setPurchasePrice(
                                        unitPrice);

                        ticket.setCurrency(
                                        payment.getCurrency());

                        /*
                         * Raw token không lưu DB.
                         */
                        ticket.setQrTokenHash(
                                        sha256(
                                                        rawQrToken));

                        ticket.setStatus(
                                        UserEventTicket.STATUS_VALID);

                        ticket.setPurchasedAt(
                                        paidAt);

                        UserEventTicket savedTicket = userEventTicketRepository
                                        .saveAndFlush(
                                                        ticket);

                        issuedTickets.add(
                                        savedTicket);
                }

                if (issuedTickets.isEmpty()) {

                        throw new IllegalStateException(
                                        "No tickets were issued");
                }

                payment.setPrimaryTicketId(
                                issuedTickets
                                                .get(0)
                                                .getId());

                /*
                 * =========================
                 * REVENUE + WALLET
                 * =========================
                 */
                createTicketRevenue(
                                payment,
                                paidAt);

                return issuedTickets;
        }

        /*
         * =========================
         * CREATE TICKET REVENUE
         * =========================
         */
        private void createTicketRevenue(
                        TicketPaymentTransaction payment,
                        LocalDateTime paidAt) {

                /*
                 * Không cộng ví hai lần cho
                 * cùng một ticket payment.
                 */
                if (ticketRevenueLedgerRepository
                                .existsByTicketPaymentId(
                                                payment.getId())) {

                        return;
                }

                long artistNetAmount = payment.getArtistNetAmount() == null
                                ? 0L
                                : payment.getArtistNetAmount();

                if (artistNetAmount <= 0L) {

                        throw new IllegalStateException(
                                        "Artist ticket revenue is invalid");
                }

                /*
                 * Artist row sẽ được lock ở
                 * TicketPaymentService trước khi
                 * gọi fulfillment.
                 *
                 * Vì vậy nếu wallet chưa tồn tại,
                 * chỉ một transaction tạo wallet.
                 */
                ArtistWallet wallet = artistWalletRepository
                                .findByArtistIdForUpdate(
                                                payment.getArtistId())
                                .orElse(null);

                if (wallet == null) {

                        wallet = new ArtistWallet();

                        wallet.setArtistId(
                                        payment.getArtistId());

                        wallet.setPendingBalance(
                                        0L);

                        wallet.setAvailableBalance(
                                        0L);

                        wallet.setReservedBalance(
                                        0L);

                        wallet.setWithdrawnBalance(
                                        0L);

                        wallet.setLifetimeEarnings(
                                        0L);

                        wallet.setCurrency(
                                        "VND");

                        wallet.setStatus(
                                        ArtistWallet.STATUS_ACTIVE);

                        wallet = artistWalletRepository
                                        .saveAndFlush(
                                                        wallet);
                }

                if (!ArtistWallet.STATUS_ACTIVE
                                .equalsIgnoreCase(
                                                wallet.getStatus())) {

                        throw new IllegalStateException(
                                        "Artist wallet is not active");
                }

                long pendingBalance = safeMoney(
                                wallet.getPendingBalance());

                long lifetimeEarnings = safeMoney(
                                wallet.getLifetimeEarnings());

                wallet.setPendingBalance(
                                Math.addExact(
                                                pendingBalance,
                                                artistNetAmount));

                wallet.setLifetimeEarnings(
                                Math.addExact(
                                                lifetimeEarnings,
                                                artistNetAmount));

                artistWalletRepository
                                .saveAndFlush(
                                                wallet);

                TicketRevenueLedger ledger = new TicketRevenueLedger();

                ledger.setTicketPaymentId(
                                payment.getId());

                ledger.setEventId(
                                payment.getEventId());

                ledger.setArtistId(
                                payment.getArtistId());

                ledger.setBuyerId(
                                payment.getBuyerId());

                ledger.setSourceType(
                                TicketRevenueLedger.SOURCE_TICKET_SALE);

                ledger.setQuantity(
                                payment.getQuantity());

                ledger.setGrossAmount(
                                payment.getGrossAmount());

                ledger.setPlatformFeeAmount(
                                payment.getPlatformFeeAmount());

                ledger.setArtistNetAmount(
                                artistNetAmount);

                ledger.setCurrency(
                                payment.getCurrency());

                ledger.setStatus(
                                TicketRevenueLedger.STATUS_PENDING);

                ledger.setAvailableAt(
                                paidAt.plusDays(
                                                Math.max(
                                                                revenueHoldDays,
                                                                0)));

                ticketRevenueLedgerRepository
                                .saveAndFlush(
                                                ledger);
        }

        /*
         * =========================
         * UNIQUE TICKET CODE
         * =========================
         */
        private String generateUniqueTicketCode() {

                for (int attempt = 0; attempt < 20; attempt++) {

                        String randomPart = UUID.randomUUID()
                                        .toString()
                                        .replace("-", "")
                                        .substring(0, 10)
                                        .toUpperCase(
                                                        Locale.ROOT);

                        String ticketCode = "SCT-"
                                        + randomPart;

                        if (!userEventTicketRepository
                                        .existsByTicketCode(
                                                        ticketCode)) {

                                return ticketCode;
                        }
                }

                throw new IllegalStateException(
                                "Unable to generate a unique ticket code");
        }

        /*
         * =========================
         * QR TOKEN
         * =========================
         */
        public String buildQrToken(
                        UserEventTicket ticket) {

                if (ticket == null) {

                        throw new IllegalArgumentException(
                                        "Ticket is required");
                }

                return generateQrToken(
                                ticket.getTicketCode(),
                                ticket.getBuyerId(),
                                ticket.getEventId());
        }

        private String generateQrToken(
                        String ticketCode,
                        String buyerId,
                        String eventId) {

                try {

                        if (qrSecret == null
                                        || qrSecret.isBlank()) {

                                throw new IllegalStateException(
                                                "Ticket QR secret is not configured");
                        }

                        String payload = ticketCode
                                        + "|"
                                        + buyerId
                                        + "|"
                                        + eventId;

                        Mac mac = Mac.getInstance(
                                        "HmacSHA256");

                        mac.init(
                                        new SecretKeySpec(
                                                        qrSecret.getBytes(
                                                                        StandardCharsets.UTF_8),
                                                        "HmacSHA256"));

                        byte[] signature = mac.doFinal(
                                        payload.getBytes(
                                                        StandardCharsets.UTF_8));

                        return ticketCode
                                        + "."
                                        + HexFormat
                                                        .of()
                                                        .formatHex(
                                                                        signature);

                } catch (IllegalStateException e) {

                        throw e;

                } catch (Exception e) {

                        throw new IllegalStateException(
                                        "Unable to generate ticket QR token",
                                        e);
                }
        }

        /*
         * =========================
         * VERIFY TICKET QR TOKEN
         * =========================
         */
        public boolean verifyQrToken(
                        UserEventTicket ticket,
                        String rawQrToken) {

                if (ticket == null
                                || rawQrToken == null
                                || rawQrToken.isBlank()) {

                        return false;
                }

                String normalizedToken = rawQrToken.trim();

                /*
                 * Regenerate token bằng secret
                 * hiện tại.
                 */
                String expectedToken = buildQrToken(
                                ticket);

                boolean signatureValid = MessageDigest.isEqual(
                                expectedToken.getBytes(
                                                StandardCharsets.UTF_8),
                                normalizedToken.getBytes(
                                                StandardCharsets.UTF_8));

                if (!signatureValid) {
                        return false;
                }

                /*
                 * Đồng thời verify với hash
                 * đã lưu khi ticket được issue.
                 */
                String tokenHash = sha256(
                                normalizedToken);

                String storedHash = ticket.getQrTokenHash();

                if (storedHash == null
                                || storedHash.isBlank()) {

                        return false;
                }

                return MessageDigest.isEqual(
                                tokenHash.getBytes(
                                                StandardCharsets.UTF_8),
                                storedHash.getBytes(
                                                StandardCharsets.UTF_8));
        }

        /*
         * =========================
         * HASH
         * =========================
         */
        private String sha256(
                        String value) {

                try {

                        MessageDigest digest = MessageDigest.getInstance(
                                        "SHA-256");

                        return HexFormat
                                        .of()
                                        .formatHex(
                                                        digest.digest(
                                                                        value.getBytes(
                                                                                        StandardCharsets.UTF_8)));

                } catch (Exception e) {

                        throw new IllegalStateException(
                                        "Unable to hash ticket QR token",
                                        e);
                }
        }

        private long safeMoney(
                        Long value) {

                return value == null
                                ? 0L
                                : Math.max(
                                                value,
                                                0L);
        }
}