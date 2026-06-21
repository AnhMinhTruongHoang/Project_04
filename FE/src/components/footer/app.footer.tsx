"use client";
import "react-h5-audio-player/lib/styles.css";
import { useTrackContext } from "@/lib/track.wrapper";
import { useHasMounted } from "@/utils/customHook";
import { Box, Container, IconButton, Slider, Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import Replay10RoundedIcon from "@mui/icons-material/Replay10Rounded";
import Forward10RoundedIcon from "@mui/icons-material/Forward10Rounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import FooterQueuePopover from "./footer.queue.popover";
import { useSession } from "next-auth/react";
import { convertSlugUrl, sendRequest } from "@/utils/api";

const formatTime = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const secondsRemainder = Math.round(seconds) % 60;
  const paddedSeconds = `0${secondsRemainder}`.slice(-2);

  return `${minutes}:${paddedSeconds}`;
};

const AppFooter = () => {
  const router = useRouter();
  const { data: session } = useSession();
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
  const [queueAnchorEl, setQueueAnchorEl] = useState<HTMLElement | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueTracks, setQueueTracks] = useState<ITrackTop[]>([]);
  const [autoplayStation, setAutoplayStation] = useState(true);
  const queueOpen = Boolean(queueAnchorEl);
  const footerCurrentTime = Number(footerTrack?.currentTime || 0);
  const footerDuration = Number(footerTrack?.duration || 0);

  const getTrackId = (track?: any) => {
    return track?._id || track?.id || "";
  };

  const getImageUrl = (imgUrl?: string) => {
    if (!imgUrl) return "/audio/SC.png";

    if (imgUrl.startsWith("http")) return imgUrl;
    if (imgUrl.startsWith("/")) return imgUrl;

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/images/${imgUrl}`;
  };

  const getAudioUrl = (trackUrl?: string) => {
    if (!trackUrl) return "";

    if (trackUrl.startsWith("http")) return trackUrl;
    if (trackUrl.startsWith("/")) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}${trackUrl}`;
    }

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/audio/${trackUrl}`;
  };

  /// footer playlist

  const isTrackTopObject = (track: unknown): track is ITrackTop => {
    if (typeof track !== "object" || track === null) return false;

    const item = track as any;

    return Boolean((item._id || item.id) && item.title && item.trackUrl);
  };

  const getTrackHref = (track: ITrackTop, autoplay = false) => {
    const trackId = getTrackId(track);
    const trackSlug =
      (track as any).slug || `${convertSlugUrl(track.title)}-${trackId}`;

    const href = `/track/${trackSlug}.html?audio=${encodeURIComponent(
      getAudioUrl(track.trackUrl)
    )}`;

    return autoplay ? `${href}&autoplay=1` : href;
  };

  const loadQueueTracks = async (): Promise<ITrackTop[]> => {
    if (queueTracks.length) return queueTracks;
    if (queueLoading) return queueTracks;

    setQueueLoading(true);

    try {
      const accessToken = (session as any)?.access_token;

      const res = await sendRequest<
        IBackendRes<IPlaylist[] | IModelPaginate<IPlaylist>>
      >({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists/by-user`,
        method: "GET",
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
      });

      const responseData = res?.data as any;

      const playlists: IPlaylist[] = Array.isArray(responseData)
        ? responseData
        : responseData?.result || [];

      const tracks: ITrackTop[] = playlists.flatMap((playlist) => {
        const playlistTracks = (playlist.tracks || []) as unknown[];

        return playlistTracks.filter(isTrackTopObject);
      });

      const uniqueTracks = Array.from(
        new Map(tracks.map((track) => [getTrackId(track), track])).values()
      );

      setQueueTracks(uniqueTracks);

      return uniqueTracks;
    } finally {
      setQueueLoading(false);
    }
  };

  const handleOpenQueue = async (event: React.MouseEvent<HTMLElement>) => {
    setQueueAnchorEl(event.currentTarget);
    await loadQueueTracks();
  };

  const handleCloseQueue = () => {
    setQueueAnchorEl(null);
  };

  const handlePlayQueueTrack = (track: ITrackTop) => {
    handleCloseQueue();

    if (isTrackDetailPage) {
      setCurrentTrack({
        ...track,
        isPlaying: false,
        source: "wave",
        currentTime: 0,
        duration: 0,
        seekTime: undefined,
      } as any);

      router.push(getTrackHref(track, true));
      return;
    }

    setCurrentTrack({
      ...track,
      isPlaying: true,
      source: "footer",
    } as any);
  };
  const getCurrentQueueIndex = (tracks: ITrackTop[]) => {
    const currentId = getTrackId(currentTrack);

    return tracks.findIndex((track) => getTrackId(track) === currentId);
  };

  const handlePlayPreviousTrack = async () => {
    const tracks = await loadQueueTracks();
    if (!tracks.length) return;

    const currentIndex = getCurrentQueueIndex(tracks);
    const previousIndex =
      currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;

    handlePlayQueueTrack(tracks[previousIndex]);
  };

  const handlePlayNextTrack = async () => {
    const tracks = await loadQueueTracks();
    if (!tracks.length) return;

    const currentIndex = getCurrentQueueIndex(tracks);
    const nextIndex =
      currentIndex < 0 || currentIndex >= tracks.length - 1
        ? 0
        : currentIndex + 1;

    handlePlayQueueTrack(tracks[nextIndex]);
  };

  const handleAudioEnded = async () => {
    if (!autoplayStation) return;

    await handlePlayNextTrack();
  };

  const handleSeekBy = (seconds: number) => {
    if (!footerDuration) return;

    const nextTime = Math.min(
      Math.max(footerCurrentTime + seconds, 0),
      footerDuration
    );

    setCurrentTrack({
      ...currentTrack,
      currentTime: nextTime,
      seekTime: nextTime,
      seekId: Date.now(),
      source: "footer-control",
    } as any);
  };

  ///

  const isWaveControlled =
    isTrackDetailPage &&
    (footerTrack?.source === "wave" ||
      footerTrack?.source === "footer-control");

  const getTrackImage = () => {
    return getImageUrl((currentTrack as any)?.imgUrl);
  };

  const setAppVolume = (value: number) => {
    const safeVolume = Math.max(0, Math.min(1, value));

    setVolume(safeVolume);

    if (safeVolume > 0) {
      previousVolumeRef.current = safeVolume;
      localStorage.setItem("soundclone-previous-volume", String(safeVolume));
    }

    localStorage.setItem("soundclone-volume", String(safeVolume));

    const audio = playerRef.current?.audio?.current;

    if (audio) {
      audio.volume = safeVolume;
    }

    setCurrentTrack({
      ...currentTrack,
      volume: safeVolume,
      source: "footer-control",
    } as any);
  };

  const handleChangeVolume = (value: number) => {
    setAppVolume(value);
  };

  const handleToggleMute = () => {
    const nextVolume = volume > 0 ? 0 : previousVolumeRef.current || 0.5;

    setAppVolume(nextVolume);
  };

  /// volume sync

  useEffect(() => {
    if (!hasMounted) return;

    const audio = playerRef.current?.audio?.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [hasMounted, volume]);

  useEffect(() => {
    if (!hasMounted) return;

    const savedVolume = localStorage.getItem("soundclone-volume");
    const savedPreviousVolume = localStorage.getItem(
      "soundclone-previous-volume"
    );

    if (savedPreviousVolume) {
      const nextPreviousVolume = Number(savedPreviousVolume);

      if (!Number.isNaN(nextPreviousVolume) && nextPreviousVolume > 0) {
        previousVolumeRef.current = Math.max(
          0,
          Math.min(1, nextPreviousVolume)
        );
      }
    }

    if (!savedVolume) return;

    const nextVolume = Number(savedVolume);

    if (Number.isNaN(nextVolume)) return;

    const safeVolume = Math.max(0, Math.min(1, nextVolume));

    setVolume(safeVolume);
  }, [hasMounted]);

  ////

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

  ///

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

              {/* Back 10s */}
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

              {/* Forward 10s */}
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
                {formatTime(footerCurrentTime)}
              </Typography>

              {/* Progress */}
              <Slider
                value={footerDuration ? footerCurrentTime : 0}
                min={0}
                max={footerDuration || 1}
                onChangeCommitted={(_, value) => {
                  setCurrentTrack({
                    ...currentTrack,
                    currentTime: Number(value),
                    seekTime: Number(value),
                    seekId: Date.now(),
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
                {formatTime(footerDuration)}
              </Typography>
            </Box>
          ) : (
            <AudioPlayer
              ref={playerRef}
              layout="horizontal-reverse"
              showSkipControls
              onClickPrevious={handlePlayPreviousTrack}
              onClickNext={handlePlayNextTrack}
              onEnded={handleAudioEnded}
              src={getAudioUrl((currentTrack as any)?.trackUrl)}
              volume={volume}
              onVolumeChange={(e: any) => {
                const nextVolume = Number(e?.target?.volume ?? volume);

                if (Number.isNaN(nextVolume)) return;

                setAppVolume(nextVolume);
              }}
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

          {/* Track info + queue icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              width: "320px",
              minWidth: "320px",
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

            <IconButton
              onClick={handleOpenQueue}
              sx={{
                width: 34,
                height: 34,
                color: "#ff5500",
                flexShrink: 0,

                "&:hover": {
                  backgroundColor: "rgba(255,85,0,0.12)",
                },
              }}
            >
              <QueueMusicRoundedIcon />
            </IconButton>
          </div>
        </Container>
      </AppBar>

      <FooterQueuePopover
        open={queueOpen}
        anchorEl={queueAnchorEl}
        onClose={handleCloseQueue}
        loading={queueLoading}
        tracks={queueTracks}
        currentTrack={currentTrack}
        autoplayStation={autoplayStation}
        onChangeAutoplayStation={setAutoplayStation}
        onClear={() => setQueueTracks([])}
        onPlayTrack={handlePlayQueueTrack}
      />
    </div>
  );
};

export default AppFooter;
