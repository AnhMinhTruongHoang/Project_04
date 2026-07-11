package com.example.demo.dtos;

public class UploadResponseDTO {

    private String fileName;

    private String url;

    public UploadResponseDTO() {
    }

    public UploadResponseDTO(String fileName, String url) {
        this.fileName = fileName;
        this.url = url;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

}