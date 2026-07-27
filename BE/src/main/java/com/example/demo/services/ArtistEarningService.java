package com.example.demo.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.demo.dtos.SubscriptionAccessDTO;
import com.example.demo.entities.ArtistEarning;
import com.example.demo.entities.ArtistWallet;
import com.example.demo.entities.ListeningSession;
import com.example.demo.repositories.ArtistEarningRepository;
import com.example.demo.repositories.ArtistWalletRepository;

@Service
public class ArtistEarningService {

        private static final String CURRENCY_VND = "VND";

        private final ArtistEarningRepository artistEarningRepository;

        private final ArtistWalletRepository artistWalletRepository;

        private final SubscriptionService subscriptionService;

        /*
         * Đơn giá mặc định cho project demo.
         * Có thể thay bằng environment variable.
         */
        @Value("${artist.earning.amount-per-qualified-stream:20}")
        private long amountPerQualifiedStream;

        /*
         * Số ngày giữ tiền trước khi chuyển:
         * PENDING → AVAILABLE.
         */
        @Value("${artist.earning.hold-days:7}")
        private long earningHoldDays;

        public ArtistEarningService(
                        ArtistEarningRepository artistEarningRepository,
                        ArtistWalletRepository artistWalletRepository,
                        SubscriptionService subscriptionService) {

                this.artistEarningRepository = artistEarningRepository;

                this.artistWalletRepository = artistWalletRepository;

                this.subscriptionService = subscriptionService;
        }

        /*
         * =========================
         * CREATE QUALIFIED EARNING
         * =========================
         */
        @Transactional
        public Map<String, Object> createQualifiedStreamEarning(
                        ListeningSession listeningSession) {

                validateListeningSession(
                                listeningSession);

                String listeningSessionId = listeningSession.getId();

                String listenerId = listeningSession.getListenerId();

                String artistId = listeningSession.getArtistId();

                String trackId = listeningSession.getTrackId();

                LocalDateTime qualifiedAt = listeningSession.getQualifiedAt();

                /*
                 * Chống tạo lại earning cho cùng session.
                 */
                ArtistEarning existingEarning = artistEarningRepository
                                .findByListeningSessionId(
                                                listeningSessionId)
                                .orElse(null);

                if (existingEarning != null) {
                        return buildResult(
                                        false,
                                        "ALREADY_RECORDED",
                                        existingEarning,
                                        null);
                }

                /*
                 * Kiểm tra lại quyền monetization tại
                 * đúng thời điểm tạo earning.
                 */
                SubscriptionAccessDTO artistAccess = subscriptionService
                                .getAccessForUser(
                                                artistId);

                if (!Boolean.TRUE.equals(
                                artistAccess.getCanMonetize())) {

                        return buildResult(
                                        false,
                                        "ARTIST_NOT_ELIGIBLE",
                                        null,
                                        null);
                }

                String artistPlanCode = artistAccess.getPlanCode();

                if (artistPlanCode == null
                                || artistPlanCode.isBlank()) {

                        throw new IllegalStateException(
                                        "Artist subscription plan is missing");
                }

                long earningAmount = Math.max(
                                amountPerQualifiedStream,
                                0L);

                if (earningAmount <= 0L) {
                        throw new IllegalStateException(
                                        "Qualified stream earning amount must be greater than zero");
                }

                LocalDate earningDate = qualifiedAt.toLocalDate();

                /*
                 * Khóa ví trước khi kiểm tra daily limit.
                 *
                 * Các earning của cùng artist được xử lý
                 * tuần tự trong transaction.
                 */
                ArtistWallet artistWallet = getOrCreateWalletForUpdate(
                                artistId);

                if (!ArtistWallet.STATUS_ACTIVE
                                .equalsIgnoreCase(
                                                artistWallet.getStatus())) {

                        return buildResult(
                                        false,
                                        "WALLET_NOT_ACTIVE",
                                        null,
                                        artistWallet);
                }

                /*
                 * Một listener chỉ tạo một earning
                 * cho cùng track trong một ngày.
                 */
                boolean dailyEarningExists = artistEarningRepository
                                .existsByListenerIdAndTrackIdAndEarningDate(
                                                listenerId,
                                                trackId,
                                                earningDate);

                if (dailyEarningExists) {
                        return buildResult(
                                        false,
                                        "DAILY_LIMIT_REACHED",
                                        null,
                                        artistWallet);
                }

                long normalizedHoldDays = Math.max(
                                earningHoldDays,
                                0L);

                ArtistEarning artistEarning = new ArtistEarning();

                artistEarning.setListeningSessionId(
                                listeningSessionId);

                artistEarning.setListenerId(
                                listenerId);

                artistEarning.setArtistId(
                                artistId);

                artistEarning.setTrackId(
                                trackId);

                artistEarning.setArtistPlanCode(
                                artistPlanCode);

                artistEarning.setSourceType(
                                ArtistEarning.SOURCE_QUALIFIED_STREAM);

                artistEarning.setAmount(
                                earningAmount);

                artistEarning.setCurrency(
                                CURRENCY_VND);

                artistEarning.setStatus(
                                ArtistEarning.STATUS_PENDING);

                artistEarning.setEarningDate(
                                earningDate);

                artistEarning.setQualifiedAt(
                                qualifiedAt);

                artistEarning.setAvailableAt(
                                qualifiedAt.plusDays(
                                                normalizedHoldDays));

                ArtistEarning savedEarning = artistEarningRepository
                                .saveAndFlush(
                                                artistEarning);

                /*
                 * Cộng tiền vào ví trong cùng transaction.
                 */
                long currentPendingBalance = safeMoney(
                                artistWallet
                                                .getPendingBalance());

                long currentLifetimeEarnings = safeMoney(
                                artistWallet
                                                .getLifetimeEarnings());

                artistWallet.setPendingBalance(
                                Math.addExact(
                                                currentPendingBalance,
                                                earningAmount));

                artistWallet.setLifetimeEarnings(
                                Math.addExact(
                                                currentLifetimeEarnings,
                                                earningAmount));

                ArtistWallet savedWallet = artistWalletRepository.save(
                                artistWallet);

                return buildResult(
                                true,
                                "EARNING_CREATED",
                                savedEarning,
                                savedWallet);
        }

