"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWavesurfer } from "@/utils/customHook";
import { WaveSurferOptions } from "wavesurfer.js";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import "../../styles/wave.css";
import { useTrackContext } from "@/lib/track.wrapper";
import { sendRequest } from "@/utils/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LikeTrack from "./like.track";
import CommentTrack from "./comment.track";
import { getUserHref } from "@/utils/actions/navigation";
import Link from "next/link";

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

  const getSyncedVolumeState = () => {
    const savedVolumeRaw =
      typeof window !== "undefined"
        ? localStorage.getItem("soundclone-volume")
        : null;

    const savedVolume = Number(savedVolumeRaw);

    const contextVolume = Number((currentTrack as any)?.volume);

    const volume = Math.max(
      0,
      Math.min(
        1,
        Number.isFinite(savedVolume)
          ? savedVolume
          : Number.isFinite(contextVolume)
          ? contextVolume
          : 0.5
      )
    );

    return {
      volume,
      muted: volume === 0,
      volumeId: (currentTrack as any)?.volumeId,
    };
  };

  const getTrackId = () => {
    return (track as any)?.id || (track as any)?._id || "";
  };

  const getCurrentTrackId = () => {
    return (currentTrack as any)?.id || (currentTrack as any)?._id || "";
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

        setCurrentTrack({
          ...track,
          isPlaying: true,
          source: "wave",
          currentTime: wavesurfer.getCurrentTime() ?? 0,
          duration: wavesurfer.getDuration() ?? 0,

          volume: (currentTrack as any)?.volume,
          muted: (currentTrack as any)?.muted,
          volumeId: (currentTrack as any)?.volumeId,

          seekTime: undefined,
          seekId: undefined,
        } as any);
      }),

      wavesurfer.on("pause", () => {
        setIsPlaying(false);

        const volumeState = getSyncedVolumeState();

        setCurrentTrack({
          ...track,
          isPlaying: false,
          source: "wave",
          currentTime: wavesurfer.getCurrentTime() ?? 0,
          duration: wavesurfer.getDuration() ?? 0,

          volume: volumeState.volume,
          muted: volumeState.muted,
          volumeId: volumeState.volumeId,

          seekTime: undefined,
          seekId: undefined,
        } as any);
      }),

      wavesurfer.on("finish", () => {
        const finishedDuration = wavesurfer.getDuration() || 0;

        setIsPlaying(false);
        setTime(formatTime(finishedDuration));

        const volumeState = getSyncedVolumeState();

        setCurrentTrack({
          ...track,
          isPlaying: false,
          source: "wave",
          currentTime: finishedDuration,
          duration: finishedDuration,
          completed: true,

          volume: volumeState.volume,
          muted: volumeState.muted,
          volumeId: volumeState.volumeId,

          seekTime: undefined,
          seekId: undefined,
        } as any);
      }),

      wavesurfer.on("decode", async (decodedDuration) => {
        setDuration(formatTime(decodedDuration));

        const trackId = getTrackId();

        if (!trackId || !track) {
          return;
        }

        const volumeState = getSyncedVolumeState();

        const actualVolume = volumeState.muted ? 0 : volumeState.volume;

        /*
         * Áp dụng volume trực tiếp ngay khi
         * WaveSurfer decode xong.
         */
        wavesurfer.setVolume(actualVolume);

        const media =
          typeof (wavesurfer as any).getMediaElement === "function"
            ? (wavesurfer as any).getMediaElement()
            : (wavesurfer as any)?.media;

        if (media) {
          media.volume = volumeState.volume;

          media.muted = volumeState.muted;
        }

        setCurrentTrack({
          ...track,
          isPlaying: false,
          source: "wave",
          currentTime: 0,
          duration: decodedDuration,

          volume: volumeState.volume,
          muted: volumeState.muted,
          volumeId: volumeState.volumeId,

          seekTime: undefined,
          seekId: undefined,
        } as any);

        if (!autoPlay) {
          return;
        }

        try {
          await wavesurfer.play();

          setIsPlaying(true);

          setCurrentTrack({
            ...track,
            isPlaying: true,
            source: "wave",
            currentTime: wavesurfer.getCurrentTime() ?? 0,
            duration: decodedDuration,

            volume: volumeState.volume,
            muted: volumeState.muted,
            volumeId: volumeState.volumeId,

            seekTime: undefined,
            seekId: undefined,
          } as any);

          void handleIncreaseView();
        } catch (error) {
          console.log("Wave autoplay failed:", error);
        }
      }),

      wavesurfer.on("timeupdate", (currentTime) => {
        setTime(formatTime(currentTime));

        const currentSecond = Math.floor(currentTime);

        if (currentSecond === lastSyncSecondRef.current) {
          return;
        }

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

  ///audio sync
  useEffect(() => {
    if (!wavesurfer || !track) return;

    const trackId = getTrackId();
    const currentTrackId = getCurrentTrackId();

    if (!trackId) return;

    if (currentTrackId && currentTrackId !== trackId) {
      return;
    }

    const footerTrack = currentTrack as any;

    /*
     * Luôn đồng bộ volume, kể cả source đang là "wave".
     * Không đặt đoạn này sau điều kiện footer-control.
     */
    const contextVolume = Number(footerTrack?.volume);

    const savedVolume =
      typeof window !== "undefined"
        ? Number(localStorage.getItem("soundclone-volume"))
        : Number.NaN;

    const safeVolume = Math.max(
      0,
      Math.min(
        1,
        Number.isFinite(contextVolume)
          ? contextVolume
          : Number.isFinite(savedVolume)
          ? savedVolume
          : 0.5
      )
    );

    const isMuted = footerTrack?.muted === true || safeVolume === 0;

    const actualVolume = isMuted ? 0 : safeVolume;

    wavesurfer.setVolume(actualVolume);

    const media =
      typeof (wavesurfer as any).getMediaElement === "function"
        ? (wavesurfer as any).getMediaElement()
        : (wavesurfer as any)?.media;

    if (media) {
      media.volume = safeVolume;
      media.muted = isMuted;
    }

    /*
     * Seek và play/pause chỉ nhận lệnh
     * khi thao tác từ footer.
     */
    if (footerTrack?.source !== "footer-control") {
      return;
    }

    if (typeof footerTrack.seekTime === "number") {
      const seekId = footerTrack.seekId ?? footerTrack.seekTime;

      if (lastHandledSeekIdRef.current === seekId) {
        return;
      }

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
      void wavesurfer.play();
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
      Boolean(currentTrackId) &&
      Boolean(trackId) &&
      currentTrackId !== trackId &&
      currentTrack?.isPlaying === true;

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

  const artist = (track as any)?.uploader || {
    _id: (track as any)?.uploaderId,
    id: (track as any)?.uploaderId,
    name: track?.description,
  };

  const artistHref = getUserHref(artist);
  const canOpenArtistProfile = artistHref !== "#";

  return (
    <div
      className="wave-track-page"
      style={{
        marginTop: 20,
      }}
    >
      {/* ========================================
          WAVE TRACK HERO
      ======================================== */}
      <div className="wave-track-card">
        {/* ========================================
            TRACK TOP INFO
        ======================================== */}
        <div className="wave-track-top">
          {/* PLAY BUTTON */}
          <button
            type="button"
            aria-label={isPlaying ? "Pause track" : "Play track"}
            className="wave-track-play"
            onClick={() => {
              onPlayClick();
              handleIncreaseView();
            }}
          >
            {isPlaying === true ? (
              <PauseIcon
                sx={{
                  fontSize: {
                    xs: 25,
                    sm: 30,
                  },

                  color: "#ffffff",
                }}
              />
            ) : (
              <PlayArrowIcon
                sx={{
                  fontSize: {
                    xs: 27,
                    sm: 30,
                  },

                  color: "#ffffff",
                }}
              />
            )}
          </button>

          {/* TRACK META */}
          <div className="wave-track-meta">
            {/* TRACK TITLE */}
            <div className="wave-track-title" title={track?.title}>
              {track?.title || "Unknown track"}
            </div>

            {/* ARTIST */}
            <Link
              href={artistHref}
              onClick={(event) => {
                if (!canOpenArtistProfile) {
                  event.preventDefault();
                }
              }}
              className="wave-track-artist-link"
            >
              <div
                className="wave-track-artist"
                title={track?.description || ""}
              >
                {track?.description || "Unknown artist"}
              </div>
            </Link>
          </div>

          {/* MOBILE COVER */}
          <div className="wave-track-cover-mobile">
            {track?.imgUrl ? (
              <Image
                src={getImageUrl(track.imgUrl)}
                fill
                sizes="96px"
                alt={track?.title || "Track cover"}
                style={{
                  objectFit: "cover",
                }}
              />
            ) : (
              <div className="wave-track-cover-placeholder" />
            )}
          </div>
        </div>

        {/* ========================================
              WAVEFORM VISUALIZER
          ======================================== */}
        <div className="wave-track-wave-area">
          <div ref={containerRef} className="wave-form-container">
            {/* HOVER WAVE */}
            <div ref={hoverRef} className="hover-wave" />

            {/* CURRENT TIME */}
            <div className="time">{time}</div>

            {/* DURATION */}
            <div className="duration">{duration}</div>

            {/* BOTTOM WAVE OVERLAY */}
            <div className="wave-track-overlay" />
          </div>
        </div>

        {/* ========================================
            DESKTOP COVER
        ======================================== */}
        <div className="wave-track-cover-desktop">
          <div className="wave-track-cover-box">
            {track?.imgUrl ? (
              <Image
                src={getImageUrl(track.imgUrl)}
                fill
                sizes="(max-width: 900px) 180px, 280px"
                alt={track?.title || "Track cover"}
                style={{
                  objectFit: "cover",
                }}
              />
            ) : (
              <div className="wave-track-cover-placeholder" />
            )}
          </div>
        </div>
      </div>

      {/* ========================================
          LIKE TRACK
      ======================================== */}
      <div className="wave-track-actions">
        <LikeTrack track={track} />
      </div>

      {/* ========================================
          COMMENTS
      ======================================== */}
      <div className="wave-track-comments">
        <CommentTrack
          track={track}
          comments={comments}
          wavesurfer={wavesurfer}
        />
      </div>

      <style jsx>{`
        /* ========================================
     WAVE TRACK CARD
  ======================================== */

        .wave-track-card {
          position: relative;

          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            280px;
          grid-template-rows:
            auto
            minmax(0, 1fr);

          column-gap: 28px;

          min-height: 400px;

          padding: 28px;

          overflow: hidden;

          border-radius: 16px;

          border: 1px solid rgba(255, 255, 255, 0.08);

          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);

          background: radial-gradient(
              circle at 0% 0%,
              rgba(255, 85, 0, 0.35),
              transparent 35%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(0, 188, 174, 0.22),
              transparent 40%
            ),
            linear-gradient(135deg, #21120d 0%, #181a1b 48%, #0d2523 100%);
        }

        /* ========================================
     TOP INFO
  ======================================== */

        .wave-track-top {
          grid-column: 1;
          grid-row: 1;

          display: flex;

          align-items: flex-start;

          gap: 18px;

          min-width: 0;

          position: relative;

          z-index: 3;
        }

        /* ========================================
     PLAY BUTTON
  ======================================== */

        .wave-track-play {
          width: 52px;
          height: 52px;

          flex: 0 0 52px;

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 0;

          border: 0;

          border-radius: 50%;

          color: #ffffff;

          background: #ff5500;

          cursor: pointer;

          box-shadow: 0 8px 24px rgba(255, 85, 0, 0.28);

          transition: transform 0.18s ease, background-color 0.18s ease;
        }

        .wave-track-play:hover {
          background: #ff6a1a;

          transform: scale(1.04);
        }

        /* ========================================
     TRACK META
  ======================================== */

        .wave-track-meta {
          flex: 1;

          min-width: 0;
        }

        .wave-track-title {
          display: block;

          width: fit-content;

          max-width: 100%;

          padding: 3px 7px;

          overflow: hidden;

          color: #ffffff;

          background: rgba(35, 35, 35, 0.88);

          font-size: 30px;

          font-weight: 800;

          line-height: 1.2;

          white-space: nowrap;

          text-overflow: ellipsis;
        }

        .wave-track-artist-link {
          display: block;

          width: fit-content;

          max-width: 100%;

          margin-top: 9px;

          text-decoration: none;
        }

        .wave-track-artist {
          width: fit-content;

          max-width: 100%;

          padding: 3px 7px;

          overflow: hidden;

          color: #ffffff;

          background: rgba(51, 51, 51, 0.82);

          font-size: 18px;

          font-weight: 600;

          line-height: 1.35;

          white-space: nowrap;

          text-overflow: ellipsis;

          transition: color 0.18s ease;
        }

        .wave-track-artist:hover {
          color: #ff7a2f;
        }

        /* ========================================
     WAVEFORM AREA
  ======================================== */

        .wave-track-wave-area {
          grid-column: 1;

          grid-row: 2;

          position: relative;

          width: 100%;

          min-width: 0;

          min-height: 180px;

          display: flex;

          align-items: flex-end;

          padding-top: 24px;

          z-index: 2;
        }

        /* ========================================
     WAVESURFER CONTAINER
  ======================================== */

        .wave-form-container {
          position: relative;

          display: block;

          width: 100%;

          height: 170px;

          min-width: 0;

          min-height: 170px;

          overflow: visible;

          isolation: isolate;
        }

        /*
   * WaveSurfer render visualizer vào container.
   * Container phải luôn có width + height thực.
   */
        .wave-form-container :global(wave) {
          width: 100% !important;

          height: 100% !important;
        }

        /* ========================================
     WAVE TIME
  ======================================== */

        .time,
        .duration {
          position: absolute;

          bottom: 5px;

          z-index: 10;

          padding: 2px 5px;

          border-radius: 3px;

          color: #ffffff;

          background: rgba(0, 0, 0, 0.65);

          font-size: 10px;

          font-weight: 800;

          line-height: 1.2;

          pointer-events: none;
        }

        .time {
          left: 4px;
        }

        .duration {
          right: 4px;
        }

        /* ========================================
     HOVER WAVE
  ======================================== */

        .hover-wave {
          position: absolute;

          top: 0;

          left: 0;

          width: 0;

          height: 100%;

          z-index: 5;

          pointer-events: none;

          background: rgba(255, 255, 255, 0.035);
        }

        /* ========================================
     WAVE BOTTOM OVERLAY
  ======================================== */

        .wave-track-overlay {
          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          height: 25px;

          z-index: 4;

          pointer-events: none;

          background: linear-gradient(to top, rgba(0, 0, 0, 0.38), transparent);
        }

        /* ========================================
     DESKTOP COVER
  ======================================== */

        .wave-track-cover-desktop {
          grid-column: 2;

          grid-row: 1 / 3;

          display: flex;

          align-items: center;
          justify-content: center;

          min-width: 0;

          position: relative;

          z-index: 2;
        }

        .wave-track-cover-box {
          position: relative;

          width: min(100%, 260px);

          aspect-ratio: 1 / 1;

          overflow: hidden;

          border-radius: 6px;

          background: #111111;

          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.3);
        }

        /* ========================================
     MOBILE COVER
  ======================================== */

        .wave-track-cover-mobile {
          display: none;
        }

        .wave-track-cover-placeholder {
          width: 100%;

          height: 100%;

          background: linear-gradient(135deg, #292929, #151515);
        }

        /* ========================================
     TRACK ACTIONS
  ======================================== */

        .wave-track-actions {
          margin-top: 0;
        }

        /* ========================================
     TABLET
  ======================================== */

        @media (max-width: 899px) {
          .wave-track-card {
            grid-template-columns:
              minmax(0, 1fr)
              190px;

            column-gap: 20px;

            min-height: 340px;

            padding: 22px;
          }

          .wave-track-title {
            font-size: 24px;
          }

          .wave-track-artist {
            font-size: 16px;
          }

          .wave-track-wave-area {
            min-height: 155px;

            padding-top: 20px;
          }

          .wave-form-container {
            height: 145px;

            min-height: 145px;
          }
        }

        /* ========================================
     MOBILE
  ======================================== */

        @media (max-width: 600px) {
          .wave-track-page {
            margin-top: 12px !important;
          }

          /* MOBILE CARD */
          .wave-track-card {
            display: flex;

            flex-direction: column;

            width: 100%;

            min-height: 0;

            padding: 14px;

            border-radius: 13px;

            overflow: hidden;
          }

          /* MOBILE TOP INFO */
          .wave-track-top {
            width: 100%;

            display: grid;

            grid-template-columns:
              40px
              minmax(0, 1fr)
              82px;

            align-items: start;

            gap: 10px;
          }

          /* MOBILE PLAY BUTTON */
          .wave-track-play {
            width: 40px;

            height: 40px;

            flex-basis: 40px;

            box-shadow: 0 6px 16px rgba(255, 85, 0, 0.28);
          }

          /* MOBILE META */
          .wave-track-meta {
            min-width: 0;

            padding-top: 1px;
          }

          .wave-track-title {
            display: block;

            width: fit-content;

            max-width: 100%;

            padding: 2px 5px;

            overflow: hidden;

            font-size: 16px;

            font-weight: 900;

            line-height: 1.3;

            white-space: nowrap;

            text-overflow: ellipsis;
          }

          .wave-track-artist-link {
            width: fit-content;

            max-width: 100%;

            margin-top: 5px;
          }

          .wave-track-artist {
            display: -webkit-box;

            width: fit-content;

            max-width: 100%;

            padding: 2px 5px;

            overflow: hidden;

            font-size: 11.5px;

            font-weight: 700;

            line-height: 1.35;

            white-space: normal;

            -webkit-line-clamp: 2;

            -webkit-box-orient: vertical;
          }

          /* MOBILE COVER */
          .wave-track-cover-mobile {
            position: relative;

            display: block;

            width: 82px;

            height: 82px;

            flex-shrink: 0;

            overflow: hidden;

            border-radius: 6px;

            background: #111111;

            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          }

          .wave-track-cover-desktop {
            display: none;
          }

          /* ========================================
       MOBILE WAVEFORM VISUALIZER
    ======================================== */

          .wave-track-wave-area {
            position: relative;

            display: block;

            width: 100%;

            min-width: 0;

            min-height: 110px;

            margin-top: 16px;

            padding-top: 0;

            overflow: visible;
          }

          .wave-form-container {
            position: relative;

            display: block;

            width: 100%;

            height: 110px;

            min-height: 110px;

            overflow: visible;
          }

          /*
     * Không dùng flex cho container WaveSurfer.
     * Cho visualizer chiếm toàn bộ chiều ngang.
     */
          .wave-form-container :global(wave) {
            display: block !important;

            width: 100% !important;

            height: 110px !important;

            min-height: 110px !important;
          }

          .wave-track-overlay {
            height: 21px;
          }

          .time,
          .duration {
            bottom: 3px;

            padding: 1px 4px;

            font-size: 9px;
          }
        }

        /* ========================================
     SMALL MOBILE
  ======================================== */

        @media (max-width: 380px) {
          .wave-track-card {
            padding: 12px;
          }

          .wave-track-top {
            grid-template-columns:
              38px
              minmax(0, 1fr)
              70px;

            gap: 8px;
          }

          .wave-track-play {
            width: 38px;

            height: 38px;
          }

          .wave-track-cover-mobile {
            width: 70px;

            height: 70px;
          }

          .wave-track-title {
            font-size: 15px;
          }

          .wave-track-artist {
            font-size: 10.5px;
          }

          /* SMALL MOBILE WAVEFORM */
          .wave-track-wave-area {
            min-height: 95px;

            margin-top: 14px;
          }

          .wave-form-container {
            height: 95px;

            min-height: 95px;
          }

          .wave-form-container :global(wave) {
            height: 95px !important;

            min-height: 95px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WaveTrack;
