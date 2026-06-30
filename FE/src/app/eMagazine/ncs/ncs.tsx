import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import NcsTrackSlider from "@/app/blog/components/NcsTrackSlider";

const DEFAULT_IMG = "/images/user/NCS.jpg";

const IMG = {
  HERO: DEFAULT_IMG,
  IMG_01: "/images/media/ncs001.jpg",
  IMG_02: "/images/media/ncs002.jpg",
  IMG_03: "/images/media/ncs003.jpg",
  IMG_05_LEFT: "/images/media/ncs004.jpg",
  IMG_05_RIGHT: "/images/media/ncs005.jpg",
};

const IMG_TAGS = {
  HERO: "#NCS_UNIVERSE",
  IMG_01: "#CIRCLE_COLORS",
  IMG_02: "#NCS_PLAYLIST",
  IMG_03: "#FOUNDER_VISION",
  IMG_05_LEFT: "#DIRTY_PALM",
  IMG_05_RIGHT: "#UNKNOWN_BRAIN",
};

type ImgKey = keyof typeof IMG;

function ImageBlock({
  image,
  tag,
  caption,
  wide = false,
  height = 520,
}: {
  image: ImgKey;
  tag: string;
  caption?: string;
  wide?: boolean;
  height?: number | { xs: number; md: number };
}) {
  return (
    <Box
      sx={{
        width: "100%",
        my: { xs: 5, md: 7 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height,
          overflow: "hidden",
          bgcolor: "#111",
        }}
      >
        <Box
          component="img"
          src={IMG[image]}
          alt={tag}
          sx={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            left: { xs: 12, md: 18 },
            bottom: { xs: 12, md: 18 },
            px: 1.3,
            py: 0.6,
            bgcolor: "rgba(0,0,0,0.72)",
            color: "#00ffe0",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            border: "1px solid rgba(0,255,224,0.35)",
          }}
        >
          {tag}
        </Box>
      </Box>

      {caption && (
        <Typography
          sx={{
            mt: 1.2,
            color: "#777",
            fontSize: 13,
            fontStyle: "italic",
            textAlign: wide ? "center" : "left",
          }}
        >
          {caption}
        </Typography>
      )}
    </Box>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        color: "#1f2933",
        fontSize: { xs: 18, md: 20 },
        lineHeight: { xs: "34px", md: "38px" },
        fontWeight: 500,
        mb: 3,
        textAlign: "justify",
      }}
    >
      {children}
    </Typography>
  );
}

function DropCapParagraph({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        color: "#1f2933",
        fontSize: { xs: 19, md: 22 },
        lineHeight: { xs: "36px", md: "42px" },
        fontWeight: 500,
        mb: 3,
        textAlign: "justify",

        "&::first-letter": {
          float: "left",
          fontSize: { xs: 72, md: 96 },
          lineHeight: "72px",
          fontWeight: 900,
          color: "#111",
          pr: 1.2,
        },
      }}
    >
      {children}
    </Typography>
  );
}

function ArticleContainer({ children }: { children: React.ReactNode }) {
  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: 860,
        mx: "auto",
        px: { xs: 2.2, md: 0 },
      }}
    >
      {children}
    </Container>
  );
}

