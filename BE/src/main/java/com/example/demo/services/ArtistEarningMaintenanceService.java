package com.example.demo.services;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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

        private final NotificationService notificationService;

        public ArtistEarningMaintenanceService(
                        ArtistEarningRepository artistEarningRepository,
                        ArtistWalletRepository artistWalletRepository,
                        NotificationService notificationService) {

                this.artistEarningRepository = artistEarningRepository;

                this.artistWalletRepository = artistWalletRepository;

                this.notificationService = notificationService;
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

                /*
                 * Một lần chạy scheduler có thể release
                 * nhiều earning của cùng một Artist.
                 *
                 * Chỉ tạo một notification tổng hợp
                 * cho mỗi Artist để tránh spam.
                 */
                Map<String, ReleasedEarningBatch> releasedByArtist = new LinkedHashMap<>();

                for (ArtistEarning candidate : dueEarnings) {

                        if (candidate == null
                                        || candidate.getId() == null
                                        || candidate.getId().isBlank()) {

                                continue;
                        }

                        ArtistEarning earning = artistEarningRepository
                                        .findByIdForUpdate(
                                                        candidate.getId())
                                        .orElse(null);

                        if (earning == null) {
                                continue;
                        }

                        /*
                         * Scheduler khác hoặc Admin có thể
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

                        String artistId = earning.getArtistId();

                        if (artistId == null
                                        || artistId.isBlank()) {

                                LOGGER.error(
                                                "Cannot release earning {} because artist ID is missing",
                                                earning.getId());

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
                                                        artistId)
                                        .orElse(null);

                        if (wallet == null) {

                                LOGGER.error(
                                                "Cannot release earning {} because wallet for artist {} was not found",
                                                earning.getId(),
                                                artistId);

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

                        /*
                         * Gom earning theo Artist để phát
                         * một notification tổng hợp.
                         */
                        ReleasedEarningBatch batch = releasedByArtist
                                        .computeIfAbsent(
                                                        artistId,
                                                        ignored -> new ReleasedEarningBatch(
                                                                        artistId,
                                                                        wallet.getId(),
                                                                        wallet.getCurrency()));

                        batch.add(
                                        earning.getId(),
                                        amount);

                        releasedCount++;
                }

                if (releasedCount <= 0) {
                        return;
                }

                /*
                 * Notification chỉ được tạo sau khi toàn bộ
                 * thay đổi earning và wallet đã commit.
                 */
                scheduleReleasedEarningNotificationsAfterCommit(
                                new ArrayList<>(
                                                releasedByArtist.values()));

                LOGGER.info(
                                "Released {} artist earnings for {} artist(s) at {}",
                                releasedCount,
                                releasedByArtist.size(),
                                now);
        }

        /*
         * =========================
         * EARNING NOTIFICATIONS
         * =========================
         */
        private void scheduleReleasedEarningNotificationsAfterCommit(
                        List<ReleasedEarningBatch> batches) {

                if (batches == null
                                || batches.isEmpty()) {

                        return;
                }

                /*
                 * Snapshot dữ liệu primitive trước khi
                 * transaction hiện tại kết thúc.
                 */
                List<ReleasedEarningBatch> notificationBatches = new ArrayList<>();

                for (ReleasedEarningBatch batch : batches) {

                        if (batch != null
                                        && batch.releasedAmount > 0L
                                        && batch.releasedCount > 0) {

                                notificationBatches.add(
                                                batch.copy());
                        }
                }

                if (notificationBatches.isEmpty()) {
                        return;
                }

                Runnable notificationTask = () -> {

                        for (ReleasedEarningBatch batch : notificationBatches) {

                                try {

                                        notificationService.notifyEarningAvailable(
                                                        batch.artistId,
                                                        batch.walletId,
                                                        batch.releasedAmount,
                                                        batch.currency,
                                                        batch.releasedCount,
                                                        buildReleaseBatchKey(
                                                                        batch));

                                } catch (Exception notificationException) {

                                        LOGGER.error(
                                                        "Cannot create earning available notification for artist {}",
                                                        batch.artistId,
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

        /*
         * Tạo batch key cố định dựa trên danh sách
         * earning đã release.
         *
         * Cùng một batch không thể tạo hai notification.
         */
        private String buildReleaseBatchKey(
                        ReleasedEarningBatch batch) {

                List<String> earningIds = new ArrayList<>(
                                batch.earningIds);

                earningIds.sort(
                                String::compareTo);

                String source = batch.artistId
                                + ":"
                                + String.join(
                                                ",",
                                                earningIds);

                return UUID.nameUUIDFromBytes(
                                source.getBytes(
                                                StandardCharsets.UTF_8))
                                .toString()
                                .replace(
                                                "-",
                                                "");
        }

        private long normalizeBalance(
                        Long value) {

                return value == null
                                ? 0L
                                : value;
        }

        /*
         * =========================
         * RELEASE BATCH SNAPSHOT
         * =========================
         */
        private static final class ReleasedEarningBatch {

                private final String artistId;

                private final String walletId;

                private final String currency;

                private long releasedAmount;

                private int releasedCount;

                private final List<String> earningIds = new ArrayList<>();

                private ReleasedEarningBatch(
                                String artistId,
                                String walletId,
                                String currency) {

                        this.artistId = artistId;

                        this.walletId = walletId;

                        this.currency = currency;
                }

                private void add(
                                String earningId,
                                long amount) {

                        releasedAmount = Math.addExact(
                                        releasedAmount,
                                        amount);

                        releasedCount++;

                        if (earningId != null
                                        && !earningId.isBlank()) {

                                earningIds.add(
                                                earningId);
                        }
                }

                private ReleasedEarningBatch copy() {

                        ReleasedEarningBatch snapshot = new ReleasedEarningBatch(
                                        artistId,
                                        walletId,
                                        currency);

                        snapshot.releasedAmount = releasedAmount;

                        snapshot.releasedCount = releasedCount;

                        snapshot.earningIds.addAll(
                                        earningIds);

                        return snapshot;
                }
        }
}