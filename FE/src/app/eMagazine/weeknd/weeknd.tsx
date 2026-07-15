"use client";

import * as React from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const MAGAZINE_IMAGES = {
  HERO: "/images/media/weeknd02.jpg",
  NIGHT_DRIVE: "/images/media/weeknd03.jpg",
  AFTER_HOURS: "/images/media/weeknd05.jpg",
  SIN_CITY: "/images/media/weeknd06.jpg",
  VEGAS_GLOW: "/images/media/weeknd04.jpg",
  BLOOD_AND_GLASS: "/images/media/weeknd07.jpg",
  FINAL_FRAME: "/images/media/weeknd08.jpg",
};

const MAGAZINE_VIDEOS = {
  OFFICIAL: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
};

type ImageKey = Exclude<keyof typeof MAGAZINE_IMAGES, "HERO">;

const HASHTAGS: Record<ImageKey, string> = {
  NIGHT_DRIVE: "#NIGHT_DRIVE",
  AFTER_HOURS: "#AFTER_HOURS",
  SIN_CITY: "#SIN_CITY",
  VEGAS_GLOW: "#VEGAS_GLOW",
  BLOOD_AND_GLASS: "#BLOOD_AND_GLASS",
  FINAL_FRAME: "#NEON_NOIR",
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
  display: "block",
  objectFit: "cover",
};

function MagazineImage({
  id,
  sx,
  imagePosition = "center",
  rounded = true,
  hashtagPosition = "left",
}: {
  id: ImageKey;
  sx?: any;
  imagePosition?: string;
  rounded?: boolean;
  hashtagPosition?: "left" | "right";
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: rounded ? { xs: "20px", md: "30px" } : 0,
        bgcolor: "#090909",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 90px rgba(0,0,0,0.55)",
        ...sx,
      }}
    >
      <Box
        component="img"
        src={MAGAZINE_IMAGES[id]}
        alt={HASHTAGS[id]}
        sx={{
          ...imageSx,
          objectPosition: imagePosition,
          filter: "saturate(1.08) contrast(1.06)",
          transition: "transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.7) 100%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          left: hashtagPosition === "left" ? 16 : "auto",
          right: hashtagPosition === "right" ? 16 : "auto",
          bottom: 16,
          px: 1.45,
          py: 0.65,
          borderRadius: "999px",
          color: "#ffffff",
          bgcolor: "rgba(8,8,8,0.78)",
          border: "1px solid rgba(255,45,45,0.55)",
          boxShadow: "0 0 28px rgba(255,0,0,0.18)",
          fontSize: 12,
          fontWeight: 950,
          letterSpacing: "0.1em",
        }}
      >
        {HASHTAGS[id]}
      </Box>
    </Box>
  );
}

function YouTubeBlock({
  videoUrl,
  hashtag = "#BLINDING_LIGHTS",
  sx,
}: {
  videoUrl: string;
  hashtag?: string;
  sx?: any;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: "20px", md: "30px" },
        bgcolor: "#090909",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 30px 100px rgba(0,0,0,0.65)",
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
          display: "block",
          border: 0,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          left: 16,
          bottom: 16,
          px: 1.45,
          py: 0.65,
          borderRadius: "999px",
          color: "#ffffff",
          bgcolor: "rgba(8,8,8,0.78)",
          border: "1px solid rgba(255,45,45,0.55)",
          boxShadow: "0 0 28px rgba(255,0,0,0.18)",
          fontSize: 12,
          fontWeight: 950,
          letterSpacing: "0.1em",
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
  align = "left",
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <Container
      maxWidth="md"
      sx={{
        my: { xs: 7, md: 11 },
        textAlign: align,
      }}
    >
      {eyebrow && (
        <Typography
          sx={{
            mb: 2,
            color: "#ff2a2a",
            fontSize: 13,
            fontWeight: 950,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textShadow: "0 0 24px rgba(255,0,0,0.35)",
          }}
        >
          {eyebrow}
        </Typography>
      )}

      {title && (
        <Typography
          component="h2"
          sx={{
            mb: 3,
            color: "#ffffff",
            fontSize: { xs: 32, md: 48 },
            lineHeight: { xs: "42px", md: "60px" },
            fontWeight: 950,
            letterSpacing: "-0.045em",
          }}
        >
          {title}
        </Typography>
      )}

      <Box
        sx={{
          color: "#d4d4d4",
          fontSize: { xs: 17, md: 19 },
          lineHeight: { xs: "31px", md: "36px" },
          fontWeight: 500,
          "& p": { mb: 3 },
          "& strong": { color: "#ffffff", fontWeight: 900 },
          "& span": { color: "#ff3b3b", fontWeight: 900 },
        }}
      >
        {children}
      </Box>
    </Container>
  );
}

