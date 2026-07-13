package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.ListeningHistory;

public interface ListeningHistoryRepository
        extends JpaRepository<ListeningHistory, Long> {

    Optional<ListeningHistory> findByUserIdAndTrackId(
            String userId,
            String trackId);

    List<ListeningHistory> findByUserIdOrderByLastPlayedAtDesc(
            String userId,
            Pageable pageable);

    List<ListeningHistory> findByUserIdAndCompletedFalseOrderByLastPlayedAtDesc(
            String userId,
            Pageable pageable);
}