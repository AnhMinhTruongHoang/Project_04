package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistWallet;

public interface ArtistWalletRepository
        extends JpaRepository<ArtistWallet, String> {

    Optional<ArtistWallet> findByArtistId(
            String artistId);

    boolean existsByArtistId(
            String artistId);

    /*
     * Khóa ví trong transaction khi:
     * - cộng pendingBalance;
     * - chuyển tiền sang availableBalance;
     * - xử lý yêu cầu rút tiền.
     *
     * Dùng native query để tránh Hibernate tạo:
     * FOR UPDATE OF alias
     * không tương thích với MySQL/TiDB hiện tại.
     */
    @Query(value = """
            SELECT *
            FROM artist_wallets
            WHERE artistId = :artistId
            FOR UPDATE
            """, nativeQuery = true)
    Optional<ArtistWallet> findByArtistIdForUpdate(
            @Param("artistId") String artistId);

    Page<ArtistWallet> findAllByOrderByUpdatedAtDesc(
            Pageable pageable);

    Page<ArtistWallet> findByStatusOrderByUpdatedAtDesc(
            String status,
            Pageable pageable);
}