package com.example.demo.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.demo.entities.Track;
import com.example.demo.entities.TrackFingerprint;
import com.example.demo.repositories.TrackFingerprintRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.services.ChromaprintService.ChromaprintResult;
import com.example.demo.services.FingerprintSimilarityService.FingerprintSimilarityResult;

@Service
public class CopyrightScanService {

        /*
         * =========================
         * PROCESSING STATUS
         * =========================
         */

        private static final String PROCESSING = "PROCESSING";

        private static final String COMPLETED = "COMPLETED";

        private static final String FAILED = "FAILED";

        /*
         * =========================
         * COPYRIGHT STATUS
         * =========================
         */

        private static final String SCANNING = "SCANNING";

        private static final String CLEAN = "CLEAN";

        private static final String REVIEW_REQUIRED = "REVIEW_REQUIRED";

        private static final String MATCHED = "MATCHED";

        private static final String SCAN_FAILED = "SCAN_FAILED";

        /*
         * =========================
         * RISK LEVEL
         * =========================
         */

        private static final String RISK_LOW = "LOW";

        private static final String RISK_MEDIUM = "MEDIUM";

        private static final String RISK_HIGH = "HIGH";

        /*
         * =========================
         * RISK THRESHOLDS
         * =========================
         */

        private static final double HIGH_SIMILARITY_THRESHOLD = 0.90D;

        private static final double HIGH_DURATION_THRESHOLD = 0.50D;

        private static final double MEDIUM_SIMILARITY_THRESHOLD = 0.78D;

        private static final double MEDIUM_DURATION_THRESHOLD = 0.25D;

        private final TrackRepository trackRepository;

        private final TrackFingerprintRepository trackFingerprintRepository;

        private final ChromaprintService chromaprintService;

        private final FingerprintSimilarityService fingerprintSimilarityService;

        private final TransactionTemplate transactionTemplate;

        public CopyrightScanService(
                        TrackRepository trackRepository,
                        TrackFingerprintRepository trackFingerprintRepository,
                        ChromaprintService chromaprintService,
                        FingerprintSimilarityService fingerprintSimilarityService,
                        TransactionTemplate transactionTemplate) {

                this.trackRepository = trackRepository;

                this.trackFingerprintRepository = trackFingerprintRepository;

                this.chromaprintService = chromaprintService;

                this.fingerprintSimilarityService = fingerprintSimilarityService;

                this.transactionTemplate = transactionTemplate;
        }

        /*
         * =========================
         * SCAN TRACK
         * =========================
         */

        public CopyrightScanResult scanTrack(
                        String trackId) {

                validateTrackId(
                                trackId);

                Track sourceTrack = markTrackAsScanning(
                                trackId);

                try {

                        /*
                         * Tải audio từ Cloudinary và chạy fpcalc.
                         *
                         * Phần xử lý dài này nằm ngoài transaction
                         * để không giữ database connection quá lâu.
                         */
                        ChromaprintResult generatedFingerprint = chromaprintService.generateFromUrl(
                                        sourceTrack.getTrackUrl());

                        String fingerprintHash = calculateSha256(
                                        generatedFingerprint
                                                        .rawFingerprint());

                        CopyrightScanResult result = transactionTemplate.execute(
                                        status -> saveScanResult(
                                                        trackId,
                                                        generatedFingerprint,
                                                        fingerprintHash));

                        if (result == null) {

                                throw new IllegalStateException(
                                                "Cannot save copyright scan result");
                        }

                        return result;

                } catch (Exception scanError) {

                        markTrackAsFailed(
                                        trackId,
                                        scanError);

                        if (scanError instanceof RuntimeException) {

                                throw (RuntimeException) scanError;
                        }

                        throw new IllegalStateException(
                                        "Copyright scan failed",
                                        scanError);
                }
        }

        /*
         * =========================
         * MARK SCANNING
         * =========================
         */

        private Track markTrackAsScanning(
                        String trackId) {

                Track track = transactionTemplate.execute(
                                status -> {

                                        Track currentTrack = trackRepository
                                                        .findById(trackId)
                                                        .orElseThrow(
                                                                        () -> new IllegalArgumentException(
                                                                                        "Track not found"));

                                        if (Boolean.TRUE.equals(
                                                        currentTrack.getIsDeleted())) {

                                                throw new IllegalArgumentException(
                                                                "Deleted track cannot be scanned");
                                        }

                                        if (currentTrack.getTrackUrl() == null
                                                        || currentTrack.getTrackUrl()
                                                                        .isBlank()) {

                                                throw new IllegalArgumentException(
                                                                "Track audio URL is missing");
                                        }

                                        currentTrack.setProcessingStatus(
                                                        PROCESSING);

                                        currentTrack.setCopyrightStatus(
                                                        SCANNING);

                                        currentTrack.setCopyrightMessage(
                                                        "Analyzing audio fingerprint");

                                        currentTrack.setCopyrightScore(
                                                        null);

                                        currentTrack.setCopyrightRiskLevel(
                                                        null);

                                        currentTrack.setScannedAt(
                                                        null);

                                        currentTrack.setUpdatedAt(
                                                        LocalDateTime.now());

                                        return trackRepository.saveAndFlush(
                                                        currentTrack);
                                });

                if (track == null) {

                        throw new IllegalStateException(
                                        "Cannot start copyright scan");
                }

                return track;
        }

