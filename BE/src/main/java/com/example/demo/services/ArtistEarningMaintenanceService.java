package com.example.demo.services;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistEarning;
import com.example.demo.entities.ArtistWallet;
import com.example.demo.repositories.ArtistEarningRepository;
import com.example.demo.repositories.ArtistWalletRepository;

@Service
public class ArtistEarningMaintenanceService {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            ArtistEarningMaintenanceService.class);

    private final ArtistEarningRepository artistEarningRepository;

    private final ArtistWalletRepository artistWalletRepository;

    public ArtistEarningMaintenanceService(
            ArtistEarningRepository artistEarningRepository,
            ArtistWalletRepository artistWalletRepository) {

        this.artistEarningRepository = artistEarningRepository;

        this.artistWalletRepository = artistWalletRepository;
    }

    /*
     * =========================
     * RELEASE PENDING EARNINGS
     * =========================
     */
    @Scheduled(fixedDelayString = "${artist.earning.release-delay-ms:60000}")
    @Transactional
    public void releaseDueEarnings() {

        LocalDateTime now = LocalDateTime.now();

        List<ArtistEarning> dueEarnings = artistEarningRepository
                .findTop100ByStatusAndAvailableAtLessThanEqualOrderByAvailableAtAsc(
                        ArtistEarning.STATUS_PENDING,
                        now);

        if (dueEarnings.isEmpty()) {
            return;
        }

        int releasedCount = 0;

        for (ArtistEarning candidate : dueEarnings) {

            ArtistEarning earning = artistEarningRepository
                    .findByIdForUpdate(
                            candidate.getId())
                    .orElse(null);

            if (earning == null) {
                continue;
            }

            /*
             * Scheduler khác hoặc admin có thể
             * đã xử lý earning trước đó.
             */
            if (!ArtistEarning.STATUS_PENDING
                    .equals(
                            earning.getStatus())) {

                continue;
            }

            if (earning.getAvailableAt() == null
                    || earning.getAvailableAt()
                            .isAfter(now)) {

                continue;
            }

            long amount = earning.getAmount() == null
                    ? 0L
                    : earning.getAmount();

            if (amount <= 0L) {

                LOGGER.warn(
                        "Cannot release earning {} because amount is invalid: {}",
                        earning.getId(),
                        amount);

                continue;
            }

            ArtistWallet wallet = artistWalletRepository
                    .findByArtistIdForUpdate(
                            earning.getArtistId())
                    .orElse(null);

            if (wallet == null) {

                LOGGER.error(
                        "Cannot release earning {} because wallet for artist {} was not found",
                        earning.getId(),
                        earning.getArtistId());

                continue;
            }

            long pendingBalance = normalizeBalance(
                    wallet.getPendingBalance());

            long availableBalance = normalizeBalance(
                    wallet.getAvailableBalance());

            /*
             * Không âm thầm tạo hoặc bù tiền
             * khi dữ liệu ví bị lệch.
             */
            if (pendingBalance < amount) {

                LOGGER.error(
                        "Cannot release earning {} because wallet pending balance {} is lower than earning amount {}",
                        earning.getId(),
                        pendingBalance,
                        amount);

                continue;
            }

            wallet.setPendingBalance(
                    pendingBalance - amount);

            wallet.setAvailableBalance(
                    Math.addExact(
                            availableBalance,
                            amount));

            artistWalletRepository.save(
                    wallet);

            earning.setStatus(
                    ArtistEarning.STATUS_AVAILABLE);

            earning.setReleasedAt(
                    now);

            artistEarningRepository.save(
                    earning);

            releasedCount++;
        }

        if (releasedCount > 0) {

            LOGGER.info(
                    "Released {} artist earnings at {}",
                    releasedCount,
                    now);
        }
    }

    private long normalizeBalance(
            Long value) {

        return value == null
                ? 0L
                : value;
    }
}