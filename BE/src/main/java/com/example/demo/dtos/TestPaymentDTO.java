package com.example.demo.dtos;

public class TestPaymentDTO {

    private String orderCode;

    private String testCode;

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(
            String orderCode) {
        this.orderCode = orderCode;
    }

    public String getTestCode() {
        return testCode;
    }

    public void setTestCode(
            String testCode) {
        this.testCode = testCode;
    }
}