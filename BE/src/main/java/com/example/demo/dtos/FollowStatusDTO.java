package com.example.demo.dtos;

public class FollowStatusDTO {

    private boolean following;
    private int targetFollowers;
    private int currentUserFollowing;

    public FollowStatusDTO() {
    }

    public FollowStatusDTO(
            boolean following,
            int targetFollowers,
            int currentUserFollowing) {
        this.following = following;
        this.targetFollowers = targetFollowers;
        this.currentUserFollowing = currentUserFollowing;
    }

    public boolean isFollowing() {
        return following;
    }

    public int getTargetFollowers() {
        return targetFollowers;
    }

    public int getCurrentUserFollowing() {
        return currentUserFollowing;
    }
}