package com.example.demo.migrations;

import java.io.File;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.example.demo.entities.Track;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.services.CloudinaryService;

@Component
public class LegacyMediaMigrationRunner
        implements CommandLineRunner {

    private final TrackRepository trackRepository;

    private final CloudinaryService cloudinaryService;

    @Value("${legacy.media.migration-enabled:false}")
    private boolean migrationEnabled;

    public LegacyMediaMigrationRunner(
            TrackRepository trackRepository,
            CloudinaryService cloudinaryService) {

        this.trackRepository = trackRepository;

        this.cloudinaryService = cloudinaryService;
    }

    @Override
    public void run(
            String... args) {

        if (!migrationEnabled) {

            System.out.println(
                    "[MEDIA MIGRATION] Disabled.");

            return;
        }

        System.out.println(
                "========================================");

        System.out.println(
                "[MEDIA MIGRATION] START");

        System.out.println(
                "========================================");

        List<Track> tracks = trackRepository.findAll();

        int migrated = 0;
        int skipped = 0;
        int failed = 0;

        for (Track track : tracks) {

            String oldImage = track.getImgUrl();

            String oldAudio = track.getTrackUrl();

            boolean migrateImage = isLegacyPath(
                    oldImage);

            boolean migrateAudio = isLegacyPath(
                    oldAudio);

            /*
             * Track đã dùng URL http/https
             * thì không upload lại.
             */
            if (!migrateImage
                    && !migrateAudio) {

                skipped++;

                continue;
            }

            String newImageUrl = null;

            String newAudioUrl = null;

            try {

                // =========================================
                // UPLOAD LEGACY IMAGE
                // =========================================

                if (migrateImage) {

                    File imageFile = Paths.get(
                            "uploads",
                            "images",
                            oldImage)
                            .toFile();

                    if (!imageFile.exists()) {

                        throw new IllegalStateException(
                                "Image not found: "
                                        + imageFile
                                                .getAbsolutePath());
                    }

                    newImageUrl = cloudinaryService
                            .uploadLocalImage(
                                    imageFile);
                }

                // =========================================
                // UPLOAD LEGACY AUDIO
                // =========================================

                if (migrateAudio) {

                    File audioFile = Paths.get(
                            "uploads",
                            "audio",
                            oldAudio)
                            .toFile();

                    if (!audioFile.exists()) {

                        throw new IllegalStateException(
                                "Audio not found: "
                                        + audioFile
                                                .getAbsolutePath());
                    }

                    newAudioUrl = cloudinaryService
                            .uploadLocalAudio(
                                    audioFile);
                }

                // =========================================
                // UPDATE DATABASE ONLY AFTER UPLOAD SUCCESS
                // =========================================

                if (newImageUrl != null) {

                    track.setImgUrl(
                            newImageUrl);
                }

                if (newAudioUrl != null) {

                    track.setTrackUrl(
                            newAudioUrl);
                }

                trackRepository.save(
                        track);

                migrated++;

                System.out.println(
                        "[MEDIA MIGRATION] OK: "
                                + track.getTitle());

            } catch (Exception error) {

                failed++;

                /*
                 * Nếu migration track này lỗi,
                 * xóa asset mới vừa upload để tránh file rác.
                 */

                if (newImageUrl != null) {

                    cloudinaryService
                            .deleteImage(
                                    newImageUrl);
                }

                if (newAudioUrl != null) {

                    cloudinaryService
                            .deleteAudio(
                                    newAudioUrl);
                }

                System.err.println(
                        "[MEDIA MIGRATION] FAILED: "
                                + track.getTitle());

                System.err.println(
                        "[MEDIA MIGRATION] "
                                + error.getMessage());
            }
        }

        System.out.println(
                "========================================");

        System.out.println(
                "[MEDIA MIGRATION] FINISHED");

        System.out.println(
                "Migrated: "
                        + migrated);

        System.out.println(
                "Skipped: "
                        + skipped);

        System.out.println(
                "Failed: "
                        + failed);

        System.out.println(
                "========================================");
    }

    private boolean isLegacyPath(
            String value) {

        if (value == null
                || value.isBlank()) {

            return false;
        }

        String normalized = value.trim()
                .toLowerCase();

        return !normalized.startsWith(
                "http://")
                && !normalized.startsWith(
                        "https://");
    }
}