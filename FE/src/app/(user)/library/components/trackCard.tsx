"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { useTrackContext } from "@/lib/track.wrapper";
import {
  getSafeTrackId,
  getTrackArtist,
  getTrackImage,
  getTrackTitle,
} from "@/utils/actions/libraryHelpers";

type Props = {
  track: any;
};

const TrackCard = ({ track }: Props) => {
  const { setCurrentTrack } = useTrackContext() as ITrackContext;

  const trackId = getSafeTrackId(track);
  const title = getTrackTitle(track);
  const artist = getTrackArtist(track);
  const image = getTrackImage(track);

  const handlePlay = () => {
    if (!trackId) return;

    setCurrentTrack({
      ...track,
      _id: track?._id || trackId,
      id: track?.id || trackId,
      isPlaying: true,
      source: "footer",
      currentTime: 0,
      duration: 0,
      seekTime: undefined,
      seekId: undefined,
    } as any);
  };

  return (
    <Box
      onClick={handlePlay}
      sx={{
        minWidth: 0,
        cursor: "pointer",
        group: "card",
        "&:hover .play-button": {
          opacity: 1,
          transform: "translateY(0)",
        },
      }}
    >
      <Box
        sx={{
          aspectRatio: "1 / 1",
          borderRadius: "3px",
          overflow: "hidden",
          position: "relative",
          background: "#2D2D2D",
          border: "1px solid rgba(255,255,255,0.05)",
          mb: 1,
        }}
      >
        <Box
          component="img"
          src={image}
          alt={title}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.src = "/audio/SC.png";
          }}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <Box
          className="play-button"
          sx={{
            position: "absolute",
            right: 8,
            bottom: 8,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#FF5500",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transform: "translateY(8px)",
            transition: "0.2s ease",
            boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
          }}
        >
          <PlayArrowRoundedIcon sx={{ fontSize: 24 }} />
        </Box>
      </Box>

      <Typography
        noWrap
        sx={{
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 950,
          lineHeight: 1.25,
        }}
      >
        {title}
      </Typography>

      <Typography
        noWrap
        sx={{
          color: "#8B949E",
          fontSize: 11,
          fontWeight: 750,
          lineHeight: 1.35,
        }}
      >
        {artist}
      </Typography>
    </Box>
  );
};

export default TrackCard;
