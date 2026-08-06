package com.example.demo.entities;

import java.io.Serializable;
import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "badges", uniqueConstraints = {
        @UniqueConstraint(name = "uk_badges_code", columnNames = "code")
})
public class Badge implements Serializable {

    private String id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private String color;
    private String category;
    private Boolean active = true;
    private Date createdAt;
    private Date updatedAt;

    public Badge() {
    }

    @Id
    @Column(name = "id", nullable = false, length = 24)
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @Column(name = "code", nullable = false, unique = true, length = 100)
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code == null
                ? null
                : code.trim().toUpperCase();
    }

    @Column(name = "name", nullable = false, length = 150)
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null
                ? null
                : name.trim();
    }

    @Column(name = "description", length = 500)
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description == null
                ? null
                : description.trim();
    }

    @Column(name = "icon_url", length = 500)
    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }

    @Column(name = "color", length = 20)
    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    @Column(name = "category", nullable = false, length = 50)
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category == null
                ? null
                : category.trim().toUpperCase();
    }

    @Column(name = "active", nullable = false)
    public Boolean getActive() {
        return active == null ? true : active;
    }

    public void setActive(Boolean active) {
        this.active = active == null ? true : active;
    }

    @Column(name = "created_at", nullable = false)
    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    @Column(name = "updated_at")
    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}