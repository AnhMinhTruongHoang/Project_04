"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { useTrackContext } from "@/lib/track.wrapper";

const getTrackId = (track?: any) => {
  return track?._id || track?.id || track?.trackId || "";
};

const getArtistName = (track: any) => {
  return (
    track?.artistName ||
    track?.artist ||
    track?.author ||
    track?.description ||
    track?.uploader?.name ||
    "NoCopyrightSounds"
  );
};

const normalizeTrackForFooter = (track: any) => {
  const trackId = getTrackId(track);

  if (!trackId) return null;

  return {
    ...track,
    _id: track._id || trackId,
    id: track.id || trackId,
    trackUrl: track.trackUrl || track.audioUrl || track.audio || track.fileName,
    imgUrl: track.imgUrl || track.image || track.thumbnail,
    isPlaying: true,
    source: "ncs-slider",
    currentTime: 0,
    duration: 0,
    seekTime: undefined,
    seekId: Date.now(),
  };
};

export default function NcsTrackSlider() {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [tracks, setTracks] = React.useState<ITrackTop[]>([]);
  const { setCurrentTrack } = useTrackContext() as ITrackContext;

  React.useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top?category=ncs`,
          { cache: "no-store" }
        );

        const json = await res.json();

        const data = Array.isArray(json?.data)
          ? json.data
          : json?.data?.result || [];

        setTracks(data.slice(0, 10));
      } catch (error) {
        console.error("Fetch NCS tracks failed:", error);
      }
    };

    fetchTracks();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  const handlePlayTrack = (track: ITrackTop) => {
    const nextTrack = normalizeTrackForFooter(track);

    if (!nextTrack) return;

    setCurrentTrack(nextTrack as any);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{ mb: 3 }}
      >
        <Box>
          <Chip
            icon={<GraphicEqRoundedIcon sx={{ color: "#020617 !important" }} />}
            label="#NCS_PLAYLIST"
            sx={{
              color: "#020617",
              bgcolor: "#00ffe0",
              fontWeight: 950,
              letterSpacing: "0.12em",
              mb: 1.5,
              px: 0.6,
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
              border: "5 red",
            }}
          >
            High-energy tracks for a no-copyright sound universe
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              color: "#a7b0c0",
              fontSize: { xs: 15, md: 17 },
              lineHeight: "28px",
              fontWeight: 600,
              maxWidth: 680,
            }}
          >
            A compact NCS playlist section built from your database tracks.
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
            <ArrowBackIosNewRoundedIcon fontSize="small" />
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
            <ArrowForwardIosRoundedIcon fontSize="small" />
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
              minWidth: { xs: 300, sm: 380, md: 430 },
              maxWidth: { xs: 300, sm: 380, md: 430 },
              scrollSnapAlign: "start",
              display: "grid",
              gridTemplateColumns: "116px 1fr",
              gap: 1.6,
              p: 1.3,
              borderRadius: "22px",
              cursor: "pointer",
              bgcolor: "rgba(8,12,22,0.84)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              backdropFilter: "blur(14px)",
              transition: "0.25s ease",
              "&:hover": {
                transform: "translateY(-5px)",
                borderColor: "rgba(0,255,224,0.45)",
                bgcolor: "rgba(10,18,30,0.92)",
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: 116,
                height: 116,
                borderRadius: "18px",
                overflow: "hidden",
                bgcolor: "#111318",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Box
                component="img"
                src={track.imgUrl || "/images/media/ncs002.jpg"}
                alt={track.title}
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
                    "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.55))",
                }}
              />

              <IconButton
                onClick={(event) => {
                  event.stopPropagation();
                  handlePlayTrack(track);
                }}
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 44,
                  height: 44,
                  bgcolor: "#00ffe0",
                  color: "#020617",
                  boxShadow: "0 12px 35px rgba(0,255,224,0.35)",
                  "&:hover": {
                    bgcolor: "#32fff0",
                  },
                }}
              >
                <PlayArrowRoundedIcon />
              </IconButton>
            </Box>

            <Stack
              justifyContent="space-between"
              sx={{
                minWidth: 0,
                py: 0.4,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#00ffe0",
                    fontSize: 12,
                    fontWeight: 950,
                    letterSpacing: "0.12em",
                    mb: 0.8,
                  }}
                >
                  #{track.category?.toUpperCase() || "NCS"} • TRACK{" "}
                  {String(index + 1).padStart(2, "0")}
                </Typography>

                <Typography
                  sx={{
                    color: "#ffffff",
                    fontSize: { xs: 18, md: 21 },
                    fontWeight: 950,
                    lineHeight: "27px",
                    letterSpacing: "-0.03em",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {track.title}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.8,
                    color: "#a7b0c0",
                    fontSize: 14,
                    fontWeight: 700,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {getArtistName(track)}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 1.4 }}>
                <Chip
                  size="small"
                  label="FREE"
                  sx={{
                    height: 24,
                    color: "#ffffff",
                    bgcolor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                />

                <Chip
                  size="small"
                  label="NO COPYRIGHT"
                  sx={{
                    height: 24,
                    color: "#00ffe0",
                    bgcolor: "rgba(0,255,224,0.08)",
                    border: "1px solid rgba(0,255,224,0.22)",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                />
              </Stack>
            </Stack>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
