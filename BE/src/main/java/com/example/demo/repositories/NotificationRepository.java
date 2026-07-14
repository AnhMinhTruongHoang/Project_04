package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.Notification;

public interface NotificationRepository
        extends JpaRepository<Notification, String> {

    Page<Notification> findByRecipientId(
            String recipientId,
            Pageable pageable);

    Page<Notification> findByRecipientIdAndIsReadFalse(
            String recipientId,
            Pageable pageable);

    Optional<Notification> findByIdAndRecipientId(
            String id,
            String recipientId);

    Optional<Notification> findByDeduplicationKey(
            String deduplicationKey);

    long countByRecipientIdAndIsReadFalse(
            String recipientId);

    @Modifying
    @Query("""
            UPDATE Notification notification
            SET notification.isRead = true,
                notification.readAt = :now,
                notification.updatedAt = :now
            WHERE notification.recipientId = :recipientId
              AND notification.isRead = false
            """)
    int markAllAsRead(
            @Param("recipientId") String recipientId,

            @Param("now") LocalDateTime now);

    long deleteByRecipientIdAndIsReadTrue(
            String recipientId);
}