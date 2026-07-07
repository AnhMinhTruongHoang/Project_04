"use client";

import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

/**
 * ArticleLayout.tsx
 *
 * - Layout inspired by typical news/article pages (Kenh14-like)
 * - Uses the content you provided (title, subtitle, sections, hashtags)
 * - Images are placeholders (MAGAZINE_IMAGES) — replace with real image URLs later
 * - Keep hashtags & English text as requested
 *
 * Usage:
 * - Import and render <ArticleLayout /> or adapt to pass data props
 */

const MAGAZINE_IMAGES = {
  HERO: "/images/media/sontungmain.png",
  STYLE_ICON: "/images/media/st003.jpg",
  RISING_STAR: "/images/media/sontungP.jpg",
  CREATIVE_LEFT: "/images/media/st005.jpg",
  CREATIVE_RIGHT: "/images/media/st006.jpg",
  ASIAN_POP: "/images/media/st007.jpg",
};

const TAGS = [
  "#EASTERN_RISING",
  "#RISING_STAR",
  "#NO.1",
  "#ASIAN_POP",
  "#STYLE_ICON",
  "#COME_MY_WAY",
];

export default function ArticleLayout() {
  const title =
    "Sơn Tùng M-TP: The Eastern Star Who Turned Pop Into a Visual Era";
  const subtitle =
    "A cinematic eMagazine feature about image, ambition, sound, and the making of a modern Asian pop icon.";
  const author = "Minh";
  const readTime = "12 min read";
  const publishedDate = "2026";

  // Article sections: you can adapt or load from props
  const sections: Array<{
    heading?: string;
    paragraphs: string[];
    image?: string;
    caption?: string;
  }> = [
    {
      heading: "",
      paragraphs: [
        "Sơn Tùng M-TP has never been just another name in Vietnamese pop. His music travels with a complete visual language: fashion, typography, attitude, color, silence, and timing. Every comeback feels built like a campaign, not only a song release.",
        "In an era where music is watched as much as it is heard, he understands one simple truth: the image arrives before the chorus. That is why his presence feels larger than a playlist. It feels like a magazine cover, a mood board, and a headline at the same time.",
      ],
    },
    {
      heading: "Chapter 01 — The power of a controlled image",
      paragraphs: [
        "The most interesting thing about Sơn Tùng is not only how he sounds, but how precisely he appears. His styling often avoids randomness. A suit, a color, a pose, a lyric teaser, or even an empty background can become part of the message.",
        "That control gives his releases a premium feeling. It makes the audience wait, decode, share, and discuss. In modern pop, this is a different kind of performance: the performance before the performance.",
      ],
      image: MAGAZINE_IMAGES.STYLE_ICON,
      caption: "Fashion as part of the song",
    },
    {
      heading: "",
      paragraphs: [
        "The phrase Eastern Rising is not about one artist alone. It describes a wider cultural shift: Asian pop no longer waits for permission to look expensive, ambitious, and global.",
        "Sơn Tùng belongs to that shift. His best moments feel local and international at the same time. He can carry Vietnamese identity while using the visual grammar of world-class pop campaigns.",
      ],
      image: MAGAZINE_IMAGES.ASIAN_POP,
      caption: "#ASIAN_POP — a frame for visual identity",
    },
    {
      heading: "Closing",
      paragraphs: [
        "Sơn Tùng M-TP’s story is not only about hit songs. It is about how an artist can build a world around sound. His image is sharp, his timing is calculated, and his audience understands the ritual of waiting.",
        "That is why the cover line still works: #RISING_STAR. Not because the rise is new, but because every era gives him another way to rise again.",
      ],
      image: MAGAZINE_IMAGES.RISING_STAR,
      caption: "#RISING_STAR",
    },
  ];

  return (
    <Box sx={{ background: "#fff", color: "#111", pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: 6 }}>
        {/* Breadcrumb / category chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label="EMAGAZINE"
            size="small"
            sx={{ bgcolor: "#00ffe0", color: "#020617", fontWeight: 900 }}
          />
          <Chip
            label="#EASTERN_RISING"
            size="small"
            variant="outlined"
            sx={{ borderColor: "rgba(0,0,0,0.08)", color: "#444" }}
          />
        </Stack>

        {/* Title */}
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 28, sm: 36, md: 44 },
            fontWeight: 900,
            lineHeight: 1.05,
            mb: 1,
          }}
        >
          {title}
        </Typography>

        {/* Subtitle / lead */}
        <Typography sx={{ color: "#444", fontSize: { xs: 15, md: 18 }, mb: 2 }}>
          {subtitle}
        </Typography>

        {/* Meta: author / date / read time / actions */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#8e44ad",
                color: "#fff",
                fontSize: 14,
              }}
            >
              {author.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                {author}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#6b6b6b" }}>
                {publishedDate} • {readTime}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mx: "6px", color: "#d0d0d0" }}>|</Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "#6b6b6b",
            }}
          >
            <CalendarTodayRoundedIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 13 }}>2026</Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" aria-label="bookmark">
              <BookmarkBorderRoundedIcon />
            </IconButton>
            <IconButton size="small" aria-label="share">
              <ShareRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Main hero image */}
        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            mb: 3,
          }}
        >
          <Box
            component="img"
            src={MAGAZINE_IMAGES.HERO}
            alt="hero"
            sx={{
              width: "100%",
              height: 480,
              objectFit: "cover",
              display: "block",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: 16,
              bottom: 16,
              bgcolor: "rgba(0,0,0,0.6)",
              px: 1.2,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            <Typography
              sx={{ color: "#00ffe0", fontWeight: 900, fontSize: 12 }}
            >
              #NO.1
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Main content */}
          <Grid item xs={12} md={8}>
            {/* lead paragraph as a highlighted block */}
            <Box
              sx={{
                bgcolor: "#f8f8f8",
                p: { xs: 2, md: 3 },
                borderRadius: 1.5,
                mb: 3,
              }}
            >
              <Typography sx={{ color: "#333", fontSize: 16, fontWeight: 600 }}>
                Sơn Tùng M-TP has never been just another name in Vietnamese
                pop. His music travels with a complete visual language: fashion,
                typography, attitude, color, silence, and timing. Every comeback
                feels built like a campaign, not only a song release.
              </Typography>
            </Box>

            {/* Render sections */}
            {sections.map((s, idx) => (
              <Box key={idx} sx={{ mb: 4 }}>
                {s.heading && (
                  <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1.2 }}>
                    {s.heading}
                  </Typography>
                )}

                {s.image && (
                  <Box sx={{ borderRadius: 2, overflow: "hidden", mb: 1.2 }}>
                    <Box
                      component="img"
                      src={s.image}
                      alt={s.caption || ""}
                      sx={{
                        width: "100%",
                        height: 340,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {s.caption && (
                      <Typography sx={{ color: "#777", fontSize: 13, mt: 0.8 }}>
                        {s.caption}
                      </Typography>
                    )}
                  </Box>
                )}

                {s.paragraphs.map((p, pi) => (
                  <Typography
                    key={pi}
                    sx={{
                      color: "#333",
                      fontSize: 16,
                      lineHeight: "28px",
                      mb: 1.5,
                    }}
                  >
                    {p}
                  </Typography>
                ))}

                <Divider sx={{ my: 2 }} />
              </Box>
            ))}

            {/* Tags */}
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 13, color: "#777", mb: 1 }}>
                Tags
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {TAGS.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    sx={{ bgcolor: "rgba(0,0,0,0.04)", fontWeight: 800 }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: "sticky", top: 24 }}>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 1.5,
                  mb: 3,
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 900 }}>
                  Related
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {/* Example related items - replace with real data */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      py: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={MAGAZINE_IMAGES.STYLE_ICON}
                      sx={{
                        width: 72,
                        height: 52,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                        Fashion as part of the song
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#777" }}>
                        Minh • 2026
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      py: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={MAGAZINE_IMAGES.CREATIVE_LEFT}
                      sx={{
                        width: 72,
                        height: 52,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                        Creative vision
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#777" }}>
                        Minh • 2026
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 2,
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 1.5,
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 900, mb: 1 }}>
                  Share
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label="Facebook" clickable />
                  <Chip label="Twitter" clickable />
                  <Chip label="Copy link" clickable />
                </Stack>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Credits */}
        <Box sx={{ mt: 6 }}>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            <Typography sx={{ color: "#666", fontSize: 13, fontWeight: 700 }}>
              Credits
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
              Minh • Design • Frontend
            </Typography>
            <Typography sx={{ color: "#777", fontSize: 14 }}>
              Tags: {TAGS.join(", ")}
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
