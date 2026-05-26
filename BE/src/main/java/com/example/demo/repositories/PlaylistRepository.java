package com.example.demo.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.Playlist;

public interface PlaylistRepository extends JpaRepository<Playlist, String> {

	Page<Playlist> findByIsDeletedFalse(Pageable pageable);

	Page<Playlist> findByUserIdAndIsDeletedFalse(String userId, Pageable pageable);

}