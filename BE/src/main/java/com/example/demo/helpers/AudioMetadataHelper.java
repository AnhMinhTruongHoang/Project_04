package com.example.demo.helpers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.springframework.web.multipart.MultipartFile;

public final class AudioMetadataHelper {

    private AudioMetadataHelper() {
    }

    public static long getDurationSeconds(
            MultipartFile audio) {

        if (audio == null || audio.isEmpty()) {
            throw new IllegalArgumentException(
                    "Audio file is required");
        }

        Path temporaryFile = null;

        try {
            String extension = getExtension(
                    audio.getOriginalFilename());

            temporaryFile = Files.createTempFile(
                    "soundclone-audio-",
                    extension);

            Files.copy(
                    audio.getInputStream(),
                    temporaryFile,
                    StandardCopyOption.REPLACE_EXISTING);

            AudioFile audioFile = AudioFileIO.read(
                    temporaryFile.toFile());

            long durationSeconds = audioFile
                    .getAudioHeader()
                    .getTrackLength();

            if (durationSeconds <= 0) {
                throw new IllegalArgumentException(
                        "Cannot determine audio duration");
            }

            return durationSeconds;

        } catch (IllegalArgumentException e) {
            throw e;

        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Unsupported or invalid audio file",
                    e);

        } finally {
            if (temporaryFile != null) {
                try {
                    Files.deleteIfExists(
                            temporaryFile);
                } catch (Exception ignored) {
                }
            }
        }
    }

    private static String getExtension(
            String filename) {

        if (filename == null
                || filename.isBlank()) {
            throw new IllegalArgumentException(
                    "Audio filename is invalid");
        }

        int dotIndex = filename.lastIndexOf('.');

        if (dotIndex < 0
                || dotIndex >= filename.length() - 1) {
            throw new IllegalArgumentException(
                    "Audio file extension is missing");
        }

        String extension = filename
                .substring(dotIndex)
                .toLowerCase(Locale.ROOT);

        if (!extension.matches(
                "\\.[a-z0-9]{2,5}")) {
            throw new IllegalArgumentException(
                    "Audio file extension is invalid");
        }

        return extension;
    }
}