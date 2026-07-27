package com.example.demo.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.ListeningProgressDTO;
import com.example.demo.dtos.SubscriptionAccessDTO;
import com.example.demo.entities.ListeningSession;
import com.example.demo.entities.Track;
import com.example.demo.repositories.ListeningSessionRepository;
import com.example.demo.repositories.TrackRepository;

@Service
public class ListeningSessionService {

        private static final String TRACK_APPROVED = "APPROVED";

        /*
         * Heartbeat FE hiện gửi mỗi 15 giây.
         *
         * Cho phép tối đa 45 giây để chịu được:
         * - mạng chậm;
         * - tab trình duyệt bị throttle;
         * - request heartbeat đến trễ.
         */
        private static final double MAX_HEARTBEAT_GAP_SECONDS = 45D;

        /*
         * Request cách nhau quá ngắn sẽ không được cộng thời gian.
         * Giảm khả năng spam API liên tục.
         */
        private static final double MIN_HEARTBEAT_GAP_SECONDS = 3D;

        /*
         * Sai số nhỏ giữa thời gian audio và đồng hồ Backend.
         */
        private static final double HEARTBEAT_TOLERANCE_SECONDS = 2D;

        private static final double STANDARD_QUALIFIED_SECONDS = 30D;

        private static final double SHORT_TRACK_REQUIRED_PERCENTAGE = 0.5D;

        private static final double COMPLETED_PERCENTAGE = 0.95D;

        private final ListeningSessionRepository listeningSessionRepository;

        private final TrackRepository trackRepository;

        private final SubscriptionService subscriptionService;

        private final ArtistEarningService artistEarningService;

        public ListeningSessionService(
                        ListeningSessionRepository listeningSessionRepository,
                        TrackRepository trackRepository,
                        SubscriptionService subscriptionService,
                        ArtistEarningService artistEarningService) {

                this.listeningSessionRepository = listeningSessionRepository;

                this.trackRepository = trackRepository;

                this.subscriptionService = subscriptionService;

                this.artistEarningService = artistEarningService;
        }

