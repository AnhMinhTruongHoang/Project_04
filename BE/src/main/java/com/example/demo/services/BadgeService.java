package com.example.demo.services;

import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.Badge;
import com.example.demo.entities.User;
import com.example.demo.entities.UserBadge;
import com.example.demo.repositories.BadgeRepository;
import com.example.demo.repositories.UserBadgeRepository;
import com.example.demo.repositories.UserRepository;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;

    public BadgeService(
            BadgeRepository badgeRepository,
            UserBadgeRepository userBadgeRepository,
            UserRepository userRepository) {

        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getActiveBadges() {
        return badgeRepository
                .findByActiveTrueOrderByCreatedAtAsc()
                .stream()
                .map(this::toBadgeResponse)
                .toList();
    }

    public List<Map<String, Object>> getAllBadges() {
        return badgeRepository
                .findAll()
                .stream()
                .map(this::toBadgeResponse)
                .toList();
    }

    public List<Map<String, Object>> getUserBadges(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found");
        }

        Date now = new Date();

        List<UserBadge> userBadges = userBadgeRepository
                .findByUser_IdAndActiveTrueOrderByAwardedAtDesc(userId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (UserBadge userBadge : userBadges) {
            if (userBadge.getExpiresAt() != null &&
                    userBadge.getExpiresAt().before(now)) {
                continue;
            }

            result.add(toUserBadgeResponse(userBadge));
        }

        return result;
    }

    @Transactional
    public Map<String, Object> awardBadge(
            String userId,
            String badgeId,
            User awardedBy,
            String note,
            Date expiresAt) {

        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Badge badge = badgeRepository
                .findById(badgeId)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found"));

        if (!Boolean.TRUE.equals(badge.getActive())) {
            throw new IllegalStateException("Badge is inactive");
        }

        UserBadge userBadge = userBadgeRepository
                .findByUser_IdAndBadge_Id(userId, badgeId)
                .orElse(null);

        Date now = new Date();
        if (userBadge != null &&
                Boolean.TRUE.equals(userBadge.getActive())) {
            throw new IllegalStateException(
                    "User already has this badge");
        }

        if (userBadge == null) {
            userBadge = new UserBadge();

            userBadge.setId(createId());
            userBadge.setUser(user);
            userBadge.setBadge(badge);
        }

        userBadge.setAwardedBy(awardedBy);
        userBadge.setNote(cleanText(note));
        userBadge.setActive(true);
        userBadge.setAwardedAt(now);
        userBadge.setExpiresAt(expiresAt);
        userBadge.setRevokedAt(null);

        UserBadge savedUserBadge = userBadgeRepository.save(userBadge);

        return toUserBadgeResponse(savedUserBadge);
    }

    @Transactional
    public Map<String, Object> revokeBadge(
            String userId,
            String badgeId) {

        UserBadge userBadge = userBadgeRepository
                .findByUser_IdAndBadge_Id(userId, badgeId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User badge not found"));

        if (!Boolean.TRUE.equals(userBadge.getActive())) {
            throw new IllegalStateException(
                    "Badge has already been revoked");
        }

        userBadge.setActive(false);
        userBadge.setRevokedAt(new Date());

        UserBadge savedUserBadge = userBadgeRepository.save(userBadge);

        return toUserBadgeResponse(savedUserBadge);
    }

    private Map<String, Object> toBadgeResponse(Badge badge) {
        Map<String, Object> result = new LinkedHashMap<>();

        result.put("id", badge.getId());
        result.put("code", badge.getCode());
        result.put("name", badge.getName());
        result.put("description", badge.getDescription());
        result.put("iconUrl", badge.getIconUrl());
        result.put("color", badge.getColor());
        result.put("category", badge.getCategory());
        result.put("active", badge.getActive());
        result.put("createdAt", badge.getCreatedAt());
        result.put("updatedAt", badge.getUpdatedAt());

        return result;
    }

    private Map<String, Object> toUserBadgeResponse(
            UserBadge userBadge) {

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("id", userBadge.getId());
        result.put("active", userBadge.getActive());
        result.put("note", userBadge.getNote());
        result.put("awardedAt", userBadge.getAwardedAt());
        result.put("expiresAt", userBadge.getExpiresAt());
        result.put("revokedAt", userBadge.getRevokedAt());

        result.put(
                "badge",
                toBadgeResponse(userBadge.getBadge()));

        if (userBadge.getAwardedBy() != null) {
            Map<String, Object> awardedBy = new LinkedHashMap<>();

            awardedBy.put(
                    "id",
                    userBadge.getAwardedBy().getId());

            awardedBy.put(
                    "name",
                    userBadge.getAwardedBy().getName());

            result.put("awardedBy", awardedBy);
        } else {
            result.put("awardedBy", null);
        }

        return result;
    }

    private String cleanText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String createId() {
        return UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 24);
    }
}