function QuoteBlock() {
  return (
    <Container maxWidth="lg" sx={{ my: { xs: 8, md: 13 } }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 4, md: 7 },
          borderRadius: { xs: "24px", md: "34px" },
          background:
            "linear-gradient(135deg, rgba(12,12,12,0.98), rgba(77,0,0,0.92))",
          border: "1px solid rgba(255,55,55,0.25)",
          boxShadow: "0 28px 110px rgba(0,0,0,0.55)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: -80,
            top: -120,
            width: 300,
            height: 300,
            borderRadius: "50%",
            bgcolor: "rgba(255,0,0,0.16)",
            filter: "blur(28px)",
          }}
        />

        <Typography
          sx={{
            position: "relative",
            zIndex: 1,
            maxWidth: 980,
            color: "#ffffff",
            fontSize: { xs: 28, md: 46 },
            lineHeight: { xs: "40px", md: "61px" },
            fontWeight: 950,
            letterSpacing: "-0.04em",
          }}
        >
          “The video does not chase the night for freedom. It chases it because
          stopping would mean facing what the light reveals.”
        </Typography>

        <Typography
          sx={{
            position: "relative",
            zIndex: 1,
            mt: 3,
            color: "#ff6b6b",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          — Editorial Note
        </Typography>
      </Box>
    </Container>
  );
}

