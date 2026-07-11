package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.UserFollow;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    boolean existsByFollower_IdAndFollowing_Id(
            String followerId,
            String followingId);

    Optional<UserFollow> findByFollower_IdAndFollowing_Id(
            String followerId,
            String followingId);

    Page<UserFollow> findByFollower_IdOrderByCreatedAtDesc(
            String followerId,
            Pageable pageable);

    Page<UserFollow> findByFollowing_IdOrderByCreatedAtDesc(
            String followingId,
            Pageable pageable);

    long countByFollower_Id(String followerId);

    long countByFollowing_Id(String followingId);

    long deleteByFollower_IdAndFollowing_Id(
            String followerId,
            String followingId);

    void deleteAllByFollower_Id(String followerId);

    void deleteAllByFollowing_Id(String followingId);
}