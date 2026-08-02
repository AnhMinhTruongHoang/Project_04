package com.example.demo.services;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.io.InputStream;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

@Service
public class CloudinaryService {

        private final Cloudinary cloudinary;

        private static final long MAX_LICENSE_FILE_SIZE = 10L * 1024L * 1024L;

        private static final String LICENSE_FOLDER = "soundclone/license";

        public CloudinaryService(
                        Cloudinary cloudinary) {

                this.cloudinary = cloudinary;
        }

        // =====================================================
        // UPLOAD IMAGE
        // =====================================================

        public String uploadImage(
                        MultipartFile file)
                        throws IOException {

                Map<?, ?> result = cloudinary.uploader()
                                .upload(
                                                file.getBytes(),
                                                ObjectUtils.asMap(
                                                                "resource_type",
                                                                "image",

                                                                "asset_folder",
                                                                "soundclone/images",

                                                                "use_filename",
                                                                true,

                                                                "unique_filename",
                                                                true,

                                                                "overwrite",
                                                                false));

                return result
                                .get("secure_url")
                                .toString();
        }

        // =====================================================
        // UPLOAD AUDIO
        // =====================================================

        public String uploadAudio(
                        MultipartFile file)
                        throws IOException {

                Map<?, ?> result = cloudinary.uploader()
                                .upload(
                                                file.getBytes(),
                                                ObjectUtils.asMap(
                                                                "resource_type",
                                                                "video",

                                                                "asset_folder",
                                                                "soundclone/audio",

                                                                "use_filename",
                                                                true,

                                                                "unique_filename",
                                                                true,

                                                                "overwrite",
                                                                false));

                return result
                                .get("secure_url")
                                .toString();
        }

        // =====================================================
        // UPLOAD COPYRIGHT LICENSE PDF
        // =====================================================

        public String uploadLicensePdf(
                        MultipartFile file)
                        throws IOException {

                validateLicensePdf(file);

                Map<?, ?> result = cloudinary.uploader()
                                .upload(
                                                file.getBytes(),
                                                ObjectUtils.asMap(
                                                                "resource_type",
                                                                "raw",

                                                                "asset_folder",
                                                                LICENSE_FOLDER,

                                                                "use_filename",
                                                                true,

                                                                "unique_filename",
                                                                true,

                                                                "overwrite",
                                                                false));

                Object secureUrl = result.get(
                                "secure_url");

                if (secureUrl == null) {
                        throw new IOException(
                                        "Cloudinary did not return a license URL");
                }

                return secureUrl.toString();
        }

        // =====================================================
        // DELETE IMAGE
        // =====================================================

        public void deleteImage(
                        String secureUrl) {

                deleteAsset(
                                secureUrl,
                                "image");
        }

        // =====================================================
        // DELETE AUDIO
        // =====================================================

        public void deleteAudio(
                        String secureUrl) {

                deleteAsset(
                                secureUrl,
                                "video");
        }

        // =====================================================
        // DELETE COPYRIGHT LICENSE PDF
        // =====================================================

        public void deleteLicensePdf(
                        String secureUrl) {

                deleteAsset(
                                secureUrl,
                                "raw");
        }

        // =====================================================
        // VALIDATE COPYRIGHT LICENSE PDF
        // =====================================================

        private void validateLicensePdf(
                        MultipartFile file)
                        throws IOException {

                if (file == null
                                || file.isEmpty()) {

                        throw new IllegalArgumentException(
                                        "License PDF is required");
                }

                if (file.getSize() > MAX_LICENSE_FILE_SIZE) {

                        throw new IllegalArgumentException(
                                        "License PDF must not exceed 10 MB");
                }

                String originalFileName = file.getOriginalFilename();

                if (originalFileName == null
                                || originalFileName.isBlank()
                                || !originalFileName
                                                .toLowerCase(Locale.ROOT)
                                                .endsWith(".pdf")) {

                        throw new IllegalArgumentException(
                                        "License file must have a .pdf extension");
                }

                String contentType = file.getContentType();

                if (contentType == null
                                || !"application/pdf"
                                                .equalsIgnoreCase(
                                                                contentType.trim())) {

                        throw new IllegalArgumentException(
                                        "License file must be a valid PDF");
                }

                /*
                 * PDF chuẩn bắt đầu bằng signature:
                 *
                 * %PDF-
                 */
                byte[] signature = new byte[5];

                try (
                                InputStream inputStream = file.getInputStream()) {

                        int bytesRead = inputStream.read(signature);

                        if (bytesRead != signature.length
                                        || signature[0] != '%'
                                        || signature[1] != 'P'
                                        || signature[2] != 'D'
                                        || signature[3] != 'F'
                                        || signature[4] != '-') {

                                throw new IllegalArgumentException(
                                                "License file content is not a valid PDF");
                        }
                }
        }

