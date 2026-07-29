package com.example.demo.services;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ChromaprintService {

    public static final String ALGORITHM = "CHROMAPRINT";

    private final HttpClient httpClient;

    /*
     * Windows:
     * C:/Tools/chromaprint/fpcalc.exe
     *
     * Hoặc chỉ cần:
     * fpcalc
     *
     * nếu thư mục fpcalc đã nằm trong PATH.
     */
    @Value("${copyright.chromaprint.fpcalc-path:fpcalc}")
    private String fpcalcPath;

    /*
     * Thời gian tối đa cho một lần chạy fingerprint.
     */
    @Value("${copyright.chromaprint.timeout-seconds:180}")
    private long timeoutSeconds;

    /*
     * Giới hạn file audio tải về để scan.
     *
     * Mặc định: 100 MB.
     */
    @Value("${copyright.chromaprint.max-download-bytes:104857600}")
    private long maxDownloadBytes;

    private volatile String cachedVersion;

    public ChromaprintService() {

        this.httpClient = HttpClient
                .newBuilder()
                .followRedirects(
                        HttpClient.Redirect.NORMAL)
                .connectTimeout(
                        Duration.ofSeconds(30))
                .build();
    }

    /*
     * =========================
     * GENERATE FROM AUDIO URL
     * =========================
     */

    public ChromaprintResult generateFromUrl(
            String audioUrl) {

        validateAudioUrl(
                audioUrl);

        Path temporaryAudioFile = null;

        try {

            String extension = resolveFileExtension(
                    audioUrl);

            temporaryAudioFile = Files.createTempFile(
                    "soundclone-copyright-",
                    extension);

            downloadAudio(
                    audioUrl,
                    temporaryAudioFile);

            return generateFromFile(
                    temporaryAudioFile);

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Cannot prepare audio for copyright scan",
                    e);

        } finally {

            safeDelete(
                    temporaryAudioFile);
        }
    }

    /*
     * =========================
     * GENERATE FROM LOCAL FILE
     * =========================
     */

    public ChromaprintResult generateFromFile(
            Path audioFile) {

        if (audioFile == null) {

            throw new IllegalArgumentException(
                    "Audio file is required");
        }

        if (!Files.exists(audioFile)
                || !Files.isRegularFile(audioFile)) {

            throw new IllegalArgumentException(
                    "Audio file does not exist");
        }

        Path processOutputFile = null;

        try {

            processOutputFile = Files.createTempFile(
                    "soundclone-fpcalc-output-",
                    ".txt");

            /*
             * -length 0:
             * xử lý toàn bộ audio.
             *
             * -raw:
             * trả về fingerprint dưới dạng danh sách số nguyên.
             *
             * Dạng raw sẽ thuận tiện hơn cho việc tính
             * Hamming similarity ở bước tiếp theo.
             */
            ProcessBuilder processBuilder = new ProcessBuilder(
                    fpcalcPath,
                    "-length",
                    "0",
                    "-raw",
                    "-text",
                    audioFile
                            .toAbsolutePath()
                            .toString());

            processBuilder.redirectErrorStream(
                    true);

            processBuilder.redirectOutput(
                    processOutputFile.toFile());

            Process process = processBuilder.start();

            boolean finished = process.waitFor(
                    Math.max(timeoutSeconds, 10L),
                    TimeUnit.SECONDS);

            if (!finished) {

                process.destroyForcibly();

                throw new IllegalStateException(
                        "Chromaprint scan timed out");
            }

            String output = Files.readString(
                    processOutputFile,
                    StandardCharsets.UTF_8);

            if (process.exitValue() != 0) {

                throw new IllegalStateException(
                        "fpcalc failed: "
                                + abbreviate(output, 1000));
            }

            return parseFingerprintOutput(
                    output);

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Cannot execute fpcalc. Check copyright.chromaprint.fpcalc-path",
                    e);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Chromaprint scan was interrupted",
                    e);

        } finally {

            safeDelete(
                    processOutputFile);
        }
    }

    /*
     * =========================
     * FPCALC INSTALLATION CHECK
     * =========================
     */

    public String getFpcalcVersion() {

        String currentVersion = cachedVersion;

        if (currentVersion != null
                && !currentVersion.isBlank()) {

            return currentVersion;
        }

        synchronized (this) {

            if (cachedVersion != null
                    && !cachedVersion.isBlank()) {

                return cachedVersion;
            }

            cachedVersion = detectFpcalcVersion();

            return cachedVersion;
        }
    }

    public boolean isAvailable() {

        try {

            getFpcalcVersion();

            return true;

        } catch (Exception e) {

            return false;
        }
    }

    /*
     * =========================
     * DOWNLOAD AUDIO
     * =========================
     */

    private void downloadAudio(
            String audioUrl,
            Path destination) {

        try {

            HttpRequest request = HttpRequest
                    .newBuilder()
                    .uri(URI.create(audioUrl))
                    .timeout(
                            Duration.ofSeconds(
                                    Math.max(timeoutSeconds, 30L)))
                    .header(
                            "User-Agent",
                            "SoundClone-Copyright-Scanner/1.0")
                    .GET()
                    .build();

            HttpResponse<InputStream> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers
                            .ofInputStream());

            int statusCode = response.statusCode();

            if (statusCode < 200
                    || statusCode >= 300) {

                response.body().close();

                throw new IllegalStateException(
                        "Cannot download audio. HTTP status: "
                                + statusCode);
            }

            long contentLength = response
                    .headers()
                    .firstValueAsLong(
                            "Content-Length")
                    .orElse(-1L);

            if (contentLength > maxDownloadBytes) {

                response.body().close();

                throw new IllegalStateException(
                        "Audio file exceeds copyright scan size limit");
            }

            try (
                    InputStream inputStream = response.body()) {

                copyWithLimit(
                        inputStream,
                        destination,
                        maxDownloadBytes);
            }

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Cannot download audio for copyright scan",
                    e);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Audio download was interrupted",
                    e);
        }
    }

    private void copyWithLimit(
            InputStream inputStream,
            Path destination,
            long maximumBytes)
            throws IOException {

        try (
                var outputStream = Files.newOutputStream(
                        destination)) {

            byte[] buffer = new byte[8192];

            long totalBytes = 0L;

            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {

                totalBytes = Math.addExact(
                        totalBytes,
                        bytesRead);

                if (totalBytes > maximumBytes) {

                    throw new IllegalStateException(
                            "Audio file exceeds copyright scan size limit");
                }

                outputStream.write(
                        buffer,
                        0,
                        bytesRead);
            }
        }
    }

    /*
     * =========================
     * PARSE FPCALC OUTPUT
     * =========================
     */

    private ChromaprintResult parseFingerprintOutput(
            String output) {

        if (output == null
                || output.isBlank()) {

            throw new IllegalStateException(
                    "fpcalc returned an empty result");
        }

        Long durationSeconds = null;

        String fingerprint = null;

        String[] lines = output.split(
                "\\R");

        for (String line : lines) {

            String cleanLine = line == null
                    ? ""
                    : line.trim();

            if (cleanLine.startsWith(
                    "DURATION=")) {

                String durationValue = cleanLine.substring(
                        "DURATION=".length())
                        .trim();

                try {

                    durationSeconds = Long.parseLong(
                            durationValue);

                } catch (NumberFormatException e) {

                    throw new IllegalStateException(
                            "Invalid fpcalc duration: "
                                    + durationValue,
                            e);
                }
            }

            if (cleanLine.startsWith(
                    "FINGERPRINT=")) {

                fingerprint = cleanLine.substring(
                        "FINGERPRINT=".length())
                        .trim();
            }
        }

        if (durationSeconds == null
                || durationSeconds <= 0L) {

            throw new IllegalStateException(
                    "fpcalc did not return a valid duration");
        }

        if (fingerprint == null
                || fingerprint.isBlank()) {

            throw new IllegalStateException(
                    "fpcalc did not return a fingerprint");
        }

        int fingerprintLength = countFingerprintValues(
                fingerprint);

        if (fingerprintLength <= 0) {

            throw new IllegalStateException(
                    "Chromaprint fingerprint is empty");
        }

        return new ChromaprintResult(
                ALGORITHM,
                getFpcalcVersion(),
                durationSeconds,
                fingerprint,
                fingerprintLength);
    }

    private int countFingerprintValues(
            String fingerprint) {

        if (fingerprint == null
                || fingerprint.isBlank()) {

            return 0;
        }

        int count = 1;

        for (int index = 0; index < fingerprint.length(); index++) {

            if (fingerprint.charAt(index) == ',') {

                count++;
            }
        }

        return count;
    }

    /*
     * =========================
     * FPCALC VERSION
     * =========================
     */

    private String detectFpcalcVersion() {

        Path processOutputFile = null;

        try {

            processOutputFile = Files.createTempFile(
                    "soundclone-fpcalc-version-",
                    ".txt");

            ProcessBuilder processBuilder = new ProcessBuilder(
                    fpcalcPath,
                    "-version");

            processBuilder.redirectErrorStream(
                    true);

            processBuilder.redirectOutput(
                    processOutputFile.toFile());

            Process process = processBuilder.start();

            boolean finished = process.waitFor(
                    15L,
                    TimeUnit.SECONDS);

            if (!finished) {

                process.destroyForcibly();

                throw new IllegalStateException(
                        "fpcalc version check timed out");
            }

            String output = Files.readString(
                    processOutputFile,
                    StandardCharsets.UTF_8)
                    .trim();

            if (process.exitValue() != 0
                    || output.isBlank()) {

                throw new IllegalStateException(
                        "fpcalc is unavailable: "
                                + abbreviate(output, 500));
            }

            String lowerOutput = output.toLowerCase(
                    Locale.ROOT);

            String marker = "fpcalc version ";

            int markerIndex = lowerOutput.indexOf(
                    marker);

            if (markerIndex < 0) {

                return abbreviate(
                        output,
                        100);
            }

            int versionStart = markerIndex
                    + marker.length();

            int versionEnd = output.indexOf(
                    ' ',
                    versionStart);

            if (versionEnd < 0) {

                versionEnd = output.length();
            }

            String version = output.substring(
                    versionStart,
                    versionEnd)
                    .trim();

            return version.isBlank()
                    ? abbreviate(output, 100)
                    : version;

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Cannot start fpcalc. Check the configured executable path",
                    e);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "fpcalc version check was interrupted",
                    e);

        } finally {

            safeDelete(
                    processOutputFile);
        }
    }

    /*
     * =========================
     * VALIDATION
     * =========================
     */

    private void validateAudioUrl(
            String audioUrl) {

        if (audioUrl == null
                || audioUrl.isBlank()) {

            throw new IllegalArgumentException(
                    "Audio URL is required");
        }

        URI uri;

        try {

            uri = URI.create(
                    audioUrl.trim());

        } catch (IllegalArgumentException e) {

            throw new IllegalArgumentException(
                    "Audio URL is invalid",
                    e);
        }

        String scheme = uri.getScheme();

        if (!"http".equalsIgnoreCase(scheme)
                && !"https".equalsIgnoreCase(scheme)) {

            throw new IllegalArgumentException(
                    "Only HTTP and HTTPS audio URLs are supported");
        }
    }

    private String resolveFileExtension(
            String audioUrl) {

        try {

            String path = URI
                    .create(audioUrl)
                    .getPath();

            if (path == null
                    || path.isBlank()) {

                return ".audio";
            }

            int fileNameIndex = path.lastIndexOf('/');

            String fileName = fileNameIndex >= 0
                    ? path.substring(
                            fileNameIndex + 1)
                    : path;

            int extensionIndex = fileName.lastIndexOf('.');

            if (extensionIndex < 0
                    || extensionIndex >= fileName.length() - 1) {

                return ".audio";
            }

            String extension = fileName.substring(
                    extensionIndex)
                    .toLowerCase(
                            Locale.ROOT);

            if (!extension.matches(
                    "\\.[a-z0-9]{1,10}")) {

                return ".audio";
            }

            return extension;

        } catch (Exception e) {

            return ".audio";
        }
    }

    /*
     * =========================
     * HELPERS
     * =========================
     */

    private void safeDelete(
            Path file) {

        if (file == null) {

            return;
        }

        try {

            Files.deleteIfExists(
                    file);

        } catch (IOException cleanupError) {

            System.err.println(
                    "Cannot delete temporary copyright file: "
                            + cleanupError.getMessage());
        }
    }

    private String abbreviate(
            String value,
            int maximumLength) {

        if (value == null) {

            return "";
        }

        String cleanValue = value.trim();

        if (cleanValue.length() <= maximumLength) {

            return cleanValue;
        }

        return cleanValue.substring(
                0,
                maximumLength)
                + "...";
    }

    /*
     * =========================
     * RESULT
     * =========================
     */

    public record ChromaprintResult(
            String algorithm,
            String algorithmVersion,
            long durationSeconds,
            String rawFingerprint,
            int fingerprintLength) {
    }
}