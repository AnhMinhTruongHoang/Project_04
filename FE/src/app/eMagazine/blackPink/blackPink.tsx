"use client";

import * as React from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BlackpinkTrackSlider from "@/app/blog/components/BlackpinkTrackSlider";

const MAGAZINE_IMAGES = {
  HERO: "/images/media/blackpink-main.jpg",
  DEBUT: "/images/media/blackpink-main.jpg",
  FOUR: "/images/media/blackpink-main.jpg",
  STAGE: "/images/media/blackpink-main.jpg",
  JENNIE: "/images/media/blackpink-main.jpg",
  JISOO: "/images/media/blackpink-main.jpg",
  ROSE: "/images/media/blackpink-main.jpg",
  LISA: "/images/media/blackpink-main.jpg",
  FILM_LEFT: "/images/media/blackpink-main.jpg",
  FILM_CENTER: "/images/media/blackpink-main.jpg",
  FILM_RIGHT: "/images/media/blackpink-main.jpg",
  CLOSING: "/images/media/blackpink-main.jpg",
};

const MAGAZINE_VIDEOS = {
  MAIN: "https://www.youtube.com/watch?v=2S24-y0Ij3Y",
};

type ImageKey = Exclude<keyof typeof MAGAZINE_IMAGES, "HERO">;

const HASHTAGS: Record<ImageKey, string> = {
  DEBUT: "#IN_YOUR_AREA",
  FOUR: "#FOUR_AS_ONE",
  STAGE: "#BORN_TO_PERFORM",
  JENNIE: "#JENNIE",
  JISOO: "#JISOO",
  ROSE: "#ROSÉ",
  LISA: "#LISA",
  FILM_LEFT: "#BEHIND_THE_LIGHTS",
  FILM_CENTER: "#BLACKPINK",
  FILM_RIGHT: "#FOREVER_YOUNG",
  CLOSING: "#PINK_CROWN",
};

