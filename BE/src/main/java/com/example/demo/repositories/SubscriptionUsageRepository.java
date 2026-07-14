
package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.SubscriptionUsage;

public interface SubscriptionUsageRepository
        extends JpaRepository<SubscriptionUsage, String> {

    @Query("""
                SELECT usage
                FROM SubscriptionUsage usage
                WHERE usage.userId = :userId
                  AND usage.subscriptionId = :subscriptionId
                  AND usage.periodStart <= :now
                  AND usage.periodEnd > :now
                ORDER BY usage.createdAt DESC
            """)
    Optional<SubscriptionUsage> findCurrentUsage(
            @Param("userId") String userId,
            @Param("subscriptionId") String subscriptionId,
            @Param("now") LocalDateTime now);
}