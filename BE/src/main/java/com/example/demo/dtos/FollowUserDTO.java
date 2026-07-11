package com.example.demo.dtos;

public class FollowUserDTO {

    private String id;
    private String username;
    private String name;
    private String avatarUrl;
    private String coverUrl;
    private String bio;
    private String city;
    private String country;
    private Boolean verified;
    private Integer followers;
    private Integer following;

    public FollowUserDTO() {
    }

    public FollowUserDTO(
            String id,
            String username,
            String name,
            String avatarUrl,
            String coverUrl,
            String bio,
            String city,
            String country,
            Boolean verified,
            Integer followers,
            Integer following) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.coverUrl = coverUrl;
        this.bio = bio;
        this.city = city;
        this.country = country;
        this.verified = verified;
        this.followers = followers;
        this.following = following;
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getName() {
        return name;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public String getBio() {
        return bio;
    }

    public String getCity() {
        return city;
    }

    public String getCountry() {
        return country;
    }

    public Boolean getVerified() {
        return verified;
    }

    public Integer getFollowers() {
        return followers;
    }

    public Integer getFollowing() {
        return following;
    }
}