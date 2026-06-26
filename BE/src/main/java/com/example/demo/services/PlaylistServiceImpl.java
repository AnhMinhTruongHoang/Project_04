package com.example.demo.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.demo.entities.Playlist;
import com.example.demo.repositories.PlaylistRepository;

@Service
public class PlaylistServiceImpl implements PlaylistService {

	@Autowired
	private PlaylistRepository playlistRepository;

	@Override
	public Playlist save(Playlist playlist) {
		return playlistRepository.save(playlist);
	}

	@Override
	public Playlist findById(String id) {
		return playlistRepository.findById(id).orElse(null);
	}

	@Override
	public void delete(Playlist playlist) {
		playlistRepository.delete(playlist);
	}

	@Override
	public Page<Playlist> findAll(Pageable pageable) {
		return playlistRepository.findByIsDeletedFalse(pageable);
	}

	@Override
	public Page<Playlist> findByUserId(String userId, Pageable pageable) {
		return playlistRepository.findByUserIdAndIsDeletedFalse(userId, pageable);
	}
}