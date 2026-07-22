package com.example.demo.services;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

@Service
public class CloudinaryService {

        private final Cloudinary cloudinary;

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
                                        secureUrl);

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
                        String secureUrl) {

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
                         * Cloudinary URL thường:
                         *
                         * /upload/v1784716222/default_wvkmgk.png
                         *
                         * Bỏ version v123456...
                         */
                        value = value.replaceFirst(
                                        "^v\\d+/",
                                        "");

                        /*
                         * Bỏ extension cuối:
                         *
                         * abc.png -> abc
                         * song.mp3 -> song
                         */
                        int lastSlash = value.lastIndexOf('/');

                        int lastDot = value.lastIndexOf('.');

                        if (lastDot > lastSlash) {

                                value = value.substring(
                                                0,
                                                lastDot);
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