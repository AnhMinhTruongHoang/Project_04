package com.example.demo.dtos;

public class CreateArtistMembershipPostDTO {

    private String type;

    private String visibility;

    private String requiredPlanId;

    private String content;

    private String trackId;

    private Long previewStartSeconds;

    private Integer previewDurationSeconds;

    private Boolean allowComments;

    private String status;

    public String getType() {
        return type;
    }

    public void setType(
            String type) {
        this.type = type;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(
            String visibility) {
        this.visibility = visibility;
    }

    public String getRequiredPlanId() {
        return requiredPlanId;
    }

    public void setRequiredPlanId(
            String requiredPlanId) {
        this.requiredPlanId = requiredPlanId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(
            String content) {
        this.content = content;
    }

    public String getTrackId() {
        return trackId;
    }

    public void setTrackId(
            String trackId) {
        this.trackId = trackId;
    }

    public Long getPreviewStartSeconds() {
        return previewStartSeconds;
    }

    public void setPreviewStartSeconds(
            Long previewStartSeconds) {
        this.previewStartSeconds = previewStartSeconds;
    }

    public Integer getPreviewDurationSeconds() {
        return previewDurationSeconds;
    }

    public void setPreviewDurationSeconds(
            Integer previewDurationSeconds) {
        this.previewDurationSeconds = previewDurationSeconds;
    }

    public Boolean getAllowComments() {
        return allowComments;
    }

    public void setAllowComments(
            Boolean allowComments) {
        this.allowComments = allowComments;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status) {
        this.status = status;
    }
}