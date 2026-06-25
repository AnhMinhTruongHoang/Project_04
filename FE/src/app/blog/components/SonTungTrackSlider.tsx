"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { useTrackContext } from "@/lib/track.wrapper";

const SON_TUNG_TITLES = [
  "HAY TRAO CHO ANH",
  "COME MY WAY",
  "Nơi Này Có Anh Sơn",
  "MUỘN RỒI MÀ SAO CÒN",
  "Lạc Trôi Sơn",
];

const getArtistName = (track: any) => {
  return (
    track?.artistName ||
    track?.artist ||
    track?.author ||
    track?.description ||
    track?.uploader?.name ||
    "Sơn Tùng M-TP"
  );
};

const getTrackId = (track?: any) => {
  return track?._id || track?.id || track?.trackId || "";
};

const normalizeTrackForFooter = (track: any) => {
  const trackId = getTrackId(track);

  if (!trackId) return null;

  return {
    ...track,

    // AppFooter cần _id để hiện
    _id: track._id || trackId,
    id: track.id || trackId,

    // AppFooter cần trackUrl để phát audio
    trackUrl: track.trackUrl || track.audioUrl || track.audio || track.fileName,

    // AppFooter cần imgUrl để hiện ảnh
    imgUrl: track.imgUrl || track.image || track.thumbnail,

    isPlaying: true,
    source: "sontung-slider",
    currentTime: 0,
    duration: 0,
    seekTime: undefined,
    seekId: Date.now(),
  };
};

export default function SonTungTrackSlider() {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [tracks, setTracks] = React.useState<ITrackTop[]>([]);
  const { setCurrentTrack } = useTrackContext() as ITrackContext;

  React.useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top?category=pop`,
          { cache: "no-store" }
        );

        const json = await res.json();

        const data = Array.isArray(json?.data)
          ? json.data
          : json?.data?.result || [];

        const sonTungTracks = data.filter((track: ITrackTop) =>
          SON_TUNG_TITLES.some(
            (title) => title.toLowerCase() === track.title?.toLowerCase()
          )
        );

        setTracks(sonTungTracks);
      } catch (error) {
        console.error("Fetch Son Tung tracks failed:", error);
      }
    };

    fetchTracks();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  };

  const handlePlayTrack = (track: ITrackTop) => {
    const nextTrack = normalizeTrackForFooter(track);

    console.log("PLAY FROM SON TUNG SLIDER:", nextTrack);

    if (!nextTrack) return;

    setCurrentTrack(nextTrack as any);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Chip
            label="#SOUND_SELECTION"
            sx={{
              color: "#00ffe0",
              bgcolor: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(0,255,224,0.35)",
              fontWeight: 900,
              mb: 1.5,
            }}
          />

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: { xs: 30, md: 52 },
              lineHeight: { xs: "40px", md: "62px" },
              fontWeight: 950,
              letterSpacing: "-0.06em",
              maxWidth: 760,
              textShadow: "0 18px 70px rgba(0,0,0,0.75)",
            }}
          >
            The tracks that shaped his pop universe
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          <IconButton
            onClick={() => scroll("left")}
            sx={{
              color: "#ffffff",
              bgcolor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              "&:hover": {
                bgcolor: "rgba(0,255,224,0.14)",
                color: "#00ffe0",
              },
            }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>

          <IconButton
            onClick={() => scroll("right")}
            sx={{
              color: "#ffffff",
              bgcolor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              "&:hover": {
                bgcolor: "rgba(0,255,224,0.14)",
                color: "#00ffe0",
              },
            }}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        ref={scrollRef}
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          pb: 1,
          pr: { xs: 2, md: 8 },
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {tracks.map((track, index) => (
          <Box
            key={getTrackId(track) || track.title}
            onClick={() => handlePlayTrack(track)}
            sx={{
              minWidth: { xs: 260, sm: 310, md: 340 },
              maxWidth: { xs: 260, sm: 310, md: 340 },
              scrollSnapAlign: "start",
              borderRadius: "24px",
              overflow: "hidden",
              bgcolor: "rgba(15,18,24,0.82)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              backdropFilter: "blur(14px)",
              transition: "0.25s ease",
              "&:hover": {
                transform: "translateY(-6px)",
                borderColor: "rgba(0,255,224,0.45)",
              },
            }}
          >
            <Box sx={{ position: "relative", height: 190, overflow: "hidden" }}>
              <Box
                component="img"
                src={track.imgUrl || "/images/media/sontungP.jpg"}
                alt={track.title}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  opacity: 0.86,
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.72))",
                }}
              />
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();
                  handlePlayTrack(track);
                }}
                sx={{
                  position: "absolute",
                  right: 14,
                  bottom: 14,
                  width: 44,
                  height: 44,
                  bgcolor: "#00ffe0",
                  color: "#020617",
                  "&:hover": {
                    bgcolor: "#32fff0",
                  },
                }}
              >
                <PlayArrowRoundedIcon />
              </IconButton>

              <Typography
                sx={{
                  position: "absolute",
                  left: 14,
                  bottom: 18,
                  color: "#00ffe0",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                }}
              >
                #{track.category?.toUpperCase() || "POP"}
              </Typography>
            </Box>

            <Box sx={{ p: 2.2 }}>
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 20,
                  fontWeight: 900,
                  lineHeight: "26px",
                  mb: 0.8,
                }}
              >
                {String(index + 1).padStart(2, "0")}. {track.title}
              </Typography>

              <Typography
                sx={{
                  color: "#a7b0c0",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {getArtistName(track)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
