package com.example.demo.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.Badge;

public interface BadgeRepository extends JpaRepository<Badge, String> {

    Optional<Badge> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Badge> findByActiveTrueOrderByCreatedAtAsc();
}