function NeonFactStrip() {
  const facts = [
    {
      number: "01",
      title: "MIDNIGHT",
      text: "The city feels endless because the character refuses to slow down.",
    },
    {
      number: "02",
      title: "RED",
      text: "The dominant color turns glamour into danger and romance into pressure.",
    },
    {
      number: "03",
      title: "MOTION",
      text: "Every sprint, turn, and collision keeps the video emotionally unstable.",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {facts.map((fact) => (
          <Box
            key={fact.number}
            sx={{
              minHeight: 220,
              p: 3.5,
              borderRadius: "24px",
              background:
                "linear-gradient(180deg, rgba(18,18,18,0.98), rgba(9,9,9,0.98))",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.38)",
            }}
          >
            <Typography
              sx={{
                color: "#ff2a2a",
                fontSize: 13,
                fontWeight: 950,
                letterSpacing: "0.18em",
              }}
            >
              {fact.number}
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: "#ffffff",
                fontSize: 26,
                fontWeight: 950,
                letterSpacing: "-0.03em",
              }}
            >
              {fact.title}
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: "#9f9f9f",
                fontSize: 15,
                lineHeight: "27px",
                fontWeight: 600,
              }}
            >
              {fact.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

export default function WeekndMagazine() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        overflow: "hidden",
        bgcolor: "#050505",
        color: "#ffffff",
      }}
    >
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 760, md: 860 },
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src={MAGAZINE_IMAGES.HERO}
          alt="Blinding Lights eMagazine cover"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            opacity: 0.78,
            filter: "saturate(1.18) contrast(1.08)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,5,5,0.05) 0%, rgba(32,0,0,0.25) 35%, #050505 100%)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            right: -120,
            top: 70,
            width: 420,
            height: 420,
            borderRadius: "50%",
            bgcolor: "rgba(255,0,0,0.17)",
            filter: "blur(36px)",
          }}
        />

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            pt: { xs: 14, md: 18 },
            pb: { xs: 8, md: 12 },
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
                color: "#ffffff",
                bgcolor: "#ff2020",
                fontWeight: 950,
                letterSpacing: "0.16em",
                boxShadow: "0 0 28px rgba(255,0,0,0.3)",
              }}
            />

            <Chip
              label="#BLINDING_LIGHTS"
              sx={{
                color: "#ff4545",
                bgcolor: "rgba(0,0,0,0.68)",
                border: "1px solid rgba(255,65,65,0.38)",
                fontWeight: 900,
              }}
            />

            <Chip
              label="#NEON_NOIR"
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
              maxWidth: 1030,
              color: "#ffffff",
              fontSize: { xs: 46, sm: 68, md: 94 },
              lineHeight: { xs: "54px", sm: "76px", md: "99px" },
              fontWeight: 950,
              letterSpacing: "-0.07em",
              textShadow: "0 18px 75px rgba(0,0,0,0.88)",
            }}
          >
            Blinding Lights: The Red-Neon Fever Dream That Made Pop Feel Like
            Midnight
          </Typography>

          <Typography
            sx={{
              mt: 3,
              maxWidth: 790,
              color: "#d0d0d0",
              fontSize: { xs: 18, md: 23 },
              lineHeight: { xs: "30px", md: "38px" },
              fontWeight: 600,
            }}
          >
            A cinematic eMagazine feature about speed, obsession, neon
            loneliness, and the visual language of one unforgettable night.
          </Typography>

          <Typography
            sx={{
              mt: 4,
              color: "#858585",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            By Minh • 11 min read • 2026
          </Typography>
        </Container>
      </Box>

      <TextBlock eyebrow="Opening">
        <p>
          <strong>Blinding Lights</strong> begins like a memory already moving
          too fast. A bruised smile, an empty road, a red city, and a man who
          looks thrilled by the very thing that is destroying him.
        </p>

        <p>
          The video turns Las Vegas into a psychological landscape. The lights
          promise pleasure, but they also expose exhaustion. The streets look
          open, yet every frame feels trapped inside the same desperate loop.
        </p>

        <p>
          This is not simply a retro-pop visual. It is a portrait of a character
          who keeps running because <span>motion feels safer than silence</span>
          .
        </p>
      </TextBlock>

      <Container maxWidth="lg" sx={{ my: { xs: 7, md: 12 } }}>
        <YouTubeBlock
          videoUrl={MAGAZINE_VIDEOS.OFFICIAL}
          hashtag="#BLINDING_LIGHTS"
          sx={{ height: { xs: 320, sm: 470, md: 660 } }}
        />

        <Typography
          sx={{
            mt: 1.5,
            color: "#777777",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          #BLINDING_LIGHTS — a night drive staged as romance, panic, and
          performance.
        </Typography>
      </Container>

      <TextBlock eyebrow="Chapter 01" title="The city as a pressure chamber">
        <p>
          In most pop videos, the city is a symbol of possibility. Here, it
          becomes a machine. Casino lights, tunnels, empty highways, and
          mirrored surfaces keep pushing the character forward.
        </p>

        <p>
          The production design is luxurious, but never peaceful. Every glow
          feels overheated. Every red reflection suggests danger. The result is
          a world that looks glamorous from a distance and emotionally toxic up
          close.
        </p>
      </TextBlock>

      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.25fr 0.75fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "stretch",
          }}
        >
          <MagazineImage
            id="NIGHT_DRIVE"
            imagePosition="center"
            sx={{ minHeight: { xs: 500, md: 760 } }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateRows: "auto 1fr",
              gap: { xs: 3, md: 4 },
            }}
          >
            <Box
              sx={{
                p: { xs: 4, md: 4.5 },
                borderRadius: "28px",
                background:
                  "linear-gradient(180deg, rgba(76,0,0,0.92), rgba(18,18,18,0.98))",
                border: "1px solid rgba(255,55,55,0.22)",
                boxShadow: "0 20px 80px rgba(0,0,0,0.42)",
              }}
            >
              <Typography
                sx={{
                  color: "#ff4b4b",
                  fontSize: 13,
                  fontWeight: 950,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                #NIGHT_DRIVE
              </Typography>

              <Typography
                sx={{
                  mt: 2,
                  color: "#ffffff",
                  fontSize: { xs: 31, md: 40 },
                  lineHeight: { xs: "41px", md: "51px" },
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                }}
              >
                Speed becomes a form of denial
              </Typography>

              <Typography
                sx={{
                  mt: 2.5,
                  color: "#bdbdbd",
                  fontSize: 17,
                  lineHeight: "31px",
                  fontWeight: 500,
                }}
              >
                The car does not represent escape. It represents the illusion of
                escape. The faster he moves, the more the night closes around
                him.
              </Typography>
            </Box>

            <MagazineImage
              id="AFTER_HOURS"
              hashtagPosition="right"
              imagePosition="center top"
              sx={{ minHeight: { xs: 420, md: 500 } }}
            />
          </Box>
        </Box>
      </Container>

      <NeonFactStrip />
      <QuoteBlock />

      <TextBlock eyebrow="Chapter 02" title="A smile that looks like damage">
        <p>
          The most memorable image is not the car or the skyline. It is the
          smile. Bloodied, exaggerated, almost euphoric, it turns pain into part
          of the performance.
        </p>

        <p>
          That expression makes the video unsettling. The character does not
          appear unaware of his collapse. He seems to enjoy the spectacle of it.
          The night hurts him, but it also gives him an identity.
        </p>

        <p>
          In that sense, the video is about the contradiction at the center of
          fame: the desire to be seen, even when being seen is consuming you.
        </p>
      </TextBlock>

      <Box sx={{ my: { xs: 8, md: 13 } }}>
        <Box
          sx={{
            position: "relative",
            height: { xs: 560, md: 780 },
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={MAGAZINE_IMAGES.SIN_CITY}
            alt="#SIN_CITY"
            sx={{
              ...imageSx,
              objectPosition: "center",
              opacity: 0.84,
              filter: "saturate(1.18) contrast(1.08)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, #050505 0%, rgba(5,5,5,0.12) 46%, #050505 100%)",
            }}
          />

          <Container
            maxWidth="lg"
            sx={{
              position: "absolute",
              inset: 0,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "flex-end",
              pb: { xs: 5, md: 8 },
            }}
          >
            <Box
              sx={{
                maxWidth: 720,
                p: { xs: 3.5, md: 5 },
                borderRadius: "28px",
                bgcolor: "rgba(5,5,5,0.72)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Typography
                sx={{
                  color: "#ff4545",
                  fontSize: 13,
                  fontWeight: 950,
                  letterSpacing: "0.18em",
                }}
              >
                #SIN_CITY
              </Typography>

              <Typography
                sx={{
                  mt: 2,
                  color: "#ffffff",
                  fontSize: { xs: 32, md: 48 },
                  lineHeight: { xs: "42px", md: "59px" },
                  fontWeight: 950,
                  letterSpacing: "-0.05em",
                }}
              >
                A city that glows like a warning
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      <TextBlock eyebrow="Chapter 03" title="Retro without becoming costume">
        <p>
          The synth-driven sound and neon imagery clearly look backward, but the
          video never feels like a simple recreation of the 1980s. Its retro
          language is filtered through modern anxiety.
        </p>

        <p>
          The result is stylish without becoming nostalgic comfort. The glowing
          signs, sharp suit, fast car, and cinematic night all belong to a world
          where beauty is unstable.
        </p>

        <p>
          That is why the visual identity works so well. It borrows the romance
          of the past, then fills it with the loneliness of the present.
        </p>
      </TextBlock>

      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <Box sx={{ position: "relative", minHeight: { xs: 1120, md: 860 } }}>
          <MagazineImage
            id="VEGAS_GLOW"
            imagePosition="center"
            sx={{
              position: { xs: "relative", md: "absolute" },
              left: { md: 0 },
              top: { md: 0 },
              width: { xs: "100%", md: "62%" },
              height: { xs: 520, md: 700 },
            }}
          />

          <MagazineImage
            id="BLOOD_AND_GLASS"
            imagePosition="center top"
            hashtagPosition="right"
            sx={{
              position: { xs: "relative", md: "absolute" },
              right: { md: 0 },
              bottom: { md: 0 },
              mt: { xs: 3, md: 0 },
              width: { xs: "100%", md: "46%" },
              height: { xs: 520, md: 610 },
              border: "1px solid rgba(255,55,55,0.28)",
            }}
          />
        </Box>

        <Typography
          sx={{
            mt: 2,
            color: "#777777",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          #VEGAS_GLOW and #BLOOD_AND_GLASS — glamour and damage sharing the same
          frame.
        </Typography>
      </Container>

      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <MagazineImage
          id="FINAL_FRAME"
          imagePosition="center"
          sx={{ height: { xs: 500, md: 720 } }}
        />
      </Container>

      <TextBlock eyebrow="Closing" title="The night keeps moving">
        <p>
          <strong>Blinding Lights</strong> works because it never explains
          everything. It gives us fragments: speed, blood, laughter, neon,
          impact, and a face caught between pleasure and collapse.
        </p>

        <p>
          The video ends, but the character still feels trapped inside the same
          red loop. He has crossed the city, survived the night, and learned
          nothing that might make him stop.
        </p>

        <p>
          That is the real power of the visual:{" "}
          <span>the lights are beautiful because they are blinding</span>.
        </p>
      </TextBlock>

      <Container maxWidth="md" sx={{ pb: { xs: 8, md: 12 } }}>
        <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.1)" }} />

        <Stack spacing={1.2}>
          <Typography
            sx={{
              color: "#7c7c7c",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Credits
          </Typography>

          <Typography sx={{ color: "#ffffff", fontSize: 22, fontWeight: 950 }}>
            Minh • Design • Frontend • Editorial
          </Typography>

          <Typography
            sx={{
              color: "#777777",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: "24px",
            }}
          >
            Tags: #BLINDING_LIGHTS, #AFTER_HOURS, #NEON_NOIR, #NIGHT_DRIVE,
            #SIN_CITY, #VEGAS_GLOW, #BLOOD_AND_GLASS.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
