package com.example.demo.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entities.Category;

public interface CategoryRepository extends JpaRepository<Category, String> {

    Category findBySlug(String slug);

    Category findByNameIgnoreCase(String name);

    Category findBySlugAndIsDeletedFalse(String slug);

    List<Category> findByIsDeletedFalse();

    Page<Category> findByIsDeletedFalse(Pageable pageable);
}