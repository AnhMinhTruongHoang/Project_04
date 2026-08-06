package com.example.demo.services;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistMembershipSubscription;
import com.example.demo.entities.ArtistWallet;
import com.example.demo.entities.MembershipPaymentTransaction;
import com.example.demo.entities.MembershipRevenueLedger;
import com.example.demo.repositories.ArtistMembershipSubscriptionRepository;
import com.example.demo.repositories.ArtistWalletRepository;
import com.example.demo.repositories.MembershipRevenueLedgerRepository;

@Service
public class ArtistMembershipActivationService {

    private static final String CURRENCY_VND = "VND";

    private final ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository;

    private final MembershipRevenueLedgerRepository membershipRevenueLedgerRepository;

    private final ArtistWalletRepository artistWalletRepository;

    @Value("${membership.revenue-hold-days:7}")
    private long revenueHoldDays;

    public ArtistMembershipActivationService(
            ArtistMembershipSubscriptionRepository artistMembershipSubscriptionRepository,

            MembershipRevenueLedgerRepository membershipRevenueLedgerRepository,

            ArtistWalletRepository artistWalletRepository) {

        this.artistMembershipSubscriptionRepository = artistMembershipSubscriptionRepository;

        this.membershipRevenueLedgerRepository = membershipRevenueLedgerRepository;

        this.artistWalletRepository = artistWalletRepository;
    }

    /*
     * =========================
     * ACTIVATE PAID MEMBERSHIP
     * =========================
     *
     * Phải được gọi bên trong transaction
     * xử lý VNPay IPN.
     *
     * Nếu có lỗi ở bất kỳ bước nào:
     *
     * - membership;
     * - revenue ledger;
     * - artist wallet;
     * - payment;
     *
     * toàn bộ transaction sẽ rollback.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public ArtistMembershipSubscription activatePaidMembership(
            MembershipPaymentTransaction payment,
            LocalDateTime paidAt) {

        validatePayment(
                payment);

        LocalDateTime activationTime = paidAt == null
                ? LocalDateTime.now()
                : paidAt;

        int periodDays = payment.getPeriodDays() == null
                ? 30
                : Math.max(
                        payment.getPeriodDays(),
                        1);

        /*
         * Chống cộng doanh thu hai lần
         * cho cùng một payment.
         */
        boolean revenueAlreadyRecorded = membershipRevenueLedgerRepository
                .existsByMembershipPaymentId(
                        payment.getId());

        if (revenueAlreadyRecorded) {
            throw new IllegalStateException(
                    "Membership payment revenue has already been recorded");
        }

        /*
         * Khóa membership của cặp:
         *
         * member + artist
         */
        ArtistMembershipSubscription subscription = artistMembershipSubscriptionRepository
                .findByMemberIdAndArtistIdForUpdate(
                        payment.getMemberId(),
                        payment.getArtistId())
                .orElse(null);

        if (subscription == null) {

            subscription = new ArtistMembershipSubscription();

            subscription.setMemberId(
                    payment.getMemberId());

            subscription.setArtistId(
                    payment.getArtistId());

            subscription.setStartedAt(
                    activationTime);

            subscription.setCurrentPeriodStart(
                    activationTime);

            subscription.setCurrentPeriodEnd(
                    activationTime.plusDays(
                            periodDays));

        } else {

            boolean currentlyActive = ArtistMembershipSubscription.STATUS_ACTIVE
                    .equalsIgnoreCase(
                            subscription.getStatus());

            boolean samePlan = payment.getPlanId().equals(
                    subscription.getPlanId());

            boolean stillInsideCurrentPeriod = subscription.getCurrentPeriodEnd() != null
                    && subscription
                            .getCurrentPeriodEnd()
                            .isAfter(
                                    activationTime);

            /*
             * Gia hạn cùng một gói khi membership
             * vẫn còn hiệu lực:
             *
             * giữ currentPeriodStart hiện tại
             * và cộng thêm thời gian vào cuối kỳ.
             */
            if (currentlyActive
                    && samePlan
                    && stillInsideCurrentPeriod) {

                subscription.setCurrentPeriodEnd(
                        subscription
                                .getCurrentPeriodEnd()
                                .plusDays(
                                        periodDays));

            } else {

                /*
                 * Membership đã hết hạn hoặc user
                 * chuyển sang gói khác.
                 */
                subscription.setCurrentPeriodStart(
                        activationTime);

                subscription.setCurrentPeriodEnd(
                        activationTime.plusDays(
                                periodDays));
            }

            if (subscription.getStartedAt() == null) {
                subscription.setStartedAt(
                        activationTime);
            }
        }

        subscription.setPlanId(
                payment.getPlanId());

