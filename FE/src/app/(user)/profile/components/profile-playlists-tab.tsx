"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

import { convertSlugUrl, sendRequest } from "@/utils/api";
import { getTrackImageUrl } from "@/utils/actions/getImages";
import { useToast } from "@/utils/toast";

type Props = {
  user: Partial<IUser> | null;
  isOwner?: boolean;
};

const DEFAULT_AUDIO = "/audio/DemoS.mp3";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getItemId = (item?: any) => item?._id || item?.id || "";

const getPlaylistOwnerId = (playlist?: IPlaylist | null) =>
  playlist?.userId || getItemId(playlist?.user) || "";

const isTrackObject = (track: unknown): track is ITrackTop => {
  if (typeof track !== "object" || track === null) return false;

  const item = track as any;
  return Boolean((item._id || item.id) && item.title);
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

const getPlaylistTracks = (playlist: IPlaylist) =>
  ((playlist.tracks || []) as unknown[]).filter(isTrackObject);

const formatRelativeTime = (value?: string) => {
  if (!value) return "";

  const createdTime = new Date(value).getTime();
  if (!Number.isFinite(createdTime)) return "";

  const diff = Math.max(Date.now() - createdTime, 0);
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

const formatPlayCount = (count?: number) => {
  const value = Number(count || 0);

  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`;
  }

  return String(value);
};

const WaveBars = ({ seed = 1 }: { seed?: number }) => {
  return (
    <Box
      sx={{
        height: 70,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        overflow: "hidden",
        py: 0.5,
      }}
    >
      {Array.from({ length: 115 }).map((_, index) => {
        const height = 12 + ((index * 17 + seed * 13 + (index % 7) * 9) % 52);

        return (
          <Box
            key={index}
            sx={{
              width: 2,
              minWidth: 2,
              height,
              borderRadius: "2px",
              backgroundColor: index < 92 ? "#b7b7b7" : "#767676",
              opacity: index < 92 ? 0.95 : 0.4,
            }}
          />
        );
      })}
    </Box>
  );
};

const ProfilePlaylistsTab = ({ user, isOwner = false }: Props) => {
  const toast = useToast();
  const { data: session } = useSession();

  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const profileUserId = getItemId(user);

  const accessToken =
    (session as any)?.accessToken ||
    (session as any)?.access_token ||
    (session as any)?.user?.access_token;

  const displayName = user?.name || user?.email || "Sound Clone user";

  useEffect(() => {
    if (!profileUserId) {
      setPlaylists([]);
      setLoading(false);
      setErrorMessage("Profile user not found.");
      return;
    }

    let cancelled = false;

    const loadPlaylists = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const headers: Record<string, string> = {};

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await sendRequest<
          IBackendRes<IModelPaginate<IPlaylist> | IPlaylist[]>
        >({
          url: `${BACKEND_URL}/api/v1/playlists`,
          method: "GET",
          queryParams: {
            current: 1,
            pageSize: 100,
          },
          headers,
          nextOption: {
            cache: "no-store",
          },
        });

        if (cancelled) return;

        if (response?.error || Number(response?.statusCode) >= 400) {
          setErrorMessage(response?.message || "Cannot load playlists.");
          setPlaylists([]);
          return;
        }

        const responseData = response?.data as any;
        const result: IPlaylist[] = Array.isArray(responseData)
          ? responseData
          : responseData?.result || [];

        const profilePlaylists = result.filter((playlist) => {
          const belongsToProfile =
            getPlaylistOwnerId(playlist) === profileUserId;
          const isPlaylist = !Boolean((playlist as any)?.isAlbum);
          const isVisible = isOwner || playlist.isPublic !== false;

          return belongsToProfile && isPlaylist && isVisible;
        });

        setPlaylists(profilePlaylists);
      } catch (error) {
        if (cancelled) return;

        console.error("Load profile playlists failed:", error);
        setPlaylists([]);
        setErrorMessage("Cannot load playlists.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPlaylists();

    return () => {
      cancelled = true;
    };
  }, [profileUserId, accessToken, isOwner]);

  const sortedPlaylists = useMemo(() => {
    return [...playlists].sort((first, second) => {
      const firstTime = new Date(first.createdAt || 0).getTime();
      const secondTime = new Date(second.createdAt || 0).getTime();
      return secondTime - firstTime;
    });
  }, [playlists]);

  const getShareUrl = (playlist: IPlaylist) => {
    if (typeof window === "undefined") return "";

    return `${window.location.origin}${
      window.location.pathname
    }#playlist-${getItemId(playlist)}`;
  };

  const handleShare = async (playlist: IPlaylist) => {
    const url = getShareUrl(playlist);
    if (!url) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: playlist.title,
          text: `Listen to ${playlist.title} on Sound Clone`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Playlist link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Cannot share playlist.");
    }
  };

  const handleCopy = async (playlist: IPlaylist) => {
    const url = getShareUrl(playlist);
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Playlist link copied.");
    } catch {
      toast.error("Cannot copy playlist link.");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={30} sx={{ color: "#ff5500" }} />
      </Box>
    );
  }

  if (errorMessage || !sortedPlaylists.length) {
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
        <QueueMusicRoundedIcon sx={{ fontSize: 52, color: "#ff5500", mb: 1 }} />

        <Typography sx={{ color: "#ffffff", fontWeight: 900, fontSize: 19 }}>
          {errorMessage ? "Playlist unavailable" : "No playlists yet"}
        </Typography>

        <Typography sx={{ mt: 0.6, color: "#999999", fontSize: 14 }}>
          {errorMessage ||
            (isOwner
              ? "Create your first playlist to show it on your profile."
              : `${displayName} has not published any playlists.`)}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      {sortedPlaylists.map((playlist, playlistIndex) => {
        const playlistId = getItemId(playlist);
        const tracks = getPlaylistTracks(playlist);
        const previewTracks = tracks.slice(0, 5);
        const firstTrack = tracks[0];
        const coverSrc = firstTrack?.imgUrl
          ? getTrackImageUrl(firstTrack.imgUrl)
          : "/images/logo/Sc.png";
        const relativeTime = formatRelativeTime(playlist.createdAt);

        return (
          <Box
            id={`playlist-${playlistId}`}
            key={playlistId || `${playlist.title}-${playlistIndex}`}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "170px minmax(0, 1fr)" },
              gap: { xs: 2, md: 3 },
              pb: 4,
              borderBottom:
                playlistIndex === sortedPlaylists.length - 1
                  ? "none"
                  : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box
              sx={{
                width: { xs: 170, md: "100%" },
                maxWidth: 170,
                aspectRatio: "1 / 1",
                overflow: "hidden",
                borderRadius: "4px",
                backgroundColor: "#111111",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 16px 34px rgba(0,0,0,0.28)",
              }}
            >
              <Box
                component="img"
                src={coverSrc}
                alt={playlist.title}
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
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                {firstTrack ? (
                  <Box
                    component={Link}
                    href={getTrackHref(firstTrack)}
                    sx={{
                      width: 42,
                      height: 42,
                      mt: 0.2,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      backgroundColor: "#ff5500",
                      textDecoration: "none",
                      flexShrink: 0,
                      "&:hover": { backgroundColor: "#ff6a00" },
                    }}
                  >
                    <PlayArrowRoundedIcon sx={{ fontSize: 32, ml: "2px" }} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      mt: 0.2,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#7d7d7d",
                      backgroundColor: "#242729",
                      flexShrink: 0,
                    }}
                  >
                    <PlayArrowRoundedIcon sx={{ fontSize: 30 }} />
                  </Box>
                )}

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
                    {displayName}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                    <Typography
                      sx={{
                        color: "#ffffff",
                        fontSize: { xs: 15, md: 16 },
                        fontWeight: 900,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {playlist.title}
                    </Typography>

                    <Tooltip
                      title={
                        playlist.isPublic
                          ? "Public playlist"
                          : "Private playlist"
                      }
                    >
                      {playlist.isPublic ? (
                        <PublicRoundedIcon
                          sx={{ color: "#8f8f8f", fontSize: 15 }}
                        />
                      ) : (
                        <LockRoundedIcon
                          sx={{ color: "#8f8f8f", fontSize: 15 }}
                        />
                      )}
                    </Tooltip>
                  </Box>
                </Box>

                {relativeTime && (
                  <Typography
                    sx={{
                      ml: "auto",
                      color: "#9a9a9a",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {relativeTime}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mt: 1.6 }}>
                <WaveBars seed={playlistIndex + 1} />
              </Box>

              <Stack spacing={0.35} sx={{ mt: 1.2 }}>
                {previewTracks.map((track, index) => (
                  <Box
                    key={getItemId(track) || index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "32px 30px minmax(0, 1fr) auto",
                      alignItems: "center",
                      gap: 1,
                      minHeight: 38,
                      px: 0.5,
                      borderRadius: 1,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.035)" },
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
                        "&:hover": { color: "#ff5500" },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ color: "#a8a8a8", fontWeight: 700 }}
                      >
                        {track.uploader?.name || displayName}
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
                      {formatPlayCount(track.countPlay)}
                    </Box>
                  </Box>
                ))}

                {!previewTracks.length && (
                  <Box
                    sx={{
                      minHeight: 72,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8f8f8f",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    This playlist has no tracks.
                  </Box>
                )}
              </Stack>

              {tracks.length > 5 && (
                <Typography
                  sx={{
                    display: "inline-block",
                    mt: 1.4,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  View {tracks.length} tracks
                </Typography>
              )}

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 2.2, flexWrap: "wrap", rowGap: 1 }}
              >
                <Tooltip title="Share">
                  <IconButton
                    onClick={() => handleShare(playlist)}
                    sx={actionButtonStyle}
                  >
                    <ShareRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Copy link">
                  <IconButton
                    onClick={() => handleCopy(playlist)}
                    sx={actionButtonStyle}
                  >
                    <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                {isOwner && (
                  <Tooltip title="Edit playlist">
                    <IconButton sx={actionButtonStyle}>
                      <EditRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title="Like">
                  <IconButton
                    sx={{
                      ...actionButtonStyle,
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
                  <IconButton sx={actionButtonStyle}>
                    <MoreHorizRoundedIcon sx={{ fontSize: 19 }} />
                  </IconButton>
                </Tooltip>

                {isOwner && (
                  <Button
                    component={Link}
                    href="/playlist"
                    sx={{
                      ml: { xs: 0, sm: "auto !important" },
                      minHeight: 36,
                      px: 1.8,
                      borderRadius: "999px",
                      color: "#ffffff",
                      textTransform: "none",
                      fontWeight: 800,
                      backgroundColor: "#242729",
                      "&:hover": { backgroundColor: "#303335" },
                    }}
                  >
                    Manage playlist
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};

const actionButtonStyle = {
  width: 40,
  height: 36,
  color: "#ffffff",
  borderRadius: "4px",
  backgroundColor: "#242729",
  "&:hover": {
    backgroundColor: "#303335",
  },
};

export default ProfilePlaylistsTab;
