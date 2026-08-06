package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.UserBadge;

public interface UserBadgeRepository
        extends JpaRepository<UserBadge, String> {

    Optional<UserBadge> findByUser_IdAndBadge_Id(
            String userId,
            String badgeId);

    List<UserBadge> findByUser_IdAndActiveTrueOrderByAwardedAtDesc(
            String userId);

    List<UserBadge> findByUser_IdOrderByAwardedAtDesc(
            String userId);

    boolean existsByUser_IdAndBadge_IdAndActiveTrue(
            String userId,
            String badgeId);
}