package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

	//// slider playlist (Hidden Gems sẽ ưu tiên bài ít lượt nghe nhưng có lượt
	//// thích tốt, sau đó ưu tiên bài mới hơn.)
	@Query("SELECT t FROM Track t " +
			"WHERE t.categoryId = :categoryId " +
			"AND t.isDeleted = false " +
			"AND t.approvalStatus = :approvalStatus " +
			"AND t.id NOT IN :excludedIds " +
			"ORDER BY " +
			"COALESCE(t.countLike, 0) DESC, " +
			"COALESCE(t.countPlay, 0) DESC, " +
			"t.createdAt DESC")
	List<Track> findRecommendedByCategory(
			@Param("categoryId") String categoryId,

			@Param("approvalStatus") String approvalStatus,

			@Param("excludedIds") List<String> excludedIds,

			Pageable pageable);

	@Query("SELECT t FROM Track t " +
			"WHERE t.isDeleted = false " +
			"AND t.approvalStatus = :approvalStatus " +
			"AND COALESCE(t.countPlay, 0) <= :maxPlays " +
			"ORDER BY " +
			"COALESCE(t.countLike, 0) DESC, " +
			"COALESCE(t.countPlay, 0) ASC, " +
			"t.createdAt DESC")
	List<Track> findHiddenGems(
			@Param("approvalStatus") String approvalStatus,

			@Param("maxPlays") Integer maxPlays,

			Pageable pageable);

	/// artist stats
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
	///
}