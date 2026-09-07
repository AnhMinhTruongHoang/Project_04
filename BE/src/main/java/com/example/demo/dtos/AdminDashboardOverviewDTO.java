package com.example.demo.dtos;

public record AdminDashboardOverviewDTO(
                long totalTracks,
                long totalUsers,
                long totalPlaylists,
                long totalComments,
                long totalPlays,
                long totalLikes) {
}