        /*
         * =========================
         * WALLET
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

                ArtistWallet newWallet = new ArtistWallet();

                newWallet.setArtistId(
                                artistId);

                newWallet.setPendingBalance(
                                0L);

                newWallet.setAvailableBalance(
                                0L);

                newWallet.setReservedBalance(
                                0L);

                newWallet.setWithdrawnBalance(
                                0L);

                newWallet.setLifetimeEarnings(
                                0L);

                newWallet.setCurrency(
                                CURRENCY_VND);

                newWallet.setStatus(
                                ArtistWallet.STATUS_ACTIVE);

                return artistWalletRepository
                                .saveAndFlush(
                                                newWallet);
        }

        /*
         * =========================
         * GET ARTIST WALLET
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getArtistWallet(
                        String artistId) {

                validateArtistId(
                                artistId);

                ArtistWallet wallet = artistWalletRepository
                                .findByArtistId(
                                                artistId)
                                .orElse(null);

                return buildWalletResponse(
                                artistId,
                                wallet);
        }

        /*
         * =========================
         * GET EARNING HISTORY
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getArtistEarningHistory(
                        String artistId,
                        String status,
                        int current,
                        int pageSize) {

                validateArtistId(
                                artistId);

                int normalizedCurrent = Math.max(
                                current,
                                1);

                int normalizedPageSize = Math.min(
                                Math.max(
                                                pageSize,
                                                1),
                                100);

                Pageable pageable = PageRequest.of(
                                normalizedCurrent - 1,
                                normalizedPageSize);

                String normalizedStatus = normalizeEarningStatus(
                                status);

                Page<ArtistEarning> earningPage;

                if (normalizedStatus == null) {

                        earningPage = artistEarningRepository
                                        .findByArtistIdOrderByCreatedAtDesc(
                                                        artistId,
                                                        pageable);

                } else {

                        earningPage = artistEarningRepository
                                        .findByArtistIdAndStatusOrderByCreatedAtDesc(
                                                        artistId,
                                                        normalizedStatus,
                                                        pageable);
                }

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "current",
                                normalizedCurrent);

                result.put(
                                "pageSize",
                                normalizedPageSize);

                result.put(
                                "totalPages",
                                earningPage.getTotalPages());

                result.put(
                                "totalItems",
                                earningPage.getTotalElements());

                result.put(
                                "status",
                                normalizedStatus);

                result.put(
                                "result",
                                earningPage
                                                .getContent()
                                                .stream()
                                                .map(this::toEarningResponse)
                                                .toList());

                return result;
        }

        /*
         * =========================
         * GET EARNING SUMMARY
         * =========================
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getArtistEarningSummary(
                        String artistId) {

                validateArtistId(
                                artistId);

                ArtistWallet wallet = artistWalletRepository
                                .findByArtistId(
                                                artistId)
                                .orElse(null);

                long pendingCount = artistEarningRepository
                                .countByArtistIdAndStatus(
                                                artistId,
                                                ArtistEarning.STATUS_PENDING);

                long availableCount = artistEarningRepository
                                .countByArtistIdAndStatus(
                                                artistId,
                                                ArtistEarning.STATUS_AVAILABLE);

                long rejectedCount = artistEarningRepository
                                .countByArtistIdAndStatus(
                                                artistId,
                                                ArtistEarning.STATUS_REJECTED);

                long reversedCount = artistEarningRepository
                                .countByArtistIdAndStatus(
                                                artistId,
                                                ArtistEarning.STATUS_REVERSED);

                long totalCount = artistEarningRepository
                                .countByArtistId(
                                                artistId);

                Map<String, Object> result = buildWalletResponse(
                                artistId,
                                wallet);

                result.put(
                                "totalEarningEvents",
                                totalCount);

                result.put(
                                "pendingEvents",
                                pendingCount);

                result.put(
                                "availableEvents",
                                availableCount);

                result.put(
                                "rejectedEvents",
                                rejectedCount);

                result.put(
                                "reversedEvents",
                                reversedCount);

                return result;
        }

        /*
         * =========================
         * VALIDATION
         * =========================
         */
        private void validateListeningSession(
                        ListeningSession listeningSession) {

                if (listeningSession == null) {
                        throw new IllegalArgumentException(
                                        "Listening session is required");
                }

                if (listeningSession.getId() == null
                                || listeningSession.getId()
                                                .isBlank()) {

                        throw new IllegalArgumentException(
                                        "Listening session must be saved before creating earning");
                }

                if (!Boolean.TRUE.equals(
                                listeningSession.getQualified())) {

                        throw new IllegalArgumentException(
                                        "Listening session is not qualified");
                }

                if (listeningSession.getQualifiedAt() == null) {

                        throw new IllegalArgumentException(
                                        "Listening qualification time is missing");
                }

                if (isBlank(
                                listeningSession.getListenerId())
                                || isBlank(
                                                listeningSession.getArtistId())
                                || isBlank(
                                                listeningSession.getTrackId())) {

                        throw new IllegalArgumentException(
                                        "Listening session information is incomplete");
                }

                if (listeningSession
                                .getListenerId()
                                .equals(
                                                listeningSession
                                                                .getArtistId())) {

                        throw new IllegalArgumentException(
                                        "Self plays cannot generate earnings");
                }
        }

