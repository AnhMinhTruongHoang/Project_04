"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Search from "./blogSearch";
import { getTrackId } from "@/utils/api";
import { getListeningHistory } from "@/utils/actions/history";
import { useTrackContext } from "@/lib/track.wrapper";
import { LibraryMusicOutlined } from "@mui/icons-material";
import EmagazineCardGrid from "./EmagazineCardGrid";
import { Pagination } from "@mui/material";

const TEMP_AVATAR = "/images/logo/Sc.png";

type MusicCategory = "All" | "V-Pop" | "Synth-Pop" | "Electronic" | "K-Pop";

const MUSIC_CATEGORIES: MusicCategory[] = [
  "All",
  "V-Pop",
  "Synth-Pop",
  "Electronic",
  "K-Pop",
];

const cardData = [
  {
    img: "/images/media/blackpink01.jpg",
    objectFit: "fill",
    tag: "K-Pop",
    title: "BLACKPINK: Four Voices, One Visual Language",
    description:
      "An editorial journey through BLACKPINK’s distinct identities, iconic performances, global influence, and powerful black-and-pink universe.",
    href: "/eMagazine/blackpink",
    authors: [
      {
        name: "Minh",
        avatar: TEMP_AVATAR,
      },
      {
        name: "SoundClone",
        avatar: TEMP_AVATAR,
      },
    ],
  },
  {
    img: "/images/media/weeknd01.jpg",
    tag: "Synth-Pop",
    title: "Blinding Lights: The Red-Neon Fever Dream That Defined a Pop Era",
    description:
      "An exploration of midnight speed, neon loneliness, retro synths, and the cinematic visual language behind The Weeknd’s iconic hit.",
    href: "/eMagazine/weeknd",
    authors: [
      {
        name: "Minh",
        avatar: TEMP_AVATAR,
      },
      {
        name: "SoundClone",
        avatar: TEMP_AVATAR,
      },
    ],
  },
  {
    img: "/images/media/sontungP.jpg",
    tag: "V-Pop",
    title: "Sơn Tùng M-TP: The Eastern Star Who Turned Pop Into a Visual Era",
    description:
      "A cinematic journey through Sơn Tùng M-TP’s music, visual identity, ambition, and influence on the modern Vietnamese pop landscape.",
    href: "/eMagazine/sontung",
    authors: [
      {
        name: "Minh",
        avatar: TEMP_AVATAR,
      },
      {
        name: "SoundClone",
        avatar: TEMP_AVATAR,
      },
    ],
  },

  {
    img: "/images/user/NCS.jpg",
    tag: "Electronic",
    title: "NCS: The Colored Circles That Powered a Generation of Creators",
    description:
      "The story of NoCopyrightSounds, electronic music culture, independent creators, and the visual identity that became recognizable worldwide.",
    href: "/eMagazine/ncs",
    authors: [
      {
        name: "Minh",
        avatar: TEMP_AVATAR,
      },
      {
        name: "SoundClone",
        avatar: TEMP_AVATAR,
      },
    ],
  },
];

