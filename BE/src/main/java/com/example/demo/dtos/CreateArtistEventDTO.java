package com.example.demo.dtos;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

public class CreateArtistEventDTO {

    private String eventName;

    private String eventType;

    private String description;

    private String venueName;

    private String venueAddress;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime eventStartAt;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime eventEndAt;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime saleStartAt;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime saleEndAt;

    private Long ticketPrice;

    private Integer totalQuantity;

    public String getEventName() {
        return eventName;
    }

    public void setEventName(
            String eventName) {
        this.eventName = eventName;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(
            String eventType) {
        this.eventType = eventType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {
        this.description = description;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(
            String venueName) {
        this.venueName = venueName;
    }

    public String getVenueAddress() {
        return venueAddress;
    }

    public void setVenueAddress(
            String venueAddress) {
        this.venueAddress = venueAddress;
    }

    public LocalDateTime getEventStartAt() {
        return eventStartAt;
    }

    public void setEventStartAt(
            LocalDateTime eventStartAt) {
        this.eventStartAt = eventStartAt;
    }

    public LocalDateTime getEventEndAt() {
        return eventEndAt;
    }

    public void setEventEndAt(
            LocalDateTime eventEndAt) {
        this.eventEndAt = eventEndAt;
    }

    public LocalDateTime getSaleStartAt() {
        return saleStartAt;
    }

    public void setSaleStartAt(
            LocalDateTime saleStartAt) {
        this.saleStartAt = saleStartAt;
    }

    public LocalDateTime getSaleEndAt() {
        return saleEndAt;
    }

    public void setSaleEndAt(
            LocalDateTime saleEndAt) {
        this.saleEndAt = saleEndAt;
    }

    public Long getTicketPrice() {
        return ticketPrice;
    }

    public void setTicketPrice(
            Long ticketPrice) {
        this.ticketPrice = ticketPrice;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(
            Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }
}