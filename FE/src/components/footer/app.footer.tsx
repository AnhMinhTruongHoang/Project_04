"use client";

import { useTrackContext } from "@/lib/track.wrapper";
import { useHasMounted } from "@/utils/customHook";
import { Container } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import { useRef, useEffect } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

const AppFooter = () => {
  const hasMounted = useHasMounted();
  const playerRef = useRef(null);
  const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

  const getTrackImage = () => {
    const imgUrl = currentTrack?.imgUrl;

    if (!imgUrl) return "/audio/SC.png";
    if (imgUrl.startsWith("http")) return imgUrl;
    if (imgUrl.startsWith("/")) return imgUrl;

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/${imgUrl}`;
  };

  useEffect(() => {
    if (currentTrack?.isPlaying === false) {
      //@ts-ignore
      playerRef?.current?.audio?.current?.pause();
    }

    if (currentTrack?.isPlaying === true) {
      //@ts-ignore
      if (playerRef?.current?.audio?.current) {
        //@ts-ignore
        playerRef.current.audio.current.currentTime = 0;
      }

      //@ts-ignore
      playerRef?.current?.audio?.current?.play();
    }
  }, [currentTrack]);

  if (!hasMounted) return <></>;

  return (
    <>
      {currentTrack._id && (
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
                  setCurrentTrack({ ...currentTrack, isPlaying: true });
                }}
                onPause={() => {
                  setCurrentTrack({ ...currentTrack, isPlaying: false });
                }}
              />

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
      )}
    </>
  );
};

export default AppFooter;