        /*
         * =========================
         * PROCESS LISTENING HEARTBEAT
         * =========================
         */
        @Transactional
        public Map<String, Object> processHeartbeat(
                        String listenerId,
                        String trackId,
                        ListeningProgressDTO dto) {

                validateRequest(
                                listenerId,
                                trackId,
                                dto);

                String sessionId = dto
                                .getSessionId()
                                .trim();

                Track track = trackRepository
                                .findById(trackId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Track not found"));

                validateTrack(
                                track);

                String artistId = track
                                .getUploaderId();

                if (artistId == null
                                || artistId.isBlank()) {

                        throw new IllegalStateException(
                                        "Track artist is missing");
                }

                double clientDuration = dto.getDuration();

                double canonicalDuration = resolveCanonicalDuration(
                                track,
                                clientDuration);

                double position = normalizePosition(
                                dto.getPosition(),
                                canonicalDuration);

                LocalDateTime now = LocalDateTime.now();

                ListeningSession listeningSession = listeningSessionRepository
                                .findBySessionIdAndListenerIdForUpdate(
                                                sessionId,
                                                listenerId)
                                .orElse(null);

                /*
                 * Heartbeat đầu tiên:
                 * chỉ khởi tạo phiên nghe, chưa cộng giây.
                 *
                 * FE cần gửi heartbeat ngay khi bắt đầu phát.
                 */
                if (listeningSession == null) {

                        ListeningSession sessionWithSameId = listeningSessionRepository
                                        .findBySessionId(
                                                        sessionId)
                                        .orElse(null);

                        if (sessionWithSameId != null) {
                                throw new IllegalArgumentException(
                                                "Listening session does not belong to current user");
                        }

                        ListeningSession newSession = createSession(
                                        sessionId,
                                        listenerId,
                                        trackId,
                                        artistId,
                                        position,
                                        canonicalDuration,
                                        now);

                        return buildResponse(
                                        newSession,
                                        requiredListeningSeconds(
                                                        canonicalDuration),
                                        0D,
                                        null);
                }

                validateExistingSession(
                                listeningSession,
                                trackId,
                                artistId);

                /*
                 * Session đã kết thúc hoặc bị vô hiệu:
                 * không tiếp tục cộng thời gian.
                 */
                if (!ListeningSession.STATUS_ACTIVE.equals(
                                listeningSession.getStatus())) {

                        return buildResponse(
                                        listeningSession,
                                        requiredListeningSeconds(
                                                        listeningSession.getDuration()),
                                        0D,
                                        "SESSION_ALREADY_CLOSED");
                }

                double creditedSeconds = calculateCreditedSeconds(
                                listeningSession,
                                position,
                                now);

                double currentAccumulated = safeDouble(
                                listeningSession
                                                .getAccumulatedSeconds());

                double nextAccumulated = Math.min(
                                currentAccumulated
                                                + creditedSeconds,
                                canonicalDuration);

                listeningSession.setAccumulatedSeconds(
                                nextAccumulated);

                listeningSession.setLastPosition(
                                position);

                listeningSession.setDuration(
                                canonicalDuration);

                listeningSession.setLastHeartbeatAt(
                                now);

                listeningSession.setHeartbeatCount(
                                safeInteger(
                                                listeningSession
                                                                .getHeartbeatCount())
                                                + 1);

                double requiredSeconds = requiredListeningSeconds(
                                canonicalDuration);

                String qualificationReason = null;

                /*
                 * Chỉ xét qualified khi:
                 * - có ít nhất 2 heartbeat;
                 * - tổng giây nghe Backend xác nhận đã đạt ngưỡng.
                 */
                boolean reachedThreshold = listeningSession.getHeartbeatCount() >= 2
                                && nextAccumulated >= requiredSeconds;

                if (reachedThreshold
                                && !Boolean.TRUE.equals(
                                                listeningSession.getQualified())) {

                        qualificationReason = evaluateQualification(
                                        listeningSession,
                                        listenerId,
                                        artistId,
                                        now);
                }

                boolean completed = Boolean.TRUE.equals(
                                dto.getCompleted())
                                || position
                                                / canonicalDuration >= COMPLETED_PERCENTAGE;

                /*
                 * Chỉ chuyển COMPLETED nếu session chưa bị INVALID.
                 */
                if (ListeningSession.STATUS_ACTIVE.equals(
                                listeningSession.getStatus())
                                && completed) {

                        listeningSession.setStatus(
                                        ListeningSession.STATUS_COMPLETED);

                        listeningSession.setEndedAt(
                                        now);
                }

                ListeningSession savedSession = listeningSessionRepository.saveAndFlush(
                                listeningSession);

                /*
                 * Chỉ tạo earning đúng tại heartbeat
                 * vừa chuyển session thành qualified.
                 *
                 * Các heartbeat sau không gọi lại,
                 * vì qualificationReason sẽ là null.
                 */
                Map<String, Object> earningData = null;

                if ("QUALIFIED".equals(
                                qualificationReason)) {

                        earningData = artistEarningService
                                        .createQualifiedStreamEarning(
                                                        savedSession);
                }

                return buildResponse(
                                savedSession,
                                requiredSeconds,
                                creditedSeconds,
                                qualificationReason,
                                earningData);
        }

        /*
         * =========================
         * CREATE SESSION
         * =========================
         */
        private ListeningSession createSession(
                        String sessionId,
                        String listenerId,
                        String trackId,
                        String artistId,
                        double position,
                        double duration,
                        LocalDateTime now) {

                ListeningSession listeningSession = new ListeningSession();

                listeningSession.setSessionId(
                                sessionId);

                listeningSession.setListenerId(
                                listenerId);

                listeningSession.setTrackId(
                                trackId);

                listeningSession.setArtistId(
                                artistId);

                listeningSession.setLastPosition(
                                position);

                listeningSession.setDuration(
                                duration);

                listeningSession.setAccumulatedSeconds(
                                0D);

                listeningSession.setHeartbeatCount(
                                1);

                listeningSession.setQualified(
                                false);

                listeningSession.setStatus(
                                ListeningSession.STATUS_ACTIVE);

                listeningSession.setStartedAt(
                                now);

                listeningSession.setLastHeartbeatAt(
                                now);

                listeningSession.setCreatedAt(
                                now);

                listeningSession.setUpdatedAt(
                                now);

                return listeningSessionRepository.save(
                                listeningSession);
        }

        /*
         * =========================
         * CALCULATE VALID SECONDS
         * =========================
         */
        private double calculateCreditedSeconds(
                        ListeningSession listeningSession,
                        double currentPosition,
                        LocalDateTime now) {

                LocalDateTime lastHeartbeatAt = listeningSession
                                .getLastHeartbeatAt();

                if (lastHeartbeatAt == null) {
                        return 0D;
                }

                double elapsedSeconds = Duration.between(
                                lastHeartbeatAt,
                                now)
                                .toMillis()
                                / 1000D;

                if (elapsedSeconds < MIN_HEARTBEAT_GAP_SECONDS) {

                        return 0D;
                }

                double previousPosition = safeDouble(
                                listeningSession
                                                .getLastPosition());

                double positionDelta = currentPosition
                                - previousPosition;

                /*
                 * Seek lùi hoặc position không tăng:
                 * không cộng thời gian ở heartbeat này.
                 */
                if (positionDelta <= 0D) {
                        return 0D;
                }

                double allowedWallClockSeconds = Math.min(
                                elapsedSeconds,
                                MAX_HEARTBEAT_GAP_SECONDS);

                double maximumCreditableSeconds = allowedWallClockSeconds
                                + HEARTBEAT_TOLERANCE_SECONDS;

                /*
                 * Ví dụ:
                 *
                 * Heartbeat cách nhau 15 giây,
                 * nhưng position nhảy từ 10 → 80.
                 *
                 * positionDelta = 70
                 * Backend chỉ cộng tối đa khoảng 17 giây.
                 */
                return Math.max(
                                0D,
                                Math.min(
                                                positionDelta,
                                                maximumCreditableSeconds));
        }

        /*
         * =========================
         * QUALIFICATION
         * =========================
         */
        private String evaluateQualification(
                        ListeningSession listeningSession,
                        String listenerId,
                        String artistId,
                        LocalDateTime now) {

                /*
                 * Artist nghe track của chính mình:
                 * không được tạo qualified stream.
                 */
                if (listenerId.equals(
                                artistId)) {

                        listeningSession.setStatus(
                                        ListeningSession.STATUS_INVALID);

                        listeningSession.setEndedAt(
                                        now);

                        return "SELF_PLAY";
                }

                SubscriptionAccessDTO artistAccess = subscriptionService
                                .getAccessForUser(
                                                artistId);

                /*
                 * Hiện tại chỉ plan có canMonetize=true,
                 * dự kiến là ARTIST_PRO, mới được nhận earnings.
                 */
                if (!Boolean.TRUE.equals(
                                artistAccess.getCanMonetize())) {

                        listeningSession.setStatus(
                                        ListeningSession.STATUS_INVALID);

                        listeningSession.setEndedAt(
                                        now);

                        return "ARTIST_NOT_ELIGIBLE";
                }

                listeningSession.setQualified(
                                true);

                listeningSession.setQualifiedAt(
                                now);

                return "QUALIFIED";
        }

        /*
         * =========================
         * VALIDATION
         * =========================
         */
        private void validateRequest(
                        String listenerId,
                        String trackId,
                        ListeningProgressDTO dto) {

                if (listenerId == null
                                || listenerId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Listener ID is required");
                }

                if (trackId == null
                                || trackId.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Track ID is required");
                }

                if (dto == null) {
                        throw new IllegalArgumentException(
                                        "Listening progress is required");
                }

                String sessionId = dto.getSessionId();

                if (sessionId == null
                                || !sessionId
                                                .trim()
                                                .matches(
                                                                "^[A-Za-z0-9_-]{16,64}$")) {

                        throw new IllegalArgumentException(
                                        "Invalid listening session ID");
                }

                if (dto.getPosition() == null
                                || !Double.isFinite(
                                                dto.getPosition())
                                || dto.getPosition() < 0D) {

                        throw new IllegalArgumentException(
                                        "Invalid listening position");
                }

                if (dto.getDuration() == null
                                || !Double.isFinite(
                                                dto.getDuration())
                                || dto.getDuration() <= 0D) {

                        throw new IllegalArgumentException(
                                        "Invalid track duration");
                }
        }

        private void validateTrack(
                        Track track) {

                if (Boolean.TRUE.equals(
                                track.getIsDeleted())) {

                        throw new IllegalArgumentException(
                                        "Track is unavailable");
                }

                if (!TRACK_APPROVED.equalsIgnoreCase(
                                track.getApprovalStatus())) {

                        throw new IllegalArgumentException(
                                        "Track is not approved");
                }
        }

        private void validateExistingSession(
                        ListeningSession listeningSession,
                        String trackId,
                        String artistId) {

                if (!trackId.equals(
                                listeningSession.getTrackId())) {

                        throw new IllegalArgumentException(
                                        "Listening session track mismatch");
                }

                if (!artistId.equals(
                                listeningSession.getArtistId())) {

                        throw new IllegalArgumentException(
                                        "Listening session artist mismatch");
                }
        }

        private double resolveCanonicalDuration(
                        Track track,
                        double clientDuration) {

                Long persistedDuration = track.getDurationSeconds();

                if (persistedDuration != null
                                && persistedDuration > 0L) {

                        return persistedDuration.doubleValue();
                }

                return clientDuration;
        }

        private double normalizePosition(
                        Double position,
                        double duration) {

                if (position > duration + 5D) {
                        throw new IllegalArgumentException(
                                        "Listening position exceeds track duration");
                }

                return Math.min(
                                Math.max(
                                                position,
                                                0D),
                                duration);
        }

        private double requiredListeningSeconds(
                        double duration) {

                if (duration < STANDARD_QUALIFIED_SECONDS) {

                        return Math.max(
                                        1D,
                                        duration
                                                        * SHORT_TRACK_REQUIRED_PERCENTAGE);
                }

                return STANDARD_QUALIFIED_SECONDS;
        }

        /*
         * =========================
         * RESPONSE
         * =========================
         */

        private Map<String, Object> buildResponse(
                        ListeningSession listeningSession,
                        double requiredSeconds,
                        double creditedSeconds,
                        String qualificationReason) {

                return buildResponse(
                                listeningSession,
                                requiredSeconds,
                                creditedSeconds,
                                qualificationReason,
                                null);
        }

        private Map<String, Object> buildResponse(
                        ListeningSession listeningSession,
                        double requiredSeconds,
                        double creditedSeconds,
                        String qualificationReason,
                        Map<String, Object> earningData) {

                Map<String, Object> result = new LinkedHashMap<>();

                result.put(
                                "sessionId",
                                listeningSession.getSessionId());

                result.put(
                                "trackId",
                                listeningSession.getTrackId());

                result.put(
                                "artistId",
                                listeningSession.getArtistId());

                result.put(
                                "status",
                                listeningSession.getStatus());

                result.put(
                                "qualified",
                                Boolean.TRUE.equals(
                                                listeningSession.getQualified()));

                result.put(
                                "creditedSeconds",
                                creditedSeconds);

                result.put(
                                "accumulatedSeconds",
                                safeDouble(
                                                listeningSession
                                                                .getAccumulatedSeconds()));

                result.put(
                                "requiredSeconds",
                                requiredSeconds);

                result.put(
                                "heartbeatCount",
                                safeInteger(
                                                listeningSession
                                                                .getHeartbeatCount()));

                result.put(
                                "qualificationReason",
                                qualificationReason);

                result.put(
                                "qualifiedAt",
                                listeningSession.getQualifiedAt());

                result.put(
                                "endedAt",
                                listeningSession.getEndedAt());

                /*
                 * Chỉ có dữ liệu tại heartbeat
                 * vừa tạo hoặc từ chối earning.
                 */
                result.put(
                                "earning",
                                earningData);

                return result;
        }

        ////

        private double safeDouble(
                        Double value) {

                return value == null
                                || !Double.isFinite(value)
                                                ? 0D
                                                : Math.max(
                                                                value,
                                                                0D);
        }

        private int safeInteger(
                        Integer value) {

                return value == null
                                ? 0
                                : Math.max(
                                                value,
                                                0);
        }
}