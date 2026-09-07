package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.Comment;

public interface CommentRepository
		extends JpaRepository<Comment, String> {

	List<Comment> findByTrackIdAndIsDeletedFalse(
			String trackId);

	/*
	 * Admin comments.
	 *
	 * Load sẵn:
	 * - comment.user
	 * - comment.track
	 * - track.categoryInfo
	 *
	 * tránh mỗi comment lại query User + Track + Category.
	 */
	@EntityGraph(attributePaths = {
			"user",
			"track",
			"track.categoryInfo"
	})
	Page<Comment> findByIsDeletedFalseOrderByCreatedAtDesc(
			Pageable pageable);

	/*
	 * Dashboard count.
	 */
	long countByIsDeletedFalse();

	/*
	 * =========================================================
	 * ARTIST STUDIO COMMENTS
	 * =========================================================
	 */

	@Query("""
			SELECT comment
			FROM Comment comment
			WHERE comment.isDeleted = false
			  AND comment.trackId IN (
				  SELECT track.id
				  FROM Track track
				  WHERE track.uploaderId = :userId
					AND track.isDeleted = false
			  )
			ORDER BY comment.createdAt DESC
			""")
	List<Comment> findActiveCommentsByUploaderId(
			@Param("userId") String userId);

	@Query("""
			SELECT COUNT(comment.id)
			FROM Comment comment
			WHERE comment.isDeleted = false
			  AND comment.trackId IN (
				  SELECT track.id
				  FROM Track track
				  WHERE track.uploaderId = :userId
					AND track.isDeleted = false
			  )
			""")
	Long countCommentsByUploaderId(
			@Param("userId") String userId);
}