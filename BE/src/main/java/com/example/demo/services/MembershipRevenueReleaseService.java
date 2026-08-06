package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistWallet;
import com.example.demo.entities.MembershipRevenueLedger;
import com.example.demo.repositories.ArtistWalletRepository;
import com.example.demo.repositories.MembershipRevenueLedgerRepository;

@Service
public class MembershipRevenueReleaseService {

    private final MembershipRevenueLedgerRepository membershipRevenueLedgerRepository;

    private final ArtistWalletRepository artistWalletRepository;

    public MembershipRevenueReleaseService(
            MembershipRevenueLedgerRepository membershipRevenueLedgerRepository,

            ArtistWalletRepository artistWalletRepository) {

        this.membershipRevenueLedgerRepository = membershipRevenueLedgerRepository;

        this.artistWalletRepository = artistWalletRepository;
    }

    /*
     * =========================
     * FIND DUE REVENUE IDS
     * =========================
     */
    @Transactional(readOnly = true)
    public List<String> findDueLedgerIds() {

        LocalDateTime now = LocalDateTime.now();

        return membershipRevenueLedgerRepository
                .findTop100ByStatusAndAvailableAtLessThanEqualOrderByAvailableAtAsc(
                        MembershipRevenueLedger.STATUS_PENDING,
                        now)
                .stream()
                .map(
                        MembershipRevenueLedger::getId)
                .toList();
    }

    /*
     * =========================
     * RELEASE ONE LEDGER
     * =========================
     *
     * Mỗi ledger chạy trong transaction riêng.
     * Một ledger lỗi sẽ không rollback các ledger khác.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean releaseLedger(
            String ledgerId) {

        if (ledgerId == null
                || ledgerId.isBlank()) {

            return false;
        }

        /*
         * Khóa ledger để chống hai scheduler
         * xử lý cùng một khoản doanh thu.
         */
        MembershipRevenueLedger ledger = membershipRevenueLedgerRepository
                .findByIdForUpdate(
                        ledgerId.trim())
                .orElse(null);

        if (ledger == null) {
            return false;
        }

        /*
         * Idempotency:
         * ledger đã xử lý thì bỏ qua.
         */
        if (!MembershipRevenueLedger.STATUS_PENDING
                .equalsIgnoreCase(
                        ledger.getStatus())) {

            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        if (ledger.getAvailableAt() == null
                || ledger
                        .getAvailableAt()
                        .isAfter(now)) {

            return false;
        }

        long releaseAmount = safeMoney(
                ledger.getAmount());

        if (releaseAmount <= 0L) {
            throw new IllegalStateException(
                    "Membership revenue amount must be greater than zero");
        }

        /*
         * Khóa ví trước khi thay đổi số dư.
         */
        ArtistWallet wallet = artistWalletRepository
                .findByArtistIdForUpdate(
                        ledger.getArtistId())
                .orElseThrow(
                        () -> new IllegalStateException(
                                "Artist wallet not found"));

        long pendingBalance = safeMoney(
                wallet.getPendingBalance());

        long availableBalance = safeMoney(
                wallet.getAvailableBalance());

        /*
         * Không cho phép ví âm.
         *
         * Nếu pendingBalance thiếu tiền,
         * transaction rollback và ledger vẫn PENDING.
         */
        if (pendingBalance < releaseAmount) {
            throw new IllegalStateException(
                    "Artist wallet pending balance is insufficient");
        }

        wallet.setPendingBalance(
                Math.subtractExact(
                        pendingBalance,
                        releaseAmount));

        wallet.setAvailableBalance(
                Math.addExact(
                        availableBalance,
                        releaseAmount));

        /*
         * lifetimeEarnings không cộng lại.
         * Giá trị này đã được cộng lúc VNPay xác nhận PAID.
         */
        artistWalletRepository.saveAndFlush(
                wallet);

        ledger.setStatus(
                MembershipRevenueLedger.STATUS_AVAILABLE);

        ledger.setReleasedAt(
                now);

        membershipRevenueLedgerRepository
                .saveAndFlush(
                        ledger);

        return true;
    }

    /*
     * =========================
     * MONEY HELPER
     * =========================
     */
    private long safeMoney(
            Long value) {

        return value == null
                ? 0L
                : Math.max(
                        value,
                        0L);
    }
}