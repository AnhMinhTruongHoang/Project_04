package com.example.demo.configs;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;
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

        private String imageOrDefault(String fileName, String defaultImage) {
                Path path = Paths.get("uploads", "images", fileName);

                if (fileName == null || fileName.trim().isEmpty() || !Files.exists(path)) {
                        return defaultImage;
                }

                return fileName;
        }

        private String audioOrDefault(String fileName, String defaultAudio) {
                Path path = Paths.get("uploads", "audio", fileName);

                if (fileName == null || fileName.trim().isEmpty() || !Files.exists(path)) {
                        return defaultAudio;
                }

                return fileName;
        }

        private String cleanArtistText(String input) {
                if (input == null || input.trim().isEmpty()) {
                        return "Unknown Artist";
                }

                return input
                                .replace("NCS seed track.", "")
                                .replace("NCS seed track", "")
                                .replaceAll("\\.$", "")
                                .trim();
        }

        private String getMainArtistName(String rawArtistName) {
                String artistName = cleanArtistText(rawArtistName);

                String[] separators = {
                                ",",
                                " ft. ",
                                " feat. ",
                                " x ",
                                " X ",
                                " & ",
                                " and "
                };

                for (String separator : separators) {
                        if (artistName.contains(separator)) {
                                return artistName.split(java.util.regex.Pattern.quote(separator))[0].trim();
                        }
                }

                return artistName.trim();
        }

        private String artistEmailFromName(String artistName) {
                String normalized = Normalizer.normalize(artistName, Normalizer.Form.NFD);

                String emailName = normalized
                                .replaceAll("\\p{M}", "")
                                .toLowerCase()
                                .replaceAll("[^a-z0-9]", "");

                if (emailName.isEmpty()) {
                        emailName = "unknownartist";
                }

                return emailName + "@gmail.com";
        }

        private String artistAvatarUrlFromName(String artistName) {
                String email = artistEmailFromName(artistName);
                String emailName = email.substring(0, email.indexOf("@"));

                String avatarFileName = emailName + ".jpg";
                String avatar = imageOrDefault(avatarFileName, "default.png");

                return "http://localhost:8000/uploads/images/" + avatar;
        }

        ////
        private User createSeedArtist(
                        UserRepository userRepository,
                        Map<String, User> artistCache,
                        String rawArtistName) {

                String artistName = getMainArtistName(rawArtistName);
                String email = artistEmailFromName(artistName);
                String avatarUrl = artistAvatarUrlFromName(artistName);

                if (artistCache.containsKey(email)) {
                        return artistCache.get(email);
                }

                User artist = userRepository.findByEmail(email);

                if (artist == null) {
                        artist = new User();

                        artist.setId(id());
                        artist.setEmail(email);
                        artist.setUsername(email);
                        artist.setPassword(BCrypt.hashpw("123456", BCrypt.gensalt()));
                        artist.setName(artistName);
                        artist.setRole("USER");
                        artist.setType("ARTIST");
                        artist.setAddress("Artist");
                        artist.setAge(20);
                        artist.setGender("OTHER");
                        artist.setIsVerify(true);
                        artist.setFollowers(0);
                        artist.setFollowing(0);
                        artist.setCode("");
                        artist.setRefreshToken("");
                        artist.setAvatarUrl(avatarUrl);
                        artist.setCreatedAt(new Date());
                        artist.setUpdatedAt(new Date());

                        userRepository.save(artist);
                } else {
                        boolean changed = false;

                        if (artist.getUsername() == null || artist.getUsername().trim().isEmpty()) {
                                artist.setUsername(email);
                                changed = true;
                        }

                        if (artist.getType() == null || artist.getType().trim().isEmpty()) {
                                artist.setType("ARTIST");
                                changed = true;
                        }

                        if (artist.getFollowers() == null) {
                                artist.setFollowers(0);
                                changed = true;
                        }

                        if (artist.getFollowing() == null) {
                                artist.setFollowing(0);
                                changed = true;
                        }

                        if (artist.getAvatarUrl() == null
                                        || artist.getAvatarUrl().trim().isEmpty()
                                        || artist.getAvatarUrl().contains("default.png")) {
                                artist.setAvatarUrl(avatarUrl);
                                changed = true;
                        }

                        if (changed) {
                                artist.setUpdatedAt(new Date());
                                userRepository.save(artist);
                        }
                }

                artistCache.put(email, artist);

                return artist;
        }

        /////

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
                track.setApprovalStatus("APPROVED");
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
                                admin.setUsername("admin@gmail.com");
                                admin.setPassword(BCrypt.hashpw("123456", BCrypt.gensalt()));
                                admin.setName("Admin");
                                admin.setRole("ADMIN");
                                admin.setAddress("Local");
                                admin.setAge(20);
                                admin.setGender("MALE");
                                admin.setIsVerify(true);
                                admin.setFollowers(0);
                                admin.setFollowing(0);
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
                                user.setUsername("user@gmail.com");
                                user.setPassword(BCrypt.hashpw("123456", BCrypt.gensalt()));
                                user.setName("Demo User");
                                user.setRole("USER");
                                user.setAddress("Local");
                                user.setAge(21);
                                user.setGender("FEMALE");
                                user.setIsVerify(true);
                                user.setFollowers(0);
                                user.setFollowing(0);
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
                        String defaultImage = "default.png";
                        String defaultAudio = "default.wav";
                        // Mỗi dòng: title, description, category, image file, audio file
                        String[][] seedTracks = {
                                        // ===== NCS =====
                                        {
                                                        "Wonder",
                                                        "Unknown Brain",
                                                        "ncs",
                                                        "wonder.jpg",
                                                        "wonder.mp3"
                                        },
                                        {
                                                        "Back To You",
                                                        "DJSM & Ima Sobé",
                                                        "ncs",
                                                        "Back To You (DJSM & Ima Sobé).jpg",
                                                        "Back To You (DJSM & Ima Sobé).mp3"
                                        },
                                        {
                                                        "Breathe Without",
                                                        "Nurko",
                                                        "ncs",
                                                        "Breathe Without (Nurko feat. Luma) - (Lyrics).jpg",
                                                        "Breathe Without (Nurko feat. Luma) - (Lyrics).mp3"
                                        },
                                        {
                                                        "Faceless",
                                                        "Unknown Brain",
                                                        "ncs",
                                                        "Faceless (Unknown Brain ft. Marvin Divine & Bri Tolani).jpg",
                                                        "Faceless (Unknown Brain ft. Marvin Divine & Bri Tolani).mp3"
                                        },
                                        {
                                                        "Holding Us Back",
                                                        "Mblue & AViVA",
                                                        "ncs",
                                                        "Holding Us Back (Mblue & AViVA).jpg",
                                                        "Holding Us Back (Mblue & AViVA).mp3"
                                        },
                                        {
                                                        "Domino",
                                                        "Meyo & Amer",
                                                        "ncs",
                                                        "Meyo & Amero - Domino.jpg",
                                                        "Meyo & Amero - Domino.mp3"
                                        },
                                        {
                                                        "Never Change",
                                                        "Crystal Skies",
                                                        "ncs",
                                                        "Never Change (Crystal Skies ft. Gallie Fisher) - (Lyrics).jpg",
                                                        "Never Change (Crystal Skies ft. Gallie Fisher) - (Lyrics).mp3"
                                        },
                                        {
                                                        "Try",
                                                        "Nightcore - Try. NCS seed track.",
                                                        "ncs",
                                                        "try.jpg",
                                                        "Nightcore - Try - (Lyrics).mp3"
                                        },
                                        {
                                                        "No Stopping Love",
                                                        "Dirty Palm",
                                                        "ncs",
                                                        "nostoping.png",
                                                        "No Stopping Love (Dirty Palm) - (Lyrics).mp3"
                                        },
                                        {
                                                        "Only You",
                                                        "Dexter King ft. Alexis Donn",
                                                        "ncs",
                                                        "onlyyou.jpg",
                                                        "Only You (Dexter King ft. Alexis Donn).mp3"
                                        },
                                        {
                                                        "Save Me",
                                                        "Reaktive & Mehdusa",
                                                        "ncs",
                                                        "Reaktive & Mehdusa - Save Me.jpg",
                                                        "Reaktive & Mehdusa - Save Me.mp3"
                                        },
                                        {
                                                        "Taboo",
                                                        "Madism, Good Humans",
                                                        "ncs",
                                                        "Taboo - Madism, Good Humans, Sadie Rose Van.jpg",
                                                        "Taboo - Madism, Good Humans, Sadie Rose Van.mp3"
                                        },
                                        {
                                                        "The Maze",
                                                        "Neovaii",
                                                        "ncs",
                                                        "The Maze (Neovaii).jpg",
                                                        "The Maze (Neovaii).mp3"
                                        },
                                        {
                                                        "Wonder",
                                                        "Unknown Brain",
                                                        "ncs",
                                                        "ws.jpg",
                                                        "ws.mp3"
                                        },
                                        {
                                                        "Overdrive",
                                                        "ZEXSING, MXRCURY, Pharmagut",
                                                        "ncs",
                                                        "overdrive.jpg",
                                                        "overdrive.mp3"
                                        },

                                        // ===== KPOP =====
                                        {
                                                        "JUMP",
                                                        "BLACKPINK",
                                                        "kpop",
                                                        "BLACKPINK - 뛰어(JUMP) MV.jpg",
                                                        "BLACKPINK - 뛰어(JUMP) MV.mp3"
                                        },
                                        {
                                                        "Kill This Love",
                                                        "BLACKPINK",
                                                        "kpop",
                                                        "BLACKPINK - Kill This Love.jpeg",
                                                        "BLACKPINK - Kill This Love.mp3"
                                        },
                                        {
                                                        "BOOMBAYAH",
                                                        "BLACKPINK",
                                                        "kpop",
                                                        "BLACKPINK BOOMBAYAH.jpg",
                                                        "BLACKPINK BOOMBAYAH.mp3"
                                        },
                                        {
                                                        "How You Like That",
                                                        "BLACKPINK",
                                                        "kpop",
                                                        "BLACKPINK - How You Like That.jpg",
                                                        "BLACKPINK - How You Like That.mp3"
                                        },
                                        {
                                                        "DDU-DU DDU-DU",
                                                        "BLACKPINK",
                                                        "kpop",
                                                        "BLACKPINK - DDU-DU DDU-DU.jpg",
                                                        "BLACKPINK - DDU-DU DDU-DU.mp3"
                                        },
                                        {
                                                        "Shut Down",
                                                        "BLACKPINK",
                                                        "kpop",
                                                        "BLACKPINK - Shut Down.jpg",
                                                        "BLACKPINK - Shut Down.mp3"
                                        },
                                        {
                                                        "Pink Venom",
                                                        "BLACKPINK",
                                                        "kpop",
                                                        "Pink Venom.jpg",
                                                        "Pink Venom.mp3"
                                        },

                                        // ===== LOFI =====
                                        {
                                                        "Lofi Coding Session",
                                                        "bootleg",
                                                        "lofi",
                                                        "lofi1.jpg",
                                                        "lofi1.mp3"
                                        },
                                        {
                                                        "Lofi Midnight Rain",
                                                        "2AM",
                                                        "lofi",
                                                        "lofi2.jpg",
                                                        "lofi2.mp3"
                                        },

                                        // ===== POP =====
                                        {
                                                        "HAY TRAO CHO ANH",
                                                        "Son Tung MTP",
                                                        "pop",
                                                        "HAY TRAO CHO ANH.jpg",
                                                        "HAY TRAO CHO ANH.mp3"
                                        },
                                        {
                                                        "COME MY WAY",
                                                        "Son Tung MTP",
                                                        "pop",
                                                        "COME MY WAY SON TUNG M-TP x TYGA.jpg",
                                                        "COME MY WAY SON TUNG M-TP x TYGA.mp3"
                                        },
                                        {
                                                        "Nơi Này Có Anh Sơn",
                                                        "Sơn Tùng M-TP.",
                                                        "pop",
                                                        "Nơi Này Có Anh Sơn Tùng M-TP.jpg",
                                                        "Nơi Này Có Anh Sơn Tùng M-TP.mp3"
                                        },
                                        {
                                                        "MUỘN RỒI MÀ SAO CÒN",
                                                        "Sơn Tùng M-TP.",
                                                        "pop",
                                                        "MUỘN RỒI MÀ SAO CÒN.jpg",
                                                        "MUỘN RỒI MÀ SAO CÒN.mp3"
                                        },
                                        {
                                                        "Không Phải Dạng Vừa Đâu",
                                                        "Sơn Tùng M-TP.",
                                                        "pop",
                                                        "Không Phải Dạng Vừa Đâu · Sơn Tùng M-TP.jpg",
                                                        "Không Phải Dạng Vừa Đâu · Sơn Tùng M-TP.mp3"
                                        },
                                        {
                                                        "Lạc Trôi Sơn",
                                                        "Sơn Tùng M-TP.",
                                                        "pop",
                                                        "Lạc Trôi Sơn Tùng M-TP.jpg",
                                                        "Lạc Trôi Sơn Tùng M-TP.mp3"
                                        },
                                        {
                                                        "ĐỪNG LÀM TRÁI TIM ANH ĐAU",
                                                        "Sơn Tùng M-TP.",
                                                        "pop",
                                                        "ĐỪNG LÀM TRÁI TIM ANH ĐAU.jpg",
                                                        "ĐỪNG LÀM TRÁI TIM ANH ĐAU.mp3"
                                        },
                        };

                        Map<String, User> artistCache = new HashMap<>();

                        for (String[] item : seedTracks) {
                                String title = item[0];
                                String description = cleanArtistText(item[1]);
                                String category = item[2];

                                String image = imageOrDefault(item[3], defaultImage);
                                String audio = audioOrDefault(item[4], defaultAudio);

                                User artist = createSeedArtist(userRepository, artistCache, description);

                                if (!hasTrackTitle(trackRepository, title)) {
                                        createTrack(
                                                        trackRepository,
                                                        artist,
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