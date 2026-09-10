package com.example.demo.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.AdminDashboardOverviewDTO;
import com.example.demo.repositories.CommentRepository;
import com.example.demo.repositories.PlaylistRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class AdminDashboardService {

        private final TrackRepository trackRepository;

        private final UserRepository userRepository;

        private final PlaylistRepository playlistRepository;

        private final CommentRepository commentRepository;

        public AdminDashboardService(
                        TrackRepository trackRepository,
                        UserRepository userRepository,
                        PlaylistRepository playlistRepository,
                        CommentRepository commentRepository) {

                this.trackRepository = trackRepository;

                this.userRepository = userRepository;

                this.playlistRepository = playlistRepository;

                this.commentRepository = commentRepository;
        }

        @Transactional(readOnly = true)
        public AdminDashboardOverviewDTO getOverview() {

                TrackRepository.DashboardTrackStats trackStats = trackRepository.getDashboardStats();

                long totalTracks = trackStats == null
                                || trackStats.getTotalTracks() == null
                                                ? 0L
                                                : trackStats.getTotalTracks();

                long totalPlays = trackStats == null
                                || trackStats.getTotalPlays() == null
                                                ? 0L
                                                : trackStats.getTotalPlays();

                long totalLikes = trackStats == null
                                || trackStats.getTotalLikes() == null
                                                ? 0L
                                                : trackStats.getTotalLikes();

                long totalUsers = userRepository.count();

                long totalPlaylists = playlistRepository
                                .countByIsDeletedFalse();

                long totalComments = commentRepository
                                .countByIsDeletedFalse();

                return new AdminDashboardOverviewDTO(
                                totalTracks,
                                totalUsers,
                                totalPlaylists,
                                totalComments,
                                totalPlays,
                                totalLikes);
        }
}