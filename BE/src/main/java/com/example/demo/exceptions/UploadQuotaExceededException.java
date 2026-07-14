package com.example.demo.exceptions;

public class UploadQuotaExceededException
        extends RuntimeException {

    private final String planCode;

    private final long requiredSeconds;

    private final long remainingSeconds;

    public UploadQuotaExceededException(
            String planCode,
            long requiredSeconds,
            long remainingSeconds) {

        super("Upload quota exceeded");

        this.planCode = planCode;

        this.requiredSeconds = requiredSeconds;

        this.remainingSeconds = remainingSeconds;
    }

    public String getPlanCode() {
        return planCode;
    }

    public long getRequiredSeconds() {
        return requiredSeconds;
    }

    public long getRemainingSeconds() {
        return remainingSeconds;
    }
}