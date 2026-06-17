package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.Playlist;

public interface PlaylistRepository extends JpaRepository<Playlist, String> {

	Page<Playlist> findByIsDeletedFalse(Pageable pageable);

	Page<Playlist> findByUserIdAndIsDeletedFalse(String userId, Pageable pageable);

	List<Playlist> findByUserIdAndIsDeletedFalse(String userId);
}