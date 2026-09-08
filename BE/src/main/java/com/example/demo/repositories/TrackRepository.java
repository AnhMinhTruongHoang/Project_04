package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.entities.Track;

public interface TrackRepository extends JpaRepository<Track, String> {

	/*
	 * =====================================================
	 * DASHBOARD PROJECTION
	 * =====================================================
	 */

	interface DashboardTrackStats {

		Long getTotalTracks();

		Long getTotalPlays();

		Long getTotalLikes();
	}

	@Query("""
			SELECT
				COUNT(track.id) AS totalTracks,
				COALESCE(SUM(track.countPlay), 0) AS totalPlays,
				COALESCE(SUM(track.countLike), 0) AS totalLikes
			FROM Track track
			WHERE track.isDeleted = false
			  AND track.approvalStatus = 'APPROVED'
			""")
	DashboardTrackStats getDashboardStats();

	/*
	 * =====================================================
	 * BASIC
	 * =====================================================
	 */

	Page<Track> findByIsDeletedFalse(
			Pageable pageable);

	List<Track> findByIsDeletedFalse();

	/*
	 * Quan trọng:
	 * load uploader + category cùng query để tránh N+1.
	 */
	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	Page<Track> findByIsDeletedFalseAndApprovalStatus(
			String approvalStatus,
			Pageable pageable);

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	List<Track> findByIsDeletedFalseAndApprovalStatus(
			String approvalStatus);

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	Track findBySlugAndIsDeletedFalseAndApprovalStatus(
			String slug,
			String approvalStatus);

	Track findBySlugAndIsDeletedFalse(
			String slug);

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	Track findFirstByIdStartingWithAndIsDeletedFalseAndApprovalStatus(
			String idPrefix,
			String approvalStatus);

	List<Track> findByUploaderId(
			String uploaderId);

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	List<Track> findByUploaderIdAndIsDeletedFalse(
			String uploaderId);

	Optional<Track> findByIdAndUploaderIdAndIsDeletedFalse(
			String id,
			String uploaderId);

	/*
	 * =====================================================
	 * CATEGORY
	 * =====================================================
	 */

	List<Track> findByCategoryIdAndIsDeletedFalseOrderByCountPlayDesc(
			String categoryId);

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	List<Track> findByCategoryIdAndIsDeletedFalseAndApprovalStatusOrderByCountPlayDesc(
			String categoryId,
			String approvalStatus);

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	List<Track> findByCategoryInfo_SlugAndIsDeletedFalseAndApprovalStatusOrderByCountPlayDesc(
			String slug,
			String approvalStatus);

	/*
	 * =====================================================
	 * SEARCH
	 * =====================================================
	 */

	List<Track> findByTitleContainingAndIsDeletedFalse(
			String keyword);

	List<Track> findByTitleContainingIgnoreCaseAndIsDeletedFalse(
			String keyword);

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	List<Track> findByTitleContainingIgnoreCaseAndIsDeletedFalseAndApprovalStatus(
			String keyword,
			String approvalStatus);

	long countByCategoryIdAndIsDeletedFalse(
			String categoryId);

	/*
	 * =====================================================
	 * AUDIO DUPLICATE
	 * =====================================================
	 */

	boolean existsByAudioHashAndIsDeletedFalse(
			String audioHash);

	Track findFirstByAudioHashAndIsDeletedFalse(
			String audioHash);

	Track findFirstByAudioHashAndIsDeletedFalseAndIdNot(
			String audioHash,
			String excludedTrackId);

	/*
	 * =====================================================
	 * RECOMMENDATIONS
	 * =====================================================
	 */

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	@Query("""
			SELECT t
			FROM Track t
			WHERE t.categoryId = :categoryId
			  AND t.isDeleted = false
			  AND t.approvalStatus = :approvalStatus
			  AND t.id NOT IN :excludedIds
			ORDER BY
				COALESCE(t.countLike, 0) DESC,
				COALESCE(t.countPlay, 0) DESC,
				t.createdAt DESC
			""")
	List<Track> findRecommendedByCategory(
			@Param("categoryId") String categoryId,

			@Param("approvalStatus") String approvalStatus,

			@Param("excludedIds") List<String> excludedIds,

			Pageable pageable);

	@EntityGraph(attributePaths = {
			"uploader",
			"categoryInfo"
	})
	@Query("""
			SELECT t
			FROM Track t
			WHERE t.isDeleted = false
			  AND t.approvalStatus = :approvalStatus
			  AND COALESCE(t.countPlay, 0) <= :maxPlays
			ORDER BY
				COALESCE(t.countLike, 0) DESC,
				COALESCE(t.countPlay, 0) ASC,
				t.createdAt DESC
			""")
	List<Track> findHiddenGems(
			@Param("approvalStatus") String approvalStatus,

			@Param("maxPlays") Integer maxPlays,

			Pageable pageable);

	/*
	 * =====================================================
	 * ARTIST STATS
	 * =====================================================
	 */

	@Query("""
			SELECT COALESCE(SUM(track.countPlay), 0)
			FROM Track track
			WHERE track.uploaderId = :userId
			  AND track.isDeleted = false
			""")
	Long sumPlaysByUploaderId(
			@Param("userId") String userId);

	@Query("""
			SELECT COALESCE(SUM(track.countLike), 0)
			FROM Track track
			WHERE track.uploaderId = :userId
			  AND track.isDeleted = false
			""")
	Long sumLikesByUploaderId(
			@Param("userId") String userId);
}