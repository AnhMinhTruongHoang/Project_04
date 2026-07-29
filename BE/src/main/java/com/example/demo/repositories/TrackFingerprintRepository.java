package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.TrackFingerprint;

public interface TrackFingerprintRepository
        extends JpaRepository<TrackFingerprint, String> {

    /*
     * =========================
     * FIND TRACK FINGERPRINT
     * =========================
     */

    Optional<TrackFingerprint> findByTrackIdAndAlgorithmAndAlgorithmVersion(
            String trackId,
            String algorithm,
            String algorithmVersion);

    /*
     * =========================
     * EXACT FINGERPRINT MATCH
     * =========================
     */

    /*
     * Tìm fingerprint giống hoàn toàn nhưng loại trừ
     * chính track đang được quét.
     */
    Optional<TrackFingerprint> findFirstByFingerprintHashAndAlgorithmAndAlgorithmVersionAndTrackIdNot(
            String fingerprintHash,
            String algorithm,
            String algorithmVersion,
            String excludedTrackId);

    /*
     * =========================
     * FINGERPRINT CATALOG
     * =========================
     */

    /*
     * Lấy toàn bộ fingerprint cùng thuật toán/phiên bản
     * để thực hiện similarity comparison.
     */
    List<TrackFingerprint> findByAlgorithmAndAlgorithmVersionAndTrackIdNotOrderByCreatedAtDesc(
            String algorithm,
            String algorithmVersion,
            String excludedTrackId);

    /*
     * =========================
     * TRACK AUDIO REPLACEMENT
     * =========================
     */

    /*
     * Xóa fingerprint cũ khi track được thay audio.
     *
     * Method này phải được gọi bên trong transaction.
     */
    long deleteByTrackId(
            String trackId);

    /*
     * =========================
     * EXISTENCE CHECK
     * =========================
     */

    boolean existsByTrackIdAndAlgorithmAndAlgorithmVersion(
            String trackId,
            String algorithm,
            String algorithmVersion);
}