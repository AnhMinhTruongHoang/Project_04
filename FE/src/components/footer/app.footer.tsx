"use client";

import "react-h5-audio-player/lib/styles.css";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AudioPlayer from "react-h5-audio-player";

import AppBar from "@mui/material/AppBar";
import { Box, Container, IconButton, Slider, Typography } from "@mui/material";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import Replay10RoundedIcon from "@mui/icons-material/Replay10Rounded";
import Forward10RoundedIcon from "@mui/icons-material/Forward10Rounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import SkipPreviousRoundedIcon from "@mui/icons-material/SkipPreviousRounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";

import { useTrackContext } from "@/lib/track.wrapper";
import { useHasMounted } from "@/utils/customHook";
import { saveListeningProgressApi, sendRequest } from "@/utils/api";
import { saveListeningHistory } from "@/utils/actions/history";
import { getTrackHref, getUserHref } from "@/utils/actions/navigation";

import FooterQueuePopover from "./components/footer.queue.popover";

const formatTime = (seconds = 0) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;

  const minutes = Math.floor(safeSeconds / 60);
  const secondsRemainder = Math.round(safeSeconds) % 60;

  return `${minutes}:${String(secondsRemainder).padStart(2, "0")}`;
};

const AppFooter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const hasMounted = useHasMounted();

  const playerRef = useRef<any>(null);
  const previousTrackUrlRef = useRef("");
  const previousVolumeRef = useRef(0.5);
  const suppressFooterAudioEventRef = useRef(false);
  const currentTrackRef = useRef<any>(null);

  const lastProgressSaveRef = useRef<{
    trackId: string;
    second: number;
    completed: boolean;
  }>({
    trackId: "",
    second: -1,
    completed: false,
  });

  /*
   * Mỗi track detail chỉ tự bỏ mute một lần.
   * Nhờ vậy user vẫn có thể mute lại ngay trong trang.
   */
  const detailVolumeResetRef = useRef<string>("");

  const [volume, setVolume] = useState(0.5);
  const [queueAnchorEl, setQueueAnchorEl] = useState<HTMLElement | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueTracks, setQueueTracks] = useState<ITrackTop[]>([]);
  const [autoplayStation, setAutoplayStation] = useState(true);
  const [shuffleMode, setShuffleMode] = useState(false);

  const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

  const footerTrack = currentTrack as any;

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token ||
    (session as any)?.user?.accessToken ||
    "";

  const isTrackDetailPage = Boolean(pathname?.startsWith("/track/"));

  const isWaveControlled =
    isTrackDetailPage &&
    (footerTrack?.source === "wave" ||
      footerTrack?.source === "footer-control");

  const queueOpen = Boolean(queueAnchorEl);

  const footerCurrentTime = Number(footerTrack?.currentTime || 0);

  const footerDuration = Number(footerTrack?.duration || 0);

  const getTrackId = (track?: any) => {
    return track?.id || track?._id || "";
  };

  const getImageUrl = (imgUrl?: string | null) => {
    if (!imgUrl) return "/audio/SC.png";

    if (imgUrl.startsWith("http")) {
      return imgUrl;
    }

    if (imgUrl.startsWith("/")) {
      return imgUrl;
    }

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/images/${imgUrl}`;
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

  const getTrackImage = () => {
    return getImageUrl((currentTrack as any)?.imgUrl);
  };

  const isTrackTopObject = (track: unknown): track is ITrackTop => {
    if (typeof track !== "object" || track === null) {
      return false;
    }

    const item = track as any;

    return Boolean((item._id || item.id) && item.title && item.trackUrl);
  };

  const loadQueueTracks = async (): Promise<ITrackTop[]> => {
    if (queueTracks.length) {
      return queueTracks;
    }

    if (queueLoading) {
      return queueTracks;
    }

    setQueueLoading(true);

    try {
      const accessToken = (session as any)?.access_token;

      const response = await sendRequest<IBackendRes<IPlaylist[]>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists/my-playlists`,
        method: "GET",
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
      });

      const responseData = response?.data as any;

      const playlists: IPlaylist[] = Array.isArray(responseData)
        ? responseData
        : responseData?.result || [];

      const tracks: ITrackTop[] = playlists.flatMap((playlist) => {
        const playlistTracks = (playlist.tracks || []) as unknown[];

        return playlistTracks.filter(isTrackTopObject);
      });

      const uniqueTracks = Array.from(
        new Map(tracks.map((track) => [getTrackId(track), track])).values()
      ).filter((track) => Boolean(getTrackId(track)));

      setQueueTracks(uniqueTracks);

      return uniqueTracks;
    } catch (error) {
      console.error("Cannot load footer queue:", error);

      return [];
    } finally {
      setQueueLoading(false);
    }
  };

  const persistListeningProgress = useCallback(
    async (trackSnapshot?: any, completedOverride?: boolean) => {
      if (!accessToken || !trackSnapshot) {
        return;
      }

      const trackId = trackSnapshot?.id || trackSnapshot?._id || "";

      if (!trackId) {
        return;
      }

      const position = Math.max(Number(trackSnapshot.currentTime) || 0, 0);

      const duration = Math.max(Number(trackSnapshot.duration) || 0, 0);

      if (duration <= 0) {
        return;
      }

      const completed = completedOverride ?? position / duration >= 0.95;

      const second = Math.floor(position);

      const previous = lastProgressSaveRef.current;

      if (
        previous.trackId === trackId &&
        previous.second === second &&
        previous.completed === completed
      ) {
        return;
      }

      lastProgressSaveRef.current = {
        trackId,
        second,
        completed,
      };

      try {
        await saveListeningProgressApi(
          trackId,
          {
            position,
            duration,
            completed,
          },
          accessToken
        );
      } catch (error) {
        console.error("Cannot save listening progress:", error);
      }
    },
    [accessToken]
  );

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
        volume,
        muted: volume === 0,
        seekTime: undefined,
        seekId: undefined,
      } as any);

      router.push(getTrackHref(track, true));
      return;
    }

    setCurrentTrack({
      ...track,
      isPlaying: true,
      source: "footer",
      currentTime: 0,
      duration: 0,
      volume,
      muted: volume === 0,
      seekTime: undefined,
      seekId: undefined,
    } as any);
  };

  const getCurrentQueueIndex = (tracks: ITrackTop[]) => {
    const currentId = getTrackId(currentTrack);

    return tracks.findIndex((track) => getTrackId(track) === currentId);
  };

  const getRandomQueueIndex = (tracks: ITrackTop[]) => {
    if (tracks.length <= 1) {
      return 0;
    }

    const currentIndex = getCurrentQueueIndex(tracks);

    let randomIndex = Math.floor(Math.random() * tracks.length);

    while (randomIndex === currentIndex) {
      randomIndex = Math.floor(Math.random() * tracks.length);
    }

    return randomIndex;
  };

  const handleToggleShuffleMode = () => {
    setShuffleMode((previous) => {
      const next = !previous;

      localStorage.setItem("soundclone-shuffle-mode", String(next));

      return next;
    });
  };

  const handlePlayPreviousTrack = async () => {
    const tracks = await loadQueueTracks();

    if (!tracks.length) return;

    if (shuffleMode) {
      handlePlayQueueTrack(tracks[getRandomQueueIndex(tracks)]);
      return;
    }

    const currentIndex = getCurrentQueueIndex(tracks);

    const previousIndex =
      currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;

    handlePlayQueueTrack(tracks[previousIndex]);
  };

  const handlePlayNextTrack = async () => {
    const tracks = await loadQueueTracks();

    if (!tracks.length) return;

    if (shuffleMode) {
      handlePlayQueueTrack(tracks[getRandomQueueIndex(tracks)]);
      return;
    }

    const currentIndex = getCurrentQueueIndex(tracks);

    const nextIndex =
      currentIndex < 0 || currentIndex >= tracks.length - 1
        ? 0
        : currentIndex + 1;

    handlePlayQueueTrack(tracks[nextIndex]);
  };

  const handleAudioEnded = async () => {
    const audio = playerRef.current?.audio?.current;

    const duration = Math.max(
      Number(audio?.duration) || Number(footerDuration) || 0,
      0
    );

    const completedTrack = {
      ...currentTrack,
      currentTime: duration,
      duration,
      isPlaying: false,
      source: "footer",
    };

    setCurrentTrack(completedTrack as any);

    await persistListeningProgress(completedTrack, true);

    if (!autoplayStation) {
      return;
    }

    await handlePlayNextTrack();
  };

  const handleSeekBy = (seconds: number) => {
    if (!currentTrack || !footerDuration) {
      return;
    }

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
      audio.muted = safeVolume === 0;
    }

    if (!currentTrack) return;

    setCurrentTrack({
      ...currentTrack,
      volume: safeVolume,
      muted: safeVolume === 0,
      source: "footer-control",
      seekTime: undefined,
      seekId: undefined,
      volumeId: Date.now(),
    } as any);
  };

  const handleChangeVolume = (value: number) => {
    setAppVolume(value);
  };

  const handleToggleMute = () => {
    const nextVolume = volume > 0 ? 0 : previousVolumeRef.current || 0.5;

    setAppVolume(nextVolume);
  };

  /*
   * Luôn giữ snapshot mới nhất của track.
   */
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  /*
   * Cứ mỗi 15 giây khi đang phát sẽ lưu lên backend.
   *
   * Hoạt động cho cả:
   * - AudioPlayer ở footer
   * - WaveSurfer ở trang track detail
   */
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const trackSnapshot = currentTrackRef.current;

      if (!trackSnapshot?.isPlaying) {
        return;
      }

      void persistListeningProgress(trackSnapshot);
    }, 15_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [accessToken, persistListeningProgress]);

  /*
   * Lưu ngay khi pause hoặc bài kết thúc.
   */
  useEffect(() => {
    if (!currentTrack) {
      return;
    }

    if (currentTrack.isPlaying !== false) {
      return;
    }

    const position = Number((currentTrack as any).currentTime || 0);

    const duration = Number((currentTrack as any).duration || 0);

    if (position <= 0 || duration <= 0) {
      return;
    }

    void persistListeningProgress(currentTrack);
  }, [
    currentTrack?.isPlaying,
    (currentTrack as any)?.currentTime,
    (currentTrack as any)?.duration,
    (currentTrack as any)?.id,
    (currentTrack as any)?._id,
    persistListeningProgress,
  ]);

  /*
   * Lưu track cũ khi user đổi sang track khác
   * hoặc AppFooter bị unmount.
   */
  useEffect(() => {
    return () => {
      const trackSnapshot = currentTrackRef.current;

      if (!trackSnapshot) {
        return;
      }

      void persistListeningProgress(trackSnapshot);
    };
  }, [
    (currentTrack as any)?.id,
    (currentTrack as any)?._id,
    persistListeningProgress,
  ]);

  /*
   * Lưu lịch sử nghe.
   */
  useEffect(() => {
    const trackId = getTrackId(currentTrack);

    if (!trackId) return;
    if (!currentTrack?.isPlaying) return;

    saveListeningHistory(currentTrack as ITrackTop);
  }, [
    currentTrack?._id,
    (currentTrack as any)?.id,
    currentTrack?.trackUrl,
    currentTrack?.isPlaying,
  ]);

  /*
   * Đọc volume đã lưu trước đó.
   */
  useEffect(() => {
    if (!hasMounted) return;

    const savedPreviousVolume = localStorage.getItem(
      "soundclone-previous-volume"
    );

    if (savedPreviousVolume) {
      const parsedPreviousVolume = Number(savedPreviousVolume);

      if (Number.isFinite(parsedPreviousVolume) && parsedPreviousVolume > 0) {
        previousVolumeRef.current = Math.max(
          0,
          Math.min(1, parsedPreviousVolume)
        );
      }
    }

    const savedVolume = localStorage.getItem("soundclone-volume");

    if (savedVolume === null) return;

    const parsedVolume = Number(savedVolume);

    if (!Number.isFinite(parsedVolume)) {
      return;
    }

    setVolume(Math.max(0, Math.min(1, parsedVolume)));
  }, [hasMounted]);

  /*
   * Khi vừa đi từ trang khác vào /track/{slug},
   * nếu app đang mute thì tự khôi phục âm lượng trước đó.
   *
   * Kết quả:
   * - WaveSurfer phát có tiếng.
   * - Icon footer đổi sang VolumeUp.
   * - Nếu user mute lại ngay trong trang track,
   *   effect không tự bật tiếng lần thứ hai.
   */
  useEffect(() => {
    if (!hasMounted) return;

    if (!isTrackDetailPage) {
      detailVolumeResetRef.current = "";
      return;
    }

    const trackId = getTrackId(currentTrack);

    if (!trackId || !currentTrack) {
      return;
    }

    const resetKey = `${pathname}:${trackId}`;

    if (detailVolumeResetRef.current === resetKey) {
      return;
    }

    detailVolumeResetRef.current = resetKey;

    const savedVolumeRaw = localStorage.getItem("soundclone-volume");

    const savedVolume =
      savedVolumeRaw === null ? volume : Number(savedVolumeRaw);

    const shouldUnmute =
      savedVolume === 0 || volume === 0 || footerTrack?.muted === true;

    if (!shouldUnmute) {
      return;
    }

    const savedPreviousRaw = localStorage.getItem("soundclone-previous-volume");

    const savedPrevious = Number(savedPreviousRaw);

    const restoredVolume =
      Number.isFinite(savedPrevious) && savedPrevious > 0
        ? Math.min(savedPrevious, 1)
        : previousVolumeRef.current > 0
        ? previousVolumeRef.current
        : 0.5;

    previousVolumeRef.current = restoredVolume;

    setVolume(restoredVolume);

    localStorage.setItem("soundclone-volume", String(restoredVolume));

    localStorage.setItem("soundclone-previous-volume", String(restoredVolume));

    const audio = playerRef.current?.audio?.current;

    if (audio) {
      audio.volume = restoredVolume;
      audio.muted = false;
    }

    setCurrentTrack({
      ...currentTrack,
      volume: restoredVolume,
      muted: false,
      volumeId: Date.now(),
      source: "footer-control",
      seekTime: undefined,
      seekId: undefined,
    } as any);
  }, [
    hasMounted,
    isTrackDetailPage,
    pathname,
    currentTrack?._id,
    (currentTrack as any)?.id,
  ]);

  /*
   * Đồng bộ volume state với audio element footer.
   */
  useEffect(() => {
    if (!hasMounted) return;

    const audio = playerRef.current?.audio?.current;

    if (!audio) return;

    audio.volume = volume;
    audio.muted = volume === 0;
  }, [hasMounted, volume]);

  useEffect(() => {
    if (!hasMounted) return;

    const savedShuffleMode = localStorage.getItem("soundclone-shuffle-mode");

    setShuffleMode(savedShuffleMode === "true");
  }, [hasMounted]);

  /*
   * Ngoài trang detail: AudioPlayer footer phát nhạc.
   * Trong trang detail: dừng audio footer để WaveSurfer làm nguồn phát duy nhất.
   */
  useEffect(() => {
    const audio = playerRef.current?.audio?.current;

    if (!audio) return;

    if (isWaveControlled || isTrackDetailPage) {
      suppressFooterAudioEventRef.current = true;

      audio.pause();
      audio.currentTime = 0;

      window.setTimeout(() => {
        suppressFooterAudioEventRef.current = false;
      }, 0);

      return;
    }

    if (previousTrackUrlRef.current !== currentTrack?.trackUrl) {
      audio.currentTime = 0;

      previousTrackUrlRef.current = currentTrack?.trackUrl || "";
    }

    if (currentTrack?.isPlaying === false) {
      audio.pause();
      return;
    }

    if (currentTrack?.isPlaying === true) {
      void audio.play().catch((error: unknown) => {
        console.warn("Footer audio play was blocked:", error);
      });
    }
  }, [
    currentTrack?._id,
    (currentTrack as any)?.id,
    currentTrack?.trackUrl,
    currentTrack?.isPlaying,
    isWaveControlled,
    isTrackDetailPage,
  ]);

  /*
   * Mọi hook phải nằm trước các return có điều kiện.
   */
  if (!hasMounted) {
    return <></>;
  }

  if (!currentTrack) {
    return <></>;
  }

  const currentTrackId = getTrackId(currentTrack);

  if (!currentTrackId) {
    return <></>;
  }

  const footerTrackHref = getTrackHref(currentTrack, true);

  const footerArtist = (currentTrack as any)?.uploader ||
    (currentTrack as any)?.user ||
    (currentTrack as any)?.artist ||
    (currentTrack as any)?.createdBy || {
      _id: (currentTrack as any)?.uploaderId,
      id: (currentTrack as any)?.uploaderId,
      name: (currentTrack as any)?.description,
    };

  const footerArtistHref = getUserHref(footerArtist);

  const canOpenTrack = footerTrackHref !== "#";

  const canOpenArtist = footerArtistHref !== "#";

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          top: "auto",
          bottom: 0,
          zIndex: 1300,

          background: "#181A1B",

          borderTop: "1px solid rgba(255,255,255,0.08)",

          boxShadow: "0 -6px 20px rgba(0,0,0,0.35)",

          pb: {
            xs: "env(safe-area-inset-bottom)",
            md: 0,
          },
        }}
      >
        <Container
          disableGutters
          sx={{
            position: "relative",

            width: "100%",
            maxWidth: "none !important",

            minHeight: {
              xs: 66,
              md: 64,
            },

            backgroundColor: "#181A1B",

            overflow: "visible",

            color: "#ffffff",
          }}
        >
          {/*MOBILE PROGRESS BAR*/}
          <Box
            sx={{
              display: {
                xs: "flex",
                md: "none",
              },
              width: "100%",
              height: 66,
              px: 1,
              alignItems: "center",
              gap: 1,
              overflow: "hidden",
              backgroundColor: "#181A1B",
            }}
          >
            <Box
              component={Link}
              href={footerTrackHref}
              onClick={(event) => {
                if (!canOpenTrack) {
                  event.preventDefault();
                }
              }}
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "block",
                overflow: "hidden",
                borderRadius: "4px",
                backgroundColor: "#111",
                cursor: canOpenTrack ? "pointer" : "default",
              }}
            >
              <Box
                component="img"
                src={getTrackImage()}
                alt={currentTrack?.title || "track image"}
                onError={(event: any) => {
                  event.currentTarget.src = "/audio/SC.png";
                }}
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Typography
                noWrap
                sx={{
                  color: "#ffffff",
                  fontSize: 13,
                  lineHeight: "18px",
                  fontWeight: 900,
                }}
              >
                {currentTrack?.title || "Unknown track"}
              </Typography>

              <Typography
                noWrap
                sx={{
                  color: "#d0d0d0",
                  fontSize: 11,
                  lineHeight: "15px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {footerArtist?.name ||
                  currentTrack?.uploader?.name ||
                  currentTrack?.description ||
                  "Unknown artist"}
              </Typography>
            </Box>

            {/* OPEN PLAYLIST / QUEUE POPOVER */}
            <IconButton
              aria-label="Open queue"
              onClick={handleOpenQueue}
              sx={{
                width: 34,
                height: 34,
                p: 0,
                flexShrink: 0,
                color: "#ffffff",
                "&:hover": {
                  color: "#ff5500",
                  backgroundColor: "rgba(255,85,0,0.10)",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: 22,
                },
              }}
            >
              <QueueMusicRoundedIcon />
            </IconButton>

            {/* PLAY / PAUSE */}
            <IconButton
              aria-label={currentTrack?.isPlaying ? "Pause" : "Play"}
              onClick={() => {
                if (!currentTrack) return;

                setCurrentTrack({
                  ...currentTrack,
                  isPlaying: !Boolean(currentTrack.isPlaying),
                  source: "footer-control",
                } as any);
              }}
              sx={{
                width: 34,
                height: 34,
                p: 0,
                flexShrink: 0,
                color: "#ffffff",
                "&:hover": {
                  color: "#ff5500",
                  backgroundColor: "rgba(255,85,0,0.10)",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: 24,
                },
              }}
            >
              {currentTrack?.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Box>

          {/* MOBILE PROGRESS BAR */}
          <Box
            sx={{
              display: {
                xs: "block",
                md: "none",
              },

              position: "absolute",

              top: 0,
              left: 0,
              right: 0,

              height: 10,

              zIndex: 30,

              transform: "translateY(-50%)",
            }}
          >
            <Slider
              value={
                footerDuration ? Math.min(footerCurrentTime, footerDuration) : 0
              }
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
                position: "absolute",

                top: "50%",
                left: 0,

                transform: "translateY(-50%)",

                width: "100%",
                height: 10,

                p: 0,

                color: "#ff5500",

                "& .MuiSlider-rail": {
                  height: 2,

                  opacity: 1,

                  backgroundColor: "rgba(255,255,255,0.22)",
                },

                "& .MuiSlider-track": {
                  height: 2,

                  border: 0,

                  backgroundColor: "#ff5500",
                },

                "& .MuiSlider-thumb": {
                  width: 9,
                  height: 9,

                  opacity: 0,

                  backgroundColor: "#ff5500",

                  boxShadow: "none",

                  "&:before": {
                    boxShadow: "none",
                  },
                },

                "&:active .MuiSlider-thumb": {
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* DESKTOP PLAYER*/}
          <Box
            sx={{
              display: {
                xs: "none",
                md: "flex",
              },

              width: "100%",

              minHeight: 64,

              alignItems: "center",

              gap: 4,

              backgroundColor: "#181A1B",

              ".rhap_container": {
                flex: 1,

                minWidth: 0,

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
            {/* PLAYER CONTROLS */}
            {isWaveControlled ? (
              <Box
                sx={{
                  flex: 1,

                  height: 64,

                  display: "flex",
                  alignItems: "center",

                  gap: 1.1,

                  px: 2,

                  minWidth: 0,

                  backgroundColor: "#181A1B",

                  color: "#ffffff",
                }}
              >
                {/* SHUFFLE */}
                <IconButton
                  onClick={handleToggleShuffleMode}
                  sx={{
                    width: 34,
                    height: 34,

                    p: 0,

                    color: shuffleMode ? "#ff5500" : "#8f8f8f",

                    opacity: "1 !important",

                    "&:hover": {
                      backgroundColor: "rgba(255,85,0,0.12)",

                      color: "#ff5500",
                    },

                    "& .MuiSvgIcon-root": {
                      fontSize: 27,
                    },
                  }}
                >
                  <ShuffleRoundedIcon />
                </IconButton>

                {/* -10 */}
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

                {/* PLAY */}
                <IconButton
                  onClick={() => {
                    setCurrentTrack({
                      ...currentTrack,

                      isPlaying: !Boolean(currentTrack.isPlaying),

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

                {/* +10 */}
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

                {/* VOLUME */}
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

                      p: 0,

                      color: "#ffffff",

                      "& .MuiSlider-rail": {
                        height: 4,

                        opacity: 1,

                        backgroundColor: "#4a4a4a",
                      },

                      "& .MuiSlider-track": {
                        height: 4,

                        border: "none",

                        backgroundColor: "#ffffff",
                      },

                      "& .MuiSlider-thumb": {
                        width: 13,
                        height: 13,

                        backgroundColor: "#ffffff",

                        boxShadow: "none",
                      },
                    }}
                  />
                </Box>

                {/* CURRENT TIME */}
                <Typography
                  sx={{
                    color: "#ff5500",

                    fontSize: 12,
                    fontWeight: 800,

                    minWidth: 38,

                    textAlign: "right",

                    flexShrink: 0,
                  }}
                >
                  {formatTime(footerCurrentTime)}
                </Typography>

                {/* DESKTOP SEEK */}
                <Slider
                  value={
                    footerDuration
                      ? Math.min(footerCurrentTime, footerDuration)
                      : 0
                  }
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

                    p: 0,

                    color: "#ff5500",

                    "& .MuiSlider-rail": {
                      height: 4,

                      opacity: 1,

                      backgroundColor: "#4a4a4a",
                    },

                    "& .MuiSlider-track": {
                      height: 4,

                      border: "none",

                      backgroundColor: "#ff5500",
                    },

                    "& .MuiSlider-thumb": {
                      width: 16,
                      height: 16,

                      backgroundColor: "#ff5500",

                      boxShadow: "none",
                    },
                  }}
                />

                {/* DURATION */}
                <Typography
                  sx={{
                    color: "#ffffff",

                    fontSize: 12,
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
                listenInterval={1000}
                onListen={(event: any) => {
                  const audio =
                    event?.currentTarget || playerRef.current?.audio?.current;

                  if (!audio || !currentTrack) {
                    return;
                  }

                  const currentTime = Math.max(
                    Number(audio.currentTime) || 0,
                    0
                  );

                  const duration = Math.max(Number(audio.duration) || 0, 0);

                  setCurrentTrack({
                    ...currentTrack,

                    currentTime,
                    duration,

                    isPlaying: !audio.paused,

                    source: "footer",

                    seekTime: undefined,
                    seekId: undefined,
                  } as any);
                }}
                customAdditionalControls={[
                  <IconButton
                    key="shuffle"
                    onClick={handleToggleShuffleMode}
                    sx={{
                      width: 34,
                      height: 34,

                      p: 0,

                      color: shuffleMode ? "#ff5500" : "#ffffff",

                      "&:hover": {
                        backgroundColor: "rgba(255,85,0,0.12)",

                        color: "#ff5500",
                      },
                    }}
                  >
                    <ShuffleRoundedIcon />
                  </IconButton>,
                ]}
                onClickPrevious={handlePlayPreviousTrack}
                onClickNext={handlePlayNextTrack}
                onEnded={handleAudioEnded}
                src={getAudioUrl(currentTrack.trackUrl)}
                volume={volume}
                muted={volume === 0}
                onVolumeChange={(event: any) => {
                  const nextVolume = Number(event?.target?.volume ?? volume);

                  if (!Number.isFinite(nextVolume)) {
                    return;
                  }

                  setAppVolume(nextVolume);
                }}
                style={{
                  flex: 1,

                  minWidth: 0,

                  boxShadow: "unset",

                  background: "#181A1B",
                }}
                onPlay={() => {
                  if (suppressFooterAudioEventRef.current) {
                    return;
                  }

                  if (isTrackDetailPage) {
                    return;
                  }

                  setCurrentTrack({
                    ...currentTrack,

                    isPlaying: true,

                    source: "footer",
                  } as any);
                }}
                onPause={(event: any) => {
                  if (suppressFooterAudioEventRef.current) {
                    return;
                  }

                  if (isTrackDetailPage) {
                    return;
                  }

                  const audio =
                    event?.currentTarget || playerRef.current?.audio?.current;

                  const nextTrack = {
                    ...currentTrack,

                    isPlaying: false,

                    currentTime: Number(audio?.currentTime) || 0,

                    duration: Number(audio?.duration) || 0,

                    source: "footer",
                  };

                  setCurrentTrack(nextTrack as any);

                  void persistListeningProgress(nextTrack);
                }}
              />
            )}

            {/* =====================================================
          DESKTOP TRACK INFO
      ====================================================== */}
            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                gap: "10px",

                width: "320px",
                minWidth: "320px",

                pr: "10px",
              }}
            >
              {/* COVER */}
              <Box
                component={Link}
                href={footerTrackHref}
                onClick={(event) => {
                  if (!canOpenTrack) {
                    event.preventDefault();
                  }
                }}
                sx={{
                  width: 38,
                  height: 38,

                  flexShrink: 0,

                  display: "block",

                  borderRadius: "3px",

                  overflow: "hidden",

                  backgroundColor: "#111",

                  cursor: canOpenTrack ? "pointer" : "default",
                }}
              >
                <Box
                  component="img"
                  src={getTrackImage()}
                  alt={currentTrack.title || "track image"}
                  onError={(event: any) => {
                    event.currentTarget.src = "/audio/SC.png";
                  }}
                  sx={{
                    width: "100%",
                    height: "100%",

                    display: "block",

                    objectFit: "cover",
                  }}
                />
              </Box>

              {/* TEXT */}
              <Box
                sx={{
                  width: "220px",

                  minWidth: 0,

                  display: "flex",

                  flexDirection: "column",

                  justifyContent: "center",

                  overflow: "hidden",
                }}
              >
                <Typography
                  component={Link}
                  href={footerArtistHref}
                  onClick={(event) => {
                    if (!canOpenArtist) {
                      event.preventDefault();
                    }
                  }}
                  sx={{
                    width: "100%",

                    color: "#a8a8a8",

                    fontSize: 12,
                    fontWeight: 700,

                    textDecoration: "none",

                    overflow: "hidden",

                    textOverflow: "ellipsis",

                    whiteSpace: "nowrap",
                  }}
                >
                  {footerArtist?.name ||
                    currentTrack.description ||
                    "Unknown artist"}
                </Typography>

                <Typography
                  component={Link}
                  href={footerTrackHref}
                  onClick={(event) => {
                    if (!canOpenTrack) {
                      event.preventDefault();
                    }
                  }}
                  sx={{
                    width: "100%",

                    color: "#ffffff",

                    fontSize: 13,
                    fontWeight: 800,

                    textDecoration: "none",

                    overflow: "hidden",

                    textOverflow: "ellipsis",

                    whiteSpace: "nowrap",
                  }}
                >
                  {currentTrack.title || "Unknown track"}
                </Typography>
              </Box>

              {/* QUEUE */}
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
            </Box>
          </Box>
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
    </>
  );
};

export default AppFooter;
