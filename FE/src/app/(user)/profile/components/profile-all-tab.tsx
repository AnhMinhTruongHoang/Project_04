"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";

import { useTrackContext } from "@/lib/track.wrapper";
import { convertSlugUrl } from "@/utils/api";
import { getTrackImageUrl } from "@/utils/actions/getImages";
import { useToast } from "@/utils/toast";

type Props = {
  user: Partial<IUser> | null;
  tracks: ITrackTop[];
  isOwner?: boolean;
};

type HistoryItem = {
  track: ITrackTop;
  listenedAt: number;
};

const DEFAULT_AUDIO = "/audio/DemoS.mp3";

const HISTORY_KEYS = [
  "soundclone-listening-history",
  "soundclone-history",
  "listening-history",
];

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const getTrackHref = (track: ITrackTop) => {
  const trackId = getItemId(track);

  if (!trackId) return "#";

  return `/track/${convertSlugUrl(
    track.title
  )}-${trackId}.html?audio=${encodeURIComponent(
    track.trackUrl || DEFAULT_AUDIO
  )}`;
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

const normalizeHistoryTime = (item: any, fallbackIndex: number) => {
  const rawValue =
    item?.listenedAt ||
    item?.playedAt ||
    item?.timestamp ||
    item?.createdAt ||
    item?.updatedAt;

  const dateValue = new Date(rawValue || 0).getTime();

  if (Number.isFinite(dateValue) && dateValue > 0) {
    return dateValue;
  }

  return Date.now() - fallbackIndex;
};

const parseHistoryValue = (
  rawValue: string,
  availableTracks: ITrackTop[]
): HistoryItem[] => {
  try {
    const parsed = JSON.parse(rawValue);

    const rawItems = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
      ? parsed.items
      : Array.isArray(parsed?.history)
      ? parsed.history
      : Array.isArray(parsed?.tracks)
      ? parsed.tracks
      : [];

    const trackMap = new Map(
      availableTracks.map((track) => [getItemId(track), track])
    );

    return rawItems
      .map((item: any, index: number) => {
        const rawTrack =
          item?.track && typeof item.track === "object" ? item.track : item;

        const trackId = getItemId(rawTrack) || item?.trackId || item?.id || "";

        const completeTrack = trackMap.get(trackId) || rawTrack;

        if (
          !completeTrack ||
          !getItemId(completeTrack) ||
          !completeTrack.title
        ) {
          return null;
        }

        return {
          track: completeTrack as ITrackTop,
          listenedAt: normalizeHistoryTime(item, index),
        };
      })
      .filter(Boolean) as HistoryItem[];
  } catch {
    return [];
  }
};

const readListeningHistory = (availableTracks: ITrackTop[]): HistoryItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const allHistoryItems = HISTORY_KEYS.flatMap((key) => {
    const rawValue = localStorage.getItem(key);

    return rawValue ? parseHistoryValue(rawValue, availableTracks) : [];
  });

  const uniqueTracks = new Map<string, HistoryItem>();

  allHistoryItems
    .sort((first, second) => second.listenedAt - first.listenedAt)
    .forEach((item) => {
      const trackId = getItemId(item.track);

      if (trackId && !uniqueTracks.has(trackId)) {
        uniqueTracks.set(trackId, item);
      }
    });

  return Array.from(uniqueTracks.values()).slice(0, 5);
};

const WaveBars = ({ seed = 1 }: { seed?: number }) => {
  return (
    <Box
      sx={{
        height: 72,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        overflow: "hidden",
      }}
    >
      {Array.from({
        length: 115,
      }).map((_, index) => {
        const height = 12 + ((index * 19 + seed * 17 + (index % 7) * 9) % 54);

        return (
          <Box
            key={index}
            sx={{
              width: 2,
              minWidth: 2,
              height,
              borderRadius: "2px",
              backgroundColor: index < 94 ? "#b8b8b8" : "#777777",
              opacity: index < 94 ? 0.95 : 0.35,
            }}
          />
        );
      })}
    </Box>
  );
};

