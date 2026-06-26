"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWavesurfer } from "@/utils/customHook";
import { WaveSurferOptions } from "wavesurfer.js";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import "../../styles/wave.scss";
import { useTrackContext } from "@/lib/track.wrapper";
import { sendRequest } from "@/utils/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LikeTrack from "./like.track";
import CommentTrack from "./comment.track";

interface IProps {
  track: ITrackTop | null;
  comments?: ITrackComment[];
  autoPlay?: boolean;
}

const WaveTrack = (props: IProps) => {
  const { track, comments = [], autoPlay = false } = props;
  const router = useRouter();

  const firstViewRef = useRef(true);
  const lastSyncSecondRef = useRef(-1);
  const lastHandledSeekIdRef = useRef<number | string | null>(null);

  const searchParams = useSearchParams();
  const fileName = searchParams.get("audio");

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);

  const [time, setTime] = useState<string>("0:00");
  const [duration, setDuration] = useState<string>("0:00");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

  const getTrackId = () => {
    return (track as any)?._id || (track as any)?.id || "";
  };

  const getCurrentTrackId = () => {
    return (currentTrack as any)?._id || (currentTrack as any)?.id || "";
  };

  const getImageUrl = (imgUrl?: string | null) => {
    if (!imgUrl) return "/images/logo/Sc.png";

    if (imgUrl.startsWith("http")) {
      return imgUrl;
    }

    if (imgUrl.startsWith("/")) {
      return imgUrl;
    }

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/images/${imgUrl}`;
  };

  const getAudioUrl = (trackUrl?: string | null) => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    if (!trackUrl) return "";
    if (trackUrl.startsWith("http")) return trackUrl;
    if (trackUrl.startsWith("/uploads/audio")) {
      return `${BACKEND_URL}${trackUrl}`;
    }
    if (trackUrl.startsWith("/")) return `${BACKEND_URL}${trackUrl}`;

    return `${BACKEND_URL}/uploads/audio/${trackUrl}`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secondsRemainder = Math.round(seconds) % 60;
    const paddedSeconds = `0${secondsRemainder}`.slice(-2);

    return `${minutes}:${paddedSeconds}`;
  };

  const optionsMemo = useMemo((): Omit<WaveSurferOptions, "container"> => {
    let gradient, progressGradient;

    if (typeof window !== "undefined") {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35);
      gradient.addColorStop(0, "#656666");
      gradient.addColorStop((canvas.height * 0.7) / canvas.height, "#656666");
      gradient.addColorStop(
        (canvas.height * 0.7 + 1) / canvas.height,
        "#ffffff"
      );
      gradient.addColorStop(
        (canvas.height * 0.7 + 2) / canvas.height,
        "#ffffff"
      );
      gradient.addColorStop(
        (canvas.height * 0.7 + 3) / canvas.height,
        "#B1B1B1"
      );
      gradient.addColorStop(1, "#B1B1B1");

      progressGradient = ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height * 1.35
      );
      progressGradient.addColorStop(0, "#EE772F");
      progressGradient.addColorStop(
        (canvas.height * 0.7) / canvas.height,
        "#EB4926"
      );
      progressGradient.addColorStop(
        (canvas.height * 0.7 + 1) / canvas.height,
        "#ffffff"
      );
      progressGradient.addColorStop(
        (canvas.height * 0.7 + 2) / canvas.height,
        "#ffffff"
      );
      progressGradient.addColorStop(
        (canvas.height * 0.7 + 3) / canvas.height,
        "#F6B094"
      );
      progressGradient.addColorStop(1, "#F6B094");
    }

    return {
      waveColor: gradient,
      progressColor: progressGradient,
      height: 100,
      barWidth: 3,
      url: getAudioUrl(track?.trackUrl || fileName),
    };
  }, [track?.trackUrl, fileName]);

  const wavesurfer = useWavesurfer(containerRef, optionsMemo);

  const syncWaveToFooter = (
    nextIsPlaying: boolean,
    nextCurrentTime?: number,
    nextDuration?: number
  ) => {
    const trackId = getTrackId();

    if (!trackId || !track) return;

    setCurrentTrack({
      ...track,
      isPlaying: nextIsPlaying,
      source: "wave",
      currentTime: nextCurrentTime ?? wavesurfer?.getCurrentTime() ?? 0,
      duration: nextDuration ?? wavesurfer?.getDuration() ?? 0,
      volume: (currentTrack as any)?.volume,
      muted: (currentTrack as any)?.muted,
      volumeId: (currentTrack as any)?.volumeId,
      seekTime: undefined,
      seekId: undefined,
    } as any);
  };

  const handleIncreaseView = async () => {
    const trackId = getTrackId();

    if (!firstViewRef.current || !trackId) return;

    await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/${trackId}/play`,
      method: "POST",
    });

    await sendRequest<IBackendRes<any>>({
      url: `/api/revalidate`,
      method: "POST",
      queryParams: {
        tag: "track-by-id",
        secret: "justArandomString",
      },
    });

    router.refresh();
    firstViewRef.current = false;
  };

  useEffect(() => {
    if (!wavesurfer) return;
    if (!track) return;
    if (!autoPlay) return;

    const playTrack = () => {
      const trackId = getTrackId();

      if (!trackId) return;

      setCurrentTrack({
        ...track,
        isPlaying: true,
        source: "wave",
        currentTime: 0,
        duration: wavesurfer.getDuration() ?? 0,
        seekTime: undefined,
        seekId: undefined,
      } as any);

      wavesurfer.play();
      handleIncreaseView();
    };

    const timer = setTimeout(playTrack, 500);

    return () => clearTimeout(timer);
  }, [wavesurfer, autoPlay, (track as any)?._id, (track as any)?.id]);

  useEffect(() => {
    const trackId = getTrackId();

    if (!trackId || !track) return;

    setIsPlaying(false);
    setTime("0:00");
    setDuration("0:00");

    firstViewRef.current = true;
    lastSyncSecondRef.current = -1;
    lastHandledSeekIdRef.current = null;

    setCurrentTrack({
      ...track,
      isPlaying: false,
      source: "wave",
      currentTime: 0,
      duration: 0,
      seekTime: undefined,
      seekId: undefined,
    } as any);
  }, [(track as any)?._id, (track as any)?.id]);

  useEffect(() => {
    if (!wavesurfer) return;

    setIsPlaying(false);

    const hover = hoverRef.current;
    const waveform = containerRef.current;

    const handlePointerMove = (e: PointerEvent) => {
      if (!hover) return;
      hover.style.width = `${e.offsetX}px`;
    };

    waveform?.addEventListener("pointermove", handlePointerMove);

    const subscriptions = [
      wavesurfer.on("play", () => {
        setIsPlaying(true);
        syncWaveToFooter(true);
      }),

      wavesurfer.on("pause", () => {
        setIsPlaying(false);
        syncWaveToFooter(false);
      }),

      wavesurfer.on("decode", (decodedDuration) => {
        setDuration(formatTime(decodedDuration));

        const trackId = getTrackId();

        if (trackId && track) {
          setCurrentTrack({
            ...track,
            isPlaying: false,
            source: "wave",
            currentTime: 0,
            duration: decodedDuration,
            seekTime: undefined,
            seekId: undefined,
          } as any);
        }
      }),

      wavesurfer.on("timeupdate", (currentTime) => {
        setTime(formatTime(currentTime));

        const currentSecond = Math.floor(currentTime);

        if (currentSecond === lastSyncSecondRef.current) return;

        lastSyncSecondRef.current = currentSecond;

        syncWaveToFooter(
          wavesurfer.isPlaying(),
          currentTime,
          wavesurfer.getDuration()
        );
      }),
    ];

    return () => {
      waveform?.removeEventListener("pointermove", handlePointerMove);
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer, (track as any)?._id, (track as any)?.id]);

  useEffect(() => {
    if (!wavesurfer) return;
    if (!track) return;

    const trackId = getTrackId();
    const currentTrackId = getCurrentTrackId();

    if (!trackId) return;
    if (currentTrackId !== trackId) return;

    const footerTrack = currentTrack as any;

    if (footerTrack?.source !== "footer-control") return;

    if (typeof footerTrack.volume === "number") {
      const safeVolume = Math.max(0, Math.min(1, footerTrack.volume));

      wavesurfer.setVolume(safeVolume);

      if (typeof (wavesurfer as any).setMuted === "function") {
        (wavesurfer as any).setMuted(safeVolume === 0);
      }
    }

    if (typeof footerTrack.seekTime === "number") {
      const seekId = footerTrack.seekId ?? footerTrack.seekTime;

      if (lastHandledSeekIdRef.current === seekId) return;

      lastHandledSeekIdRef.current = seekId;

      const waveDuration = wavesurfer.getDuration();

      if (waveDuration) {
        const nextTime = Math.min(
          Math.max(Number(footerTrack.seekTime), 0),
          waveDuration
        );

        wavesurfer.setTime(nextTime);
        setTime(formatTime(nextTime));
        lastSyncSecondRef.current = Math.floor(nextTime);
      }

      return;
    }

    if (footerTrack.isPlaying === true && !wavesurfer.isPlaying()) {
      wavesurfer.play();
      return;
    }

    if (footerTrack.isPlaying === false && wavesurfer.isPlaying()) {
      wavesurfer.pause();
    }
  }, [
    wavesurfer,
    (currentTrack as any)?._id,
    (currentTrack as any)?.id,
    currentTrack?.isPlaying,
    (currentTrack as any)?.seekTime,
    (currentTrack as any)?.seekId,
    (currentTrack as any)?.source,
    (currentTrack as any)?.volume,
    (currentTrack as any)?.volumeId,
    (currentTrack as any)?.muted,
    (track as any)?._id,
    (track as any)?.id,
  ]);

  useEffect(() => {
    if (!wavesurfer) return;

    const currentTrackId = getCurrentTrackId();
    const trackId = getTrackId();

    const isAnotherTrackPlaying =
      currentTrackId &&
      trackId &&
      currentTrackId !== trackId &&
      currentTrack.isPlaying;

    if (isAnotherTrackPlaying) {
      wavesurfer.pause();
    }
  }, [
    wavesurfer,
    (currentTrack as any)?._id,
    (currentTrack as any)?.id,
    currentTrack?.isPlaying,
    (currentTrack as any)?.seekTime,
    (currentTrack as any)?.seekId,
    (currentTrack as any)?.source,
    (currentTrack as any)?.volume,
    (currentTrack as any)?.volumeId,
    (currentTrack as any)?.muted,
    (track as any)?._id,
    (track as any)?.id,
  ]);

  const onPlayClick = useCallback(() => {
    if (!wavesurfer) return;

    if (wavesurfer.isPlaying()) {
      wavesurfer.pause();
    } else {
      wavesurfer.play();
    }
  }, [wavesurfer]);

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          gap: 15,
          padding: 20,
          height: 400,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          background:
            "radial-gradient(circle at 0% 0%, rgba(255,85,0,0.35), transparent 35%), radial-gradient(circle at 100% 100%, rgba(0,188,174,0.22), transparent 40%), linear-gradient(135deg, #21120d 0%, #181a1b 48%, #0d2523 100%)",
        }}
      >
        <div
          className="left"
          style={{
            width: "75%",
            height: "calc(100% - 10px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div className="info" style={{ display: "flex" }}>
            <div>
              <div
                onClick={() => {
                  onPlayClick();
                  handleIncreaseView();
                }}
                style={{
                  borderRadius: "50%",
                  background: "#f50",
                  height: "50px",
                  width: "50px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {isPlaying === true ? (
                  <PauseIcon sx={{ fontSize: 30, color: "white" }} />
                ) : (
                  <PlayArrowIcon sx={{ fontSize: 30, color: "white" }} />
                )}
              </div>
            </div>

            <div style={{ marginLeft: 20 }}>
              <div
                style={{
                  padding: "0 5px",
                  background: "#333",
                  fontSize: 30,
                  width: "fit-content",
                  color: "white",
                }}
              >
                {track?.title}
              </div>

              <div
                style={{
                  padding: "0 5px",
                  marginTop: 10,
                  background: "#333",
                  fontSize: 20,
                  width: "fit-content",
                  color: "white",
                }}
              >
                {track?.description}
              </div>
            </div>
          </div>

          <div ref={containerRef} className="wave-form-container">
            <div className="time">{time}</div>
            <div className="duration">{duration}</div>
            <div ref={hoverRef} className="hover-wave"></div>

            <div
              className="overlay"
              style={{
                position: "absolute",
                height: "30px",
                width: "100%",
                bottom: "0",
                backdropFilter: "brightness(0.5)",
              }}
            ></div>
          </div>
        </div>

        <div
          className="right"
          style={{
            width: "25%",
            padding: 15,
            display: "flex",
            alignItems: "center",
          }}
        >
          {track?.imgUrl ? (
            <Image
              src={getImageUrl(track?.imgUrl)}
              width={250}
              height={250}
              alt="image track"
            />
          ) : (
            <div
              style={{
                background: "#ccc",
                width: 250,
                height: 250,
              }}
            ></div>
          )}
        </div>
      </div>

      <div>
        <LikeTrack track={track} />
      </div>

      <div>
        <CommentTrack
          track={track}
          comments={comments}
          wavesurfer={wavesurfer}
        />
      </div>
    </div>
  );
};

export default WaveTrack;
