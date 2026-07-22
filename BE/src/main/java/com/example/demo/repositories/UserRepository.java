package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.demo.entities.User;

public interface UserRepository extends JpaRepository<User, String> {

	User findByEmail(String email);

	Page<User> findByType(String type, Pageable pageable);

	/// who to follow

	@Query("""
			    SELECT u
			    FROM User u
			    WHERE
			        UPPER(COALESCE(u.type, '')) = 'ARTIST'
			        OR UPPER(COALESCE(u.role, '')) = 'ARTIST'
			    ORDER BY
			        COALESCE(u.followers, 0) DESC,
			        u.createdAt DESC
			""")
	List<User> findWhoToFollow(Pageable pageable);

	/*
	 * =========================
	 * Khóa này đảm bảo cùng một user không thể đồng thời:
	 * upload hai track;
	 * vừa upload vừa đổi plan;
	 * vừa upload vừa hủy subscription.
	 * =========================
	 */

	@Query(value = """
			SELECT *
			FROM users
			WHERE id = :userId
			FOR UPDATE
			""", nativeQuery = true)
	Optional<User> findByIdForUpdate(
			@Param("userId") String userId);
	///

}