export default function NcsMagazine() {
  return (
    <Box
      sx={{
        bgcolor: "#f5f1e8",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight: { xs: 680, md: 820 },
          overflow: "hidden",
          bgcolor: "#050505",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <Box
          component="img"
          src={IMG.HERO}
          alt="NCS Hero"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.92,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.88) 100%)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            left: { xs: 16, md: 28 },
            top: { xs: 88, md: 110 },
            px: 1.4,
            py: 0.7,
            bgcolor: "rgba(0,0,0,0.72)",
            color: "#00ffe0",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.1em",
            border: "1px solid rgba(0,255,224,0.35)",
          }}
        >
          {IMG_TAGS.HERO}
        </Box>

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            pb: { xs: 8, md: 12 },
          }}
        >
          <Typography
            sx={{
              color: "#00ffe0",
              fontSize: { xs: 13, md: 15 },
              fontWeight: 900,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              mb: 2,
            }}
          >
            eMagazine
          </Typography>

          <Typography
            component="h1"
            sx={{
              maxWidth: 980,
              color: "#ffffff",
              fontSize: { xs: 46, sm: 68, md: 92 },
              lineHeight: { xs: "54px", sm: "76px", md: "98px" },
              fontWeight: 950,
              letterSpacing: "-0.075em",
              textShadow: "0 24px 80px rgba(0,0,0,0.85)",
            }}
          >
            NCS: The Colored Circles That Powered a Generation of Creators
          </Typography>

          <Typography
            sx={{
              mt: 3,
              maxWidth: 760,
              color: "#d1d5db",
              fontSize: { xs: 18, md: 23 },
              lineHeight: { xs: "30px", md: "38px" },
              fontWeight: 600,
            }}
          >
            From copyright-free music to creator culture, NoCopyrightSounds
            turned electronic tracks into a visual language recognized by
            millions of video makers.
          </Typography>

          <Stack
            direction="row"
            spacing={1.4}
            sx={{
              mt: 4,
              flexWrap: "wrap",
              rowGap: 1,
            }}
          >
            {["Music", "NCS", "Electronic", "Creator Culture"].map((item) => (
              <Box
                key={item}
                sx={{
                  px: 1.6,
                  py: 0.7,
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.24)",
                  bgcolor: "rgba(0,0,0,0.35)",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {item}
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>
      {/* META */}
      <ArticleContainer>
        <Box
          sx={{
            py: { xs: 4, md: 5 },
            borderBottom: "1px solid rgba(0,0,0,0.16)",
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              color: "#111",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Created by Minh
          </Typography>

          <Typography
            sx={{
              color: "#555",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            12 min read • 2026
          </Typography>
        </Box>
      </ArticleContainer>
      {/* INTRO */}
      <ArticleContainer>
        <Box sx={{ pt: { xs: 5, md: 8 } }}>
          <DropCapParagraph>
            NCS is more than a music channel. For many creators, it was the
            soundtrack of their first gaming montage, their first cinematic
            edit, their first YouTube intro, and their first feeling that music
            could be used freely without destroying a project through copyright
            problems.
          </DropCapParagraph>

          <Paragraph>
            Its identity is simple but powerful: electronic music, bold visual
            circles, high-energy drops, and a promise that creators can build
            with sound. That promise helped NCS become a bridge between artists,
            listeners, streamers, editors, and independent video makers.
          </Paragraph>
        </Box>
      </ArticleContainer>
      {/* IMAGE 01 */}
      <ArticleContainer>
        <ImageBlock
          image="IMG_01"
          tag={IMG_TAGS.IMG_01}
          height={{ xs: 320, md: 540 }}
          caption="#CIRCLE_COLORS — the visual language of NCS: simple circles, strong colors, and instant recognition."
        />
      </ArticleContainer>
      {/* BODY 01 */}
      <ArticleContainer>
        <Paragraph>
          The colored circle became one of NCS’s strongest design choices. It is
          not complicated, but that is exactly why it works. A track can be
          remembered by sound, but the circle makes it easier to recognize
          visually before the first beat even starts.
        </Paragraph>

        <Paragraph>
          In a crowded platform like YouTube, that kind of design matters. NCS
          did not need a complex cover for every song. It needed a repeatable
          system: color, motion, rhythm, and a center point that felt like a
          portal into the track.
        </Paragraph>

        <Paragraph>
          For creators, NCS became a practical library. For listeners, it became
          a discovery engine. For artists, it became a stage where electronic
          music could travel through gaming videos, edits, livestreams, short
          films, and online culture.
        </Paragraph>
      </ArticleContainer>
      {/* PLAYLIST SECTION */}
      <Box sx={{ my: { xs: 5, md: 8 } }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: { xs: 520, md: 760 },
            overflow: "hidden",
            bgcolor: "#080808",
          }}
        >
          <Box
            component="img"
            src={IMG.IMG_02}
            alt={IMG_TAGS.IMG_02}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.2) 52%, rgba(0,0,0,0.78) 100%)",
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
            <NcsTrackSlider />
          </Container>
        </Box>
      </Box>
      {/* BODY 02 */}
      <ArticleContainer>
        <Paragraph>
          NCS works because it understands a creator’s workflow. A video editor
          does not always need a famous song. Sometimes they need a clean intro,
          a strong build-up, a drop that matches a transition, and a track that
          will not block their upload.
        </Paragraph>

        <Paragraph>
          That is why the NCS sound often feels immediate. It has to support a
          visual moment quickly. It has to move fast, stay memorable, and leave
          enough space for footage, voice-over, montage, or gameplay.
        </Paragraph>
      </ArticleContainer>
      {/* IMAGE 03 */}
      <ArticleContainer>
        <ImageBlock
          image="IMG_03"
          tag={IMG_TAGS.IMG_03}
          height={{ xs: 340, md: 560 }}
          caption="#FOUNDER_VISION — from a copyright problem to a creator-first music ecosystem."
        />
      </ArticleContainer>{" "}
      <ArticleContainer>
        <Paragraph>
          The story of NCS begins with a problem many creators know too well:
          finding music that can be used online without running into copyright
          trouble. Billy Woodford started the idea in 2011 after dealing with
          that exact problem around YouTube gaming content.
        </Paragraph>

        <Paragraph>
          That origin explains the future of NCS. It was not built only as a
          label in the traditional sense. It was built as infrastructure for
          digital creators: a place where music could be discovered, credited,
          shared, downloaded, and reused inside the culture that YouTube helped
          create.
        </Paragraph>

        <Paragraph>
          Looking forward, the most interesting direction for NCS is not simply
          releasing more tracks. It is becoming a deeper bridge between artists
          and creators: better licensing clarity, stronger artist discovery,
          more visual identity, and music that can move across YouTube, TikTok,
          livestreaming, games, and short-form video.
        </Paragraph>
      </ArticleContainer>
      {/* QUOTE */}
      <ArticleContainer>
        <Box
          sx={{
            my: { xs: 5, md: 8 },
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 6 },
            bgcolor: "#111",
            color: "#fff",
            borderLeft: "8px solid #00ffe0",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: 28, md: 42 },
              lineHeight: { xs: "40px", md: "56px" },
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            “A good creator track does not just fill silence. It gives the edit
            direction, energy, timing, and identity.”
          </Typography>

          <Typography
            sx={{
              mt: 2,
              color: "#9ca3af",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            NCS Magazine Note
          </Typography>
        </Box>
      </ArticleContainer>
      {/* BODY 03 */}
      <ArticleContainer>
        <Paragraph>
          Inside the NCS world, artists can feel very different from one
          another. Some are known through names, faces, live presence, and
          producer identity. Others feel more mysterious, more symbol-driven, or
          more project-focused. That contrast is part of what makes the catalog
          flexible.
        </Paragraph>

        <Paragraph>
          In electronic music, identity can be loud or hidden. A producer can
          appear directly, perform openly, and build a personal image. Another
          project can keep the face secondary and let the name, logo, sound, and
          atmosphere do the storytelling.
        </Paragraph>
      </ArticleContainer>
      {/* DOUBLE IMAGE */}
      <ArticleContainer>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 2, md: 3 },
            my: { xs: 5, md: 7 },
          }}
        >
          <Box
            sx={{
              position: "relative",
              height: { xs: 420, md: 620 },
              overflow: "hidden",
              bgcolor: "#111",
            }}
          >
            <Box
              component="img"
              src={IMG.IMG_05_LEFT}
              alt={IMG_TAGS.IMG_05_LEFT}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                left: 14,
                bottom: 14,
                px: 1.2,
                py: 0.6,
                bgcolor: "rgba(0,0,0,0.72)",
                color: "#00ffe0",
                fontSize: 12,
                fontWeight: 900,
                border: "1px solid rgba(0,255,224,0.35)",
              }}
            >
              {IMG_TAGS.IMG_05_LEFT}
            </Box>
          </Box>

          <Box
            sx={{
              position: "relative",
              height: { xs: 420, md: 620 },
              overflow: "hidden",
              bgcolor: "#111",
            }}
          >
            <Box
              component="img"
              src={IMG.IMG_05_RIGHT}
              alt={IMG_TAGS.IMG_05_RIGHT}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                left: 14,
                bottom: 14,
                px: 1.2,
                py: 0.6,
                bgcolor: "rgba(0,0,0,0.72)",
                color: "#00ffe0",
                fontSize: 12,
                fontWeight: 900,
                border: "1px solid rgba(0,255,224,0.35)",
              }}
            >
              {IMG_TAGS.IMG_05_RIGHT}
            </Box>
          </Box>
        </Box>

        <Typography
          sx={{
            mt: -3,
            mb: 5,
            color: "#777",
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          #DIRTY_PALM and #UNKNOWN_BRAIN — two different ways electronic artists
          can build identity inside the same creator-driven ecosystem.
        </Typography>
      </ArticleContainer>
      {/* DIRTY PALM / UNKNOWN BRAIN */}
      <ArticleContainer>
        <Paragraph>
          <b style={{ color: "#F7A02A" }}> Dirty Palm</b> represents the more
          visible producer energy: sharp, club-ready, direct, and
          performance-friendly. His NCS profile is tied to Future House and
          Trap, a sound world that often feels aggressive, energetic, bouncy,
          and built for movement.
        </Paragraph>

        <Paragraph>
          That kind of identity is easier to read as an individual producer
          brand. The name can connect to a person, a DJ image, a live presence,
          and a clearer artist face. It fits the side of EDM where personality,
          crowd energy, and producer recognition matter.
        </Paragraph>

        <Paragraph>
          <b style={{ color: "#45D155" }}> Unknown Brain</b> works differently.
          The name itself feels like a concept: less about a visible face, more
          about a mysterious project identity. Tracks connected to the project
          often sit around electronic and bass moods, with dramatic melodies,
          vocal hooks, heavy drops, and cinematic tension.
        </Paragraph>

        <Paragraph>
          This is the difference between showing the artist and hiding behind
          the world of the sound. Dirty Palm can feel like a producer stepping
          into the light. Unknown Brain can feel like a symbol stepping out of
          the dark. Both approaches work, because NCS gives space for both: the
          face and the mask, the performer and the project.
        </Paragraph>
      </ArticleContainer>
      {/* FINAL */}
      <ArticleContainer>
        <Paragraph>
          NCS can be seen as a music library, but that description is too small.
          For many creators, it became a memory: the first intro, the first
          edit, the first montage, the first upload that felt complete because
          the music finally matched the picture.
        </Paragraph>

        <Paragraph>
          Its future depends on the same idea that started it: making music
          useful, visible, and open for digital creativity. As creator culture
          keeps changing, NCS still has a clear role — not only as a label, but
          as a soundtrack system for people building stories online.
        </Paragraph>
      </ArticleContainer>
      {/* CREDIT */}
      <ArticleContainer>
        <Box
          sx={{
            py: { xs: 5, md: 7 },
            borderTop: "1px solid rgba(0,0,0,0.18)",
            borderBottom: "1px solid rgba(0,0,0,0.18)",
          }}
        >
          <Typography
            sx={{
              color: "#111",
              fontSize: 16,
              fontWeight: 900,
              mb: 1,
            }}
          >
            Credits:
          </Typography>

          <Typography
            sx={{
              color: "#111",
              fontSize: { xs: 26, md: 34 },
              lineHeight: { xs: "36px", md: "44px" },
              fontWeight: 950,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            MINH — DESIGN — FRONTEND
          </Typography>
        </Box>
      </ArticleContainer>
      {/* COMMENT MOCK */}
      <ArticleContainer>
        <Box sx={{ py: { xs: 5, md: 7 } }}>
          <Typography
            sx={{
              color: "#111",
              fontSize: 24,
              fontWeight: 900,
              mb: 3,
            }}
          >
            Comments (0)
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder="Write a comment"
            sx={{
              bgcolor: "#fff",
              "& .MuiOutlinedInput-root": {
                borderRadius: 0,
                fontSize: 16,
              },
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#111",
                color: "#fff",
                borderRadius: 0,
                px: 4,
                fontWeight: 900,
                "&:hover": {
                  bgcolor: "#333",
                },
              }}
            >
              Send comment
            </Button>
          </Box>
        </Box>
      </ArticleContainer>
    </Box>
  );
}
