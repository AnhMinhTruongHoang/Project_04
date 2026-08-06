package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.ArtistMembershipPollVote;

public interface ArtistMembershipPollVoteRepository
                extends JpaRepository<ArtistMembershipPollVote, String> {

        Optional<ArtistMembershipPollVote> findByPostIdAndMemberId(
                        String postId,
                        String memberId);

        boolean existsByPostIdAndMemberId(
                        String postId,
                        String memberId);

        long countByPostId(
                        String postId);

        long countByOptionId(
                        String optionId);

        List<ArtistMembershipPollVote> findByPostId(
                        String postId);

        /*
         * Khóa vote hiện tại để user có thể
         * đổi lựa chọn một cách an toàn.
         */
        @Query(value = """
                        SELECT *
                        FROM artist_membership_poll_votes
                        WHERE postId = :postId
                          AND memberId = :memberId
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<ArtistMembershipPollVote> findByPostIdAndMemberIdForUpdate(
                        @Param("postId") String postId,
                        @Param("memberId") String memberId);

        /*
         * =========================
         * DELETE POLL VOTES
         * =========================
         */
        void deleteByPostId(
                        String postId);
}