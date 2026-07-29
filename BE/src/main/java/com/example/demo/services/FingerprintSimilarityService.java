package com.example.demo.services;

import org.springframework.stereotype.Service;

@Service
public class FingerprintSimilarityService {

    private static final int BITS_PER_FINGERPRINT_VALUE = 32;

    /*
     * Số fingerprint frame tối thiểu phải được so sánh.
     * Tránh kết luận dựa trên một đoạn audio quá ngắn.
     */
    private static final int MINIMUM_MATCHED_VALUES = 16;

    /*
     * =========================
     * COMPARE FINGERPRINTS
     * =========================
     */

    public FingerprintSimilarityResult compare(
            String sourceFingerprint,
            String candidateFingerprint) {

        int[] sourceValues = parseFingerprint(
                sourceFingerprint);

        int[] candidateValues = parseFingerprint(
                candidateFingerprint);

        int shorterLength = Math.min(
                sourceValues.length,
                candidateValues.length);

        if (shorterLength < MINIMUM_MATCHED_VALUES) {

            throw new IllegalArgumentException(
                    "Fingerprint is too short for similarity comparison");
        }

        /*
         * Cho phép tìm đoạn match từ khoảng 12% fingerprint ngắn hơn.
         *
         * Tuy nhiên không thấp hơn 16 frame.
         */
        int minimumOverlap = Math.max(
                MINIMUM_MATCHED_VALUES,
                (int) Math.ceil(
                        shorterLength * 0.12D));

        minimumOverlap = Math.min(
                minimumOverlap,
                shorterLength);

        ComparisonCandidate bestCandidate = null;

        /*
         * Offset âm:
         * source bắt đầu trước candidate.
         *
         * Offset dương:
         * candidate bắt đầu trước source.
         */
        int minimumOffset = -(candidateValues.length
                - minimumOverlap);

        int maximumOffset = sourceValues.length
                - minimumOverlap;

        for (int offset = minimumOffset; offset <= maximumOffset; offset++) {

            ComparisonCandidate currentCandidate = compareAtOffset(
                    sourceValues,
                    candidateValues,
                    offset,
                    minimumOverlap);

            if (currentCandidate == null) {
                continue;
            }

            if (bestCandidate == null
                    || currentCandidate.rankScore() > bestCandidate.rankScore()) {

                bestCandidate = currentCandidate;
            }
        }

        if (bestCandidate == null) {

            return new FingerprintSimilarityResult(
                    0D,
                    0D,
                    0D,
                    0D,
                    0,
                    0,
                    sourceValues.length,
                    candidateValues.length);
        }

        return new FingerprintSimilarityResult(
                roundScore(
                        bestCandidate.similarityScore()),
                roundScore(
                        bestCandidate.matchedDurationRatio()),
                roundScore(
                        bestCandidate.sourceCoverage()),
                roundScore(
                        bestCandidate.candidateCoverage()),
                bestCandidate.offset(),
                bestCandidate.matchedValues(),
                sourceValues.length,
                candidateValues.length);
    }

    /*
     * =========================
     * COMPARE AT ONE OFFSET
     * =========================
     */

    private ComparisonCandidate compareAtOffset(
            int[] sourceValues,
            int[] candidateValues,
            int offset,
            int minimumOverlap) {

        int sourceStart = Math.max(
                offset,
                0);

        int candidateStart = Math.max(
                -offset,
                0);

        int matchedValues = Math.min(
                sourceValues.length
                        - sourceStart,
                candidateValues.length
                        - candidateStart);

        if (matchedValues < minimumOverlap) {

            return null;
        }

        long differentBits = 0L;

        for (int index = 0; index < matchedValues; index++) {

            int sourceValue = sourceValues[sourceStart + index];

            int candidateValue = candidateValues[candidateStart + index];

            /*
             * XOR đánh dấu các bit khác nhau.
             *
             * Integer.bitCount đếm số bit 1
             * trong kết quả XOR.
             */
            differentBits += Integer.bitCount(
                    sourceValue
                            ^ candidateValue);
        }

        long totalBits = Math.multiplyExact(
                (long) matchedValues,
                BITS_PER_FINGERPRINT_VALUE);

        double similarityScore = totalBits == 0L
                ? 0D
                : 1D - (differentBits
                        / (double) totalBits);

        similarityScore = clampScore(
                similarityScore);

        double sourceCoverage = matchedValues
                / (double) sourceValues.length;

        double candidateCoverage = matchedValues
                / (double) candidateValues.length;

        /*
         * Dùng tỷ lệ coverage thấp hơn để tránh:
         *
         * - một file rất ngắn match với một đoạn nhỏ
         * trong file rất dài;
         * - similarity cao nhưng thời lượng match thấp.
         */
        double matchedDurationRatio = Math.min(
                sourceCoverage,
                candidateCoverage);

        /*
         * Rank dùng để chọn offset tốt nhất.
         *
         * Similarity chiếm 85%.
         * Matched duration chiếm 15%.
         */
        double rankScore = similarityScore * 0.85D
                + matchedDurationRatio * 0.15D;

        return new ComparisonCandidate(
                similarityScore,
                matchedDurationRatio,
                sourceCoverage,
                candidateCoverage,
                rankScore,
                offset,
                matchedValues);
    }

