package com.example.demo.controllers;

import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.dtos.UploadResponseDTO;
import com.example.demo.helpers.FileHelper;
import com.example.demo.responses.ApiResponse;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadController {

        @Value("${images_url}")
        private String imagesUrl;

        @Value("${audio_url}")
        private String audioUrl;

        private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

        private static final long MAX_AUDIO_SIZE = 200 * 1024 * 1024; // 200MB

        /**
         * Upload Image
         */
        @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<UploadResponseDTO>> uploadImage(
                        @RequestParam("file") MultipartFile file) throws IOException {

                if (file == null || file.isEmpty()) {
                        return ResponseEntity.badRequest().body(
                                        new ApiResponse<>(400, "Image is required", null));
                }

                if (file.getSize() > MAX_IMAGE_SIZE) {
                        return ResponseEntity.badRequest().body(
                                        new ApiResponse<>(400, "Image must be smaller than 10MB", null));
                }

                String contentType = file.getContentType();

                if (contentType == null ||
                                !(contentType.equals("image/jpeg")
                                                || contentType.equals("image/png")
                                                || contentType.equals("image/webp")
                                                || contentType.equals("image/gif"))) {

                        return ResponseEntity.badRequest().body(
                                        new ApiResponse<>(400, "Unsupported image format", null));
                }

                String fileName = FileHelper.upload(file, "uploads/images");

                UploadResponseDTO dto = new UploadResponseDTO(
                                fileName,
                                imagesUrl + fileName);

                return ResponseEntity.ok(
                                new ApiResponse<>(
                                                200,
                                                "Upload image successfully",
                                                dto));
        }

        /**
         * Upload Audio
         */
        @PostMapping(value = "/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<UploadResponseDTO>> uploadAudio(
                        @RequestParam("file") MultipartFile file) throws IOException {

                if (file == null || file.isEmpty()) {
                        return ResponseEntity.badRequest().body(
                                        new ApiResponse<>(400, "Audio is required", null));
                }

                if (file.getSize() > MAX_AUDIO_SIZE) {
                        return ResponseEntity.badRequest().body(
                                        new ApiResponse<>(400, "Audio must be smaller than 200MB", null));
                }

                String contentType = file.getContentType();

                if (contentType == null ||
                                !(contentType.equals("audio/mpeg")
                                                || contentType.equals("audio/mp3")
                                                || contentType.equals("audio/wav")
                                                || contentType.equals("audio/x-wav")
                                                || contentType.equals("audio/ogg")
                                                || contentType.equals("audio/flac")
                                                || contentType.equals("audio/mp4")
                                                || contentType.equals("audio/x-m4a"))) {

                        return ResponseEntity.badRequest().body(
                                        new ApiResponse<>(400, "Unsupported audio format", null));
                }

                String fileName = FileHelper.upload(file, "uploads/audio");

                UploadResponseDTO dto = new UploadResponseDTO(
                                fileName,
                                audioUrl + fileName);

                return ResponseEntity.ok(
                                new ApiResponse<>(
                                                200,
                                                "Upload audio successfully",
                                                dto));
        }

}