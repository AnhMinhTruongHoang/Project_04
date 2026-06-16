"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWavesurfer } from "@/utils/customHook";
import { WaveSurferOptions } from "wavesurfer.js";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import "../../styles/wave.scss";
import { Avatar, Tooltip } from "@mui/material";
import { useTrackContext } from "@/lib/track.wrapper";
import { sendRequest } from "@/utils/api";
import CommentTrack from "./comment.track";
import { useRouter } from "next/navigation";
import Image from "next/image";

import LikeTrack from "./like.track";
interface IProps {
  track: ITrackTop | null;
  comments: ITrackComment[];
}

const WaveTrack = (props: IProps) => {
  const { track, comments } = props;
  const router = useRouter();
  const firstViewRef = useRef(true);
  const searchParams = useSearchParams();
  const fileName = searchParams.get("audio");
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState<string>("0:00");
  const [duration, setDuration] = useState<string>("0:00");
  const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

  ///
  const getInitials = (name?: string | null, email?: string | null) => {
    const value = name?.trim() || email?.trim() || "User";
    const words = value.split(" ").filter(Boolean);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return value.slice(0, 2).toUpperCase();
  };

  const getUserAvatarUrl = (user?: Partial<IUser> | null) => {
    const avatar =
      (user as any)?.avatar ||
      (user as any)?.avatarUrl ||
      (user as any)?.image ||
      "";

    if (!avatar) return "";

    if (avatar.startsWith("http")) return avatar;
    if (avatar.startsWith("/")) return avatar;

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/${avatar}`;
  };
  ///

  const optionsMemo = useMemo((): Omit<WaveSurferOptions, "container"> => {
    let gradient, progressGradient;
    if (typeof window !== "undefined") {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      // Define the waveform gradient
      gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35);
      gradient.addColorStop(0, "#656666"); // Top color
      gradient.addColorStop((canvas.height * 0.7) / canvas.height, "#656666"); // Top color
      gradient.addColorStop(
        (canvas.height * 0.7 + 1) / canvas.height,
        "#ffffff"
      ); // White line
      gradient.addColorStop(
        (canvas.height * 0.7 + 2) / canvas.height,
        "#ffffff"
      ); // White line
      gradient.addColorStop(
        (canvas.height * 0.7 + 3) / canvas.height,
        "#B1B1B1"
      ); // Bottom color
      gradient.addColorStop(1, "#B1B1B1"); // Bottom color

      // Define the progress gradient
      progressGradient = ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height * 1.35
      );
      progressGradient.addColorStop(0, "#EE772F"); // Top color
      progressGradient.addColorStop(
        (canvas.height * 0.7) / canvas.height,
        "#EB4926"
      ); // Top color
      progressGradient.addColorStop(
        (canvas.height * 0.7 + 1) / canvas.height,
        "#ffffff"
      ); // White line
      progressGradient.addColorStop(
        (canvas.height * 0.7 + 2) / canvas.height,
        "#ffffff"
      ); // White line
      progressGradient.addColorStop(
        (canvas.height * 0.7 + 3) / canvas.height,
        "#F6B094"
      ); // Bottom color
      progressGradient.addColorStop(1, "#F6B094"); // Bottom color
    }

    return {
      waveColor: gradient,
      progressColor: progressGradient,
      height: 100,
      barWidth: 3,
      url: `/api?audio=${fileName}`,
    };
  }, []);
  const wavesurfer = useWavesurfer(containerRef, optionsMemo);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Initialize wavesurfer when the container mounts
  // or any of the props change
  useEffect(() => {
    if (!wavesurfer) return;
    setIsPlaying(false);

    const hover = hoverRef.current!;
    const waveform = containerRef.current!;
    waveform.addEventListener(
      "pointermove",
      (e) => (hover.style.width = `${e.offsetX}px`)
    );

    const subscriptions = [
      wavesurfer.on("play", () => setIsPlaying(true)),
      wavesurfer.on("pause", () => setIsPlaying(false)),
      wavesurfer.on("decode", (duration) => {
        setDuration(formatTime(duration));
      }),
      wavesurfer.on("timeupdate", (currentTime) => {
        setTime(formatTime(currentTime));
      }),
      wavesurfer.once("interaction", () => {
        wavesurfer.play();
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer]);

  // On play button click
  const onPlayClick = useCallback(() => {
    if (wavesurfer) {
      wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
    }
  }, [wavesurfer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secondsRemainder = Math.round(seconds) % 60;
    const paddedSeconds = `0${secondsRemainder}`.slice(-2);
    return `${minutes}:${paddedSeconds}`;
  };
  const calLeft = (moment: number) => {
    const currentDuration = wavesurfer?.getDuration() ?? 0;

    if (!currentDuration) return "0%";

    const percent = (moment / currentDuration) * 100;
    const safePercent = Math.min(100, Math.max(0, percent));

    return `${safePercent}%`;
  };

  useEffect(() => {
    if (wavesurfer && currentTrack.isPlaying) {
      wavesurfer.pause();
    }
  }, [currentTrack]);

  useEffect(() => {
    if (track?._id && !currentTrack?._id)
      setCurrentTrack({ ...track, isPlaying: false });
  }, [track]);

  const handleIncreaseView = async () => {
    if (firstViewRef.current) {
      await sendRequest<IBackendRes<IModelPaginate<ITrackLike>>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/increase-view`,
        method: "POST",
        body: {
          trackId: track?._id,
        },
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
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          gap: 15,
          padding: 20,
          height: 400,
          background:
            "linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)",
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
                  if (track && wavesurfer) {
                    setCurrentTrack({ ...currentTrack, isPlaying: false });
                  }
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
                // background: "#ccc"
                backdropFilter: "brightness(0.5)",
              }}
            >
              .
            </div>
            <div className="comments" style={{ position: "relative" }}>
              {comments?.map((item) => {
                const avatarUrl = getUserAvatarUrl(item.user);

                return (
                  <Tooltip title={item.content} arrow key={item._id}>
                    <Avatar
                      src={avatarUrl}
                      alt={
                        item.user?.name || item.user?.email || "User comment"
                      }
                      onPointerMove={() => {
                        const hover = hoverRef.current;
                        if (!hover) return;

                        hover.style.width = calLeft(item.moment);
                      }}
                      sx={{
                        position: "absolute",
                        top: 71,
                        left: calLeft(item.moment),
                        zIndex: 20,
                        width: 22,
                        height: 22,
                        bgcolor: "#ff5500",
                        color: "#ffffff",
                        fontSize: 8,
                        fontWeight: 900,
                        border: "1px solid rgba(255,255,255,0.9)",
                        cursor: "pointer",
                      }}
                    >
                      {getInitials(item.user?.name, item.user?.email)}
                    </Avatar>
                  </Tooltip>
                );
              })}
            </div>
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
              src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/images/${track?.imgUrl}`}
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
          comments={comments}
          track={track}
          wavesurfer={wavesurfer}
        />
      </div>
    </div>
  );
};

export default WaveTrack;
