package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistEvent;
import com.example.demo.entities.TicketPaymentTransaction;
import com.example.demo.repositories.ArtistEventRepository;
import com.example.demo.repositories.TicketPaymentTransactionRepository;

@Service
public class TicketPaymentMaintenanceService {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            TicketPaymentMaintenanceService.class);

    private static final ZoneId VIETNAM_ZONE = ZoneId.of(
            "Asia/Ho_Chi_Minh");

    private final TicketPaymentTransactionRepository ticketPaymentTransactionRepository;

    private final ArtistEventRepository artistEventRepository;

    /*
     * Cho callback VNPay thêm một khoảng
     * grace period trước khi release vé.
     *
     * Ví dụ:
     * expiresAt = 10:00
     * grace = 120 giây
     *
     * Scheduler chỉ expire từ 10:02.
     */
    @Value("${ticketing.maintenance.expire-grace-seconds:120}")
    private long expireGraceSeconds;

    public TicketPaymentMaintenanceService(
            TicketPaymentTransactionRepository ticketPaymentTransactionRepository,
            ArtistEventRepository artistEventRepository) {

        this.ticketPaymentTransactionRepository = ticketPaymentTransactionRepository;

        this.artistEventRepository = artistEventRepository;
    }

    /*
     * =========================
     * EXPIRE PENDING TICKET PAYMENTS
     * =========================
     */
    @Scheduled(fixedDelayString = "${ticketing.maintenance.expire-delay-ms:60000}")
    @Transactional
    public void expirePendingTicketPayments() {

        LocalDateTime now = LocalDateTime.now(
                VIETNAM_ZONE);

        long normalizedGraceSeconds = Math.max(
                expireGraceSeconds,
                0L);

        LocalDateTime expirationCutoff = now.minusSeconds(
                normalizedGraceSeconds);

        /*
         * Ticket chỉ expire PENDING.
         *
         * PROCESSING không expire ở đây vì
         * PROCESSING chỉ tồn tại bên trong
         * callback transaction.
         *
         * Nếu callback rollback thì payment
         * quay lại PENDING.
         */
        List<TicketPaymentTransaction> candidates = ticketPaymentTransactionRepository
                .findTop100ByStatusAndExpiresAtLessThanEqualOrderByExpiresAtAsc(
                        TicketPaymentTransaction.STATUS_PENDING,
                        expirationCutoff);

        if (candidates.isEmpty()) {
            return;
        }

        int expiredCount = 0;

        for (TicketPaymentTransaction candidate : candidates) {

            if (candidate == null
                    || candidate.getId() == null
                    || candidate.getId().isBlank()) {

                continue;
            }

            /*
             * =========================
             * LOCK PAYMENT
             * =========================
             *
             * Callback VNPay có thể đang
             * xử lý cùng payment.
             */
            TicketPaymentTransaction payment = ticketPaymentTransactionRepository
                    .findByIdForUpdate(
                            candidate.getId())
                    .orElse(null);

            if (payment == null) {
                continue;
            }

            /*
             * Payment có thể đã chuyển PAID
             * trong lúc scheduler chờ lock.
             */
            if (!TicketPaymentTransaction.STATUS_PENDING
                    .equalsIgnoreCase(
                            payment.getStatus())) {

                continue;
            }

            if (payment.getExpiresAt() == null
                    || payment.getExpiresAt()
                            .isAfter(
                                    expirationCutoff)) {

                continue;
            }

            /*
             * =========================
             * RELEASE INVENTORY
             * =========================
             */
            if (Boolean.TRUE.equals(
                    payment.getInventoryReserved())) {

                ArtistEvent event = artistEventRepository
                        .findByIdForUpdate(
                                payment.getEventId())
                        .orElse(null);

                if (event == null) {

                    LOGGER.error(
                            "Cannot expire ticket payment {} because event {} was not found",
                            payment.getId(),
                            payment.getEventId());

                    continue;
                }

                int quantity = payment.getQuantity() == null
                        ? 0
                        : payment.getQuantity();

                int reservedQuantity = event.getReservedQuantity() == null
                        ? 0
                        : event.getReservedQuantity();

                /*
                 * Không dùng Math.max() ở đây.
                 *
                 * Nếu inventory sai, không được
                 * âm thầm sửa vì có thể làm mất
                 * reservation của payment khác.
                 */
                if (quantity <= 0) {

                    LOGGER.error(
                            "Cannot expire ticket payment {} because quantity is invalid: {}",
                            payment.getId(),
                            quantity);

                    continue;
                }

                if (reservedQuantity < quantity) {

                    LOGGER.error(
                            "Cannot release reservation for ticket payment {}. Reserved={}, quantity={}",
                            payment.getId(),
                            reservedQuantity,
                            quantity);

                    continue;
                }

                event.setReservedQuantity(
                        reservedQuantity
                                - quantity);

                artistEventRepository
                        .saveAndFlush(
                                event);

                payment.setInventoryReserved(
                        false);
            }

            /*
             * =========================
             * MARK EXPIRED
             * =========================
             */
            payment.setStatus(
                    TicketPaymentTransaction.STATUS_EXPIRED);

            payment.setFailureReason(
                    "Ticket payment session expired");

            ticketPaymentTransactionRepository
                    .save(
                            payment);

            expiredCount++;
        }

        if (expiredCount > 0) {

            LOGGER.info(
                    "Expired {} ticket payment transaction(s) at {}",
                    expiredCount,
                    now);
        }
    }
}