package com.example.demo.dtos;

public class CreatePaymentDTO {

    /**
     * BASIC, ARTIST hoặc ARTIST_PRO.
     *
     * BASIC không cần thanh toán và sẽ không được
     * chấp nhận tại API tạo giao dịch VNPAY.
     */
    private String planCode;

    /**
     * Mã ngân hàng VNPAY.
     *
     * Để trống để người dùng chọn ngân hàng
     * trên trang thanh toán VNPAY.
     *
     * Ví dụ:
     * NCB
     * VNPAYQR
     * INTCARD
     */
    private String bankCode;

    /**
     * Ngôn ngữ giao diện VNPAY.
     *
     * Giá trị hỗ trợ:
     * vn
     * en
     */
    private String locale;

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(
            String planCode) {

        this.planCode = planCode;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(
            String bankCode) {

        this.bankCode = bankCode;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(
            String locale) {

        this.locale = locale;
    }
}