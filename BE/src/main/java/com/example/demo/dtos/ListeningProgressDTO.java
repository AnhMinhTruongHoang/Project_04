package com.example.demo.dtos;

public class ListeningProgressDTO {

    private Double position;
    private Double duration;
    private Boolean completed;

    public Double getPosition() {
        return position;
    }

    public void setPosition(
            Double position) {
        this.position = position;
    }

    public Double getDuration() {
        return duration;
    }

    public void setDuration(
            Double duration) {
        this.duration = duration;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(
            Boolean completed) {
        this.completed = completed;
    }
}