    /*
     * =========================
     * PARSE RAW CHROMAPRINT
     * =========================
     */

    public int[] parseFingerprint(
            String rawFingerprint) {

        if (rawFingerprint == null
                || rawFingerprint.isBlank()) {

            throw new IllegalArgumentException(
                    "Raw fingerprint is required");
        }

        String cleanFingerprint = rawFingerprint.trim();

        /*
         * Cho phép truyền cả:
         *
         * FINGERPRINT=123,456,789
         *
         * hoặc:
         *
         * 123,456,789
         */
        if (cleanFingerprint.startsWith(
                "FINGERPRINT=")) {

            cleanFingerprint = cleanFingerprint.substring(
                    "FINGERPRINT=".length())
                    .trim();
        }

        if (cleanFingerprint.isBlank()) {

            throw new IllegalArgumentException(
                    "Raw fingerprint is empty");
        }

        String[] tokens = cleanFingerprint.split(
                ",");

        int[] values = new int[tokens.length];

        int valueCount = 0;

        for (String token : tokens) {

            String cleanToken = token == null
                    ? ""
                    : token.trim();

            if (cleanToken.isBlank()) {
                continue;
            }

            values[valueCount] = parseFingerprintValue(
                    cleanToken);

            valueCount++;
        }

        if (valueCount == 0) {

            throw new IllegalArgumentException(
                    "Raw fingerprint contains no values");
        }

        if (valueCount == values.length) {

            return values;
        }

        int[] compactValues = new int[valueCount];

        System.arraycopy(
                values,
                0,
                compactValues,
                0,
                valueCount);

        return compactValues;
    }

    private int parseFingerprintValue(
            String value) {

        try {

            /*
             * Chromaprint thường trả signed 32-bit integer.
             */
            return Integer.parseInt(
                    value);

        } catch (NumberFormatException signedError) {

            try {

                /*
                 * Một số output có thể biểu diễn dưới dạng
                 * unsigned 32-bit integer.
                 */
                long unsignedValue = Long.parseLong(
                        value);

                if (unsignedValue < 0L
                        || unsignedValue > 0xFFFFFFFFL) {

                    throw new IllegalArgumentException(
                            "Fingerprint value is outside 32-bit range: "
                                    + value);
                }

                return (int) unsignedValue;

            } catch (NumberFormatException unsignedError) {

                throw new IllegalArgumentException(
                        "Invalid fingerprint value: "
                                + value,
                        unsignedError);
            }
        }
    }

    /*
     * =========================
     * HELPERS
     * =========================
     */

    private double clampScore(
            double score) {

        return Math.max(
                0D,
                Math.min(
                        score,
                        1D));
    }

    private double roundScore(
            double score) {

        return Math.round(
                clampScore(score)
                        * 10000D)
                / 10000D;
    }

    /*
     * =========================
     * INTERNAL COMPARISON
     * =========================
     */

    private record ComparisonCandidate(
            double similarityScore,
            double matchedDurationRatio,
            double sourceCoverage,
            double candidateCoverage,
            double rankScore,
            int offset,
            int matchedValues) {
    }

    /*
     * =========================
     * PUBLIC RESULT
     * =========================
     */

    public record FingerprintSimilarityResult(
            double similarityScore,
            double matchedDurationRatio,
            double sourceCoverage,
            double candidateCoverage,
            int offset,
            int matchedValues,
            int sourceLength,
            int candidateLength) {
    }
}