const ProfileAllTab = ({ user, tracks, isOwner = false }: Props) => {
  const toast = useToast();

  const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const displayName = user?.name || user?.email || "Sound Clone user";

  const currentTrackId = getItemId(currentTrack);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isOwner) {
      setRecentHistory([]);
      return;
    }

    const refreshHistory = () => {
      setRecentHistory(readListeningHistory(tracks));
    };

    refreshHistory();

    window.addEventListener("storage", refreshHistory);

    window.addEventListener("soundclone-history-updated", refreshHistory);

    return () => {
      window.removeEventListener("storage", refreshHistory);

      window.removeEventListener("soundclone-history-updated", refreshHistory);
    };
  }, [mounted, isOwner, tracks, currentTrackId]);

  const recentTracks = useMemo(
    () => recentHistory.map((item) => item.track).slice(0, 5),
    [recentHistory]
  );

  const mainTrack = recentTracks[0];

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

  const getShareUrl = (track: ITrackTop) => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}${getTrackHref(track)}`;
  };

  const handleShare = async (track: ITrackTop) => {
    const url = getShareUrl(track);

    if (!url) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: track.title,
          text: `Listen to ${track.title} on Sound Clone`,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Track link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error("Cannot share track.");
    }
  };

  const handleCopy = async (track: ITrackTop) => {
    const url = getShareUrl(track);

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Track link copied.");
    } catch {
      toast.error("Cannot copy track link.");
    }
  };

  if (!mounted) {
    return null;
  }

  if (!isOwner) {
    return (
      <Box
        sx={{
          minHeight: 250,
          border: "1px dashed rgba(255,255,255,0.14)",
          borderRadius: 2,
          backgroundColor: "#111314",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 3,
        }}
      >
        <HistoryRoundedIcon
          sx={{
            fontSize: 52,
            color: "#ff5500",
            mb: 1,
          }}
        />

        <Typography
          sx={{
            color: "#ffffff",
            fontSize: 19,
            fontWeight: 900,
          }}
        >
          Listening history is private
        </Typography>

        <Typography
          sx={{
            mt: 0.6,
            color: "#999999",
            fontSize: 14,
          }}
        >
          Only {displayName} can view recently played tracks.
        </Typography>
      </Box>
    );
  }

  if (!mainTrack) {
    return (
      <Box
        sx={{
          minHeight: 250,
          border: "1px dashed rgba(255,255,255,0.14)",
          borderRadius: 2,
          backgroundColor: "#111314",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 3,
        }}
      >
        <HistoryRoundedIcon
          sx={{
            fontSize: 52,
            color: "#ff5500",
            mb: 1,
          }}
        />

        <Typography
          sx={{
            color: "#ffffff",
            fontSize: 19,
            fontWeight: 900,
          }}
        >
          No listening history yet
        </Typography>

        <Typography
          sx={{
            mt: 0.6,
            color: "#999999",
            fontSize: 14,
          }}
        >
          Your five most recently played tracks will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        component="h2"
        sx={{
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 900,
          mb: 2,
        }}
      >
        Recent
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "170px minmax(0, 1fr)",
          },
          gap: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Box
          component={Link}
          href={getTrackHref(mainTrack)}
          sx={{
            width: {
              xs: 170,
              md: "100%",
            },
            maxWidth: 170,
            aspectRatio: "1 / 1",
            borderRadius: "4px",
            overflow: "hidden",
            backgroundColor: "#111111",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 16px 34px rgba(0,0,0,0.28)",
            textDecoration: "none",
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
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <IconButton
              onClick={() => handlePlay(mainTrack)}
              sx={{
                width: 44,
                height: 44,
                mt: 0.2,
                color: "#ffffff",
                backgroundColor: "#ff5500",
                flexShrink: 0,

                "&:hover": {
                  backgroundColor: "#ff6a00",
                },
              }}
            >
              <PlayArrowRoundedIcon
                sx={{
                  fontSize: 34,
                  ml: "2px",
                }}
              />
            </IconButton>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: "#b8b8b8",
                  fontSize: 13,
                  fontWeight: 800,
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
                component={Link}
                href={getTrackHref(mainTrack)}
                sx={{
                  display: "block",
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 900,
                  textDecoration: "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",

                  "&:hover": {
                    color: "#ff5500",
                  },
                }}
              >
                {mainTrack.title}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <WaveBars seed={1} />
          </Box>

          <Stack spacing={0.35} sx={{ mt: 1.2 }}>
            {recentTracks.map((track, index) => (
              <Box
                key={getItemId(track) || index}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "30px 30px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 1,
                  minHeight: 39,
                  px: 0.5,
                  borderRadius: 1,

                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.035)",
                  },
                }}
              >
                <Typography
                  sx={{
                    color: "#b8b8b8",
                    fontSize: 14,
                    fontWeight: 900,
                    textAlign: "right",
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
                  component={Link}
                  href={getTrackHref(track)}
                  sx={{
                    minWidth: 0,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 800,
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",

                    "&:hover": {
                      color: "#ff5500",
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      color: "#a8a8a8",
                      fontWeight: 700,
                    }}
                  >
                    {track.uploader?.name ||
                      track.description ||
                      "Unknown artist"}
                    {" · "}
                  </Box>

                  {track.title}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.3,
                    color: "#9a9a9a",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <PlayArrowRoundedIcon sx={{ fontSize: 15 }} />

                  {formatCount(track.countPlay)}
                </Box>
              </Box>
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: 2.2,
              flexWrap: "wrap",
              rowGap: 1,
            }}
          >
            <Tooltip title="Share">
              <IconButton
                onClick={() => handleShare(mainTrack)}
                sx={{
                  width: 40,
                  height: 36,
                  color: "#ffffff",
                  borderRadius: "4px",
                  backgroundColor: "#242729",

                  "&:hover": {
                    backgroundColor: "#303335",
                  },
                }}
              >
                <ShareRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Copy link">
              <IconButton
                onClick={() => handleCopy(mainTrack)}
                sx={{
                  width: 40,
                  height: 36,
                  color: "#ffffff",
                  borderRadius: "4px",
                  backgroundColor: "#242729",

                  "&:hover": {
                    backgroundColor: "#303335",
                  },
                }}
              >
                <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Like">
              <IconButton
                sx={{
                  width: 40,
                  height: 36,
                  color: "#ffffff",
                  borderRadius: "4px",
                  backgroundColor: "#242729",

                  "&:hover": {
                    color: "#ff5500",
                    backgroundColor: "#303335",
                  },
                }}
              >
                <FavoriteBorderRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="More">
              <IconButton
                sx={{
                  width: 40,
                  height: 36,
                  color: "#ffffff",
                  borderRadius: "4px",
                  backgroundColor: "#242729",

                  "&:hover": {
                    backgroundColor: "#303335",
                  },
                }}
              >
                <MoreHorizRoundedIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileAllTab;