        subscription.setLatestPaymentId(
                payment.getId());

        subscription.setStatus(
                ArtistMembershipSubscription.STATUS_ACTIVE);

        subscription.setCancelAtPeriodEnd(
                false);

        subscription.setCanceledAt(
                null);

        subscription.setExpiredAt(
                null);

        ArtistMembershipSubscription savedSubscription = artistMembershipSubscriptionRepository
                .saveAndFlush(
                        subscription);

        /*
         * =========================
         * CREATE REVENUE LEDGER
         * =========================
         */
        long normalizedHoldDays = Math.max(
                revenueHoldDays,
                0L);

        MembershipRevenueLedger ledger = new MembershipRevenueLedger();

        ledger.setMembershipPaymentId(
                payment.getId());

        ledger.setSubscriptionId(
                savedSubscription.getId());

        ledger.setMemberId(
                payment.getMemberId());

        ledger.setArtistId(
                payment.getArtistId());

        ledger.setPlanId(
                payment.getPlanId());

        ledger.setSourceType(
                MembershipRevenueLedger.SOURCE_MEMBERSHIP);

        ledger.setGrossAmount(
                payment.getGrossAmount());

        ledger.setPlatformFeeAmount(
                payment.getPlatformFeeAmount());

        ledger.setAmount(
                payment.getArtistNetAmount());

        ledger.setCurrency(
                CURRENCY_VND);

        ledger.setStatus(
                MembershipRevenueLedger.STATUS_PENDING);

        ledger.setAvailableAt(
                activationTime.plusDays(
                        normalizedHoldDays));

        membershipRevenueLedgerRepository
                .saveAndFlush(
                        ledger);

        /*
         * =========================
         * CREDIT ARTIST WALLET
         * =========================
         */
        ArtistWallet wallet = getOrCreateWalletForUpdate(
                payment.getArtistId());

        if (!ArtistWallet.STATUS_ACTIVE
                .equalsIgnoreCase(
                        wallet.getStatus())) {

            throw new IllegalStateException(
                    "Artist wallet is not active");
        }

        long artistNetAmount = safeMoney(
                payment.getArtistNetAmount());

        wallet.setPendingBalance(
                Math.addExact(
                        safeMoney(
                                wallet.getPendingBalance()),
                        artistNetAmount));

        wallet.setLifetimeEarnings(
                Math.addExact(
                        safeMoney(
                                wallet.getLifetimeEarnings()),
                        artistNetAmount));

        artistWalletRepository.save(
                wallet);

        return savedSubscription;
    }

    /*
     * =========================
     * GET OR CREATE WALLET
     * =========================
     */
    private ArtistWallet getOrCreateWalletForUpdate(
            String artistId) {

        ArtistWallet existingWallet = artistWalletRepository
                .findByArtistIdForUpdate(
                        artistId)
                .orElse(null);

        if (existingWallet != null) {
            return existingWallet;
        }

        ArtistWallet wallet = new ArtistWallet();

        wallet.setArtistId(
                artistId);

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
                CURRENCY_VND);

        wallet.setStatus(
                ArtistWallet.STATUS_ACTIVE);

        return artistWalletRepository
                .saveAndFlush(
                        wallet);
    }

    /*
     * =========================
     * VALIDATION
     * =========================
     */
    private void validatePayment(
            MembershipPaymentTransaction payment) {

        if (payment == null) {
            throw new IllegalArgumentException(
                    "Membership payment is required");
        }

        if (isBlank(payment.getId())
                || isBlank(payment.getMemberId())
                || isBlank(payment.getArtistId())
                || isBlank(payment.getPlanId())) {

            throw new IllegalArgumentException(
                    "Membership payment information is incomplete");
        }

        if (payment.getMemberId().equals(
                payment.getArtistId())) {

            throw new IllegalArgumentException(
                    "An artist cannot join their own membership");
        }

        long grossAmount = safeMoney(
                payment.getGrossAmount());

        long platformFeeAmount = safeMoney(
                payment.getPlatformFeeAmount());

        long artistNetAmount = safeMoney(
                payment.getArtistNetAmount());

        if (grossAmount <= 0L) {
            throw new IllegalArgumentException(
                    "Membership payment amount must be greater than zero");
        }

        if (artistNetAmount <= 0L) {
            throw new IllegalArgumentException(
                    "Artist membership revenue must be greater than zero");
        }

        if (Math.addExact(
                platformFeeAmount,
                artistNetAmount) != grossAmount) {

            throw new IllegalStateException(
                    "Membership payment revenue amounts are inconsistent");
        }
    }

    private boolean isBlank(
            String value) {

        return value == null
                || value.isBlank();
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