        /*
         * =========================
         * RESPONSE
         * =========================
         */
        private Map<String, Object> buildResult(
                        boolean created,
                        String reason,
                        ArtistEarning earning,
                        ArtistWallet wallet) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "created",
                                created);

                result.put(
                                "reason",
                                reason);

                result.put(
                                "earningId",
                                earning == null
                                                ? null
                                                : earning.getId());

                result.put(
                                "listeningSessionId",
                                earning == null
                                                ? null
                                                : earning
                                                                .getListeningSessionId());

                result.put(
                                "amount",
                                earning == null
                                                ? 0L
                                                : safeMoney(
                                                                earning.getAmount()));

                result.put(
                                "currency",
                                earning == null
                                                ? CURRENCY_VND
                                                : earning.getCurrency());

                result.put(
                                "status",
                                earning == null
                                                ? null
                                                : earning.getStatus());

                result.put(
                                "availableAt",
                                earning == null
                                                ? null
                                                : earning.getAvailableAt());

                result.put(
                                "pendingBalance",
                                wallet == null
                                                ? null
                                                : safeMoney(
                                                                wallet.getPendingBalance()));

                result.put(
                                "availableBalance",
                                wallet == null
                                                ? null
                                                : safeMoney(
                                                                wallet.getAvailableBalance()));
                result.put(
                                "reservedBalance",
                                wallet == null
                                                ? null
                                                : safeMoney(
                                                                wallet.getReservedBalance()));

                result.put(
                                "lifetimeEarnings",
                                wallet == null
                                                ? null
                                                : safeMoney(
                                                                wallet.getLifetimeEarnings()));

                return result;
        }

        private long safeMoney(
                        Long value) {

                return value == null
                                ? 0L
                                : Math.max(
                                                value,
                                                0L);
        }

        private boolean isBlank(
                        String value) {

                return value == null
                                || value.isBlank();
        }

        /*
         * =========================
         * EARNING RESPONSE
         * =========================
         */
        private Map<String, Object> toEarningResponse(
                        ArtistEarning earning) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "id",
                                earning.getId());

                result.put(
                                "trackId",
                                earning.getTrackId());

                result.put(
                                "listeningSessionId",
                                earning.getListeningSessionId());

                result.put(
                                "artistPlanCode",
                                earning.getArtistPlanCode());

                result.put(
                                "sourceType",
                                earning.getSourceType());

                result.put(
                                "amount",
                                safeMoney(
                                                earning.getAmount()));

                result.put(
                                "currency",
                                earning.getCurrency());

                result.put(
                                "status",
                                earning.getStatus());

                result.put(
                                "earningDate",
                                earning.getEarningDate());

                result.put(
                                "qualifiedAt",
                                earning.getQualifiedAt());

                result.put(
                                "availableAt",
                                earning.getAvailableAt());

                result.put(
                                "releasedAt",
                                earning.getReleasedAt());

                result.put(
                                "reversedAt",
                                earning.getReversedAt());

                result.put(
                                "rejectionReason",
                                earning.getRejectionReason());

                result.put(
                                "createdAt",
                                earning.getCreatedAt());

                return result;
        }

        /*
         * =========================
         * WALLET RESPONSE
         * =========================
         */
        private Map<String, Object> buildWalletResponse(
                        String artistId,
                        ArtistWallet wallet) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "artistId",
                                artistId);

                result.put(
                                "walletId",
                                wallet == null
                                                ? null
                                                : wallet.getId());

                result.put(
                                "pendingBalance",
                                wallet == null
                                                ? 0L
                                                : safeMoney(
                                                                wallet.getPendingBalance()));

                result.put(
                                "availableBalance",
                                wallet == null
                                                ? 0L
                                                : safeMoney(
                                                                wallet.getAvailableBalance()));

                result.put(
                                "reservedBalance",
                                wallet == null
                                                ? 0L
                                                : safeMoney(
                                                                wallet.getReservedBalance()));

                result.put(
                                "withdrawnBalance",
                                wallet == null
                                                ? 0L
                                                : safeMoney(
                                                                wallet.getWithdrawnBalance()));

                result.put(
                                "lifetimeEarnings",
                                wallet == null
                                                ? 0L
                                                : safeMoney(
                                                                wallet.getLifetimeEarnings()));

                result.put(
                                "currency",
                                wallet == null
                                                ? CURRENCY_VND
                                                : wallet.getCurrency());

                result.put(
                                "status",
                                wallet == null
                                                ? ArtistWallet.STATUS_ACTIVE
                                                : wallet.getStatus());

                result.put(
                                "createdAt",
                                wallet == null
                                                ? null
                                                : wallet.getCreatedAt());

                result.put(
                                "updatedAt",
                                wallet == null
                                                ? null
                                                : wallet.getUpdatedAt());

                return result;
        }

        /*
         * =========================
         * STATUS VALIDATION
         * =========================
         */
        private String normalizeEarningStatus(
                        String status) {

                if (status == null
                                || status.isBlank()) {

                        return null;
                }

                String normalizedStatus = status
                                .trim()
                                .toUpperCase();

                return switch (normalizedStatus) {

                        case ArtistEarning.STATUS_PENDING,
                                        ArtistEarning.STATUS_AVAILABLE,
                                        ArtistEarning.STATUS_REJECTED,
                                        ArtistEarning.STATUS_REVERSED ->
                                normalizedStatus;

                        default -> throw new IllegalArgumentException(
                                        "Invalid earning status");
                };
        }

        private void validateArtistId(
                        String artistId) {

                if (artistId == null
                                || artistId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Artist ID is required");
                }
        }

}