package com.example.demo.dtos;

public class CreateArtistPayoutRequestDTO {

    /*
     * Số tiền rút theo đơn vị VND.
     */
    private Long amount;

    private String bankCode;

    private String bankName;

    private String accountNumber;

    private String accountHolderName;

    private String artistNote;

    public Long getAmount() {
        return amount;
    }

    public void setAmount(
            Long amount) {
        this.amount = amount;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(
            String bankCode) {
        this.bankCode = bankCode;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(
            String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(
            String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(
            String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }

    public String getArtistNote() {
        return artistNote;
    }

    public void setArtistNote(
            String artistNote) {
        this.artistNote = artistNote;
    }
}