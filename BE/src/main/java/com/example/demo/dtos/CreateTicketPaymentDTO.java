package com.example.demo.dtos;

public class CreateTicketPaymentDTO {

    private String eventId;

    private Integer quantity;

    private String locale;

    private String bankCode;

    public String getEventId() {
        return eventId;
    }

    public void setEventId(
            String eventId) {

        this.eventId = eventId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
            Integer quantity) {

        this.quantity = quantity;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(
            String locale) {

        this.locale = locale;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(
            String bankCode) {

        this.bankCode = bankCode;
    }
}