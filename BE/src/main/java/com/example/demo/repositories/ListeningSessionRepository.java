package com.example.demo.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.demo.entities.ListeningSession;

public interface ListeningSessionRepository
                extends JpaRepository<ListeningSession, String> {

        Optional<ListeningSession> findBySessionId(
                        String sessionId);

        Optional<ListeningSession> findBySessionIdAndListenerId(
                        String sessionId,
                        String listenerId);

        /*
         * Khóa phiên nghe trong lúc xử lý heartbeat.
         * Tránh hai request đồng thời cùng cộng accumulatedSeconds.
         */
        @Query(value = """
                        SELECT *
                        FROM listening_sessions
                        WHERE sessionId = :sessionId
                          AND listenerId = :listenerId
                        FOR UPDATE
                        """, nativeQuery = true)
        Optional<ListeningSession> findBySessionIdAndListenerIdForUpdate(
                        @Param("sessionId") String sessionId,
                        @Param("listenerId") String listenerId);

        boolean existsBySessionId(
                        String sessionId);

        List<ListeningSession> findByListenerIdOrderByCreatedAtDesc(
                        String listenerId);

        List<ListeningSession> findByArtistIdAndQualifiedTrueOrderByQualifiedAtDesc(
                        String artistId);

        /*
         * Dùng cho scheduler đóng các phiên không còn heartbeat.
         */
        List<ListeningSession> findByStatusAndLastHeartbeatAtBefore(
                        String status,
                        LocalDateTime cutoffTime);
}