"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

const MAGAZINE_IMAGES = {
  RISING_STAR: "/images/media/sontungP.jpg",
  NO_1: "/images/media/sontungP.jpg",
  STYLE_ICON: "/images/media/st003.jpg",
  ASIAN_POP: "/images/media/st007.jpg",
  CREATIVE_LEFT: "/images/media/st005.jpg",
  CREATIVE_RIGHT: "/images/media/st006.jpg",
  CLOSING_FRAME: "/images/media/st006.jpg",
};

const MAGAZINE_VIDEOS = {
  NO_1: "https://www.youtube.com/watch?v=SlQR9iu09bQ&list=RDSlQR9iu09bQ&start_radio=1",
};

type ImageKey = keyof typeof MAGAZINE_IMAGES;

const HASHTAGS: Record<ImageKey, string> = {
  RISING_STAR: "#RISING_STAR",
  NO_1: "#NO.1",
  STYLE_ICON: "#STYLE_ICON",
  ASIAN_POP: "#ASIAN_POP",
  CREATIVE_LEFT: "#CREATIVE_VISION",
  CREATIVE_RIGHT: "#NEW_WAVE",
  CLOSING_FRAME: "#COME_MY_WAY",
};

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return "";

  if (url.includes("youtube.com/embed/")) return url;

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("watch?v=")) {
    const id = url.split("watch?v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  return url;
};

const imageSx = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

function MagazineImage({
  id,
  sx,
  rounded = true,
}: {
  id: ImageKey;
  sx?: any;
  rounded?: boolean;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: rounded ? { xs: "22px", md: "32px" } : 0,
        border: "1px solid rgba(255,255,255,0.12)",
        bgcolor: "#111318",
        boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        ...sx,
      }}
    >
      <Box
        component="img"
        src={MAGAZINE_IMAGES[id]}
        alt={HASHTAGS[id]}
        sx={imageSx}
      />

      <Box
        sx={{
          position: "absolute",
          left: 16,
          bottom: 16,
          px: 1.4,
          py: 0.6,
          borderRadius: "999px",
          bgcolor: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(0,255,224,0.35)",
          color: "#00ffe0",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.08em",
        }}
      >
        {HASHTAGS[id]}
      </Box>
    </Box>
  );
}

function YouTubeBlock({
  videoUrl,
  hashtag = "#NO.1",
  sx,
  rounded = true,
}: {
  videoUrl: string;
  hashtag?: string;
  sx?: any;
  rounded?: boolean;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: rounded ? { xs: "22px", md: "32px" } : 0,
        border: "1px solid rgba(255,255,255,0.12)",
        bgcolor: "#111318",
        boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        ...sx,
      }}
    >
      <Box
        component="iframe"
        src={getYouTubeEmbedUrl(videoUrl)}
        title={hashtag}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        sx={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          left: 16,
          bottom: 16,
          px: 1.4,
          py: 0.6,
          borderRadius: "999px",
          bgcolor: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(0,255,224,0.35)",
          color: "#00ffe0",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.08em",
          pointerEvents: "none",
        }}
      >
        {hashtag}
      </Box>
    </Box>
  );
}

function TextBlock({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Container
      maxWidth="md"
      sx={{
        my: { xs: 7, md: 11 },
      }}
    >
      {eyebrow && (
        <Typography
          sx={{
            color: "#00ffe0",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            mb: 2,
          }}
        >
          {eyebrow}
        </Typography>
      )}

      {title && (
        <Typography
          component="h2"
          sx={{
            color: "#ffffff",
            fontSize: { xs: 32, md: 46 },
            lineHeight: { xs: "42px", md: "58px" },
            fontWeight: 950,
            letterSpacing: "-0.04em",
            mb: 3,
          }}
        >
          {title}
        </Typography>
      )}

      <Box
        sx={{
          color: "#d8dee9",
          fontSize: { xs: 17, md: 19 },
          lineHeight: { xs: "32px", md: "36px" },
          fontWeight: 500,
          "& p": {
            mb: 3,
          },
          "& strong": {
            color: "#ffffff",
            fontWeight: 900,
          },
          "& span": {
            color: "#00ffe0",
            fontWeight: 900,
          },
        }}
      >
        {children}
      </Box>
    </Container>
  );
}

