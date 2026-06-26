package com.example.demo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.entities.Playlist;

public interface PlaylistService {

	Playlist save(Playlist playlist);

	Playlist findById(String id);

	void delete(Playlist playlist);

	Page<Playlist> findAll(Pageable pageable);

	Page<Playlist> findByUserId(String userId, Pageable pageable);

}