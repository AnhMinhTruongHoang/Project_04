package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.Track;

public interface TrackRepository extends JpaRepository<Track, String> {

	Page<Track> findByIsDeletedFalse(Pageable pageable);

	List<Track> findByIsDeletedFalse();

	Page<Track> findByIsDeletedFalseAndApprovalStatus(String approvalStatus, Pageable pageable);

	List<Track> findByIsDeletedFalseAndApprovalStatus(String approvalStatus);

	Track findBySlugAndIsDeletedFalseAndApprovalStatus(String slug, String approvalStatus);

	Track findBySlugAndIsDeletedFalse(String slug);

	Track findFirstByIdStartingWithAndIsDeletedFalseAndApprovalStatus(
			String idPrefix,
			String approvalStatus);

	List<Track> findByUploaderId(String uploaderId);

	List<Track> findByUploaderIdAndIsDeletedFalse(String uploaderId);

	List<Track> findByCategoryIdAndIsDeletedFalseOrderByCountPlayDesc(String categoryId);

	List<Track> findByCategoryIdAndIsDeletedFalseAndApprovalStatusOrderByCountPlayDesc(
			String categoryId,
			String approvalStatus);

	List<Track> findByCategoryInfo_SlugAndIsDeletedFalseAndApprovalStatusOrderByCountPlayDesc(
			String slug,
			String approvalStatus);

	List<Track> findByTitleContainingAndIsDeletedFalse(String keyword);

	List<Track> findByTitleContainingIgnoreCaseAndIsDeletedFalse(String keyword);

	List<Track> findByTitleContainingIgnoreCaseAndIsDeletedFalseAndApprovalStatus(
			String keyword,
			String approvalStatus);

	//// count songs in category
	long countByCategoryIdAndIsDeletedFalse(String categoryId);

	boolean existsByAudioHashAndIsDeletedFalse(
			String audioHash);

	Track findFirstByAudioHashAndIsDeletedFalse(
			String audioHash);
}