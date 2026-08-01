package com.example.demo.dtos;

import java.time.LocalDateTime;

public class CreateEarningRateDTO {

    /*
     * Số tiền cho một qualified stream.
     *
     * Ví dụ:
     * 20 = 20 VND / qualified stream.
     */
    private Long amountPerStream;

    /*
     * Hiện tại chỉ hỗ trợ VND.
     */
    private String currency;

    /*
     * null hoặc thời gian hiện tại:
     * áp dụng ngay.
     *
     * Thời gian trong tương lai:
     * tạo rate SCHEDULED.
     */
    private LocalDateTime effectiveFrom;

    /*
     * Lý do Admin điều chỉnh tỷ giá.
     */
    private String reason;

    public Long getAmountPerStream() {
        return amountPerStream;
    }

    public void setAmountPerStream(
            Long amountPerStream) {
        this.amountPerStream = amountPerStream;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(
            String currency) {
        this.currency = currency;
    }

    public LocalDateTime getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(
            LocalDateTime effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(
            String reason) {
        this.reason = reason;
    }
}