package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistMembershipPost;

public interface ArtistMembershipPostRepository
                extends JpaRepository<ArtistMembershipPost, String> {

        /*
         * =========================
         * PUBLIC ARTIST FEED
         * =========================
         */

        Page<ArtistMembershipPost> findByArtistIdAndStatusOrderByPublishedAtDescCreatedAtDesc(
                        String artistId,
                        String status,
                        Pageable pageable);

        /*
         * =========================
         * ARTIST MANAGE POSTS
         * =========================
         */

        Page<ArtistMembershipPost> findByArtistIdOrderByCreatedAtDesc(
                        String artistId,
                        Pageable pageable);

        Page<ArtistMembershipPost> findByArtistIdAndStatusOrderByCreatedAtDesc(
                        String artistId,
                        String status,
                        Pageable pageable);

        Optional<ArtistMembershipPost> findByIdAndArtistId(
                        String id,
                        String artistId);

        long countByArtistIdAndStatus(
                        String artistId,
                        String status);

        /*
         * =========================
         * LOCK ARTIST POST
         * =========================
         */

        @Query(value = """
                        SELECT *
                        FROM artist_membership_posts
                        WHERE id = :postId
                          AND artistId = :artistId
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<ArtistMembershipPost> findByIdAndArtistIdForUpdate(
                        @Param("postId") String postId,
                        @Param("artistId") String artistId);

        /*
         * =========================
         * LOCK POST BY ID
         * =========================
         *
         * Dùng khi bình chọn để tránh hai request
         * của cùng user tạo hai vote đồng thời.
         */
        @Query(value = """
                        SELECT *
                        FROM artist_membership_posts
                        WHERE id = :postId
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<ArtistMembershipPost> findByIdForUpdate(
                        @Param("postId") String postId);
}