package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.example.demo.entities.PaymentTransaction;
import com.example.demo.repositories.PaymentTransactionRepository;

@Service
public class PaymentMaintenanceService {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            PaymentMaintenanceService.class);

    private static final ZoneId VIETNAM_ZONE = ZoneId.of(
            "Asia/Ho_Chi_Minh");

    private final PaymentTransactionRepository paymentTransactionRepository;

    private final NotificationService notificationService;

    public PaymentMaintenanceService(
            PaymentTransactionRepository paymentTransactionRepository,
            NotificationService notificationService) {

        this.paymentTransactionRepository = paymentTransactionRepository;

        this.notificationService = notificationService;
    }

    /*
     * =========================
     * EXPIRE UNFINISHED PAYMENTS
     * =========================
     */
    @Scheduled(fixedDelayString = "${payment.maintenance.expire-delay-ms:60000}")
    @Transactional
    public void expirePendingPayments() {

        LocalDateTime now = LocalDateTime.now(
                VIETNAM_ZONE);

        List<PaymentTransaction> candidates = paymentTransactionRepository
                .findTop100ByStatusInAndExpiresAtLessThanEqualOrderByExpiresAtAsc(
                        List.of(
                                PaymentTransaction.STATUS_PENDING,
                                PaymentTransaction.STATUS_PROCESSING),
                        now);

        if (candidates.isEmpty()) {
            return;
        }

        List<PaymentTransaction> expiredPayments = new ArrayList<>();

        for (PaymentTransaction candidate : candidates) {

            if (candidate == null
                    || candidate.getId() == null
                    || candidate.getId().isBlank()) {

                continue;
            }

            PaymentTransaction payment = paymentTransactionRepository
                    .findByIdForUpdate(
                            candidate.getId())
                    .orElse(null);

            if (payment == null) {
                continue;
            }

            /*
             * Payment có thể đã được IPN hoặc Return
             * xử lý trong lúc scheduler chờ khóa.
             */
            if (!isExpirableStatus(
                    payment.getStatus())) {

                continue;
            }

            if (payment.getExpiresAt() == null
                    || payment.getExpiresAt()
                            .isAfter(now)) {

                continue;
            }

            payment.setStatus(
                    PaymentTransaction.STATUS_EXPIRED);

            payment.setFailureReason(
                    "Payment session expired.");

            payment.setUpdatedAt(
                    now);

            PaymentTransaction savedPayment = paymentTransactionRepository.save(
                    payment);

            expiredPayments.add(
                    savedPayment);
        }

        if (expiredPayments.isEmpty()) {
            return;
        }

        /*
         * Notification chỉ được tạo sau khi trạng thái
         * EXPIRED đã commit thành công.
         */
        scheduleExpiredNotificationsAfterCommit(
                expiredPayments);

        LOGGER.info(
                "Expired {} unfinished payment transaction(s) at {}",
                expiredPayments.size(),
                now);
    }

    /*
     * =========================
     * PAYMENT STATUS CHECK
     * =========================
     */
    private boolean isExpirableStatus(
            String status) {

        return PaymentTransaction.STATUS_PENDING
                .equalsIgnoreCase(status)
                || PaymentTransaction.STATUS_PROCESSING
                        .equalsIgnoreCase(status);
    }

    /*
     * =========================
     * EXPIRED NOTIFICATIONS
     * =========================
     */
    private void scheduleExpiredNotificationsAfterCommit(
            List<PaymentTransaction> expiredPayments) {

        if (expiredPayments == null
                || expiredPayments.isEmpty()) {

            return;
        }

        List<PaymentTransaction> notificationPayments = List.copyOf(
                expiredPayments);

        Runnable notificationTask = () -> {

            for (PaymentTransaction payment : notificationPayments) {

                try {

                    notificationService.notifyPaymentExpired(
                            payment);

                } catch (Exception notificationException) {

                    LOGGER.error(
                            "Cannot create expired payment notification for payment {}",
                            payment.getId(),
                            notificationException);
                }
            }
        };

        if (TransactionSynchronizationManager
                .isActualTransactionActive()
                && TransactionSynchronizationManager
                        .isSynchronizationActive()) {

            TransactionSynchronizationManager
                    .registerSynchronization(
                            new TransactionSynchronization() {

                                @Override
                                public void afterCommit() {

                                    notificationTask.run();
                                }
                            });

            return;
        }

        notificationTask.run();
    }
}