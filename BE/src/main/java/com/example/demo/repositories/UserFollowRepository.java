package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.UserFollow;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    boolean existsByFollower_IdAndFollowing_Id(String followerId, String followingId);

    UserFollow findByFollower_IdAndFollowing_Id(String followerId, String followingId);

    List<UserFollow> findByFollower_IdOrderByCreatedAtDesc(String followerId);

    List<UserFollow> findByFollowing_IdOrderByCreatedAtDesc(String followingId);

    long countByFollower_Id(String followerId);

    long countByFollowing_Id(String followingId);

    @Transactional
    void deleteAllByFollower_IdOrFollowing_Id(String followerId, String followingId);
}