package com.example.demo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.dtos.FollowStatusDTO;
import com.example.demo.dtos.FollowUserDTO;

public interface FollowService {

    FollowStatusDTO follow(String currentUserId, String targetUserId);

    FollowStatusDTO unfollow(String currentUserId, String targetUserId);

    FollowStatusDTO getFollowStatus(
            String currentUserId,
            String targetUserId);

    Page<FollowUserDTO> getFollowers(
            String userId,
            Pageable pageable);

    Page<FollowUserDTO> getFollowing(
            String userId,
            Pageable pageable);
}