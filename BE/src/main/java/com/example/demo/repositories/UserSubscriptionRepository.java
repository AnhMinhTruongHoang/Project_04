package com.example.demo.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.UserSubscription;

public interface UserSubscriptionRepository
        extends JpaRepository<UserSubscription, String> {

    Optional<UserSubscription> findFirstByUserIdAndStatusOrderByCreatedAtDesc(
            String userId,
            String status);
}