package com.example.demo.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.ArtistStudioStatsDTO;
import com.example.demo.repositories.CommentRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserFollowRepository;

@Service
public class ArtistStudioService {

    private final TrackRepository trackRepository;

    private final CommentRepository commentRepository;

    private final UserFollowRepository userFollowRepository;

    public ArtistStudioService(
            TrackRepository trackRepository,
            CommentRepository commentRepository,
            UserFollowRepository userFollowRepository) {

        this.trackRepository = trackRepository;

        this.commentRepository = commentRepository;

        this.userFollowRepository = userFollowRepository;
    }

    @Transactional(readOnly = true)
    public ArtistStudioStatsDTO getStats(
            String userId) {

        ArtistStudioStatsDTO stats = new ArtistStudioStatsDTO();

        stats.setPlays(
                safeLong(
                        trackRepository
                                .sumPlaysByUploaderId(
                                        userId)));

        stats.setLikes(
                safeLong(
                        trackRepository
                                .sumLikesByUploaderId(
                                        userId)));

        stats.setComments(
                safeLong(
                        commentRepository
                                .countCommentsByUploaderId(
                                        userId)));

        stats.setFans(
                userFollowRepository
                        .countByFollowing_Id(
                                userId));

        /*
         * Chưa có module dữ liệu thật.
         */
        stats.setReposts(0);
        stats.setDownloads(0);
        stats.setEarnings(0);

        return stats;
    }

    private long safeLong(
            Long value) {

        return value == null
                ? 0L
                : value;
    }
}