package com.example.demo.controllers;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dtos.UploadResponseDTO;
import com.example.demo.responses.ApiResponse;
import com.example.demo.services.CloudinaryService;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadController {

        private static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024;

        private static final long MAX_AUDIO_SIZE = 200L * 1024 * 1024;

        private final CloudinaryService cloudinaryService;

        public UploadController(
                        CloudinaryService cloudinaryService) {

                this.cloudinaryService = cloudinaryService;
        }

        // =====================================================
        // UPLOAD IMAGE TO CLOUDINARY
        // =====================================================

        @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<UploadResponseDTO>> uploadImage(
                        @RequestParam("file") MultipartFile file)
                        throws IOException {

                if (file == null
                                || file.isEmpty()) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        "Image is required",
                                                                        null));
                }

                if (file.getSize() > MAX_IMAGE_SIZE) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        "Image must be smaller than 10MB",
                                                                        null));
                }

                String contentType = file.getContentType();

                if (contentType == null
                                || !isSupportedImage(
                                                contentType)) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        "Unsupported image format",
                                                                        null));
                }

                String secureUrl = cloudinaryService
                                .uploadImage(file);

                UploadResponseDTO dto = new UploadResponseDTO(
                                secureUrl,
                                secureUrl);

                return ResponseEntity.ok(
                                new ApiResponse<>(
                                                200,
                                                "Upload image successfully",
                                                dto));
        }

        // =====================================================
        // UPLOAD AUDIO TO CLOUDINARY
        // =====================================================

        @PostMapping(value = "/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<UploadResponseDTO>> uploadAudio(
                        @RequestParam("file") MultipartFile file)
                        throws IOException {

                if (file == null
                                || file.isEmpty()) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        "Audio is required",
                                                                        null));
                }

                if (file.getSize() > MAX_AUDIO_SIZE) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        "Audio must be smaller than 200MB",
                                                                        null));
                }

                String contentType = file.getContentType();

                if (contentType == null
                                || !isSupportedAudio(
                                                contentType)) {

                        return ResponseEntity
                                        .badRequest()
                                        .body(
                                                        new ApiResponse<>(
                                                                        400,
                                                                        "Unsupported audio format",
                                                                        null));
                }

                String secureUrl = cloudinaryService
                                .uploadAudio(file);

                UploadResponseDTO dto = new UploadResponseDTO(
                                secureUrl,
                                secureUrl);

                return ResponseEntity.ok(
                                new ApiResponse<>(
                                                200,
                                                "Upload audio successfully",
                                                dto));
        }

        // =====================================================
        // FILE TYPE HELPERS
        // =====================================================

        private boolean isSupportedImage(
                        String contentType) {

                return contentType.equals(
                                "image/jpeg")
                                || contentType.equals(
                                                "image/png")
                                || contentType.equals(
                                                "image/webp")
                                || contentType.equals(
                                                "image/gif");
        }

        private boolean isSupportedAudio(
                        String contentType) {

                return contentType.equals(
                                "audio/mpeg")
                                || contentType.equals(
                                                "audio/mp3")
                                || contentType.equals(
                                                "audio/wav")
                                || contentType.equals(
                                                "audio/x-wav")
                                || contentType.equals(
                                                "audio/ogg")
                                || contentType.equals(
                                                "audio/flac")
                                || contentType.equals(
                                                "audio/mp4")
                                || contentType.equals(
                                                "audio/x-m4a");
        }
}