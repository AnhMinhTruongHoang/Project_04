"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";

import { useTrackContext } from "@/lib/track.wrapper";
import { convertSlugUrl } from "@/utils/api";
import { getTrackImageUrl } from "@/utils/actions/getImages";
import { useToast } from "@/utils/toast";

type Props = {
  user: Partial<IUser> | null;
  tracks: ITrackTop[];
  isOwner?: boolean;
};

const DEFAULT_AUDIO = "/audio/DemoS.mp3";

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const getUploaderId = (track?: ITrackTop | null) => {
  return track?.uploaderId || getItemId(track?.uploader) || "";
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

const formatRelativeTime = (value?: string) => {
  if (!value) return "";

  const createdAt = new Date(value).getTime();

  if (!Number.isFinite(createdAt)) {
    return "";
  }

  const diff = Math.max(Date.now() - createdAt, 0);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return "just now";

  if (diff < hour) {
    const amount = Math.floor(diff / minute);
    return `${amount} minute${amount === 1 ? "" : "s"} ago`;
  }

  if (diff < day) {
    const amount = Math.floor(diff / hour);
    return `${amount} hour${amount === 1 ? "" : "s"} ago`;
  }

  if (diff < month) {
    const amount = Math.floor(diff / day);
    return `${amount} day${amount === 1 ? "" : "s"} ago`;
  }

  if (diff < year) {
    const amount = Math.floor(diff / month);
    return `${amount} month${amount === 1 ? "" : "s"} ago`;
  }

  const amount = Math.floor(diff / year);
  return `${amount} year${amount === 1 ? "" : "s"} ago`;
};

const WaveBars = ({ seed = 1 }: { seed?: number }) => {
  return (
    <Box
      sx={{
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 100 }).map((_, index) => {
        const height = 10 + ((index * 23 + seed * 11 + (index % 8) * 7) % 42);

        return (
          <Box
            key={index}
            sx={{
              width: 2,
              minWidth: 2,
              height,
              borderRadius: "2px",
              backgroundColor: index < 80 ? "#b8b8b8" : "#777777",
              opacity: index < 80 ? 0.95 : 0.4,
            }}
          />
        );
      })}
    </Box>
  );
};

const getRankStyle = (rank: number) => {
  if (rank === 1) {
    return {
      color: "#ffd166",
      backgroundColor: "rgba(255,209,102,0.12)",
      borderColor: "rgba(255,209,102,0.35)",
    };
  }

  if (rank === 2) {
    return {
      color: "#d6d6d6",
      backgroundColor: "rgba(214,214,214,0.1)",
      borderColor: "rgba(214,214,214,0.28)",
    };
  }

  if (rank === 3) {
    return {
      color: "#d8945f",
      backgroundColor: "rgba(216,148,95,0.12)",
      borderColor: "rgba(216,148,95,0.3)",
    };
  }

  return {
    color: "#b8b8b8",
    backgroundColor: "#242729",
    borderColor: "rgba(255,255,255,0.08)",
  };
};

