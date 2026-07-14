package com.example.demo.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.Track;
import com.example.demo.repositories.TrackRepository;

@Service
public class TrackUploadService {

    @Autowired
    private TrackRepository trackRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    @Transactional
    public Track saveTrackWithQuota(
            Track track,
            long durationSeconds) {

        if (track == null) {
            throw new IllegalArgumentException(
                    "Track is required");
        }

        if (track.getUploaderId() == null
                || track.getUploaderId()
                        .isBlank()) {

            throw new IllegalArgumentException(
                    "Track uploader is required");
        }

        /*
         * Trừ quota trong cùng transaction
         * với việc lưu Track.
         */
        subscriptionService.consumeUploadQuota(
                track.getUploaderId(),
                durationSeconds);

        /*
         * Nếu save track lỗi:
         * transaction rollback luôn quota.
         */
        return trackRepository.saveAndFlush(
                track);
    }
}