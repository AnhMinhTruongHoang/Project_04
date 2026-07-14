package com.example.demo.dtos;

public class ArtistBenefitDTO {

    private String id;

    private String title;

    private String description;

    private String saveLabel;

    private String imageUrl;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(
            String title) {
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
}