        /*
         * =========================
         * SAVE SCAN RESULT
         * =========================
         */

        private CopyrightScanResult saveScanResult(
                        String trackId,
                        ChromaprintResult generatedFingerprint,
                        String fingerprintHash) {

                Track sourceTrack = trackRepository
                                .findById(trackId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Track not found"));

                if (Boolean.TRUE.equals(
                                sourceTrack.getIsDeleted())) {

                        throw new IllegalArgumentException(
                                        "Deleted track cannot be scanned");
                }

                TrackFingerprint sourceFingerprint = saveFingerprint(
                                sourceTrack,
                                generatedFingerprint,
                                fingerprintHash);

                BestMatch bestMatch = findBestMatch(
                                sourceTrack,
                                sourceFingerprint);

                RiskAssessment assessment = assessRisk(
                                bestMatch);

                LocalDateTime now = LocalDateTime.now();

                sourceTrack.setProcessingStatus(
                                COMPLETED);

                sourceTrack.setCopyrightStatus(
                                assessment.copyrightStatus());

                sourceTrack.setCopyrightRiskLevel(
                                assessment.riskLevel());

                sourceTrack.setCopyrightScore(
                                assessment.finalScore());

                sourceTrack.setCopyrightMessage(
                                assessment.message());

                sourceTrack.setFingerprintAlgorithm(
                                generatedFingerprint.algorithm());

                sourceTrack.setFingerprintVersion(
                                generatedFingerprint
                                                .algorithmVersion());

                sourceTrack.setScannedAt(
                                now);

                sourceTrack.setUpdatedAt(
                                now);

                boolean significantMatch = bestMatch != null
                                && !RISK_LOW.equals(
                                                assessment.riskLevel());

                if (!significantMatch) {

                        sourceTrack.setMatchedTrackId(
                                        null);

                        sourceTrack.setFingerprintScore(
                                        bestMatch == null
                                                        ? 0D
                                                        : bestMatch.similarityScore());

                        sourceTrack.setMatchedDurationRatio(
                                        0D);

                } else {

                        sourceTrack.setMatchedTrackId(
                                        bestMatch.track().getId());

                        sourceTrack.setFingerprintScore(
                                        bestMatch.similarityScore());

                        sourceTrack.setMatchedDurationRatio(
                                        bestMatch.matchedDurationRatio());
                }

                Track savedTrack = trackRepository
                                .saveAndFlush(
                                                sourceTrack);

                return new CopyrightScanResult(
                                savedTrack.getId(),
                                savedTrack.getProcessingStatus(),
                                savedTrack.getCopyrightStatus(),
                                savedTrack.getCopyrightRiskLevel(),
                                savedTrack.getCopyrightScore(),
                                savedTrack.getFingerprintScore(),
                                savedTrack.getMatchedDurationRatio(),
                                savedTrack.getMatchedTrackId(),
                                significantMatch
                                                ? bestMatch.track().getTitle()
                                                : null,
                                savedTrack.getCopyrightMessage(),
                                savedTrack.getScannedAt());
        }

        /*
         * =========================
         * SAVE FINGERPRINT
         * =========================
         */

        private TrackFingerprint saveFingerprint(
                        Track track,
                        ChromaprintResult generatedFingerprint,
                        String fingerprintHash) {

                TrackFingerprint fingerprint = trackFingerprintRepository
                                .findByTrackIdAndAlgorithmAndAlgorithmVersion(
                                                track.getId(),
                                                generatedFingerprint.algorithm(),
                                                generatedFingerprint
                                                                .algorithmVersion())
                                .orElse(null);

                LocalDateTime now = LocalDateTime.now();

                if (fingerprint == null) {

                        fingerprint = new TrackFingerprint();

                        fingerprint.setId(
                                        generateId());

                        fingerprint.setTrackId(
                                        track.getId());

                        fingerprint.setCreatedAt(
                                        now);
                }

                fingerprint.setAlgorithm(
                                generatedFingerprint.algorithm());

                fingerprint.setAlgorithmVersion(
                                generatedFingerprint
                                                .algorithmVersion());

                fingerprint.setRawFingerprint(
                                generatedFingerprint
                                                .rawFingerprint());

                fingerprint.setFingerprintHash(
                                fingerprintHash);

                fingerprint.setFingerprintLength(
                                generatedFingerprint
                                                .fingerprintLength());

                fingerprint.setDurationSeconds(
                                generatedFingerprint
                                                .durationSeconds());

                fingerprint.setUpdatedAt(
                                now);

                return trackFingerprintRepository
                                .saveAndFlush(
                                                fingerprint);
        }

        /*
         * =========================
         * FIND BEST MATCH
         * =========================
         */

        private BestMatch findBestMatch(
                        Track sourceTrack,
                        TrackFingerprint sourceFingerprint) {

                /*
                 * Kiểm tra fingerprint giống tuyệt đối trước.
                 */
                TrackFingerprint exactFingerprint = trackFingerprintRepository
                                .findFirstByFingerprintHashAndAlgorithmAndAlgorithmVersionAndTrackIdNot(
                                                sourceFingerprint
                                                                .getFingerprintHash(),
                                                sourceFingerprint
                                                                .getAlgorithm(),
                                                sourceFingerprint
                                                                .getAlgorithmVersion(),
                                                sourceTrack.getId())
                                .orElse(null);

                if (exactFingerprint != null) {

                        Track exactTrack = findValidCandidateTrack(
                                        exactFingerprint.getTrackId());

                        if (exactTrack != null) {

                                return new BestMatch(
                                                exactTrack,
                                                1D,
                                                1D,
                                                true);
                        }
                }

                List<TrackFingerprint> catalog = trackFingerprintRepository
                                .findByAlgorithmAndAlgorithmVersionAndTrackIdNotOrderByCreatedAtDesc(
                                                sourceFingerprint
                                                                .getAlgorithm(),
                                                sourceFingerprint
                                                                .getAlgorithmVersion(),
                                                sourceTrack.getId());

                BestMatch bestMatch = null;

                for (TrackFingerprint candidateFingerprint : catalog) {

                        Track candidateTrack = findValidCandidateTrack(
                                        candidateFingerprint
                                                        .getTrackId());

                        if (candidateTrack == null) {
                                continue;
                        }

                        try {

                                FingerprintSimilarityResult similarity = fingerprintSimilarityService.compare(
                                                sourceFingerprint
                                                                .getRawFingerprint(),
                                                candidateFingerprint
                                                                .getRawFingerprint());

                                double similarityScore = roundScore(
                                                similarity
                                                                .similarityScore());

                                double durationRatio = roundScore(
                                                similarity
                                                                .matchedDurationRatio());

                                BestMatch candidateMatch = new BestMatch(
                                                candidateTrack,
                                                similarityScore,
                                                durationRatio,
                                                false);

                                if (bestMatch == null
                                                || calculateRankScore(
                                                                candidateMatch) > calculateRankScore(
                                                                                bestMatch)) {

                                        bestMatch = candidateMatch;
                                }

                        } catch (IllegalArgumentException ignored) {

                                /*
                                 * Fingerprint quá ngắn hoặc dữ liệu cũ lỗi.
                                 * Bỏ qua candidate này và tiếp tục catalog.
                                 */
                        }
                }

                return bestMatch;
        }

        private Track findValidCandidateTrack(
                        String trackId) {

                if (trackId == null
                                || trackId.isBlank()) {

                        return null;
                }

                Track candidateTrack = trackRepository
                                .findById(trackId)
                                .orElse(null);

                if (candidateTrack == null
                                || Boolean.TRUE.equals(
                                                candidateTrack.getIsDeleted())) {

                        return null;
                }

                return candidateTrack;
        }

        /*
         * =========================
         * RISK ASSESSMENT
         * =========================
         */

        private RiskAssessment assessRisk(
                        BestMatch bestMatch) {

                if (bestMatch == null) {

                        return new RiskAssessment(
                                        RISK_LOW,
                                        CLEAN,
                                        0D,
                                        "No matching audio fingerprint was found in the SoundClone catalog.");
                }

                double similarityScore = bestMatch.similarityScore();

                double matchedDurationRatio = bestMatch.matchedDurationRatio();

                double finalScore = roundScore(
                                similarityScore * 0.80D
                                                + matchedDurationRatio * 0.20D);

                String matchedTitle = bestMatch.track().getTitle();

                if (bestMatch.exactMatch()
                                || (similarityScore >= HIGH_SIMILARITY_THRESHOLD
                                                && matchedDurationRatio >= HIGH_DURATION_THRESHOLD)) {

                        return new RiskAssessment(
                                        RISK_HIGH,
                                        MATCHED,
                                        finalScore,
                                        String.format(
                                                        Locale.US,
                                                        "High-risk audio fingerprint match with \"%s\". Similarity: %.2f%%, matched duration: %.2f%%. Manual review is required.",
                                                        matchedTitle,
                                                        similarityScore * 100D,
                                                        matchedDurationRatio * 100D));
                }

                if (similarityScore >= MEDIUM_SIMILARITY_THRESHOLD
                                && matchedDurationRatio >= MEDIUM_DURATION_THRESHOLD) {

                        return new RiskAssessment(
                                        RISK_MEDIUM,
                                        REVIEW_REQUIRED,
                                        finalScore,
                                        String.format(
                                                        Locale.US,
                                                        "Possible audio similarity with \"%s\". Similarity: %.2f%%, matched duration: %.2f%%. Manual review is recommended.",
                                                        matchedTitle,
                                                        similarityScore * 100D,
                                                        matchedDurationRatio * 100D));
                }

                return new RiskAssessment(
                                RISK_LOW,
                                CLEAN,
                                0D,
                                String.format(
                                                Locale.US,
                                                "No significant copyright fingerprint match was found. Best catalog similarity: %.2f%%.",
                                                similarityScore * 100D));
        }

        private double calculateRankScore(
                        BestMatch match) {

                return match.similarityScore()
                                * 0.85D
                                + match.matchedDurationRatio()
                                                * 0.15D;
        }

        /*
         * =========================
         * MARK SCAN FAILED
         * =========================
         */

        private void markTrackAsFailed(
                        String trackId,
                        Exception error) {

                try {

                        transactionTemplate.executeWithoutResult(
                                        status -> {

                                                Track track = trackRepository
                                                                .findById(trackId)
                                                                .orElse(null);

                                                if (track == null) {
                                                        return;
                                                }

                                                track.setProcessingStatus(
                                                                FAILED);

                                                track.setCopyrightStatus(
                                                                SCAN_FAILED);

                                                track.setCopyrightRiskLevel(
                                                                null);

                                                track.setCopyrightScore(
                                                                null);

                                                track.setCopyrightMessage(
                                                                abbreviate(
                                                                                error.getMessage(),
                                                                                1000));

                                                track.setScannedAt(
                                                                LocalDateTime.now());

                                                track.setUpdatedAt(
                                                                LocalDateTime.now());

                                                trackRepository.saveAndFlush(
                                                                track);
                                        });

                } catch (Exception persistenceError) {

                        System.err.println(
                                        "Cannot save copyright scan failure: "
                                                        + persistenceError.getMessage());
                }
        }

        /*
         * =========================
         * HASH FINGERPRINT
         * =========================
         */

        private String calculateSha256(
                        String value) {

                if (value == null
                                || value.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Fingerprint value is required");
                }

                try {

                        MessageDigest digest = MessageDigest.getInstance(
                                        "SHA-256");

                        byte[] hashBytes = digest.digest(
                                        value.getBytes(
                                                        StandardCharsets.UTF_8));

                        StringBuilder result = new StringBuilder(
                                        hashBytes.length * 2);

                        for (byte hashByte : hashBytes) {

                                result.append(
                                                String.format(
                                                                "%02x",
                                                                hashByte & 0xff));
                        }

                        return result.toString();

                } catch (NoSuchAlgorithmException e) {

                        throw new IllegalStateException(
                                        "SHA-256 is unavailable",
                                        e);
                }
        }

        /*
         * =========================
         * HELPERS
         * =========================
         */

        private void validateTrackId(
                        String trackId) {

                if (trackId == null
                                || trackId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Track ID is required");
                }
        }

        private String generateId() {

                return UUID.randomUUID()
                                .toString()
                                .replace("-", "")
                                .substring(0, 24);
        }

        private double roundScore(
                        double score) {

                double safeScore = Math.max(
                                0D,
                                Math.min(
                                                score,
                                                1D));

                return Math.round(
                                safeScore * 10000D)
                                / 10000D;
        }

        private String abbreviate(
                        String value,
                        int maximumLength) {

                if (value == null
                                || value.isBlank()) {

                        return "Copyright scan failed";
                }

                String cleanValue = value.trim();

                if (cleanValue.length() <= maximumLength) {

                        return cleanValue;
                }

                return cleanValue.substring(
                                0,
                                maximumLength)
                                + "...";
        }

        /*
         * =========================
         * INTERNAL RESULTS
         * =========================
         */

        private record BestMatch(
                        Track track,
                        double similarityScore,
                        double matchedDurationRatio,
                        boolean exactMatch) {
        }

        private record RiskAssessment(
                        String riskLevel,
                        String copyrightStatus,
                        double finalScore,
                        String message) {
        }

        /*
         * =========================
         * PUBLIC RESULT
         * =========================
         */

        public record CopyrightScanResult(
                        String trackId,
                        String processingStatus,
                        String copyrightStatus,
                        String riskLevel,
                        Double copyrightScore,
                        Double fingerprintScore,
                        Double matchedDurationRatio,
                        String matchedTrackId,
                        String matchedTrackTitle,
                        String message,
                        LocalDateTime scannedAt) {
        }
}