const ProfilePopularTracksTab = ({ user, tracks, isOwner = false }: Props) => {
  const toast = useToast();

  const { setCurrentTrack } = useTrackContext() as ITrackContext;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<5 | 10>(5);

  const displayName = user?.name || user?.email || "Sound Clone user";

  const popularTracks = useMemo(() => {
    return [...tracks]
      .filter((track) => {
        if (track.isDeleted === true) {
          return false;
        }

        if (isOwner) {
          return true;
        }

        const approvalStatus = String(track.approvalStatus || "").toUpperCase();

        return !approvalStatus || approvalStatus === "APPROVED";
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
      });
  }, [tracks, isOwner]);
  const totalPages = Math.max(Math.ceil(popularTracks.length / pageSize), 1);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const visibleTracks = useMemo(() => {
    const start = (page - 1) * pageSize;

    return popularTracks.slice(start, start + pageSize);
  }, [popularTracks, page, pageSize]);

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

  if (!popularTracks.length) {
    return (
      <Box
        sx={{
          minHeight: 260,
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
        <EmojiEventsRoundedIcon
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
          No popular tracks yet
        </Typography>

        <Typography
          sx={{
            mt: 0.6,
            color: "#999999",
            fontSize: 14,
          }}
        >
          {isOwner
            ? "Your most played tracks will appear here."
            : `${displayName} has no public tracks yet.`}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 2.5,
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          gap: 2,
          flexDirection: {
            xs: "column",
            sm: "row",
          },
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            Popular tracks
          </Typography>

          <Typography
            sx={{
              mt: 0.35,
              color: "#969696",
              fontSize: 13,
            }}
          >
            Ranked by total plays from highest to lowest.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              color: "#9a9a9a",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Show
          </Typography>

          <FormControl size="small">
            <Select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as 5 | 10);
              }}
              sx={{
                minWidth: 78,
                height: 36,
                color: "#ffffff",
                backgroundColor: "#242729",
                fontWeight: 800,

                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.1)",
                },

                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.26)",
                },

                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ff5500",
                },

                "& .MuiSvgIcon-root": {
                  color: "#ffffff",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "#181A1B",
                    color: "#ffffff",
                  },
                },
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <Stack spacing={1.4}>
        {visibleTracks.map((track, index) => {
          const absoluteIndex = (page - 1) * pageSize + index;

          const rank = absoluteIndex + 1;
          const rankStyle = getRankStyle(rank);
          const trackHref = getTrackHref(track);
          const approvalStatus = String(
            track.approvalStatus || ""
          ).toUpperCase();

          return (
            <Box
              key={getItemId(track) || rank}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "42px 58px minmax(0,1fr)",
                  md: "42px 70px minmax(0,1fr) auto",
                },
                alignItems: "center",
                gap: {
                  xs: 1.2,
                  md: 1.6,
                },
                p: 1.4,
                borderRadius: 2,
                backgroundColor: "#111314",
                border: "1px solid rgba(255,255,255,0.07)",

                "&:hover": {
                  backgroundColor: "#151819",
                  borderColor: "rgba(255,85,0,0.2)",
                },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: rankStyle.color,
                  backgroundColor: rankStyle.backgroundColor,
                  border: `1px solid ${rankStyle.borderColor}`,
                  fontSize: 14,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {rank <= 3 ? (
                  <EmojiEventsRoundedIcon sx={{ fontSize: 18 }} />
                ) : (
                  rank
                )}
              </Box>

              <Box
                sx={{
                  position: "relative",
                  width: {
                    xs: 56,
                    md: 68,
                  },
                  height: {
                    xs: 56,
                    md: 68,
                  },
                  overflow: "hidden",
                  borderRadius: "4px",
                  backgroundColor: "#0d0d0d",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
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
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <IconButton
                  onClick={() => handlePlay(track)}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    m: "auto",
                    width: 34,
                    height: 34,
                    color: "#ffffff",
                    backgroundColor: "rgba(255,85,0,0.9)",
                    opacity: 0,
                    transition: "0.16s ease",

                    ".MuiBox-root:hover &": {
                      opacity: 1,
                    },

                    "&:hover": {
                      backgroundColor: "#ff5500",
                    },
                  }}
                >
                  <PlayArrowRoundedIcon
                    sx={{
                      fontSize: 26,
                      ml: "1px",
                    }}
                  />
                </IconButton>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    component={Link}
                    href={trackHref}
                    sx={{
                      color: "#ffffff",
                      fontSize: 15,
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
                    {track.title}
                  </Typography>

                  {isOwner &&
                    approvalStatus &&
                    approvalStatus !== "APPROVED" && (
                      <Chip
                        size="small"
                        label={
                          approvalStatus === "REJECTED" ? "Rejected" : "Pending"
                        }
                        sx={{
                          height: 20,
                          color:
                            approvalStatus === "REJECTED"
                              ? "#ff6666"
                              : "#ffb347",
                          backgroundColor:
                            approvalStatus === "REJECTED"
                              ? "rgba(255,102,102,0.1)"
                              : "rgba(255,179,71,0.1)",
                          border:
                            approvalStatus === "REJECTED"
                              ? "1px solid rgba(255,102,102,0.28)"
                              : "1px solid rgba(255,179,71,0.28)",
                          fontSize: 10,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      />
                    )}
                </Box>

                <Typography
                  sx={{
                    mt: 0.2,
                    color: "#9f9f9f",
                    fontSize: 12,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {track.uploader?.name || displayName}
                  {track.categoryName || track.category
                    ? ` · ${track.categoryName || track.category}`
                    : ""}
                  {track.createdAt
                    ? ` · ${formatRelativeTime(track.createdAt)}`
                    : ""}
                </Typography>

                <Box
                  sx={{
                    mt: 0.7,
                    display: {
                      xs: "none",
                      sm: "block",
                    },
                  }}
                >
                  <WaveBars seed={rank} />
                </Box>
              </Box>

              <Box
                sx={{
                  gridColumn: {
                    xs: "1 / -1",
                    md: "auto",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: {
                    xs: "space-between",
                    md: "flex-end",
                  },
                  gap: 1.6,
                  color: "#999999",
                  flexWrap: "wrap",
                }}
              >
                <Stack direction="row" spacing={1.4}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.3,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    <PlayArrowRoundedIcon sx={{ fontSize: 16 }} />
                    {formatCount(track.countPlay)}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.3,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    <FavoriteBorderRoundedIcon sx={{ fontSize: 15 }} />
                    {formatCount(track.countLike)}
                  </Box>

                  <Box
                    sx={{
                      display: {
                        xs: "none",
                        sm: "flex",
                      },
                      alignItems: "center",
                      gap: 0.3,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    <GraphicEqRoundedIcon sx={{ fontSize: 15 }} />
                    {track.categoryName || track.category || "Track"}
                  </Box>
                </Stack>

                <Stack direction="row" spacing={0.7}>
                  <Tooltip title="Share">
                    <IconButton
                      onClick={() => handleShare(track)}
                      sx={{
                        width: 34,
                        height: 34,
                        color: "#ffffff",
                        borderRadius: "4px",
                        backgroundColor: "#242729",

                        "&:hover": {
                          backgroundColor: "#303335",
                        },
                      }}
                    >
                      <ShareRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Copy link">
                    <IconButton
                      onClick={() => handleCopy(track)}
                      sx={{
                        width: 34,
                        height: 34,
                        color: "#ffffff",
                        borderRadius: "4px",
                        backgroundColor: "#242729",

                        "&:hover": {
                          backgroundColor: "#303335",
                        },
                      }}
                    >
                      <ContentCopyRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Stack>

      {popularTracks.length > pageSize && (
        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, nextPage) => {
              setPage(nextPage);

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#b8b8b8",
                fontWeight: 800,
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "#242729",
              },

              "& .MuiPaginationItem-root:hover": {
                color: "#ffffff",
                backgroundColor: "#303335",
              },

              "& .Mui-selected": {
                color: "#ffffff !important",
                backgroundColor: "#ff5500 !important",
                borderColor: "#ff5500 !important",
              },
            }}
          />
        </Box>
      )}

      <Typography
        sx={{
          mt: 2,
          color: "#777777",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        Showing {Math.min((page - 1) * pageSize + 1, popularTracks.length)}–
        {Math.min(page * pageSize, popularTracks.length)} of{" "}
        {popularTracks.length} tracks
      </Typography>
    </Box>
  );
};

export default ProfilePopularTracksTab;
