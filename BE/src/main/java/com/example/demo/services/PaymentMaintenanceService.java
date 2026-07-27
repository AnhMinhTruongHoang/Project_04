package com.example.demo.services;

import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.PaymentTransaction;
import com.example.demo.repositories.PaymentTransactionRepository;

@Service
public class PaymentMaintenanceService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PaymentTransactionRepository paymentTransactionRepository;

    public PaymentMaintenanceService(
            PaymentTransactionRepository paymentTransactionRepository) {

        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    /*
     * =========================
     * EXPIRE PENDING PAYMENTS
     * =========================
     */
    @Scheduled(fixedDelayString = "${payment.maintenance.expire-delay-ms:60000}")
    @Transactional
    public void expirePendingPayments() {

        LocalDateTime now = LocalDateTime.now(
                VIETNAM_ZONE);

        int expiredCount = paymentTransactionRepository
                .expirePendingPayments(
                        PaymentTransaction.STATUS_PENDING,
                        PaymentTransaction.STATUS_EXPIRED,
                        "Payment session expired.",
                        now);

        if (expiredCount > 0) {
            System.out.println(
                    "Expired "
                            + expiredCount
                            + " pending payment transaction(s).");
        }
    }
}