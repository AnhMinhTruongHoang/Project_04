package com.example.demo.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.Track;
import com.example.demo.repositories.TrackRepository;

@Service
public class TrackUploadService {

        @Autowired
        private TrackRepository trackRepository;

        @Autowired
        private SubscriptionService subscriptionService;

        /*
         * =========================
         * CREATE TRACK WITH QUOTA
         * =========================
         */

        @Transactional
        public Track saveTrackWithQuota(
                        Track track,
                        long durationSeconds) {

                validateTrack(track);

                if (durationSeconds < 0) {
                        throw new IllegalArgumentException(
                                        "Track duration cannot be negative");
                }

                /*
                 * Trừ toàn bộ thời lượng của audio mới
                 * trong cùng transaction với việc lưu Track.
                 */
                subscriptionService.consumeUploadQuota(
                                track.getUploaderId(),
                                durationSeconds);

                /*
                 * Nếu lưu Track lỗi:
                 * transaction rollback luôn phần quota vừa trừ.
                 */
                return trackRepository.saveAndFlush(
                                track);
        }

        /*
         * =========================
         * UPDATE TRACK WITH QUOTA
         * =========================
         */

        @Transactional
        public Track updateTrackWithQuotaAdjustment(
                        Track track,
                        long oldDurationSeconds,
                        long newDurationSeconds) {

                validateTrack(track);

                if (oldDurationSeconds < 0) {
                        throw new IllegalArgumentException(
                                        "Old track duration cannot be negative");
                }

                if (newDurationSeconds < 0) {
                        throw new IllegalArgumentException(
                                        "New track duration cannot be negative");
                }

                /*
                 * Chỉ điều chỉnh phần thời lượng chênh lệch.
                 *
                 * Ví dụ:
                 *
                 * Audio cũ: 300 giây
                 * Audio mới: 420 giây
                 * Delta: +120 giây
                 * → trừ thêm 120 giây quota.
                 *
                 * Audio cũ: 300 giây
                 * Audio mới: 180 giây
                 * Delta: -120 giây
                 * → hoàn lại 120 giây quota.
                 */
                long durationDeltaSeconds = Math.subtractExact(
                                newDurationSeconds,
                                oldDurationSeconds);

                subscriptionService.adjustUploadQuota(
                                track.getUploaderId(),
                                durationDeltaSeconds);

                /*
                 * Nếu save Track lỗi:
                 * quota adjustment cũng rollback.
                 */
                return trackRepository.saveAndFlush(
                                track);
        }

        /*
         * =========================
         * VALIDATION
         * =========================
         */

        private void validateTrack(
                        Track track) {

                if (track == null) {
                        throw new IllegalArgumentException(
                                        "Track is required");
                }

                if (track.getUploaderId() == null
                                || track.getUploaderId().isBlank()) {

                        throw new IllegalArgumentException(
                                        "Track uploader is required");
                }
        }
}