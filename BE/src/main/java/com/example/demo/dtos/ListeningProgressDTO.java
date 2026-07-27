package com.example.demo.dtos;

public class ListeningProgressDTO {

    private Double position;
    private Double duration;
    private Boolean completed;
    private String sessionId;
    private Boolean playing;

    public Double getPosition() {
        return position;
    }

    public void setPosition(
            Double position) {
        this.position = position;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(
            String sessionId) {
        this.sessionId = sessionId;
    }

    public Boolean getPlaying() {
        return playing;
    }

    public void setPlaying(Boolean playing) {
        this.playing = playing;
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