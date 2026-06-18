package com.example.demo.configs;

import java.text.Normalizer;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.entities.Playlist;
import com.example.demo.entities.Track;
import com.example.demo.entities.User;
import com.example.demo.repositories.PlaylistRepository;
import com.example.demo.repositories.TrackRepository;
import com.example.demo.repositories.UserRepository;

@Configuration
public class DataSeeder {

    private String id() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    }

    private String slugify(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "track";
        }

        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);

        return normalized.replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    private boolean hasTrackTitle(TrackRepository trackRepository, String title) {
        return trackRepository.findAll()
                .stream()
                .anyMatch(track -> title.equalsIgnoreCase(track.getTitle()));
    }

    private Track createTrack(
            TrackRepository trackRepository,
            User uploader,
            String title,
            String description,
            String category,
            String imgUrl,
            String trackUrl) {

        String trackId = id();

        Track track = new Track();

        track.setId(trackId);
        track.setTitle(title.trim());
        track.setSlug(slugify(title) + "-" + trackId.substring(0, 6));
        track.setDescription(description);
        track.setCategory(category.trim().toLowerCase());
        track.setImgUrl(imgUrl);
        track.setTrackUrl(trackUrl);
        track.setCountLike(0);
        track.setCountPlay(0);
        track.setUploaderId(uploader.getId());
        track.setIsDeleted(false);
        track.setCreatedAt(new Date());
        track.setUpdatedAt(new Date());

        return trackRepository.save(track);
    }

    @Bean
    CommandLineRunner seedData(
            UserRepository userRepository,
            TrackRepository trackRepository,
            PlaylistRepository playlistRepository) {

        return args -> {

            // ===== USER SEED =====
            User admin = userRepository.findByEmail("admin@gmail.com");

            if (admin == null) {
                admin = new User();

                admin.setId(id());
                admin.setEmail("admin@gmail.com");
                admin.setUsername("");
                admin.setPassword(BCrypt.hashpw("123456", BCrypt.gensalt()));
                admin.setName("Admin");
                admin.setRole("ADMIN");
                admin.setAddress("Local");
                admin.setAge(20);
                admin.setGender("MALE");
                admin.setIsVerify(true);
                admin.setType("SYSTEM");
                admin.setCode("");
                admin.setRefreshToken("");
                admin.setAvatarUrl("http://localhost:8000/uploads/images/default.png");
                admin.setCreatedAt(new Date());
                admin.setUpdatedAt(new Date());

                userRepository.save(admin);
            }

            User user = userRepository.findByEmail("user@gmail.com");

            if (user == null) {
                user = new User();

                user.setId(id());
                user.setEmail("user@gmail.com");
                user.setUsername("");
                user.setPassword(BCrypt.hashpw("123456", BCrypt.gensalt()));
                user.setName("Demo User");
                user.setRole("USER");
                user.setAddress("Local");
                user.setAge(21);
                user.setGender("FEMALE");
                user.setIsVerify(true);
                user.setType("SYSTEM");
                user.setCode("");
                user.setRefreshToken("");
                user.setAvatarUrl("http://localhost:8000/uploads/images/default.png");
                user.setCreatedAt(new Date());
                user.setUpdatedAt(new Date());

                userRepository.save(user);
            }

            // ===== TRACK SEED =====
            // Dùng lại file bạn đã upload test trước đó.
            // Nếu muốn đổi file, đổi 2 filename này.
            String defaultImage = "aad1b154-3fbe-4aaf-904e-b10aeb2ba83f_default.png";
            String defaultAudio = "f9220d0b-8d2f-4e59-a47f-5cf423334229_default.wav";
            // Mỗi dòng: title, description, category, image file, audio file
            String[][] seedTracks = {
                    // ===== NCS =====
                    {
                            "Unknown Brain - Wonder",
                            "Unknown Brain - Wonder ft. Rarin & Bri Tolani. NCS seed track.",
                            "ncs",
                            "unknown-brain-wonder.jpg",
                            "unknown-brain-wonder.mp3"
                    },
                    {
                            "Back To You",
                            "Back To You (DJSM & Ima Sobé)",
                            "ncs",
                            "Back To You (DJSM & Ima Sobé).jpg",
                            "Back To You (DJSM & Ima Sobé).mp3"
                    },
                    {
                            "Breathe Without (Nurko feat. Luma) - (Lyrics)",
                            "Breathe Without - Nurko feat. Luma. NCS seed track.",
                            "ncs",
                            "Breathe Without (Nurko feat. Luma) - (Lyrics).jpg",
                            "Breathe Without (Nurko feat. Luma) - (Lyrics).mp3"
                    },
                    {
                            "Faceless (Unknown Brain ft. Marvin Divine & Bri Tolani)",
                            "Faceless - Unknown Brain ft. Marvin Divine & Bri Tolani. NCS seed track.",
                            "ncs",
                            "Faceless (Unknown Brain ft. Marvin Divine & Bri Tolani).jpg",
                            "Faceless (Unknown Brain ft. Marvin Divine & Bri Tolani).mp3"
                    },
                    {
                            "Holding Us Back (Mblue & AViVA)",
                            "Holding Us Back - Mblue & AViVA. NCS seed track.",
                            "ncs",
                            "Holding Us Back (Mblue & AViVA).jpg",
                            "Holding Us Back (Mblue & AViVA).mp3"
                    },
                    {
                            "Meyo & Amero - Domino",
                            "Meyo & Amero - Domino. NCS seed track.",
                            "ncs",
                            "Meyo & Amero - Domino.jpg",
                            "Meyo & Amero - Domino.mp3"
                    },
                    {
                            "Never Change (Crystal Skies ft. Gallie Fisher) - (Lyrics)",
                            "Never Change - Crystal Skies ft. Gallie Fisher. NCS seed track.",
                            "ncs",
                            "Never Change (Crystal Skies ft. Gallie Fisher) - (Lyrics).jpg",
                            "Never Change (Crystal Skies ft. Gallie Fisher) - (Lyrics).mp3"
                    },
                    {
                            "Nightcore - Try - (Lyrics)",
                            "Nightcore - Try. NCS seed track.",
                            "ncs",
                            "Nightcore - Try - (Lyrics).jpg",
                            "Nightcore - Try - (Lyrics).mp3"
                    },
                    {
                            "No Stopping Love (Dirty Palm) - (Lyrics)",
                            "No Stopping Love - Dirty Palm. NCS seed track.",
                            "ncs",
                            "No Stopping Love (Dirty Palm) - (Lyrics).jpg",
                            "No Stopping Love (Dirty Palm) - (Lyrics).mp3"
                    },
                    {
                            "Only You (Dexter King ft. Alexis Donn)",
                            "Only You - Dexter King ft. Alexis Donn. NCS seed track.",
                            "ncs",
                            "Only You (Dexter King ft. Alexis Donn).jpg",
                            "Only You (Dexter King ft. Alexis Donn).mp3"
                    },
                    {
                            "Reaktive & Mehdusa - Save Me",
                            "Reaktive & Mehdusa - Save Me. NCS seed track.",
                            "ncs",
                            "Reaktive & Mehdusa - Save Me.jpg",
                            "Reaktive & Mehdusa - Save Me.mp3"
                    },
                    {
                            "Taboo - Madism, Good Humans, Sadie Rose Van",
                            "Taboo - Madism, Good Humans, Sadie Rose Van. NCS seed track.",
                            "ncs",
                            "Taboo - Madism, Good Humans, Sadie Rose Van.jpg",
                            "Taboo - Madism, Good Humans, Sadie Rose Van.mp3"
                    },
                    {
                            "The Maze (Neovaii)",
                            "The Maze - Neovaii. NCS seed track.",
                            "ncs",
                            "The Maze (Neovaii).jpg",
                            "The Maze (Neovaii).mp3"
                    },
                    {
                            "Unknown Brain - Wonder (Lyric Video) (ft. Rarin & Bri Tolani)",
                            "Unknown Brain - Wonder ft. Rarin & Bri Tolani. NCS seed track.",
                            "ncs",
                            "Unknown Brain - Wonder (Lyric Video) (ft. Rarin & Bri Tolani).jpg",
                            "Unknown Brain - Wonder (Lyric Video) (ft. Rarin & Bri Tolani).mp3"
                    },
                    {
                            "ZEXSING, MXRCURY, Pharmagut - Overdrive Complextro NCS - Copyright Free Music",
                            "ZEXSING, MXRCURY, Pharmagut - Overdrive. NCS seed track.",
                            "ncs",
                            "ZEXSING, MXRCURY, Pharmagut - Overdrive Complextro NCS - Copyright Free Music.jpg",
                            "ZEXSING, MXRCURY, Pharmagut - Overdrive Complextro NCS - Copyright Free Music.mp3"
                    },

                    // ===== KPOP =====
                    {
                            "Kpop Night Drive",
                            "Kpop demo track for testing SoundCloud clone.",
                            "kpop",
                            "kpop-night-drive.jpg",
                            "kpop-night-drive.mp3"
                    },
                    {
                            "Kpop Love Signal",
                            "Kpop seed track demo.",
                            "kpop",
                            "kpop-love-signal.jpg",
                            "kpop-love-signal.mp3"
                    },

                    // ===== LOFI =====
                    {
                            "Lofi Coding Session",
                            "Lofi chill beat for coding.",
                            "lofi",
                            "lofi-coding-session.jpg",
                            "lofi-coding-session.mp3"
                    },
                    {
                            "Lofi Midnight Rain",
                            "Lofi midnight rain demo track.",
                            "lofi",
                            "lofi-midnight-rain.jpg",
                            "lofi-midnight-rain.mp3"
                    },

                    // ===== EDM =====
                    {
                            "EDM Future Bass",
                            "EDM future bass demo track.",
                            "edm",
                            "edm-future-bass.jpg",
                            "edm-future-bass.mp3"
                    },
                    {
                            "EDM Neon Lights",
                            "EDM neon lights demo track.",
                            "edm",
                            "edm-neon-lights.jpg",
                            "edm-neon-lights.mp3"
                    },

                    // ===== POP =====
                    {
                            "Pop Summer Vibes",
                            "Pop summer demo track.",
                            "pop",
                            "pop-summer-vibes.jpg",
                            "pop-summer-vibes.mp3"
                    },
                    {
                            "Pop City Dreams",
                            "Pop city dreams demo track.",
                            "pop",
                            "pop-city-dreams.jpg",
                            "pop-city-dreams.mp3"
                    }
            };

            for (String[] item : seedTracks) {
                String title = item[0];
                String description = item[1];
                String category = item[2];
                String image = item[3];
                String audio = item[4];

                if (!hasTrackTitle(trackRepository, title)) {
                    createTrack(
                            trackRepository,
                            admin,
                            title,
                            description,
                            category,
                            image,
                            audio);
                }
            }

            // ===== PLAYLIST SEED =====
            boolean hasSeedPlaylist = playlistRepository.findAll()
                    .stream()
                    .anyMatch(playlist -> "Seed Playlist".equalsIgnoreCase(playlist.getTitle()));

            if (!hasSeedPlaylist) {
                Playlist playlist = new Playlist();

                playlist.setId(id());
                playlist.setTitle("Seed Playlist");
                playlist.setIsPublic(true);
                playlist.setIsAlbum(false);
                playlist.setUserId(admin.getId());
                playlist.setIsDeleted(false);
                playlist.setCreatedAt(new Date());
                playlist.setUpdatedAt(new Date());

                Set<Track> tracks = new HashSet<>();

                for (Track track : trackRepository.findAll()) {
                    if (!Boolean.TRUE.equals(track.getIsDeleted())) {
                        tracks.add(track);
                    }
                }

                playlist.setTracks(tracks);

                playlistRepository.save(playlist);
            }

            System.out.println("Seed data completed.");
        };
    }
}