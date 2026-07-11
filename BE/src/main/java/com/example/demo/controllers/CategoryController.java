package com.example.demo.controllers;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.demo.entities.Category;
import com.example.demo.entities.User;
import com.example.demo.helpers.JwtHelper;
import com.example.demo.repositories.CategoryRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.responses.ApiResponse;

import io.jsonwebtoken.Claims;

@RestController
@RequestMapping({ "/api/v1/categories", "/api/categories" })
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackRepository trackRepository;

    private String generateId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    }

    private String slugify(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "category";
        }

        String prepared = input.trim()
                .replace("Đ", "D")
                .replace("đ", "d");

        String normalized = Normalizer.normalize(prepared, Normalizer.Form.NFD);

        String slug = normalized.replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        return slug.isEmpty() ? "category" : slug;
    }

    private String getString(Map<String, Object> body, String key) {
        Object value = body.get(key);

        if (value == null) {
            return "";
        }

        return String.valueOf(value).trim();
    }

    private Map<String, Object> toCategoryResponse(Category category) {
        Map<String, Object> item = new HashMap<>();

        item.put("id", category.getId());
        item.put("_id", category.getId());
        item.put("name", category.getName());
        item.put("slug", category.getSlug());
        item.put("description", category.getDescription());
        item.put("isDeleted", category.getIsDeleted());
        item.put("createdAt", category.getCreatedAt());
        item.put("updatedAt", category.getUpdatedAt());

        long trackCount = trackRepository.countByCategoryIdAndIsDeletedFalse(category.getId());

        item.put("trackCount", trackCount);

        return item;
    }

    private ResponseEntity<?> checkAdmin(String authorization) {
        try {
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(
                        new ApiResponse<>(401, "Unauthorized", null));
            }

            String token = authorization.replace("Bearer ", "");
            Claims claims = JwtHelper.verifyToken(token);
            String email = claims.getSubject();

            User admin = userRepository.findByEmail(email);

            if (admin == null || !"ADMIN".equals(admin.getRole())) {
                return ResponseEntity.status(403).body(
                        new ApiResponse<>(403, "Access denied", null));
            }

            return null;
        } catch (Exception e) {
            return ResponseEntity.status(401).body(
                    new ApiResponse<>(401, "Invalid token", null));
        }
    }

    // GET /api/v1/categories?current=1&pageSize=100
    @GetMapping
    public ResponseEntity<?> getCategories(
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "10") int pageSize) {

        try {
            Page<Category> page = categoryRepository.findByIsDeletedFalse(
                    PageRequest.of(
                            current - 1,
                            pageSize,
                            Sort.by(Sort.Direction.ASC, "name")));

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch categories success",
                            page.map(this::toCategoryResponse)));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    // GET /api/v1/categories/all
    @GetMapping("/all")
    public ResponseEntity<?> getAllCategories() {
        try {
            return ResponseEntity.ok(
                    new ApiResponse<>(
                            200,
                            "Fetch all categories success",
                            categoryRepository.findByIsDeletedFalse()
                                    .stream()
                                    .map(this::toCategoryResponse)
                                    .toList()));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    // GET /api/v1/categories/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable String id) {
        try {
            Category category = categoryRepository.findById(id).orElse(null);

            if (category == null || Boolean.TRUE.equals(category.getIsDeleted())) {
                return ResponseEntity.status(404).body(
                        new ApiResponse<>(404, "Category not found", null));
            }

            return ResponseEntity.ok(
                    new ApiResponse<>(200, "Fetch category success", category));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    // GET /api/v1/categories/slug/{slug}
    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getCategoryBySlug(@PathVariable String slug) {
        try {
            Category category = categoryRepository.findBySlugAndIsDeletedFalse(slug);

            if (category == null) {
                return ResponseEntity.status(404).body(
                        new ApiResponse<>(404, "Category not found", null));
            }

            return ResponseEntity.ok(
                    new ApiResponse<>(200, "Fetch category success", category));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    // POST /api/v1/categories
    @PostMapping
    public ResponseEntity<?> createCategory(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        try {
            ResponseEntity<?> adminCheck = checkAdmin(authorization);

            if (adminCheck != null) {
                return adminCheck;
            }

            String name = getString(body, "name");
            String slug = getString(body, "slug");
            String description = getString(body, "description");

            if (name.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse<>(400, "Category name is required", null));
            }

            if (slug.isEmpty()) {
                slug = slugify(name);
            } else {
                slug = slugify(slug);
            }

            Category existedCategory = categoryRepository.findBySlug(slug);

            if (existedCategory != null && !Boolean.TRUE.equals(existedCategory.getIsDeleted())) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse<>(400, "Category slug already exists", null));
            }

            Category category = existedCategory != null ? existedCategory : new Category();

            if (category.getId() == null || category.getId().trim().isEmpty()) {
                category.setId(generateId());
                category.setCreatedAt(LocalDateTime.now());
            }

            category.setName(name.trim().toUpperCase());
            category.setSlug(slug);
            category.setDescription(description);
            category.setIsDeleted(false);
            category.setUpdatedAt(LocalDateTime.now());

            categoryRepository.save(category);

            return ResponseEntity.status(201).body(
                    new ApiResponse<>(201, "Create category success", category));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    // PUT /api/v1/categories/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        try {
            ResponseEntity<?> adminCheck = checkAdmin(authorization);

            if (adminCheck != null) {
                return adminCheck;
            }

            Category category = categoryRepository.findById(id).orElse(null);

            if (category == null || Boolean.TRUE.equals(category.getIsDeleted())) {
                return ResponseEntity.status(404).body(
                        new ApiResponse<>(404, "Category not found", null));
            }

            String name = getString(body, "name");
            String slug = getString(body, "slug");
            String description = getString(body, "description");

            if (!name.isEmpty()) {
                category.setName(name.toUpperCase());
            }

            if (!slug.isEmpty()) {
                String newSlug = slugify(slug);
                Category existedCategory = categoryRepository.findBySlug(newSlug);

                if (existedCategory != null && !existedCategory.getId().equals(category.getId())) {
                    return ResponseEntity.badRequest().body(
                            new ApiResponse<>(400, "Category slug already exists", null));
                }

                category.setSlug(newSlug);
            }

            category.setDescription(description);
            category.setUpdatedAt(LocalDateTime.now());
            categoryRepository.save(category);

            return ResponseEntity.ok(
                    new ApiResponse<>(200, "Update category success", category));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }

    // DELETE /api/v1/categories/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        try {
            ResponseEntity<?> adminCheck = checkAdmin(authorization);

            if (adminCheck != null) {
                return adminCheck;
            }

            Category category = categoryRepository.findById(id).orElse(null);

            if (category == null || Boolean.TRUE.equals(category.getIsDeleted())) {
                return ResponseEntity.status(404).body(
                        new ApiResponse<>(404, "Category not found", null));
            }

            category.setIsDeleted(true);
            category.setUpdatedAt(LocalDateTime.now());

            categoryRepository.save(category);

            return ResponseEntity.ok(
                    new ApiResponse<>(200, "Delete category success", null));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    new ApiResponse<>(500, e.getMessage(), null));
        }
    }
}