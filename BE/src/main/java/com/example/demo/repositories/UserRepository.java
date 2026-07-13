package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

	///

}