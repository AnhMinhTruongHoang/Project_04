package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.ArtistMembershipPollOption;

public interface ArtistMembershipPollOptionRepository
        extends JpaRepository<ArtistMembershipPollOption, String> {

    List<ArtistMembershipPollOption> findByPostIdOrderByDisplayOrderAscCreatedAtAsc(
            String postId);

    Optional<ArtistMembershipPollOption> findByIdAndPostId(
            String id,
            String postId);

    long countByPostId(
            String postId);

    void deleteByPostId(
            String postId);
}