const MEMBER_COPY = [
  {
    id: "JENNIE" as const,
    name: "JENNIE",
    role: "The controlled spark",
    copy: "Jennie brings tension into every frame: elegance against impact, calm against command. Her presence often feels editorial before it becomes explosive.",
  },
  {
    id: "JISOO" as const,
    name: "JISOO",
    role: "The visual anchor",
    copy: "Jisoo gives the group a sense of balance. Her image carries classic poise, but the restraint makes every dramatic moment land with more force.",
  },
  {
    id: "ROSE" as const,
    name: "ROSÉ",
    role: "The emotional frequency",
    copy: "Rosé turns contrast into identity. Delicate styling, sharp silhouettes, and a voice built around vulnerability make her scenes feel intimate and cinematic.",
  },
  {
    id: "LISA" as const,
    name: "LISA",
    role: "The kinetic edge",
    copy: "Lisa is motion made visible. Her rhythm, posture, and graphic styling give BLACKPINK a global street energy that reads instantly in any frame.",
  },
];

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return "";

  let videoId = "";

  if (url.includes("youtube.com/embed/")) {
    videoId = url.split("youtube.com/embed/")[1]?.split("?")[0];
  } else if (url.includes("youtube-nocookie.com/embed/")) {
    videoId = url.split("youtube-nocookie.com/embed/")[1]?.split("?")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0];
  }

  if (!videoId) return url;

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`;
};
const imageSx = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
};

function Hashtag({
  text,
  align = "left",
}: {
  text: string;
  align?: "left" | "right";
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        left: align === "left" ? 16 : "auto",
        right: align === "right" ? 16 : "auto",
        bottom: 16,
        px: 1.45,
        py: 0.65,
        borderRadius: "8px",
        color: "#111111",
        bgcolor: "#ff7eb6",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "0 10px 35px rgba(255,72,148,0.28)",
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: "0.1em",
        lineHeight: 1,
      }}
    >
      {text}
    </Box>
  );
}

function MagazineImage({
  id,
  sx,
  objectPosition = "center",
  rotate = 0,
  clipPath = "none",
  hashtagAlign = "left",
}: {
  id: ImageKey;
  sx?: any;
  objectPosition?: string;
  rotate?: number;
  clipPath?: string;
  hashtagAlign?: "left" | "right";
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "#151515",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 28px 90px rgba(0,0,0,0.52)",
        transform: `rotate(${rotate}deg)`,
        clipPath,
        ...sx,
      }}
    >
      <Box
        component="img"
        src={MAGAZINE_IMAGES[id]}
        alt={HASHTAGS[id]}
        sx={{
          ...imageSx,
          objectPosition,
          filter: "saturate(0.9) contrast(1.08)",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 48%, rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
        }}
      />

      <Hashtag text={HASHTAGS[id]} align={hashtagAlign} />
    </Box>
  );
}

function YouTubeBlock({ videoUrl, sx }: { videoUrl: string; sx?: any }) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "#111111",
        border: "1px solid rgba(255,126,182,0.25)",
        boxShadow: "0 30px 100px rgba(0,0,0,0.62)",
        ...sx,
      }}
    >
      <Box
        component="iframe"
        src={getYouTubeEmbedUrl(videoUrl)}
        title="BLACKPINK official music video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        sx={{
          width: "100%",
          height: "100%",
          display: "block",
          border: 0,
        }}
      />

      <Hashtag text="#KILL_THIS_LOVE" />
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
            color: "#ff7eb6",
            fontSize: 12,
            fontWeight: 950,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
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
            fontSize: { xs: 34, md: 50 },
            lineHeight: { xs: "43px", md: "60px" },
            fontWeight: 950,
            letterSpacing: "-0.045em",
          }}
        >
          {title}
        </Typography>
      )}

      <Box
        sx={{
          color: "#dedede",
          fontSize: { xs: 17, md: 19 },
          lineHeight: { xs: "31px", md: "36px" },
          fontWeight: 500,
          "& p": { mb: 3 },
          "& strong": { color: "#ffffff", fontWeight: 900 },
          "& span": { color: "#ff7eb6", fontWeight: 900 },
        }}
      >
        {children}
      </Box>
    </Container>
  );
}

function TornLabel({
  top,
  bottom,
  align = "left",
}: {
  top: string;
  bottom: string;
  align?: "left" | "center";
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 0.4,
      }}
    >
      <Typography
        sx={{
          px: 1.3,
          py: 0.4,
          color: "#111111",
          bgcolor: "#ff7eb6",
          fontSize: { xs: 16, md: 20 },
          fontWeight: 950,
          letterSpacing: "0.03em",
          transform: "rotate(-1.5deg)",
          clipPath: "polygon(1% 4%, 100% 0, 99% 91%, 2% 100%, 0 38%)",
        }}
      >
        {top}
      </Typography>

      <Typography
        sx={{
          px: 1.4,
          py: 0.45,
          color: "#ffffff",
          bgcolor: "#151515",
          border: "1px solid rgba(255,255,255,0.16)",
          fontSize: { xs: 18, md: 24 },
          fontWeight: 950,
          letterSpacing: "0.02em",
          transform: "rotate(1deg)",
          clipPath: "polygon(0 6%, 98% 0, 100% 88%, 4% 100%, 1% 55%)",
        }}
      >
        {bottom}
      </Typography>
    </Box>
  );
}

function QuoteStrip() {
  return (
    <Box
      sx={{
        my: { xs: 8, md: 12 },
        py: { xs: 6, md: 8 },
        bgcolor: "#171717",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          sx={{
            maxWidth: 1060,
            color: "#ffffff",
            fontSize: { xs: 30, md: 52 },
            lineHeight: { xs: "42px", md: "63px" },
            fontWeight: 950,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
          }}
        >
          Four different energies. One visual language.
          <Box component="span" sx={{ color: "#ff7eb6" }}>
            {" "}
            BLACKPINK becomes complete only when contrast becomes harmony.
          </Box>
        </Typography>

        <Box
          sx={{
            mt: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.85,
            borderRadius: "8px",
            border: "2px solid #ff7eb6",
            color: "#ff7eb6",
            fontSize: 11,
            fontWeight: 950,
            letterSpacing: "0.12em",
          }}
        >
          “ &nbsp; BLACKPINK &nbsp; | &nbsp; FOUR AS ONE
        </Box>
      </Container>
    </Box>
  );
}

function MemberGrid() {
  return (
    <Container maxWidth="lg" sx={{ my: { xs: 8, md: 13 } }}>
      <Box sx={{ mb: 5, textAlign: "center" }}>
        <TornLabel
          top="FOUR FACES"
          bottom="ONE UNMISTAKABLE SILHOUETTE"
          align="center"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
          gap: 2.5,
        }}
      >
        {MEMBER_COPY.map((member, index) => (
          <Box
            key={member.name}
            sx={{
              overflow: "hidden",
              bgcolor: "#151515",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 22px 70px rgba(0,0,0,0.4)",
              transform: {
                lg: index % 2 === 0 ? "translateY(0)" : "translateY(34px)",
              },
            }}
          >
            <Box sx={{ position: "relative", height: 410 }}>
              <Box
                component="img"
                src={MAGAZINE_IMAGES[member.id]}
                alt={member.name}
                sx={{
                  ...imageSx,
                  objectPosition: "center top",
                  filter: "grayscale(0.25) contrast(1.08)",
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)",
                }}
              />

              <Hashtag text={HASHTAGS[member.id]} />
            </Box>

            <Box sx={{ p: 2.5 }}>
              <Typography
                sx={{
                  color: "#ff7eb6",
                  fontSize: 11,
                  fontWeight: 950,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {member.role}
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: "#ffffff",
                  fontSize: 28,
                  fontWeight: 950,
                  letterSpacing: "-0.035em",
                }}
              >
                {member.name}
              </Typography>

              <Typography
                sx={{
                  mt: 1.4,
                  color: "#ababab",
                  fontSize: 14,
                  lineHeight: "25px",
                  fontWeight: 600,
                }}
              >
                {member.copy}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

function FilmStrip() {
  const images = [
    { id: "FILM_LEFT" as const, rotate: -4 },
    { id: "FILM_CENTER" as const, rotate: 1.5 },
    { id: "FILM_RIGHT" as const, rotate: 4 },
  ];

  return (
    <Container maxWidth="lg" sx={{ my: { xs: 8, md: 13 } }}>
      <Box
        sx={{
          position: "relative",
          p: { xs: 2, md: 4 },
          bgcolor: "#111111",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 48px, rgba(255,255,255,0.22) 48px 58px)",
            pointerEvents: "none",
          }}
        />

        <Box
          sx={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 3, md: 1 },
            alignItems: "center",
          }}
        >
          {images.map((image) => (
            <MagazineImage
              key={image.id}
              id={image.id}
              rotate={image.rotate}
              sx={{
                height: { xs: 410, md: 470 },
                border: "10px solid #090909",
              }}
            />
          ))}
        </Box>

        <Typography
          sx={{
            position: "relative",
            mt: 4,
            color: "#ffffff",
            fontSize: { xs: 23, md: 32 },
            lineHeight: { xs: "33px", md: "43px" },
            fontWeight: 950,
            textAlign: "center",
            letterSpacing: "-0.03em",
          }}
        >
          The strongest frame is not a solo portrait. It is the moment the four
          figures return to the same image.
        </Typography>
      </Box>
    </Container>
  );
}

export default function BlackpinkMagazine() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        overflow: "hidden",
        bgcolor: "#101010",
        color: "#ffffff",
      }}
    >
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 780, md: 920 },
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          bgcolor: "#111111",
        }}
      >
        <Box
          component="img"
          src={MAGAZINE_IMAGES.HERO}
          alt="BLACKPINK eMagazine cover"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            opacity: 0.68,
            filter: "grayscale(0.25) contrast(1.13)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(17,17,17,0.1) 0%, rgba(17,17,17,0.18) 35%, #101010 100%)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.23,
            backgroundImage:
              "radial-gradient(circle at 25% 28%, #ff7eb6 0 1px, transparent 1px)",
            backgroundSize: "5px 5px",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        <Typography
          sx={{
            position: "absolute",
            top: { xs: 120, md: 95 },
            left: { xs: -12, md: 30 },
            color: "rgba(255,126,182,0.16)",
            fontSize: { xs: 110, md: 230 },
            lineHeight: 0.8,
            fontWeight: 950,
            letterSpacing: "-0.1em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          BLACK
        </Typography>

        <Typography
          sx={{
            position: "absolute",
            top: { xs: 230, md: 250 },
            right: { xs: -18, md: 25 },
            color: "rgba(255,255,255,0.12)",
            fontSize: { xs: 118, md: 245 },
            lineHeight: 0.8,
            fontWeight: 950,
            letterSpacing: "-0.1em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          PINK
        </Typography>

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            pt: { xs: 15, md: 18 },
            pb: { xs: 8, md: 11 },
          }}
        >
          <Stack
            direction="row"
            spacing={1.2}
            sx={{ mb: 3, flexWrap: "wrap", rowGap: 1 }}
          >
            <Chip
              label="EMAGAZINE"
              sx={{
                color: "#111111",
                bgcolor: "#ff7eb6",
                fontWeight: 950,
                letterSpacing: "0.16em",
              }}
            />

            <Chip
              label="#IN_YOUR_AREA"
              sx={{
                color: "#ff7eb6",
                bgcolor: "rgba(10,10,10,0.78)",
                border: "1px solid rgba(255,126,182,0.45)",
                fontWeight: 900,
              }}
            />

            <Chip
              label="#FOUR_AS_ONE"
              sx={{
                color: "#ffffff",
                bgcolor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
                fontWeight: 900,
              }}
            />
          </Stack>

          <Typography
            component="h1"
            sx={{
              maxWidth: 1030,
              color: "#ffffff",
              fontSize: { xs: 45, sm: 68, md: 94 },
              lineHeight: { xs: "53px", sm: "76px", md: "99px" },
              fontWeight: 950,
              letterSpacing: "-0.07em",
              textShadow: "0 20px 80px rgba(0,0,0,0.9)",
            }}
          >
            BLACKPINK: Four Voices, One Visual Language, and a Crown Built From
            Contrast
          </Typography>

          <Typography
            sx={{
              mt: 3,
              maxWidth: 780,
              color: "#d0d0d0",
              fontSize: { xs: 18, md: 23 },
              lineHeight: { xs: "30px", md: "38px" },
              fontWeight: 600,
            }}
          >
            A black-and-pink editorial about identity, image, performance, and
            the power of four distinct figures moving as one.
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
            By Minh • 13 min read • 2026
          </Typography>
        </Container>
      </Box>

      <TextBlock eyebrow="Opening">
        <p>
          BLACKPINK has always lived inside a contradiction. The name is soft
          and severe at once. The music can be luxurious, aggressive, playful,
          and emotionally exposed inside the same era.
        </p>

        <p>
          That tension is not a branding trick added after the songs. It is the
          engine of the entire image. Black gives the group weight, edge, and
          confidence. Pink gives it glamour, wit, and a sense of controlled
          spectacle.
        </p>

        <p>
          The result is a visual system that can be recognized before a chorus
          begins:{" "}
          <span>four silhouettes, one color code, no neutral frame</span>.
        </p>
      </TextBlock>

      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 960, md: 750 },
          }}
        >
          <MagazineImage
            id="DEBUT"
            rotate={-3}
            clipPath="polygon(2% 1%, 98% 0, 100% 92%, 94% 100%, 4% 97%, 0 15%)"
            sx={{
              position: { xs: "relative", md: "absolute" },
              left: { md: 0 },
              top: { md: 20 },
              width: { xs: "100%", md: "58%" },
              height: { xs: 520, md: 650 },
            }}
          />

          <MagazineImage
            id="FOUR"
            rotate={3}
            hashtagAlign="right"
            clipPath="polygon(3% 0, 100% 5%, 97% 100%, 0 94%)"
            sx={{
              position: { xs: "relative", md: "absolute" },
              right: { md: 0 },
              bottom: { md: 0 },
              mt: { xs: 3, md: 0 },
              width: { xs: "100%", md: "49%" },
              height: { xs: 420, md: 530 },
              border: "8px solid #101010",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              left: { xs: 12, md: "48%" },
              top: { xs: 20, md: 0 },
              zIndex: 3,
            }}
          >
            <TornLabel top="BLACK" bottom="PINK" />
          </Box>
        </Box>
      </Container>

      <TextBlock eyebrow="Chapter 01" title="The architecture of contrast">
        <p>
          BLACKPINK does not ask its four members to disappear into one uniform
          image. The group works because each member remains visually readable.
          Their differences create rhythm.
        </p>

        <p>
          A close-up can feel elegant. The next frame can become graphic,
          oversized, and confrontational. A romantic color can sit beside hard
          typography. The visual language keeps changing while the identity
          remains intact.
        </p>
      </TextBlock>

      <QuoteStrip />

      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <YouTubeBlock
          videoUrl={MAGAZINE_VIDEOS.MAIN}
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
          #KILL_THIS_LOVE — monumental scale, military rhythm, and a visual
          world built to turn impact into identity.
        </Typography>
      </Container>

      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <BlackpinkTrackSlider />
      </Container>

      <TextBlock
        eyebrow="Chapter 02"
        title="Performance becomes graphic design"
      >
        <p>
          On stage, the group image is built through lines, spacing, symmetry,
          and disruption. A formation is not only choreography. It is a moving
          composition.
        </p>

        <p>
          Black costumes create a sharp silhouette. Pink lighting softens the
          frame without weakening it. Metallic surfaces, giant screens, and
          controlled negative space allow the members to remain the center of
          the image.
        </p>
      </TextBlock>

      <Box sx={{ my: { xs: 8, md: 13 } }}>
        <Box
          sx={{
            position: "relative",
            height: { xs: 580, md: 820 },
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={MAGAZINE_IMAGES.STAGE}
            alt="#BORN_TO_PERFORM"
            sx={{
              ...imageSx,
              objectPosition: "center",
              opacity: 0.88,
              filter: "contrast(1.08) saturate(1.05)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(16,16,16,0.08) 0%, rgba(16,16,16,0.1) 50%, #101010 100%)",
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
                maxWidth: 780,
                p: { xs: 3.5, md: 5 },
                bgcolor: "rgba(16,16,16,0.78)",
                border: "1px solid rgba(255,126,182,0.22)",
                backdropFilter: "blur(14px)",
              }}
            >
              <Typography
                sx={{
                  color: "#ff7eb6",
                  fontSize: 12,
                  fontWeight: 950,
                  letterSpacing: "0.18em",
                }}
              >
                #BORN_TO_PERFORM
              </Typography>

              <Typography
                sx={{
                  mt: 2,
                  color: "#ffffff",
                  fontSize: { xs: 34, md: 52 },
                  lineHeight: { xs: "44px", md: "62px" },
                  fontWeight: 950,
                  letterSpacing: "-0.05em",
                }}
              >
                The stage turns four personalities into one enormous shape
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      <MemberGrid />

      <TextBlock
        eyebrow="Chapter 03"
        title="Fame is polished, but the bond must remain visible"
      >
        <p>
          The strongest group images are rarely the most perfect. They are the
          frames where the performance drops for a moment and friendship becomes
          visible.
        </p>

        <p>
          Behind the sharp styling and controlled campaigns, audiences still
          look for something human: laughter between takes, shared exhaustion,
          an arm around a shoulder, four people returning to the same center.
        </p>

        <p>
          That emotional layer prevents the image from becoming only luxury. It
          gives the spectacle a reason to matter.
        </p>
      </TextBlock>

      <FilmStrip />

      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 560, md: 760 },
            overflow: "hidden",
            bgcolor: "#151515",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box
            component="img"
            src={MAGAZINE_IMAGES.CLOSING}
            alt="#PINK_CROWN"
            sx={{
              ...imageSx,
              objectPosition: "center",
              opacity: 0.7,
              filter: "grayscale(0.3) contrast(1.12)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(16,16,16,0.95) 0%, rgba(16,16,16,0.24) 58%, rgba(16,16,16,0.72) 100%)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              left: { xs: 24, md: 60 },
              bottom: { xs: 32, md: 58 },
              maxWidth: 670,
            }}
          >
            <TornLabel top="THE CROWN" bottom="IS BUILT TOGETHER" />

            <Typography
              sx={{
                mt: 3,
                color: "#ffffff",
                fontSize: { xs: 30, md: 48 },
                lineHeight: { xs: "40px", md: "58px" },
                fontWeight: 950,
                letterSpacing: "-0.05em",
              }}
            >
              BLACKPINK is strongest when every difference remains visible.
            </Typography>
          </Box>

          <Hashtag text="#PINK_CROWN" align="right" />
        </Box>
      </Container>

      <TextBlock
        eyebrow="Closing"
        title="Black and pink were never opposite colors"
      >
        <p>
          The group’s visual identity succeeds because it does not choose
          between strength and glamour. It treats both as necessary.
        </p>

        <p>
          Black creates the frame. Pink breaks it open. Four individual
          personalities move through that contrast and give it a human shape.
        </p>

        <p>
          That is why the name still feels complete:
          <span>
            {" "}
            BLACKPINK is not a color palette. It is a system of balance
          </span>
          .
        </p>
      </TextBlock>

      <Container maxWidth="md" sx={{ pb: { xs: 8, md: 12 } }}>
        <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.1)" }} />

        <Stack spacing={1.2}>
          <Typography
            sx={{
              color: "#777777",
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
            Tags: #BLACKPINK, #IN_YOUR_AREA, #FOUR_AS_ONE, #JENNIE, #JISOO,
            #ROSÉ, #LISA, #BORN_TO_PERFORM, #PINK_CROWN.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
