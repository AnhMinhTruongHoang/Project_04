package com.example.demo.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class VNPayConfig {

    public static final String VERSION = "2.1.0";

    public static final String COMMAND_PAY = "pay";

    public static final String CURRENCY_VND = "VND";

    public static final String DEFAULT_LOCALE = "vn";

    public static final String DEFAULT_ORDER_TYPE = "other";

    private final String payUrl;

    private final String tmnCode;

    private final String hashSecret;

    private final String returnUrl;

    private final String ipnUrl;

    private final int expireMinutes;

    public VNPayConfig(
            @Value("${vnpay.pay-url}") String payUrl,
            @Value("${vnpay.tmn-code}") String tmnCode,
            @Value("${vnpay.hash-secret}") String hashSecret,
            @Value("${vnpay.return-url}") String returnUrl,
            @Value("${vnpay.ipn-url}") String ipnUrl,
            @Value("${vnpay.expire-minutes:15}") int expireMinutes) {

        this.payUrl = normalize(payUrl);
        this.tmnCode = normalize(tmnCode);
        this.hashSecret = normalize(hashSecret);
        this.returnUrl = normalize(returnUrl);
        this.ipnUrl = normalize(ipnUrl);
        this.expireMinutes = Math.max(expireMinutes, 1);
    }

    public void validate() {

        if (payUrl.isBlank()) {
            throw new IllegalStateException(
                    "VNPAY payment URL is missing");
        }

        if (tmnCode.isBlank()) {
            throw new IllegalStateException(
                    "VNPAY TMN code is missing");
        }

        if (hashSecret.isBlank()) {
            throw new IllegalStateException(
                    "VNPAY hash secret is missing");
        }

        if (returnUrl.isBlank()) {
            throw new IllegalStateException(
                    "VNPAY return URL is missing");
        }

        if (ipnUrl.isBlank()) {
            throw new IllegalStateException(
                    "VNPAY IPN URL is missing");
        }
    }

    private String normalize(
            String value) {

        return value == null
                ? ""
                : value.trim();
    }

    public String getPayUrl() {
        return payUrl;
    }

    public String getTmnCode() {
        return tmnCode;
    }

    public String getHashSecret() {
        return hashSecret;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public String getIpnUrl() {
        return ipnUrl;
    }

    public int getExpireMinutes() {
        return expireMinutes;
    }
}