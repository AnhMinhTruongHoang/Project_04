package com.example.demo.dtos;

public class CreateMembershipPaymentDTO {

    private String planId;

    private String bankCode;

    private String locale;

    public String getPlanId() {
        return planId;
    }

    public void setPlanId(
            String planId) {
        this.planId = planId;
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