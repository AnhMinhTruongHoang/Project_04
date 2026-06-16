"use client";
import "react-h5-audio-player/lib/styles.css";
import { useTrackContext } from "@/lib/track.wrapper";
import { useHasMounted } from "@/utils/customHook";
import { Box, Container, IconButton, Slider, Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import Replay10RoundedIcon from "@mui/icons-material/Replay10Rounded";
import Forward10RoundedIcon from "@mui/icons-material/Forward10Rounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";

const formatTime = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const secondsRemainder = Math.round(seconds) % 60;
  const paddedSeconds = `0${secondsRemainder}`.slice(-2);

  return `${minutes}:${paddedSeconds}`;
};

const AppFooter = () => {
  const hasMounted = useHasMounted();
  const pathname = usePathname();
  const playerRef = useRef<any>(null);
  const previousTrackUrlRef = useRef("");
  const previousVolumeRef = useRef(0.5);
  const [volume, setVolume] = useState(0.5);
  const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;
  const footerTrack = currentTrack as any;
  const isTrackDetailPage = pathname?.startsWith("/track/");
  const currentTime = Number(footerTrack?.currentTime || 0);
  const duration = Number(footerTrack?.duration || 0);
  const isWaveControlled =
    isTrackDetailPage &&
    (footerTrack?.source === "wave" ||
      footerTrack?.source === "footer-control");

  const getTrackImage = () => {
    const imgUrl = currentTrack?.imgUrl;

    if (!imgUrl) return "/audio/SC.png";
    if (imgUrl.startsWith("http")) return imgUrl;
    if (imgUrl.startsWith("/")) return imgUrl;

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/${imgUrl}`;
  };

  const handleChangeVolume = (value: number) => {
    const nextVolume = Math.max(0, Math.min(1, value));

    if (nextVolume > 0) {
      previousVolumeRef.current = nextVolume;
    }

    setVolume(nextVolume);

    setCurrentTrack({
      ...currentTrack,
      volume: nextVolume,
      source: "footer-control",
    } as any);
  };

  const handleSeekBy = (seconds: number) => {
    if (!duration) return;

    const nextTime = Math.min(Math.max(currentTime + seconds, 0), duration);

    setCurrentTrack({
      ...currentTrack,
      currentTime: nextTime,
      seekTime: nextTime,
      seekId: Date.now(),
      source: "footer-control",
    } as any);
  };

  const handleToggleMute = () => {
    const nextVolume = volume > 0 ? 0 : previousVolumeRef.current || 0.5;

    setVolume(nextVolume);

    setCurrentTrack({
      ...currentTrack,
      volume: nextVolume,
      source: "footer-control",
    } as any);
  };

  useEffect(() => {
    const audio = playerRef.current?.audio?.current;
    if (!audio) return;

    // Khi đang ở track detail, WaveSurfer là audio chính.
    // Footer chỉ làm control, không phát audio riêng để tránh dual audio.
    if (isWaveControlled) {
      audio.pause();
      return;
    }

    // Chỉ reset về 0 khi đổi bài, không reset mỗi lần play/pause.
    if (previousTrackUrlRef.current !== currentTrack?.trackUrl) {
      audio.currentTime = 0;
      previousTrackUrlRef.current = currentTrack?.trackUrl || "";
    }

    if (currentTrack?.isPlaying === false) {
      audio.pause();
      return;
    }

    if (currentTrack?.isPlaying === true) {
      audio.play();
    }
  }, [
    currentTrack?._id,
    currentTrack?.trackUrl,
    currentTrack?.isPlaying,
    isWaveControlled,
  ]);

  if (!hasMounted) return <></>;

  if (!currentTrack?._id) return <></>;

  return (
    <div style={{ marginTop: 50 }}>
      <AppBar
        position="fixed"
        sx={{
          top: "auto",
          bottom: 0,
          background: "#181A1B",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -6px 20px rgba(0,0,0,0.35)",
        }}
      >
        <Container
          disableGutters
          sx={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            backgroundColor: "#181A1B",
            color: "#ffffff",

            ".rhap_container": {
              backgroundColor: "#181A1B",
              boxShadow: "unset",
              color: "#ffffff",
            },

            ".rhap_main": {
              gap: "20px",
            },

            ".rhap_time": {
              color: "#cfcfcf",
              fontSize: "12px",
              fontWeight: 700,
            },

            ".rhap_current-time": {
              color: "#ff5500",
            },

            ".rhap_main-controls-button": {
              color: "#ffffff",
            },

            ".rhap_play-pause-button": {
              color: "#ffffff",
            },

            ".rhap_volume-button": {
              color: "#ffffff",
            },

            ".rhap_progress-bar": {
              backgroundColor: "#3a3a3a",
            },

            ".rhap_progress-filled": {
              backgroundColor: "#ff5500",
            },

            ".rhap_progress-indicator": {
              backgroundColor: "#ff5500",
            },

            ".rhap_download-progress": {
              backgroundColor: "#555",
            },

            ".rhap_volume-bar": {
              backgroundColor: "#3a3a3a",
            },

            ".rhap_volume-indicator": {
              backgroundColor: "#ffffff",
            },
          }}
        >
          {isWaveControlled ? (
            <Box
              sx={{
                flex: 1,
                height: 64,
                display: "flex",
                alignItems: "center",
                gap: 1.1,
                px: 2,
                backgroundColor: "#181A1B",
                color: "#ffffff",
                minWidth: 0,
              }}
            >
              {/* Shuffle */}
              <IconButton
                disabled
                sx={{
                  width: 34,
                  height: 34,
                  p: 0,
                  color: "#8f8f8f !important",
                  opacity: "1 !important",

                  "& .MuiSvgIcon-root": {
                    fontSize: 27,
                  },
                }}
              >
                <ShuffleRoundedIcon />
              </IconButton>

              {/* Previous */}
              <IconButton
                onClick={() => handleSeekBy(-10)}
                sx={{
                  width: 34,
                  height: 34,
                  p: 0,
                  color: "#ffffff",

                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },

                  "& .MuiSvgIcon-root": {
                    fontSize: 28,
                  },
                }}
              >
                <Replay10RoundedIcon />
              </IconButton>

              {/* Play / Pause */}
              <IconButton
                onClick={() => {
                  setCurrentTrack({
                    ...currentTrack,
                    isPlaying: !currentTrack.isPlaying,
                    source: "footer-control",
                  } as any);
                }}
                sx={{
                  width: 42,
                  height: 42,
                  p: 0,
                  borderRadius: "50%",
                  color: "#181A1B",
                  backgroundColor: "#ffffff",
                  border: "none",
                  flexShrink: 0,

                  "&:hover": {
                    backgroundColor: "#f1f1f1",
                  },

                  "& .MuiSvgIcon-root": {
                    fontSize: 32,
                  },
                }}
              >
                {currentTrack.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>

              {/* Next */}
              <IconButton
                onClick={() => handleSeekBy(10)}
                sx={{
                  width: 34,
                  height: 34,
                  p: 0,
                  color: "#ffffff",

                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },

                  "& .MuiSvgIcon-root": {
                    fontSize: 28,
                  },
                }}
              >
                <Forward10RoundedIcon />
              </IconButton>

              {/* Volume */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.8,
                  width: 95,
                  flexShrink: 0,
                }}
              >
                <IconButton
                  onClick={handleToggleMute}
                  sx={{
                    width: 28,
                    height: 28,
                    p: 0,
                    color: "#ffffff",

                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },

                    "& .MuiSvgIcon-root": {
                      fontSize: 24,
                    },
                  }}
                >
                  {volume > 0 ? (
                    <VolumeUpRoundedIcon />
                  ) : (
                    <VolumeOffRoundedIcon />
                  )}
                </IconButton>

                <Slider
                  value={volume * 100}
                  min={0}
                  max={100}
                  onChange={(_, value) => {
                    handleChangeVolume(Number(value) / 100);
                  }}
                  sx={{
                    width: 58,
                    color: "#ffffff",
                    p: 0,

                    "& .MuiSlider-rail": {
                      height: 4,
                      opacity: 1,
                      backgroundColor: "#4a4a4a",
                    },

                    "& .MuiSlider-track": {
                      height: 4,
                      backgroundColor: "#ffffff",
                      border: "none",
                    },

                    "& .MuiSlider-thumb": {
                      width: 13,
                      height: 13,
                      backgroundColor: "#ffffff",
                      boxShadow: "none",

                      "&:hover, &.Mui-focusVisible": {
                        boxShadow: "0 0 0 6px rgba(255,255,255,0.12)",
                      },

                      "&:before": {
                        boxShadow: "none",
                      },
                    },
                  }}
                />
              </Box>

              {/* Current time */}
              <Typography
                sx={{
                  color: "#ff5500",
                  fontSize: "12px",
                  fontWeight: 800,
                  minWidth: 38,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {formatTime(currentTime)}
              </Typography>

              {/* Progress */}
              <Slider
                value={duration ? currentTime : 0}
                min={0}
                max={duration || 1}
                onChangeCommitted={(_, value) => {
                  setCurrentTrack({
                    ...currentTrack,
                    seekTime: Number(value),
                    source: "footer-control",
                  } as any);
                }}
                sx={{
                  flex: 1,
                  minWidth: 180,
                  color: "#ff5500",
                  p: 0,

                  "& .MuiSlider-rail": {
                    height: 4,
                    opacity: 1,
                    backgroundColor: "#4a4a4a",
                  },

                  "& .MuiSlider-track": {
                    height: 4,
                    backgroundColor: "#ff5500",
                    border: "none",
                  },

                  "& .MuiSlider-thumb": {
                    width: 16,
                    height: 16,
                    backgroundColor: "#ff5500",
                    boxShadow: "none",

                    "&:hover, &.Mui-focusVisible": {
                      boxShadow: "0 0 0 6px rgba(255,85,0,0.16)",
                    },

                    "&:before": {
                      boxShadow: "none",
                    },
                  },
                }}
              />

              {/* Duration */}
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  minWidth: 42,
                  flexShrink: 0,
                }}
              >
                {formatTime(duration)}
              </Typography>
            </Box>
          ) : (
            <AudioPlayer
              ref={playerRef}
              layout="horizontal-reverse"
              src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/tracks/${currentTrack.trackUrl}`}
              volume={0.5}
              style={{
                boxShadow: "unset",
                background: "#181A1B",
              }}
              onPlay={() => {
                setCurrentTrack({
                  ...currentTrack,
                  isPlaying: true,
                  source: "footer",
                } as any);
              }}
              onPause={() => {
                setCurrentTrack({
                  ...currentTrack,
                  isPlaying: false,
                  source: "footer",
                } as any);
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              width: "280px",
              minWidth: "280px",
              paddingRight: "10px",
            }}
          >
            <img
              src={getTrackImage()}
              alt={currentTrack.title}
              onError={(e) => {
                e.currentTarget.src = "/audio/SC.png";
              }}
              style={{
                width: "38px",
                height: "38px",
                objectFit: "cover",
                borderRadius: "3px",
                backgroundColor: "#111",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "start",
                justifyContent: "center",
                width: "220px",
                overflow: "hidden",
              }}
            >
              <div
                title={currentTrack.description}
                style={{
                  width: "100%",
                  color: "#a8a8a8",
                  fontSize: "12px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentTrack.description}
              </div>

              <div
                title={currentTrack.title}
                style={{
                  width: "100%",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentTrack.title}
              </div>
            </div>
          </div>
        </Container>
      </AppBar>
    </div>
  );
};

export default AppFooter;
