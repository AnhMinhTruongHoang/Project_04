package com.example.demo.configs;

import java.util.Date;
import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entities.Badge;
import com.example.demo.repositories.BadgeRepository;

@Component
public class BadgeDataInitializer implements CommandLineRunner {

    private final BadgeRepository badgeRepository;

    public BadgeDataInitializer(
            BadgeRepository badgeRepository) {

        this.badgeRepository = badgeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        createBadgeIfMissing(
                "VERIFIED_ARTIST",
                "Verified Artist",
                "Identity and artist ownership verified by SoundClone.",
                "ARTIST",
                "#3B82F6");

        createBadgeIfMissing(
                "FOUNDING_ARTIST",
                "Founding Artist",
                "One of the first artists to publish music on SoundClone.",
                "ARTIST",
                "#A78BFA");

        createBadgeIfMissing(
                "EARLY_SUPPORTER",
                "Early Supporter",
                "An early supporter who joined SoundClone during its initial stage.",
                "USER",
                "#F59E0B");

        createBadgeIfMissing(
                "TOP_LISTENER",
                "Top Listener",
                "A listener recognized for meaningful listening activity.",
                "ACHIEVEMENT",
                "#22C55E");
    }

    private void createBadgeIfMissing(
            String code,
            String name,
            String description,
            String category,
            String color) {

        if (badgeRepository.existsByCodeIgnoreCase(code)) {
            return;
        }

        Date now = new Date();

        Badge badge = new Badge();

        badge.setId(createId());
        badge.setCode(code);
        badge.setName(name);
        badge.setDescription(description);
        badge.setCategory(category);
        badge.setColor(color);
        badge.setIconUrl(null);
        badge.setActive(true);
        badge.setCreatedAt(now);
        badge.setUpdatedAt(now);

        badgeRepository.save(badge);
    }

    private String createId() {
        return UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 24);
    }
}