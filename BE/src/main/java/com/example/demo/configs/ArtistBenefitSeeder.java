package com.example.demo.configs;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.ArtistBenefit;
import com.example.demo.repositories.ArtistBenefitRepository;

@Component
public class ArtistBenefitSeeder
                implements CommandLineRunner {

        private final ArtistBenefitRepository artistBenefitRepository;

        public ArtistBenefitSeeder(
                        ArtistBenefitRepository artistBenefitRepository) {

                this.artistBenefitRepository = artistBenefitRepository;
        }

        @Override
        @Transactional
        public void run(String... args) {

                List<BenefitSeedData> seedData = List.of(

                                new BenefitSeedData(
                                                "artist-benefit-1",
                                                "Get 2 free months of Splice Sounds+ royalty-free samples",
                                                "Access loops, presets, one-shots, and production sounds.",
                                                "Save $25.98",
                                                "https://res.cloudinary.com/eybmkz9z/image/upload/v1784716515/benefit1_wzdsh2.png",
                                                1),

                                new BenefitSeedData(
                                                "artist-benefit-2",
                                                "Get 20% off all campaigns on Groover.co",
                                                "Promote your music and reach new curators faster.",
                                                "Save $21",
                                                "https://res.cloudinary.com/eybmkz9z/image/upload/v1784716522/benefit2_zv6jey.png",
                                                2),

                                new BenefitSeedData(
                                                "artist-benefit-3",
                                                "Get 1 month free of Native Instruments 360 Pro suite",
                                                "Unlock pro audio tools for production and mastering.",
                                                "Save $50",
                                                "https://res.cloudinary.com/eybmkz9z/image/upload/v1784716523/benefit3_faznqf.png",
                                                3),

                                new BenefitSeedData(
                                                "artist-benefit-4",
                                                "Get 3 free months of Output's Arcade plug-in and samples",
                                                "Experiment with creative instruments and sample libraries.",
                                                "Save $ plug-in and samples",
                                                "Experiment with creative instruments39",
                                                "https://res.cloudinary.com/eybmkz9z/image/upload/v1784716524/benefit4_auyq1w.png",
                                                4));

                LocalDateTime now = LocalDateTime.now();

                for (BenefitSeedData item : seedData) {

                        ArtistBenefit benefit = artistBenefitRepository
                                        .findById(item.id())
                                        .orElseGet(ArtistBenefit::new);

                        boolean isNew = benefit.getId() == null;

                        benefit.setId(item.id());
                        benefit.setTitle(item.title());
                        benefit.setDescription(item.description());
                        benefit.setSaveLabel(item.saveLabel());
                        benefit.setImageUrl(item.imageUrl());
                        benefit.setSortOrder(item.sortOrder());
                        benefit.setActive(true);

                        if (isNew || benefit.getCreatedAt() == null) {
                                benefit.setCreatedAt(now);
                        }

                        benefit.setUpdatedAt(now);

                        artistBenefitRepository.save(benefit);
                }

                System.out.println(
                                "Seeded 4 Artist Pro benefits successfully.");
        }

        private record BenefitSeedData(
                        String id,
                        String title,
                        String description,
                        String saveLabel,
                        String imageUrl,
                        Integer sortOrder) {
        }
}