export default function MainContent() {
  const [tracks, setTracks] = useState<ITrackTop[]>([]);

  const [activeCategory, setActiveCategory] = useState<MusicCategory>("All");

  const { setCurrentTrack } = useTrackContext() as ITrackContext;

  useEffect(() => {
    setTracks(getListeningHistory());
  }, []);

  const latestTrack = tracks[0];

  const filteredCards = React.useMemo(() => {
    if (activeCategory === "All") {
      return cardData;
    }

    return cardData.filter((card) => card.tag === activeCategory);
  }, [activeCategory]);

  const handlePlayHistoryTrack = (track: ITrackTop) => {
    const trackId = getTrackId(track);

    if (!trackId) {
      return;
    }

    setCurrentTrack({
      ...track,

      _id: (track as any)._id || trackId,

      id: (track as any).id || trackId,

      isPlaying: true,
      source: "footer",

      currentTime: 0,
      duration: 0,

      seekTime: undefined,
      seekId: Date.now(),
    } as any);
  };

  const chipSx = {
    color: "#a7a7a7",
    bgcolor: "transparent",

    border: "1px solid rgba(255,255,255,0.12)",

    fontWeight: 750,
    borderRadius: "999px",

    transition: "all 180ms ease",

    "&:hover": {
      color: "#00ffe0",

      bgcolor: "rgba(0,255,224,0.08)",

      borderColor: "rgba(0,255,224,0.45)",
    },
  };

  const activeChipSx = {
    ...chipSx,

    color: "#020617",
    bgcolor: "#00ffe0",
    borderColor: "#00ffe0",

    fontWeight: 900,

    "&:hover": {
      color: "#020617",
      bgcolor: "#32fff0",
      borderColor: "#32fff0",
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* PAGE HEADER */}
      <Box
        sx={{
          textAlign: "center",

          pt: {
            xs: 4,
            md: 6,
          },

          pb: {
            xs: 3,
            md: 4,
          },
        }}
      >
        <Typography
          variant="h1"
          gutterBottom
          sx={{
            fontWeight: 900,
            color: "#ffffff",
            fontSize: { xs: 40, md: 64 },
            letterSpacing: "-0.04em",
          }}
        >
          NEWS
        </Typography>
        <Typography
          sx={{
            maxWidth: 720,

            mx: "auto",
            mt: 1.5,

            color: "#8b949e",

            fontSize: {
              xs: 15,
              md: 18,
            },

            lineHeight: {
              xs: "25px",
              md: "29px",
            },

            fontWeight: 600,
          }}
        >
          Explore cinematic eMagazines about artists, iconic songs, music
          movements, and the visual cultures behind them.
        </Typography>
      </Box>

      {/* MOBILE SEARCH */}
      <Box
        sx={{
          display: {
            xs: "flex",
            sm: "none",
          },

          flexDirection: "row",
          alignItems: "center",

          gap: 1,

          width: "100%",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Search />
        </Box>

        <IconButton
          size="small"
          aria-label="Play latest history track"
          disabled={!latestTrack}
          onClick={() => {
            if (latestTrack) {
              handlePlayHistoryTrack(latestTrack);
            }
          }}
          sx={{
            width: 40,
            height: 40,

            flexShrink: 0,

            color: "#a7a7a7",
            bgcolor: "#111318",

            borderRadius: "10px",

            border: "1px solid rgba(255,255,255,0.12)",

            "&:hover": {
              color: "#00ffe0",

              bgcolor: "rgba(0,255,224,0.08)",

              borderColor: "rgba(0,255,224,0.45)",
            },

            "&.Mui-disabled": {
              color: "#555555",
              bgcolor: "#0d0f13",

              borderColor: "rgba(255,255,255,0.06)",
            },
          }}
        >
          <LibraryMusicOutlined />
        </IconButton>
      </Box>

      {/* FILTER + DESKTOP SEARCH */}
      <Box
        sx={{
          display: "flex",

          flexDirection: {
            xs: "column",
            md: "row",
          },

          alignItems: {
            xs: "stretch",
            md: "center",
          },

          justifyContent: "space-between",

          gap: 2,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",

            flex: 1,
            gap: 1.2,

            py: 0.5,

            overflowX: "auto",

            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {MUSIC_CATEGORIES.map((category) => {
            const isActive = category === activeCategory;

            return (
              <Chip
                key={category}
                size="medium"
                label={category === "All" ? "All stories" : category}
                onClick={() => setActiveCategory(category)}
                sx={isActive ? activeChipSx : chipSx}
              />
            );
          })}
        </Box>

        <Box
          sx={{
            display: {
              xs: "none",
              sm: "flex",
            },

            flexDirection: "row",
            alignItems: "center",

            gap: 1,
            flexShrink: 0,
          }}
        >
          <Search />

          <IconButton
            size="small"
            aria-label="Play latest history track"
            disabled={!latestTrack}
            onClick={() => {
              if (latestTrack) {
                handlePlayHistoryTrack(latestTrack);
              }
            }}
            sx={{
              width: 40,
              height: 40,

              color: "#a7a7a7",
              bgcolor: "#111318",

              borderRadius: "10px",

              border: "1px solid rgba(255,255,255,0.12)",

              "&:hover": {
                color: "#00ffe0",

                bgcolor: "rgba(0,255,224,0.08)",

                borderColor: "rgba(0,255,224,0.45)",
              },

              "&.Mui-disabled": {
                color: "#555555",
                bgcolor: "#0d0f13",

                borderColor: "rgba(255,255,255,0.06)",
              },
            }}
          >
            <LibraryMusicOutlined />
          </IconButton>
        </Box>
      </Box>

      {/* EMAGAZINE CARDS */}
      <EmagazineCardGrid cards={filteredCards} />

      {/* EMPTY FILTER */}
      {filteredCards.length === 0 && (
        <Box
          sx={{
            minHeight: 260,

            display: "flex",
            flexDirection: "column",

            alignItems: "center",
            justifyContent: "center",

            px: 3,

            textAlign: "center",

            bgcolor: "#111318",

            borderRadius: "20px",

            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <LibraryMusicOutlined
            sx={{
              mb: 1.5,
              color: "#00ffe0",
              fontSize: 42,
            }}
          />

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            No music stories found
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              color: "#858b95",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Select another music category to continue exploring.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          pt: 4,
        }}
      >
        <Pagination
          hidePrevButton
          hideNextButton
          count={10}
          boundaryCount={10}
          sx={{
            "& .MuiPaginationItem-root": {
              color: "#a7a7a7",
              borderColor: "rgba(255,255,255,0.12)",
              fontWeight: 800,
            },

            "& .MuiPaginationItem-root:hover": {
              bgcolor: "rgba(0,255,224,0.08)",
              color: "#00ffe0",
            },

            "& .Mui-selected": {
              bgcolor: "#00ffe0 !important",
              color: "#020617",
              fontWeight: 900,
            },

            "& .MuiPaginationItem-ellipsis": {
              color: "#8b949e",
            },
          }}
        />
      </Box>
    </Box>
  );
}
