package com.example.demo.services;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistWallet;
import com.example.demo.entities.TicketRevenueLedger;
import com.example.demo.repositories.ArtistWalletRepository;
import com.example.demo.repositories.TicketRevenueLedgerRepository;

@Service
public class TicketRevenueReleaseService {

    private final TicketRevenueLedgerRepository ticketRevenueLedgerRepository;

    private final ArtistWalletRepository artistWalletRepository;

    public TicketRevenueReleaseService(
            TicketRevenueLedgerRepository ticketRevenueLedgerRepository,
            ArtistWalletRepository artistWalletRepository) {

        this.ticketRevenueLedgerRepository = ticketRevenueLedgerRepository;

        this.artistWalletRepository = artistWalletRepository;
    }

    /*
     * =========================
     * RELEASE ONE TICKET REVENUE
     * =========================
     *
     * Mỗi ledger chạy transaction riêng.
     *
     * Một ledger lỗi sẽ không rollback
     * toàn bộ batch scheduler.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean releaseRevenue(
            String ledgerId,
            LocalDateTime now) {

        /*
         * =========================
         * LOCK LEDGER
         * =========================
         */
        TicketRevenueLedger ledger = ticketRevenueLedgerRepository
                .findByIdForUpdate(
                        ledgerId)
                .orElse(null);

        if (ledger == null) {
            return false;
        }

        /*
         * Callback/job chạy lại
         * không release lần hai.
         */
        if (!TicketRevenueLedger.STATUS_PENDING
                .equalsIgnoreCase(
                        ledger.getStatus())) {

            return false;
        }

        if (ledger.getAvailableAt() == null
                || ledger.getAvailableAt()
                        .isAfter(now)) {

            return false;
        }

        long amount = ledger.getArtistNetAmount() == null
                ? 0L
                : ledger.getArtistNetAmount();

        if (amount <= 0L) {

            throw new IllegalStateException(
                    "Ticket revenue amount is invalid");
        }

        /*
         * =========================
         * LOCK ARTIST WALLET
         * =========================
         */
        ArtistWallet wallet = artistWalletRepository
                .findByArtistIdForUpdate(
                        ledger.getArtistId())
                .orElseThrow(
                        () -> new IllegalStateException(
                                "Artist wallet not found"));

        if (!ArtistWallet.STATUS_ACTIVE
                .equalsIgnoreCase(
                        wallet.getStatus())) {

            throw new IllegalStateException(
                    "Artist wallet is not active");
        }

        long pendingBalance = wallet.getPendingBalance() == null
                ? 0L
                : wallet.getPendingBalance();

        long availableBalance = wallet.getAvailableBalance() == null
                ? 0L
                : wallet.getAvailableBalance();

        /*
         * Không dùng Math.max() để che lỗi.
         *
         * Nếu wallet không đủ pendingBalance
         * thì dữ liệu đang inconsistent.
         */
        if (pendingBalance < amount) {

            throw new IllegalStateException(
                    "Artist wallet pending balance is inconsistent");
        }

        /*
         * =========================
         * PENDING → AVAILABLE
         * =========================
         */
        wallet.setPendingBalance(
                Math.subtractExact(
                        pendingBalance,
                        amount));

        wallet.setAvailableBalance(
                Math.addExact(
                        availableBalance,
                        amount));

        artistWalletRepository
                .saveAndFlush(
                        wallet);

        /*
         * =========================
         * LEDGER AVAILABLE
         * =========================
         */
        ledger.setStatus(
                TicketRevenueLedger.STATUS_AVAILABLE);

        ledger.setReleasedAt(
                now);

        ticketRevenueLedgerRepository
                .saveAndFlush(
                        ledger);

        return true;
    }
}