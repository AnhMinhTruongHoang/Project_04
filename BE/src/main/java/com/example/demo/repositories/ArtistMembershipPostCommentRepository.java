package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistMembershipPostComment;

public interface ArtistMembershipPostCommentRepository
                extends JpaRepository<ArtistMembershipPostComment, String> {

        /*
         * =========================
         * TOP-LEVEL COMMENTS
         * =========================
         */

        Page<ArtistMembershipPostComment> findByPostIdAndParentCommentIdIsNullOrderByCreatedAtDesc(
                        String postId,
                        Pageable pageable);

        /*
         * =========================
         * COMMENT REPLIES
         * =========================
         */

        List<ArtistMembershipPostComment> findByPostIdAndParentCommentIdOrderByCreatedAtAsc(
                        String postId,
                        String parentCommentId);

        /*
         * =========================
         * COMMENT LOOKUP
         * =========================
         */

        Optional<ArtistMembershipPostComment> findByIdAndPostId(
                        String id,
                        String postId);

        /*
         * Chỉ đếm bình luận chưa bị xóa.
         */
        long countByPostIdAndStatus(
                        String postId,
                        String status);

        long countByParentCommentIdAndStatus(
                        String parentCommentId,
                        String status);

        /*
         * =========================
         * LOCK COMMENT
         * =========================
         *
         * Dùng khi:
         * - chỉnh sửa bình luận;
         * - user xóa bình luận;
         * - artist kiểm duyệt bình luận.
         */

        @Query(value = """
                        SELECT *
                        FROM artist_membership_post_comments
                        WHERE id = :commentId
                          AND postId = :postId
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<ArtistMembershipPostComment> findByIdAndPostIdForUpdate(
                        @Param("commentId") String commentId,
                        @Param("postId") String postId);

        /*
         * =========================
         * DELETE POST COMMENTS
         * =========================
         */
        void deleteByPostId(
                        String postId);
}