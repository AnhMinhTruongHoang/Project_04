package com.example.demo.helpers;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import jakarta.servlet.http.HttpServletRequest;

public final class VNPayHelper {

    private static final String HMAC_SHA512 = "HmacSHA512";

    private VNPayHelper() {
    }

    /*
     * =========================
     * CREATE PAYMENT URL
     * =========================
     */
    public static String buildPaymentUrl(
            String payUrl,
            Map<String, String> parameters,
            String hashSecret) {

        if (payUrl == null || payUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "VNPAY payment URL is required");
        }

        if (hashSecret == null
                || hashSecret.isBlank()) {

            throw new IllegalArgumentException(
                    "VNPAY hash secret is required");
        }

        Map<String, String> sortedParameters = normalizeParameters(parameters);

        String queryString = buildQueryString(sortedParameters);

        String secureHash = hmacSHA512(
                hashSecret,
                queryString);

        String separator = payUrl.contains("?")
                ? "&"
                : "?";

        return payUrl
                + separator
                + queryString
                + "&vnp_SecureHash="
                + secureHash;
    }

    /*
     * =========================
     * VERIFY RETURN / IPN HASH
     * =========================
     */
    public static boolean verifySignature(
            Map<String, String> callbackParameters,
            String hashSecret) {

        if (callbackParameters == null
                || callbackParameters.isEmpty()
                || hashSecret == null
                || hashSecret.isBlank()) {

            return false;
        }

        String receivedSecureHash = callbackParameters.get(
                "vnp_SecureHash");

        if (receivedSecureHash == null
                || receivedSecureHash.isBlank()) {

            return false;
        }

        Map<String, String> signedParameters = callbackParameters
                .entrySet()
                .stream()
                .filter(entry -> entry.getKey() != null)
                .filter(entry -> !"vnp_SecureHash".equals(
                        entry.getKey()))
                .filter(entry -> !"vnp_SecureHashType".equals(
                        entry.getKey()))
                .collect(
                        Collectors.toMap(
                                Map.Entry::getKey,
                                entry -> entry.getValue() == null
                                        ? ""
                                        : entry.getValue(),
                                (first, second) -> first,
                                TreeMap::new));

        String hashData = buildQueryString(
                signedParameters);

        String calculatedSecureHash = hmacSHA512(
                hashSecret,
                hashData);

        return constantTimeEquals(
                calculatedSecureHash,
                receivedSecureHash);
    }

    /*
     * =========================
     * CREATE HMAC SHA-512
     * =========================
     */
    public static String hmacSHA512(
            String key,
            String data) {

        try {
            Mac mac = Mac.getInstance(
                    HMAC_SHA512);

            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(
                            StandardCharsets.UTF_8),
                    HMAC_SHA512);

            mac.init(secretKey);

            byte[] hashBytes = mac.doFinal(
                    data.getBytes(
                            StandardCharsets.UTF_8));

            StringBuilder result = new StringBuilder(
                    hashBytes.length * 2);

            for (byte hashByte : hashBytes) {
                result.append(
                        String.format(
                                "%02x",
                                hashByte & 0xff));
            }

            return result.toString();

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Cannot generate VNPAY checksum",
                    e);
        }
    }

    /*
     * =========================
     * BUILD SIGNED QUERY STRING
     * =========================
     */
    public static String buildQueryString(
            Map<String, String> parameters) {

        if (parameters == null
                || parameters.isEmpty()) {

            return "";
        }

        return parameters
                .entrySet()
                .stream()
                .filter(entry -> entry.getKey() != null
                        && !entry.getKey().isBlank())
                .filter(entry -> entry.getValue() != null
                        && !entry.getValue().isBlank())
                .sorted(
                        Map.Entry.comparingByKey())
                .map(entry -> urlEncode(entry.getKey())
                        + "="
                        + urlEncode(
                                entry.getValue()))
                .collect(
                        Collectors.joining("&"));
    }

    /*
     * =========================
     * NORMALIZE VNPAY PARAMETERS
     * =========================
     */
    private static Map<String, String> normalizeParameters(
            Map<String, String> parameters) {

        Map<String, String> sortedParameters = new TreeMap<>();

        if (parameters == null) {
            return sortedParameters;
        }

        for (Map.Entry<String, String> entry : parameters.entrySet()) {

            String key = entry.getKey();
            String value = entry.getValue();

            if (key == null
                    || key.isBlank()
                    || value == null
                    || value.isBlank()) {

                continue;
            }

            if ("vnp_SecureHash".equals(key)
                    || "vnp_SecureHashType".equals(key)) {

                continue;
            }

            sortedParameters.put(
                    key.trim(),
                    value.trim());
        }

        return sortedParameters;
    }

    /*
     * =========================
     * URL ENCODE
     * =========================
     */
    public static String urlEncode(
            String value) {

        return URLEncoder.encode(
                value == null ? "" : value,
                StandardCharsets.UTF_8);
    }

    /*
     * =========================
     * GET CLIENT IP
     * =========================
     */
    public static String getClientIpAddress(
            HttpServletRequest request) {

        if (request == null) {
            return "127.0.0.1";
        }

        String forwardedFor = request.getHeader(
                "X-Forwarded-For");

        if (forwardedFor != null
                && !forwardedFor.isBlank()) {

            String firstIp = forwardedFor
                    .split(",")[0]
                    .trim();

            if (!firstIp.isBlank()) {
                return normalizeIp(firstIp);
            }
        }

        String realIp = request.getHeader(
                "X-Real-IP");

        if (realIp != null
                && !realIp.isBlank()) {

            return normalizeIp(
                    realIp.trim());
        }

        return normalizeIp(
                request.getRemoteAddr());
    }

    private static String normalizeIp(
            String ipAddress) {

        if (ipAddress == null
                || ipAddress.isBlank()) {

            return "127.0.0.1";
        }

        if ("0:0:0:0:0:0:0:1"
                .equals(ipAddress)
                || "::1".equals(ipAddress)) {

            return "127.0.0.1";
        }

        return ipAddress;
    }

    /*
     * =========================
     * SAFE ORDER INFORMATION
     * =========================
     */
    public static String normalizeOrderInfo(
            String value) {

        if (value == null
                || value.isBlank()) {

            return "Thanh toan SoundClone";
        }

        String withoutVietnameseMarks = Normalizer.normalize(
                value,
                Normalizer.Form.NFD)
                .replaceAll(
                        "\\p{M}+",
                        "")
                .replace("Đ", "D")
                .replace("đ", "d");

        String sanitized = withoutVietnameseMarks
                .replaceAll(
                        "[^a-zA-Z0-9 ._-]",
                        " ")
                .replaceAll(
                        "\\s+",
                        " ")
                .trim();

        if (sanitized.isBlank()) {
            return "Thanh toan SoundClone";
        }

        return sanitized.length() > 255
                ? sanitized.substring(0, 255)
                : sanitized;
    }

    /*
     * =========================
     * CONSTANT-TIME HASH COMPARE
     * =========================
     */
    private static boolean constantTimeEquals(
            String first,
            String second) {

        if (first == null || second == null) {
            return false;
        }

        byte[] firstBytes = first.trim()
                .toLowerCase()
                .getBytes(
                        StandardCharsets.UTF_8);

        byte[] secondBytes = second.trim()
                .toLowerCase()
                .getBytes(
                        StandardCharsets.UTF_8);

        return MessageDigest.isEqual(
                firstBytes,
                secondBytes);
    }
}