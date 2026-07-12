"use client";

import { useTrackContext } from "@/lib/track.wrapper";
import { convertSlugUrl } from "@/utils/api";
import { Box, Typography } from "@mui/material";
import Link from "next/link";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import IconButton from "@mui/material/IconButton";

interface IProps {
  track: IShareTrack;
}
const CurrentTrack = (props: IProps) => {
  const { track } = props;

  const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

  const trackId = track._id || track.id || "";

  const currentTrackId = currentTrack?._id || currentTrack?.id || "";

  const isCurrentTrack = Boolean(trackId) && trackId === currentTrackId;

  const isPlaying = isCurrentTrack && currentTrack?.isPlaying === true;

  return (
    <Box
      sx={{ display: "flex", width: "100%", justifyContent: "space-between" }}
    >
      <Typography sx={{ py: 2 }}>
        <Link
          style={{ textDecoration: "none", color: "unset" }}
          href={`/track/${convertSlugUrl(
            track.title
          )}-${trackId}.html?audio=${encodeURIComponent(track.trackUrl || "")}`}
        >
          {track.title}
        </Link>
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        {!isPlaying && (
          <IconButton
            aria-label="play"
            onClick={() => {
              setCurrentTrack({
                ...track,
                _id: trackId,
                id: trackId,
                isPlaying: true,
                source: "footer",
                currentTime: 0,
                duration: 0,
                seekTime: undefined,
                seekId: undefined,
              } as any);
            }}
          >
            <PlayArrowIcon
              sx={{
                height: 25,
                width: 25,
                color: "white",
              }}
            />
          </IconButton>
        )}

        {isPlaying && (
          <IconButton
            aria-label="pause"
            onClick={() => {
              setCurrentTrack({
                ...currentTrack,
                isPlaying: false,
                source: "footer",
              } as any);
            }}
          >
            <PauseIcon
              sx={{
                height: 25,
                width: 25,
                color: "white",
              }}
            />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default CurrentTrack;
