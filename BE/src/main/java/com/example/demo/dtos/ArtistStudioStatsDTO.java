package com.example.demo.dtos;

public class ArtistStudioStatsDTO {

    private long plays;
    private long reposts;
    private long downloads;
    private long likes;
    private long comments;
    private long earnings;
    private long fans;

    public long getPlays() {
        return plays;
    }

    public void setPlays(long plays) {
        this.plays = plays;
    }

    public long getReposts() {
        return reposts;
    }

    public void setReposts(long reposts) {
        this.reposts = reposts;
    }

    public long getDownloads() {
        return downloads;
    }

    public void setDownloads(long downloads) {
        this.downloads = downloads;
    }

    public long getLikes() {
        return likes;
    }

    public void setLikes(long likes) {
        this.likes = likes;
    }

    public long getComments() {
        return comments;
    }

    public void setComments(long comments) {
        this.comments = comments;
    }

    public long getEarnings() {
        return earnings;
    }

    public void setEarnings(long earnings) {
        this.earnings = earnings;
    }

    public long getFans() {
        return fans;
    }

    public void setFans(long fans) {
        this.fans = fans;
    }
}