package com.example.demo.responses;

public class ArtistBenefitResponse {

    private String title;
    private String description;
    private String saveLabel;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean active;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {
        this.description = description;
    }

    public String getSaveLabel() {
        return saveLabel;
    }

    public void setSaveLabel(
            String saveLabel) {
        this.saveLabel = saveLabel;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(
            String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(
            Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(
            Boolean active) {
        this.active = active;
    }
}