function QuoteBlock() {
  return (
    <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
      <Box
        sx={{
          position: "relative",
          p: { xs: 4, md: 7 },
          borderRadius: { xs: "26px", md: "36px" },
          background:
            "linear-gradient(135deg, rgba(18,22,32,0.98), rgba(4,29,30,0.95))",
          border: "1px solid rgba(0,255,224,0.22)",
          boxShadow: "0 24px 90px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: { xs: 24, md: 40 },
            top: { xs: 32, md: 56 },
            bottom: { xs: 32, md: 56 },
            width: 4,
            borderRadius: "99px",
            bgcolor: "#00ffe0",
          }}
        />

        <Typography
          sx={{
            pl: { xs: 3, md: 5 },
            color: "#ffffff",
            fontSize: { xs: 28, md: 44 },
            lineHeight: { xs: "40px", md: "60px" },
            fontWeight: 900,
            letterSpacing: "-0.04em",
          }}
        >
          “A pop star does not rise only through songs. He rises through image,
          timing, emotion, and the ability to make every release feel like an
          event.”
        </Typography>

        <Typography
          sx={{
            pl: { xs: 3, md: 5 },
            mt: 3,
            color: "#8b949e",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          — Magazine Note
        </Typography>
      </Box>
    </Container>
  );
}

export default function SonTungMagazine() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#05070A",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 720, md: 820 },
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src="/images/media/sontungmain.png"
          alt="Sơn Tùng M-TP Magazine Cover"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.72,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,7,10,0.15) 0%, rgba(5,7,10,0.45) 45%, #05070A 100%)",
          }}
        />

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            pb: { xs: 8, md: 12 },
            pt: { xs: 14, md: 18 },
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mb: 3, flexWrap: "wrap", rowGap: 1 }}
          >
            <Chip
              label="EMAGAZINE"
              sx={{
                color: "#020617",
                bgcolor: "#00ffe0",
                fontWeight: 950,
                letterSpacing: "0.16em",
              }}
            />

            <Chip
              label="#EASTERN_RISING"
              sx={{
                color: "#00ffe0",
                bgcolor: "rgba(0,0,0,0.58)",
                border: "1px solid rgba(0,255,224,0.35)",
                fontWeight: 900,
              }}
            />

            <Chip
              label="#NO.1"
              sx={{
                color: "#ffffff",
                bgcolor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontWeight: 900,
              }}
            />
          </Stack>

          <Typography
            component="h1"
            sx={{
              maxWidth: 980,
              fontSize: { xs: 46, sm: 68, md: 92 },
              lineHeight: { xs: "54px", sm: "76px", md: "98px" },
              fontWeight: 950,
              letterSpacing: "-0.07em",
              color: "#ffffff",
              textShadow: "0 18px 70px rgba(0,0,0,0.75)",
            }}
          >
            Sơn Tùng M-TP: The Eastern Star Who Turned Pop Into a Visual Era
          </Typography>

          <Typography
            sx={{
              mt: 3,
              maxWidth: 760,
              color: "#c9d1d9",
              fontSize: { xs: 18, md: 23 },
              lineHeight: { xs: "30px", md: "38px" },
              fontWeight: 600,
            }}
          >
            A cinematic eMagazine feature about image, ambition, sound, and the
            making of a modern Asian pop icon.
          </Typography>

          <Typography
            sx={{
              mt: 4,
              color: "#8b949e",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            By Minh • 12 min read • 2026
          </Typography>
        </Container>
      </Box>

      {/* INTRO */}
      <TextBlock eyebrow="Opening">
        <p>
          Sơn Tùng M-TP has never been just another name in Vietnamese pop. His
          music travels with a complete visual language: fashion, typography,
          attitude, color, silence, and timing. Every comeback feels built like
          a campaign, not only a song release.
        </p>

        <p>
          In an era where music is watched as much as it is heard, he
          understands one simple truth:{" "}
          <span>the image arrives before the chorus</span>. That is why his
          presence feels larger than a playlist. It feels like a magazine cover,
          a mood board, and a headline at the same time.
        </p>
      </TextBlock>

      {/* IMAGE FULL */}
      <Container maxWidth="lg" sx={{ my: { xs: 7, md: 12 } }}>
        <YouTubeBlock
          videoUrl={MAGAZINE_VIDEOS.NO_1}
          hashtag="#NO.1"
          sx={{
            height: { xs: 320, sm: 460, md: 660 },
          }}
        />

        <Typography
          sx={{
            mt: 1.5,
            color: "#8b949e",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          #NO.1 — a portrait of momentum, confidence, and carefully built pop
          identity.
        </Typography>
      </Container>

      {/* BODY 01 */}
      <TextBlock eyebrow="Chapter 01" title="The power of a controlled image">
        <p>
          The most interesting thing about Sơn Tùng is not only how he sounds,
          but how precisely he appears. His styling often avoids randomness. A
          suit, a color, a pose, a lyric teaser, or even an empty background can
          become part of the message.
        </p>

        <p>
          That control gives his releases a premium feeling. It makes the
          audience wait, decode, share, and discuss. In modern pop, this is a
          different kind of performance: the performance before the performance.
        </p>
      </TextBlock>

      <QuoteBlock />

      {/* SPLIT SECTION */}
      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "520px 1fr" },
            gap: { xs: 4, md: 6 },
            alignItems: "center",
          }}
        >
          <MagazineImage
            id="STYLE_ICON"
            sx={{
              height: { xs: 520, md: 720 },
            }}
          />

          <Box
            sx={{
              p: { xs: 4, md: 5 },
              borderRadius: "32px",
              bgcolor: "#0F1218",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 18px 70px rgba(0,0,0,0.35)",
            }}
          >
            <Typography
              sx={{
                color: "#00ffe0",
                fontSize: 13,
                fontWeight: 950,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              #STYLE_ICON
            </Typography>

            <Typography
              component="h2"
              sx={{
                color: "#ffffff",
                fontSize: { xs: 32, md: 44 },
                lineHeight: { xs: "42px", md: "56px" },
                fontWeight: 950,
                letterSpacing: "-0.05em",
                mb: 3,
              }}
            >
              Fashion as part of the song
            </Typography>

            <Typography
              sx={{
                color: "#a7b0c0",
                fontSize: 18,
                lineHeight: "34px",
                fontWeight: 500,
              }}
            >
              For artists like Sơn Tùng, fashion is not decoration. It is a
              signal. It tells the viewer what kind of era they are entering
              before the beat even drops.
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* FULL BLEED */}
      <Box sx={{ my: { xs: 8, md: 13 } }}>
        <Box
          sx={{
            position: "relative",
            height: { xs: 520, md: 760 },
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={MAGAZINE_IMAGES.ASIAN_POP}
            alt="#ASIAN_POP"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.78,
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, #05070A 0%, rgba(5,7,10,0.3) 50%, #05070A 100%)",
            }}
          />

          <Container
            maxWidth="lg"
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              left: "50%",
              transform: "translateX(-50%)",
              pb: { xs: 5, md: 8 },
            }}
          >
            <Box>
              <Chip
                label="#ASIAN_POP"
                sx={{
                  color: "#00ffe0",
                  bgcolor: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(0,255,224,0.35)",
                  fontWeight: 900,
                  mb: 2,
                }}
              />

              <Typography
                sx={{
                  maxWidth: 720,
                  color: "#ffffff",
                  fontSize: { xs: 34, md: 56 },
                  lineHeight: { xs: "44px", md: "66px" },
                  fontWeight: 950,
                  letterSpacing: "-0.06em",
                }}
              >
                A new pop language built from sound, styling, and spectacle
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* BODY 02 */}
      <TextBlock eyebrow="Chapter 02" title="Eastern rising, global-facing">
        <p>
          The phrase <strong>Eastern Rising</strong> is not about one artist
          alone. It describes a wider cultural shift: Asian pop no longer waits
          for permission to look expensive, ambitious, and global.
        </p>

        <p>
          Sơn Tùng belongs to that shift. His best moments feel local and
          international at the same time. He can carry Vietnamese identity while
          using the visual grammar of world-class pop campaigns.
        </p>

        <p>
          That balance is difficult. Too local, and the work may feel limited.
          Too global, and the artist risks losing texture. His strongest image
          lives in the middle: recognizable, polished, and still personal.
        </p>
      </TextBlock>

      {/* DOUBLE IMAGE */}
      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 4 },
          }}
        >
          <MagazineImage
            id="CREATIVE_LEFT"
            sx={{
              height: { xs: 520, md: 680 },
            }}
          />

          <MagazineImage
            id="CREATIVE_RIGHT"
            sx={{
              height: { xs: 520, md: 680 },
            }}
          />
        </Box>

        <Typography
          sx={{
            mt: 1.5,
            color: "#8b949e",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          #CREATIVE_VISION and #NEW_WAVE — two frames for the artist’s visual
          identity.
        </Typography>
      </Container>

      {/* CLOSING */}
      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <MagazineImage
          id="CLOSING_FRAME"
          sx={{
            height: { xs: 340, sm: 480, md: 620 },
          }}
        />
      </Container>

      <TextBlock eyebrow="Closing">
        <p>
          Sơn Tùng M-TP’s story is not only about hit songs. It is about how an
          artist can build a world around sound. His image is sharp, his timing
          is calculated, and his audience understands the ritual of waiting.
        </p>

        <p>
          That is why the cover line still works: <span>#RISING_STAR</span>. Not
          because the rise is new, but because every era gives him another way
          to rise again.
        </p>
      </TextBlock>

      {/* CREDIT */}
      <Container maxWidth="md" sx={{ pb: { xs: 8, md: 12 } }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", mb: 4 }} />

        <Stack spacing={1.2}>
          <Typography
            sx={{
              color: "#8b949e",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Credits
          </Typography>

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 950,
            }}
          >
            Minh • Design • Frontend
          </Typography>

          <Typography
            sx={{
              color: "#8b949e",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Tags: #EASTERN_RISING, #RISING_STAR, #NO.1, #ASIAN_POP, #STYLE_ICON,
            #COME_MY_WAY.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
