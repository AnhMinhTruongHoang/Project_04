package com.example.demo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dtos.FollowStatusDTO;
import com.example.demo.dtos.FollowUserDTO;
import com.example.demo.entities.User;
import com.example.demo.entities.UserFollow;
import com.example.demo.repositories.UserFollowRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class FollowServiceImpl implements FollowService {

    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;

    public FollowServiceImpl(
            UserFollowRepository userFollowRepository,
            UserRepository userRepository) {
        this.userFollowRepository = userFollowRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public FollowStatusDTO follow(
            String currentUserId,
            String targetUserId) {
        if (currentUserId == null || targetUserId == null) {
            throw new IllegalArgumentException("User id is required");
        }

        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException(
                    "You cannot follow yourself");
        }

        User currentUser = getUser(currentUserId);
        User targetUser = getUser(targetUserId);

        boolean alreadyFollowing = userFollowRepository.existsByFollower_IdAndFollowing_Id(
                currentUserId,
                targetUserId);

        // Cho API có tính idempotent:
        // gọi follow nhiều lần vẫn trả trạng thái thành công.
        if (!alreadyFollowing) {
            UserFollow userFollow = new UserFollow();

            userFollow.setFollower(currentUser);
            userFollow.setFollowing(targetUser);

            userFollowRepository.save(userFollow);
        }

        return synchronizeCounters(currentUser, targetUser, true);
    }

    @Override
    @Transactional
    public FollowStatusDTO unfollow(
            String currentUserId,
            String targetUserId) {
        if (currentUserId == null || targetUserId == null) {
            throw new IllegalArgumentException("User id is required");
        }

        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException(
                    "You cannot unfollow yourself");
        }

        User currentUser = getUser(currentUserId);
        User targetUser = getUser(targetUserId);

        userFollowRepository.deleteByFollower_IdAndFollowing_Id(
                currentUserId,
                targetUserId);

        return synchronizeCounters(currentUser, targetUser, false);
    }

    @Override
    @Transactional(readOnly = true)
    public FollowStatusDTO getFollowStatus(
            String currentUserId,
            String targetUserId) {
        getUser(targetUserId);

        boolean following = false;
        int currentUserFollowing = 0;

        if (currentUserId != null) {
            getUser(currentUserId);

            following = userFollowRepository.existsByFollower_IdAndFollowing_Id(
                    currentUserId,
                    targetUserId);

            currentUserFollowing = safeInt(
                    userFollowRepository.countByFollower_Id(currentUserId));
        }

        int targetFollowers = safeInt(
                userFollowRepository.countByFollowing_Id(targetUserId));

        return new FollowStatusDTO(
                following,
                targetFollowers,
                currentUserFollowing);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FollowUserDTO> getFollowers(
            String userId,
            Pageable pageable) {
        getUser(userId);

        return userFollowRepository
                .findByFollowing_IdOrderByCreatedAtDesc(userId, pageable)
                .map(follow -> toDTO(follow.getFollower()));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FollowUserDTO> getFollowing(
            String userId,
            Pageable pageable) {
        getUser(userId);

        return userFollowRepository
                .findByFollower_IdOrderByCreatedAtDesc(userId, pageable)
                .map(follow -> toDTO(follow.getFollowing()));
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private FollowStatusDTO synchronizeCounters(
            User currentUser,
            User targetUser,
            boolean following) {
        int currentUserFollowing = safeInt(
                userFollowRepository.countByFollower_Id(currentUser.getId()));

        int targetFollowers = safeInt(
                userFollowRepository.countByFollowing_Id(targetUser.getId()));

        currentUser.setFollowing(currentUserFollowing);
        targetUser.setFollowers(targetFollowers);

        userRepository.save(currentUser);
        userRepository.save(targetUser);

        return new FollowStatusDTO(
                following,
                targetFollowers,
                currentUserFollowing);
    }

    private int safeInt(long value) {
        return value > Integer.MAX_VALUE
                ? Integer.MAX_VALUE
                : (int) value;
    }

    private FollowUserDTO toDTO(User user) {
        return new FollowUserDTO(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getAvatarUrl(),
                user.getCoverUrl(),
                user.getBio(),
                user.getCity(),
                user.getCountry(),
                Boolean.TRUE.equals(user.getVerified()),
                user.getFollowers() == null ? 0 : user.getFollowers(),
                user.getFollowing() == null ? 0 : user.getFollowing());
    }
}