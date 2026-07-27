package com.example.demo.dtos;

public class AdminArtistPayoutActionDTO {

    /*
     * Ghi chú khi Admin duyệt,
     * từ chối hoặc xác nhận thanh toán.
     */
    private String adminNote;

    /*
     * Mã giao dịch chuyển khoản.
     * Bắt buộc khi xác nhận PAID.
     */
    private String transactionReference;

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(
            String adminNote) {
        this.adminNote = adminNote;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(
            String transactionReference) {

        this.transactionReference = transactionReference;
    }
}