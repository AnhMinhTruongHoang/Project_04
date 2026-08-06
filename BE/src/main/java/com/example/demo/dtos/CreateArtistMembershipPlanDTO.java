package com.example.demo.dtos;

public class CreateArtistMembershipPlanDTO {

    private String code;

    private String name;

    private String description;

    private Long monthlyPrice;

    private String badgeName;

    private String badgeColor;

    private Integer displayOrder;

    public String getCode() {
        return code;
    }

    public void setCode(
            String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(
            String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {
        this.description = description;
    }

    public Long getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(
            Long monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public String getBadgeName() {
        return badgeName;
    }

    public void setBadgeName(
            String badgeName) {
        this.badgeName = badgeName;
    }

    public String getBadgeColor() {
        return badgeColor;
    }

    public void setBadgeColor(
            String badgeColor) {
        this.badgeColor = badgeColor;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(
            Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}