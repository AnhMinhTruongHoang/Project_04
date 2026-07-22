"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import { convertSlugUrl, getTrackId } from "@/utils/api";
import { getListeningHistory } from "@/utils/actions/history";
import { useTrackContext } from "@/lib/track.wrapper";
import { getTrackImageUrl } from "@/utils/actions/getImages";

const formatNumber = (value?: number) => {
  const number = Number(value || 0);

  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;

  return String(number);
};

const getArtistName = (track?: any) => {
  return (
    track?.artistName ||
    track?.artist ||
    track?.author ||
    track?.description ||
    track?.uploader?.name ||
    track?.uploader?.email ||
    "Unknown"
  );
};

const getAudioUrl = (trackUrl?: string | null) => {
  if (!trackUrl) return "";

  if (trackUrl.startsWith("http")) {
    return trackUrl;
  }

  if (trackUrl.startsWith("/")) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}${trackUrl}`;
  }

  return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/audio/${trackUrl}`;
};

const getTrackHref = (track: ITrackTop, autoplay = true) => {
  const trackId = getTrackId(track);

  const trackSlug =
    (track as any).slug || `${convertSlugUrl(track.title)}-${trackId}`;

  const href = `/track/${trackSlug}.html?audio=${encodeURIComponent(
    getAudioUrl(track.trackUrl)
  )}`;

  return autoplay ? `${href}&autoplay=1` : href;
};

const ListeningHistory = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [tracks, setTracks] = useState<ITrackTop[]>([]);
  const { setCurrentTrack } = useTrackContext() as ITrackContext;

  const isTrackDetailPage = pathname?.startsWith("/track/");

  useEffect(() => {
    setTracks(getListeningHistory());
  }, []);

  const latestTrack = tracks[0];

  const handlePlayHistoryTrack = (track: ITrackTop) => {
    const trackId = getTrackId(track);

    if (!trackId) return;

    if (isTrackDetailPage) {
      setCurrentTrack({
        ...track,
        _id: (track as any)._id || trackId,
        id: (track as any).id || trackId,
        isPlaying: false,
        source: "wave",
        currentTime: 0,
        duration: 0,
        seekTime: undefined,
        seekId: undefined,
      } as any);

      router.push(getTrackHref(track, true));
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
      seekId: undefined,
    } as any);
  };

  if (!latestTrack) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 900,
            color: "#d8d8d8",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          Listening History
        </Typography>

        <Typography sx={{ fontSize: 13, color: "#9a9a9a", fontWeight: 800 }}>
          No listening history yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 900,
            color: "#d8d8d8",
            textTransform: "uppercase",
          }}
        >
          Listening History
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            color: "#9a9a9a",
            cursor: "pointer",
            "&:hover": {
              color: "#ffffff",
            },
          }}
        >
          View all
        </Typography>
      </Box>

      <Box
        onClick={() => handlePlayHistoryTrack(latestTrack)}
        sx={{
          display: "flex",
          gap: 1.2,
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
          borderRadius: "4px",
          p: 0.4,
          mx: -0.4,
          transition: "0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.06)",
          },
        }}
      >
        <Box
          component="img"
          src={getTrackImageUrl(latestTrack.imgUrl ?? "")}
          alt={latestTrack.title}
          onError={(e) => {
            e.currentTarget.src = "https://res.cloudinary.com/eybmkz9z/image/upload/v1784726300/default_djtlyj.png";
          }}
          sx={{
            width: 44,
            height: 44,
            objectFit: "cover",
            borderRadius: "2px",
            bgcolor: "#111",
            flexShrink: 0,
          }}
        />

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            sx={{
              fontSize: 13,
              color: "#ffffff",
              fontWeight: 900,
              lineHeight: 1.3,
              mt: 0.2,
            }}
          >
            {latestTrack.title}
          </Typography>

          <Typography
            noWrap
            sx={{
              fontSize: 10,
              color: "#ffffff",
              fontWeight: 900,
              lineHeight: 1.3,
            }}
          >
            <i>{getArtistName(latestTrack)}</i>
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.9,
              mt: 0.7,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
              <PlayArrowRoundedIcon sx={{ fontSize: 14, color: "#9a9a9a" }} />
              <Typography sx={{ fontSize: 11, color: "#9a9a9a" }}>
                {formatNumber(latestTrack.countPlay)}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
              <FavoriteRoundedIcon sx={{ fontSize: 13, color: "#9a9a9a" }} />
              <Typography sx={{ fontSize: 11, color: "#9a9a9a" }}>
                {formatNumber(latestTrack.countLike)}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
              <RepeatRoundedIcon sx={{ fontSize: 13, color: "#9a9a9a" }} />
              <Typography sx={{ fontSize: 11, color: "#9a9a9a" }}>0</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
              <ChatBubbleRoundedIcon sx={{ fontSize: 12, color: "#9a9a9a" }} />
              <Typography sx={{ fontSize: 11, color: "#9a9a9a" }}>0</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ListeningHistory;

