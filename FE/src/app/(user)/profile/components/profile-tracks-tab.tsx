"use client";

import { useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";

import { convertSlugUrl, getAllTracksApi } from "@/utils/api";
import { getTrackImageUrl } from "@/utils/actions/getImages";
import { useToast } from "@/utils/toast";
import { useTrackContext } from "@/lib/track.wrapper";
import { Stack } from "@mui/material";

type Props = {};

const DEFAULT_AUDIO = "/audio/DemoS.mp3";

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const formatCount = (value?: number) => {
  const count = Number(value || 0);

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count >= 100_000 ? 0 : 1)}K`;
  }

  return String(count);
};

const WaveBars = ({ seed = 1 }: { seed?: number }) => {
  return (
    <Box
      sx={{
        height: 46,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        overflow: "hidden",
      }}
    >
      {Array.from({
        length: 52,
      }).map((_, index) => {
        const height = 8 + ((index * 19 + seed * 17 + (index % 7) * 9) % 34);

        return (
          <Box
            key={index}
            sx={{
              width: 2,
              minWidth: 2,
              height,
              borderRadius: "2px",
              backgroundColor: index < 43 ? "#b8b8b8" : "#777777",
              opacity: index < 43 ? 0.95 : 0.35,
            }}
          />
        );
      })}
    </Box>
  );
};

const ProfileTracksTab = (_props: Props) => {
  const toast = useToast();

  const { setCurrentTrack } = useTrackContext() as ITrackContext;

  const [allTracks, setAllTracks] = useState<ITrackTop[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await getAllTracksApi();

        if (cancelled) {
          return;
        }

        const data = response?.data as any;

        const result: ITrackTop[] = Array.isArray(data)
          ? data
          : data?.result ?? [];

        setAllTracks(result);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Load track leaderboard failed:", error);

        setAllTracks([]);
        setLoadError("Cannot load track leaderboard.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const leaderboardTracks = useMemo(() => {
    return [...allTracks]
      .filter((track) => {
        if (track.isDeleted === true) {
          return false;
        }

        const status = String(track.approvalStatus || "").toUpperCase();

        if (status && status !== "APPROVED") {
          return false;
        }

        return Number(track.countPlay || 0) > 0;
      })
      .sort((first, second) => {
        const playDifference =
          Number(second.countPlay || 0) - Number(first.countPlay || 0);

        if (playDifference !== 0) {
          return playDifference;
        }

        const likeDifference =
          Number(second.countLike || 0) - Number(first.countLike || 0);

        if (likeDifference !== 0) {
          return likeDifference;
        }

        return (
          new Date(second.createdAt || 0).getTime() -
          new Date(first.createdAt || 0).getTime()
        );
      })
      .slice(0, 10);
  }, [allTracks]);

  const mainTrack = leaderboardTracks[0];

  const handlePlay = (track: ITrackTop) => {
    const trackId = getItemId(track);

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
  };

  if (loading) {
    return (
      <Box>
        <Typography
          component="h2"
          sx={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 900,
            mb: 1.5,
          }}
        >
          Top tracks leaderboard
        </Typography>

        <Box
          sx={{
            minHeight: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            size={26}
            sx={{
              color: "#ff5500",
            }}
          />
        </Box>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box>
        <Typography
          component="h2"
          sx={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 900,
            mb: 1.5,
          }}
        >
          Top tracks leaderboard
        </Typography>

        <Box
          sx={{
            minHeight: 130,
            border: "1px dashed rgba(255,255,255,0.14)",
            borderRadius: 1.5,
            backgroundColor: "#111314",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 2,
          }}
        >
          <QueueMusicRoundedIcon
            sx={{
              fontSize: 34,
              color: "#ff5500",
              mb: 0.7,
            }}
          />

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            Leaderboard unavailable
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: "#999999",
              fontSize: 11.5,
            }}
          >
            {loadError}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!mainTrack) {
    return (
      <Box>
        <Typography
          component="h2"
          sx={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 900,
            mb: 1.5,
          }}
        >
          Top tracks leaderboard
        </Typography>

        <Box
          sx={{
            minHeight: 130,
            border: "1px dashed rgba(255,255,255,0.14)",
            borderRadius: 1.5,
            backgroundColor: "#111314",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 2,
          }}
        >
          <EmojiEventsRoundedIcon
            sx={{
              fontSize: 34,
              color: "#ff5500",
              mb: 0.7,
            }}
          />

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            No leaderboard data yet
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: "#999999",
              fontSize: 11.5,
            }}
          >
            Tracks need at least one play to appear here.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        component="h2"
        sx={{
          color: "#ffffff",
          fontSize: 18,
          fontWeight: 900,
          mb: 0.2,
        }}
      >
        Top tracks leaderboard
      </Typography>

      <Typography
        sx={{
          color: "#8d8d8d",
          fontSize: 11.5,
          lineHeight: 1.45,
          mb: 1.6,
        }}
      >
        Top 10 approved tracks ranked by total plays.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "105px minmax(0, 1fr)",
          gap: 1.5,
          alignItems: "start",
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => handlePlay(mainTrack)}
          sx={{
            position: "relative",
            width: 105,
            height: 105,
            p: 0,
            border: 0,
            borderRadius: "4px",
            overflow: "hidden",
            backgroundColor: "#111111",
            cursor: "pointer",
            boxShadow: "0 12px 25px rgba(0,0,0,0.24)",

            "&:hover .main-play": {
              transform: "translate(-50%, -50%) scale(1.06)",
            },
          }}
        >
          <Box
            component="img"
            src={
              mainTrack.imgUrl
                ? getTrackImageUrl(mainTrack.imgUrl)
                : "/images/logo/Sc.png"
            }
            alt={mainTrack.title}
            onError={(event: any) => {
              event.currentTarget.src = "/images/logo/Sc.png";
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          <Box
            className="main-play"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 42,
              height: 42,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              backgroundColor: "#ff5500",
              transform: "translate(-50%, -50%)",
              transition: "transform 0.15s ease",
              boxShadow: "0 7px 18px rgba(0,0,0,0.35)",
            }}
          >
            <PlayArrowRoundedIcon
              sx={{
                fontSize: 31,
                ml: "2px",
              }}
            />
          </Box>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 0.8,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: "#a8a8a8",
                  fontSize: 11.5,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {mainTrack.uploader?.name ||
                  mainTrack.description ||
                  "Unknown artist"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {mainTrack.title}
              </Typography>
            </Box>

            <Box
              sx={{
                ml: "auto",
                flexShrink: 0,
                minWidth: 27,
                height: 20,
                px: 0.7,
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffd166",
                backgroundColor: "rgba(255,209,102,0.1)",
                border: "1px solid rgba(255,209,102,0.28)",
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              #1
            </Box>
          </Box>

          <Box sx={{ mt: 0.5 }}>
            <WaveBars seed={1} />
          </Box>

          <Box
            sx={{
              mt: 0.35,
              display: "flex",
              alignItems: "center",
              gap: 0.35,
              color: "#919191",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            <PlayArrowRoundedIcon
              sx={{
                fontSize: 14,
              }}
            />
            {formatCount(mainTrack.countPlay)} plays
          </Box>
        </Box>
      </Box>

      <Stack
        spacing={0.2}
        sx={{
          mt: 1.6,
        }}
      >
        {leaderboardTracks.map((track, index) => {
          const trackId = getItemId(track);

          const artistName =
            track.uploader?.name || track.description || "Unknown artist";

          return (
            <Box
              key={trackId || index}
              component="button"
              type="button"
              onClick={() => handlePlay(track)}
              sx={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "24px 30px minmax(0, 1fr) auto",
                alignItems: "center",
                gap: 0.8,
                minHeight: 39,
                px: 0.35,
                py: 0.25,
                border: 0,
                borderRadius: 1,
                color: "inherit",
                backgroundColor: "transparent",
                textAlign: "left",
                fontFamily: "inherit",
                cursor: "pointer",

                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.04)",
                },

                "&:hover .leaderboard-title": {
                  color: "#ff5500",
                },
              }}
            >
              <Typography
                component="span"
                sx={{
                  color:
                    index === 0
                      ? "#ffd166"
                      : index === 1
                      ? "#d8d8d8"
                      : index === 2
                      ? "#d8945f"
                      : "#8b8b8b",
                  fontSize: 12,
                  fontWeight: 900,
                  textAlign: "center",
                }}
              >
                {index + 1}
              </Typography>

              <Box
                component="img"
                src={
                  track.imgUrl
                    ? getTrackImageUrl(track.imgUrl)
                    : "/images/logo/Sc.png"
                }
                alt={track.title}
                onError={(event: any) => {
                  event.currentTarget.src = "/images/logo/Sc.png";
                }}
                sx={{
                  width: 28,
                  height: 28,
                  objectFit: "cover",
                  borderRadius: "2px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />

              <Typography
                component="span"
                className="leaderboard-title"
                sx={{
                  minWidth: 0,
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 800,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s ease",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    color: "#999999",
                    fontWeight: 700,
                  }}
                >
                  {artistName}
                  {" · "}
                </Box>

                {track.title}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.2,
                  color: "#8e8e8e",
                  fontSize: 10.5,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                <PlayArrowRoundedIcon
                  sx={{
                    fontSize: 13,
                  }}
                />

                {formatCount(track.countPlay)}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ProfileTracksTab;
