package com.example.demo.dtos;

public class SubscriptionAccessDTO {

    private String planCode;

    private Boolean unlimitedUploads;

    private Long uploadLimitSeconds;

    private Long uploadedSeconds;

    private Long remainingSeconds;

    private Boolean canDistribute;

    private Boolean canMonetize;

    private Boolean canScheduleRelease;

    private Boolean hasMembershipBenefits;

    private Integer advancedInsightsDays;

    private Boolean hasTicketingBenefits;

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(
            String planCode) {
        this.planCode = planCode;
    }

    public Boolean getUnlimitedUploads() {
        return unlimitedUploads;
    }

    public void setUnlimitedUploads(
            Boolean unlimitedUploads) {
        this.unlimitedUploads = unlimitedUploads;
    }

    public Long getUploadLimitSeconds() {
        return uploadLimitSeconds;
    }

    public void setUploadLimitSeconds(
            Long uploadLimitSeconds) {
        this.uploadLimitSeconds = uploadLimitSeconds;
    }

    public Long getUploadedSeconds() {
        return uploadedSeconds;
    }

    public void setUploadedSeconds(
            Long uploadedSeconds) {
        this.uploadedSeconds = uploadedSeconds;
    }

    public Long getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(
            Long remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }

    public Boolean getCanDistribute() {
        return canDistribute;
    }

    public void setCanDistribute(
            Boolean canDistribute) {
        this.canDistribute = canDistribute;
    }

    public Boolean getCanMonetize() {
        return canMonetize;
    }

    public void setCanMonetize(
            Boolean canMonetize) {
        this.canMonetize = canMonetize;
    }

    public Boolean getCanScheduleRelease() {
        return canScheduleRelease;
    }

    public void setCanScheduleRelease(
            Boolean canScheduleRelease) {
        this.canScheduleRelease = canScheduleRelease;
    }

    public Boolean getHasMembershipBenefits() {
        return hasMembershipBenefits;
    }

    public void setHasMembershipBenefits(
            Boolean hasMembershipBenefits) {
        this.hasMembershipBenefits = hasMembershipBenefits;
    }

    public Integer getAdvancedInsightsDays() {
        return advancedInsightsDays;
    }

    public void setAdvancedInsightsDays(
            Integer advancedInsightsDays) {
        this.advancedInsightsDays = advancedInsightsDays;
    }

    public Boolean getHasTicketingBenefits() {
        return hasTicketingBenefits;
    }

    public void setHasTicketingBenefits(
            Boolean hasTicketingBenefits) {

        this.hasTicketingBenefits = hasTicketingBenefits;
    }
}