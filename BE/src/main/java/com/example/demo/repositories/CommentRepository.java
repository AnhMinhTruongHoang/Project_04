package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.Comment;

public interface CommentRepository
		extends JpaRepository<Comment, String> {

	List<Comment> findByTrackIdAndIsDeletedFalse(
			String trackId);

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