        // =====================================================
        // DELETE CLOUDINARY ASSET
        // =====================================================

        private void deleteAsset(
                        String secureUrl,
                        String resourceType) {

                if (secureUrl == null
                                || secureUrl.isBlank()
                                || !secureUrl.contains(
                                                "res.cloudinary.com")) {

                        return;
                }

                try {

                        String publicId = extractPublicId(
                                        secureUrl,
                                        "raw".equalsIgnoreCase(
                                                        resourceType));

                        if (publicId == null
                                        || publicId.isBlank()) {

                                return;
                        }

                        cloudinary.uploader()
                                        .destroy(
                                                        publicId,
                                                        ObjectUtils.asMap(
                                                                        "resource_type",
                                                                        resourceType,

                                                                        "invalidate",
                                                                        true));

                } catch (Exception e) {

                        System.err.println(
                                        "Cannot delete Cloudinary asset: "
                                                        + secureUrl);

                        System.err.println(
                                        e.getMessage());
                }
        }

        // =====================================================
        // EXTRACT PUBLIC ID FROM CLOUDINARY URL
        // =====================================================

        private String extractPublicId(
                        String secureUrl,
                        boolean preserveExtension) {

                try {

                        URI uri = URI.create(
                                        secureUrl);

                        String path = uri.getPath();

                        int uploadIndex = path.indexOf(
                                        "/upload/");

                        if (uploadIndex < 0) {
                                return null;
                        }

                        String value = path.substring(
                                        uploadIndex
                                                        + "/upload/".length());

                        /*
                         * Bỏ Cloudinary version:
                         *
                         * v1234567890/
                         */
                        value = value.replaceFirst(
                                        "^v\\d+/",
                                        "");

                        /*
                         * Image và video:
                         * publicId thường không chứa extension.
                         *
                         * Raw PDF:
                         * publicId cần giữ extension .pdf.
                         */
                        if (!preserveExtension) {

                                int lastSlash = value.lastIndexOf('/');

                                int lastDot = value.lastIndexOf('.');

                                if (lastDot > lastSlash) {

                                        value = value.substring(
                                                        0,
                                                        lastDot);
                                }
                        }

                        return value;

                } catch (Exception e) {

                        return null;
                }
        }

        // =====================================================
        // MIGRATION - UPLOAD LOCAL IMAGE FILE
        // =====================================================

        public String uploadLocalImage(
                        File file)
                        throws IOException {

                if (file == null
                                || !file.exists()
                                || !file.isFile()) {

                        throw new IOException(
                                        "Local image file not found: "
                                                        + (file == null
                                                                        ? "null"
                                                                        : file.getAbsolutePath()));
                }

                Map<?, ?> result = cloudinary.uploader()
                                .upload(
                                                file,
                                                ObjectUtils.asMap(
                                                                "resource_type",
                                                                "image",

                                                                "asset_folder",
                                                                "soundclone/images",

                                                                "use_filename",
                                                                true,

                                                                "unique_filename",
                                                                true,

                                                                "overwrite",
                                                                false));

                return result
                                .get("secure_url")
                                .toString();
        }

        // =====================================================
        // MIGRATION - UPLOAD LOCAL AUDIO FILE
        // =====================================================

        public String uploadLocalAudio(
                        File file)
                        throws IOException {

                if (file == null
                                || !file.exists()
                                || !file.isFile()) {

                        throw new IOException(
                                        "Local audio file not found: "
                                                        + (file == null
                                                                        ? "null"
                                                                        : file.getAbsolutePath()));
                }

                Map<?, ?> result = cloudinary.uploader()
                                .upload(
                                                file,
                                                ObjectUtils.asMap(
                                                                "resource_type",
                                                                "video",

                                                                "asset_folder",
                                                                "soundclone/audio",

                                                                "use_filename",
                                                                true,

                                                                "unique_filename",
                                                                true,

                                                                "overwrite",
                                                                false));

                return result
                                .get("secure_url")
                                .toString();
        }
}