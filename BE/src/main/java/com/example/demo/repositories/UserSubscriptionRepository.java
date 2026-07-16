package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.UserSubscription;

public interface UserSubscriptionRepository
                extends JpaRepository<UserSubscription, String> {

        Optional<UserSubscription> findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                        String userId,
                        String status);

        List<UserSubscription> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
                        LocalDateTime start,
                        LocalDateTime end);

        List<UserSubscription> findByStatus(
                        String status);
}