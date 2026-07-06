"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import {
  getPlaylistCover,
  getPlaylistTitle,
  getPlaylistTracks,
} from "@/utils/actions/libraryHelpers";

type Props = {
  playlist: any;
};

const PlaylistCard = ({ playlist }: Props) => {
  const title = getPlaylistTitle(playlist);
  const image = getPlaylistCover(playlist);
  const tracks = getPlaylistTracks(playlist);

  return (
    <Box
      sx={{
        minWidth: 0,
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          aspectRatio: "1 / 1",
          borderRadius: "3px",
          overflow: "hidden",
          position: "relative",
          background:
            "linear-gradient(135deg, rgba(255,85,0,0.18), rgba(0,255,224,0.12))",
          border: "1px solid rgba(255,255,255,0.05)",
          mb: 1,
        }}
      >
        {image ? (
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
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              background: "#2D2D2D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <QueueMusicRoundedIcon sx={{ fontSize: 42 }} />
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55))",
          }}
        />
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
        {tracks.length} tracks
      </Typography>
    </Box>
  );
};

export default PlaylistCard;
