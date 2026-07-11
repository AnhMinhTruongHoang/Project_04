"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

import { convertSlugUrl } from "@/utils/api";
import { getTrackImageUrl } from "@/utils/actions/getAvatar";
import { useToast } from "@/utils/toast";

import ProfileShareDialog from "./profile-share-dialog";
import ProfileEditDialog from "./profile-edit-dialog";

/* ======================================================
   CONFIG
====================================================== */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const DEFAULT_AUDIO = "/audio/DemoS.mp3";

/* ======================================================
   TYPES
====================================================== */

type Props = {
  /**
   * Cách mới: truyền thẳng userId vào.
   */
  userId?: string;

  /**
   * Cách mới nếu component cha đã fetch user sẵn.
   */
  initialUser?: Partial<IUser> | null;

  /**
   * Cách mới nếu component cha đã fetch tracks sẵn.
   */
  initialTracks?: ITrackTop[];

  /**
   * Backward compatible với code cũ:
   * <ProfileMain user={user} tracks={tracks} />
   */
  user?: Partial<IUser> | null;
  tracks?: ITrackTop[];
};

type TabKey =
  | "all"
  | "popular"
  | "tracks"
  | "albums"
  | "playlists"
  | "reposts";

type TabItem = {
  label: string;
  value: TabKey;
};

type ApiRequestOptions = {
  url: string;
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  headers?: Record<string, string>;
  body?: BodyInit | null;
  label: string;
};

/* ======================================================
   TABS
====================================================== */

const tabs: TabItem[] = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Popular tracks",
    value: "popular",
  },
  {
    label: "Tracks",
    value: "tracks",
  },
  {
    label: "Albums",
    value: "albums",
  },
  {
    label: "Playlists",
    value: "playlists",
  },
  {
    label: "Reposts",
    value: "reposts",
  },
];

/* ======================================================
   HELPERS
====================================================== */

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const isArtist = (user?: any) => {
  return String(user?.type || "").toUpperCase() === "ARTIST";
};

const normalizeRouteParam = (value: unknown) => {
  if (Array.isArray(value)) {
    return String(value[0] || "");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
};

const extractList = <T,>(response: any): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.result)) {
    return response.data.result;
  }

  if (Array.isArray(response?.result)) {
    return response.result;
  }

  return [];
};

const extractObject = <T,>(response: any): T | null => {
  if (response?.data && !Array.isArray(response.data)) {
    return response.data as T;
  }

  if (response && typeof response === "object" && !Array.isArray(response)) {
    return response as T;
  }

  return null;
};

const maskHeadersForLog = (headers: Record<string, string> = {}) => {
  return {
    ...headers,
    Authorization: headers.Authorization ? "Bearer ***" : undefined,
  };
};

const apiFetch = async ({
  url,
  method,
  headers = {},
  body = null,
  label,
}: ApiRequestOptions) => {
  console.group(`🚀 ${label}`);
  console.log("URL:", url);
  console.log("Method:", method);
  console.log("Headers:", maskHeadersForLog(headers));
  console.log("Body:", body);
  console.groupEnd();

  const response = await fetch(url, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  console.group(`📥 ${label} RESPONSE`);
  console.log("Status:", response.status);
  console.log("OK:", response.ok);
  console.log("Data:", data);
  console.groupEnd();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || `HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
};

/* ======================================================
   COMPONENT
====================================================== */

const ProfileMain = ({
  userId,
  initialUser = null,
  initialTracks = [],
  user: legacyUser = null,
  tracks: legacyTracks = [],
}: Props) => {
  const toast = useToast();

  const params = useParams() as Record<string, string | string[] | undefined>;

  const { data: session, status: sessionStatus } = useSession();

  const accessToken =
    (session as any)?.accessToken ||
    (session as any)?.access_token ||
    (session as any)?.user?.access_token ||
    "";

  const currentUserId = getItemId((session as any)?.user);

  const routeUserId =
    normalizeRouteParam(params?.id) ||
    normalizeRouteParam(params?.userId) ||
    normalizeRouteParam(params?.profileId) ||
    normalizeRouteParam(params?.slug);

  const initialProfileUser = initialUser || legacyUser || null;

  const initialProfileTracks =
    initialTracks.length > 0 ? initialTracks : legacyTracks || [];

  const resolvedUserId =
    userId || getItemId(initialProfileUser) || routeUserId || "";

  const isOwner = Boolean(
    resolvedUserId && currentUserId && resolvedUserId === currentUserId
  );

  /* ======================================================
     STATE
  ====================================================== */

  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const [profileUser, setProfileUser] = useState<Partial<IUser> | null>(
    initialProfileUser
  );

  const [tracks, setTracks] = useState<ITrackTop[]>(initialProfileTracks);

  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);

  const [loading, setLoading] = useState(true);

  const [playlistsLoading, setPlaylistsLoading] = useState(false);

  const [error, setError] = useState("");

  const [openEdit, setOpenEdit] = useState(false);

  const [openShare, setOpenShare] = useState(false);

  const [followersCount, setFollowersCount] = useState(
    initialProfileUser?.followers ?? 0
  );

  const [isFollowing, setIsFollowing] = useState(false);

  const [followLoading, setFollowLoading] = useState(false);

  /* ======================================================
     DEBUG INPUT
  ====================================================== */

  useEffect(() => {
    console.group("🧩 PROFILE MAIN INPUT");
    console.log("prop userId:", userId);
    console.log("route params:", params);
    console.log("routeUserId:", routeUserId);
    console.log("initialUser:", initialUser);
    console.log("legacyUser:", legacyUser);
    console.log("resolvedUserId:", resolvedUserId);
    console.log("currentUserId:", currentUserId);
    console.log("isOwner:", isOwner);
    console.groupEnd();
  }, [
    userId,
    routeUserId,
    resolvedUserId,
    currentUserId,
    isOwner,
    initialUser,
    legacyUser,
    params,
  ]);

  /* ======================================================
     SYNC INITIAL USER/TRACKS
  ====================================================== */

  useEffect(() => {
    if (initialProfileUser) {
      setProfileUser(initialProfileUser);
      setFollowersCount(initialProfileUser.followers ?? 0);
    }
  }, [initialProfileUser]);

  useEffect(() => {
    if (initialProfileTracks.length > 0) {
      setTracks(initialProfileTracks);
    }
  }, [initialProfileTracks]);

  /* ======================================================
     FETCH USER
  ====================================================== */

  const fetchProfileUser = async () => {
    const url = `${BACKEND_URL}/api/v1/users/${resolvedUserId}`;

    const headers: Record<string, string> = {};

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const json = await apiFetch({
      label: "GET PROFILE USER",
      url,
      method: "GET",
      headers,
    });

    const userData = extractObject<IUser>(json);

    console.log("✅ PROFILE USER EXTRACTED:", userData);

    if (userData) {
      setProfileUser(userData);
      setFollowersCount(userData.followers ?? 0);
    }

    return userData;
  };

  /* ======================================================
     FETCH TRACKS BY USER
  ====================================================== */

  const fetchProfileTracksForm = async () => {
    const url = `${BACKEND_URL}/api/v1/tracks/users?current=1&pageSize=100`;

    const body = new URLSearchParams();
    body.append("id", resolvedUserId);

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const json = await apiFetch({
      label: "GET PROFILE TRACKS FORM",
      url,
      method: "POST",
      headers,
      body: body.toString(),
    });

    const list = extractList<ITrackTop>(json);

    console.log("✅ TRACKS FORM EXTRACTED:", list);

    return list;
  };

  const fetchProfileTracksJson = async () => {
    const url = `${BACKEND_URL}/api/v1/tracks/users?current=1&pageSize=100`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const json = await apiFetch({
      label: "GET PROFILE TRACKS JSON FALLBACK",
      url,
      method: "POST",
      headers,
      body: JSON.stringify({
        id: resolvedUserId,
      }),
    });

    const list = extractList<ITrackTop>(json);

    console.log("✅ TRACKS JSON EXTRACTED:", list);

    return list;
  };

  const fetchProfileTracks = async () => {
    let list = await fetchProfileTracksForm();

    if (!list.length) {
      console.warn(
        "⚠️ Form-urlencoded returned empty tracks. Trying JSON fallback..."
      );

      try {
        const jsonList = await fetchProfileTracksJson();

        if (jsonList.length > 0) {
          list = jsonList;
        }
      } catch (error) {
        console.warn("JSON fallback failed:", error);
      }
    }

    console.table(
      list.map((track, index) => ({
        index: index + 1,
        id: getItemId(track),
        title: track.title,
        countPlay: track.countPlay ?? 0,
        imgUrl: track.imgUrl,
        trackUrl: track.trackUrl,
      }))
    );

    setTracks(list);

    return list;
  };

  /* ======================================================
     LOAD PROFILE DATA
  ====================================================== */

  useEffect(() => {
    if (!resolvedUserId) {
      console.error("❌ ProfileMain missing user id:", {
        userId,
        initialUser,
        legacyUser,
        routeUserId,
        params,
      });

      setError("User ID is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
          fetchProfileUser(),
          fetchProfileTracks(),
        ]);

        if (cancelled) {
          return;
        }

        const userResult = results[0];
        const tracksResult = results[1];

        if (userResult.status === "rejected") {
          console.error("❌ User API failed:", userResult.reason);

          if (!initialProfileUser) {
            throw userResult.reason;
          }
        }

        if (tracksResult.status === "rejected") {
          console.error("❌ Tracks API failed:", tracksResult.reason);

          if (!initialProfileTracks.length) {
            setTracks([]);
          }
        }
      } catch (err) {
        console.error("❌ PROFILE LOAD ERROR:", err);

        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId, accessToken]);

  /* ======================================================
     FOLLOW STATUS
  ====================================================== */

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (!resolvedUserId || !accessToken || isOwner) {
      setIsFollowing(false);
      return;
    }

    let cancelled = false;

    const fetchFollowStatus = async () => {
      try {
        const url = `${BACKEND_URL}/api/v1/users/${resolvedUserId}/follow-status`;

        const json = await apiFetch({
          label: "GET FOLLOW STATUS",
          url,
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (cancelled) {
          return;
        }

        const followState =
          json?.data?.isFollowing ?? json?.isFollowing ?? false;

        setIsFollowing(Boolean(followState));
      } catch (error) {
        console.error("❌ FOLLOW STATUS ERROR:", error);
      }
    };

    fetchFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId, accessToken, isOwner, sessionStatus]);

  /* ======================================================
     PLAYLISTS
  ====================================================== */

  useEffect(() => {
    if (activeTab !== "playlists" && activeTab !== "all") {
      return;
    }

    /**
     * Endpoint hiện tại:
     * GET /api/v1/playlists/by-user
     *
     * Endpoint này không nhận userId, nên chỉ gọi đúng cho profile chính chủ.
     */
    if (!isOwner || !accessToken) {
      setPlaylists([]);
      return;
    }

    let cancelled = false;

    const fetchPlaylists = async () => {
      try {
        setPlaylistsLoading(true);

        const url = `${BACKEND_URL}/api/v1/playlists/by-user?current=1&pageSize=100`;

        const json = await apiFetch({
          label: "GET MY PLAYLISTS",
          url,
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (cancelled) {
          return;
        }

        const list = extractList<IPlaylist>(json);

        console.log("✅ PLAYLISTS EXTRACTED:", list);

        setPlaylists(list);
      } catch (error) {
        console.error("❌ PLAYLIST ERROR:", error);

        if (!cancelled) {
          setPlaylists([]);
        }
      } finally {
        if (!cancelled) {
          setPlaylistsLoading(false);
        }
      }
    };

    fetchPlaylists();

    return () => {
      cancelled = true;
    };
  }, [activeTab, isOwner, accessToken]);

  /* ======================================================
     DERIVED DATA
  ====================================================== */

  const popularTracks = useMemo(() => {
    return [...tracks]
      .sort((a, b) => (b.countPlay ?? 0) - (a.countPlay ?? 0))
      .slice(0, 10);
  }, [tracks]);

  const displayName = profileUser?.name || profileUser?.email || "User";

  const showArtistBadge = isArtist(profileUser);

  const getTrackHref = (track: ITrackTop) => {
    const trackId = getItemId(track);
    const title = track.title || "untitled";

    return `/track/${convertSlugUrl(title)}-${trackId}.html?audio=${encodeURIComponent(
      track.trackUrl || DEFAULT_AUDIO
    )}`;
  };

  /* ======================================================
     FOLLOW / UNFOLLOW
  ====================================================== */

  const handleToggleFollow = async () => {
    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (isOwner) {
      toast.error("You cannot follow yourself.");
      return;
    }

    const nextState = !isFollowing;
    const action = nextState ? "follow" : "unfollow";

    try {
      setFollowLoading(true);

      const url = `${BACKEND_URL}/api/v1/users/${resolvedUserId}/${action}`;

      const json = await apiFetch({
        label: `POST ${action.toUpperCase()}`,
        url,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setIsFollowing(nextState);

      const newFollowers = json?.data?.followers;

      if (typeof newFollowers === "number") {
        setFollowersCount(newFollowers);
      } else {
        setFollowersCount((current) =>
          Math.max(0, current + (nextState ? 1 : -1))
        );
      }

      toast.success(nextState ? "Followed." : "Unfollowed.");
    } catch (error) {
      console.error("❌ FOLLOW ERROR:", error);
      toast.error("Follow failed.");
    } finally {
      setFollowLoading(false);
    }
  };

  /* ======================================================
     RENDER HELPERS
  ====================================================== */

  const renderEmpty = (text: string) => {
    return (
      <Box
        sx={{
          minHeight: 260,
          border: "1px dashed rgba(255,255,255,0.14)",
          borderRadius: 3,
          backgroundColor: "#111314",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "#9a9a9a",
          fontWeight: 800,
          p: 3,
        }}
      >
        {text}
      </Box>
    );
  };

  const renderTracks = (list: ITrackTop[], emptyText = "No tracks found.") => {
    if (!list.length) {
      return renderEmpty(emptyText);
    }

    return (
      <Stack spacing={2}>
        {list.map((track, index) => (
          <Box
            key={getItemId(track) || index}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "64px 1fr",
                md: "80px 1fr auto",
              },
              gap: 2,
              alignItems: "center",
              p: 1.5,
              backgroundColor: "#111314",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 2,
            }}
          >
            <Box
              component="img"
              src={getTrackImageUrl(track.imgUrl)}
              alt={track.title || "Track image"}
              sx={{
                width: {
                  xs: 64,
                  md: 80,
                },
                height: {
                  xs: 64,
                  md: 80,
                },
                objectFit: "cover",
                borderRadius: 1,
                backgroundColor: "#222",
              }}
            />

            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.4,
                }}
              >
                <Typography
                  sx={{
                    color: "#999",
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </Typography>

                {showArtistBadge && (
                  <VerifiedRoundedIcon
                    sx={{
                      fontSize: 15,
                      color: "#4da3ff",
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>

              <Typography
                component={Link}
                href={getTrackHref(track)}
                sx={{
                  display: "block",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: 16,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    color: "#ff5500",
                  },
                }}
              >
                {track.title || "Untitled track"}
              </Typography>

              <Typography
                sx={{
                  color: "#777",
                  fontSize: 12,
                  mt: 0.5,
                }}
              >
                Plays: {track.countPlay ?? 0}
              </Typography>
            </Box>

            <Box
              component={Link}
              href={getTrackHref(track)}
              sx={{
                display: {
                  xs: "none",
                  md: "flex",
                },
                width: 42,
                height: 42,
                borderRadius: "50%",
                backgroundColor: "#ff5500",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                textDecoration: "none",
                "&:hover": {
                  backgroundColor: "#ff6a00",
                },
              }}
            >
              <PlayArrowRoundedIcon />
            </Box>
          </Box>
        ))}
      </Stack>
    );
  };

  const renderPlaylists = () => {
    if (playlistsLoading) {
      return (
        <Box
          sx={{
            py: 8,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!isOwner) {
      return renderEmpty(
        "Backend hiện tại chưa hỗ trợ lấy playlist theo userId của profile khác."
      );
    }

    if (!playlists.length) {
      return renderEmpty("No playlists found.");
    }

    return (
      <Stack spacing={2}>
        {playlists.map((playlist, index) => {
          const playlistAny = playlist as any;

          return (
            <Box
              key={getItemId(playlist) || index}
              sx={{
                p: 2,
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "#111314",
                borderRadius: 2,
              }}
            >
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 900,
                }}
              >
                {playlistAny.title || "Untitled playlist"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: "#888",
                  fontSize: 13,
                }}
              >
                {Array.isArray(playlistAny.tracks)
                  ? playlistAny.tracks.length
                  : 0}{" "}
                tracks
              </Typography>
            </Box>
          );
        })}
      </Stack>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <Box>
            <Typography
              sx={{
                color: "#fff",
                fontSize: 18,
                fontWeight: 900,
                mb: 2,
              }}
            >
              Tracks
            </Typography>

            {renderTracks(tracks)}

            {isOwner && (
              <Box sx={{ mt: 4 }}>
                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 900,
                    mb: 2,
                  }}
                >
                  Playlists
                </Typography>

                {renderPlaylists()}
              </Box>
            )}
          </Box>
        );

      case "popular":
        return renderTracks(popularTracks, "No popular tracks found.");

      case "tracks":
        return renderTracks(tracks);

      case "albums":
        return renderEmpty("Albums API is not available.");

      case "playlists":
        return renderPlaylists();

      case "reposts":
        return renderEmpty("Reposts API is not available.");

      default:
        return null;
    }
  };

  /* ======================================================
     LOADING / ERROR
  ====================================================== */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ff5555",
          fontWeight: 900,
        }}
      >
        {error}
      </Box>
    );
  }

  /* ======================================================
     JSX
  ====================================================== */

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "1fr 330px",
        },
        gap: 4,
        px: {
          xs: 2,
          md: 0,
        },
        py: 3,
      }}
    >
      {/* LEFT */}
      <Box sx={{ minWidth: 0 }}>
        {/* TABS + ACTIONS */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          <Stack
            direction="row"
            spacing={2.5}
            role="tablist"
            sx={{
              overflowX: "auto",
            }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.value;

              return (
                <Typography
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    console.log("TAB CLICK:", tab.value);
                    setActiveTab(tab.value);
                  }}
                  sx={{
                    color: active ? "#fff" : "#aaa",
                    fontSize: 14,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                    pb: 1.2,
                    cursor: "pointer",
                    borderBottom: active
                      ? "2px solid rgba(255,255,255,0.5)"
                      : "2px solid transparent",
                    "&:hover": {
                      color: "#fff",
                    },
                  }}
                >
                  {tab.label}
                </Typography>
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1}>
            {!isOwner && (
              <Button
                disabled={followLoading}
                onClick={handleToggleFollow}
                sx={{
                  height: 36,
                  px: 1.8,
                  borderRadius: "5px",
                  color: "#fff",
                  backgroundColor: isFollowing ? "#ff5500" : "#242729",
                  textTransform: "none",
                  fontWeight: 900,
                  "&:hover": {
                    backgroundColor: isFollowing ? "#ff6a00" : "#303335",
                  },
                  "&.Mui-disabled": {
                    color: "#777",
                    backgroundColor: "#181A1B",
                  },
                }}
              >
                {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </Button>
            )}

            <Button
              startIcon={<ShareRoundedIcon />}
              onClick={() => setOpenShare(true)}
              sx={{
                height: 36,
                px: 1.8,
                borderRadius: "5px",
                color: "#fff",
                backgroundColor: "#242729",
                textTransform: "none",
                fontWeight: 900,
                "&:hover": {
                  backgroundColor: "#303335",
                },
              }}
            >
              Share
            </Button>

            {isOwner && (
              <Button
                startIcon={<EditRoundedIcon />}
                onClick={() => setOpenEdit(true)}
                sx={{
                  height: 36,
                  px: 1.8,
                  borderRadius: "5px",
                  color: "#fff",
                  backgroundColor: "#242729",
                  textTransform: "none",
                  fontWeight: 900,
                  "&:hover": {
                    backgroundColor: "#303335",
                  },
                }}
              >
                Edit
              </Button>
            )}
          </Stack>
        </Box>

        {/* TAB CONTENT */}
        {renderTabContent()}
      </Box>

      {/* RIGHT SIDEBAR */}
      <Box
        sx={{
          display: {
            xs: "none",
            lg: "block",
          },
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          pl: 3,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            mb: 3,
          }}
        >
          {[
            ["Followers", followersCount],
            ["Following", profileUser?.following ?? 0],
            ["Tracks", tracks.length],
          ].map(([label, value]) => (
            <Box key={String(label)}>
              <Typography
                sx={{
                  color: "#999",
                  fontSize: 13,
                  fontWeight: 900,
                  mb: 0.5,
                }}
              >
                {label}
              </Typography>

              <Typography
                sx={{
                  color: "#fff",
                  fontSize: 30,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider
          sx={{
            borderColor: "rgba(255,255,255,0.08)",
            mb: 2,
          }}
        />

        <Typography
          sx={{
            color: "#888",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          Legal · Privacy · Cookie Policy · Cookie Manager · Imprint · Artist
          Resources · Newsroom · Topics · Charts · Transparency Reports
        </Typography>
      </Box>

      {/* DIALOGS */}
      <ProfileShareDialog
        open={openShare}
        onClose={() => setOpenShare(false)}
        user={profileUser}
      />

      <ProfileEditDialog
        open={Boolean(isOwner && openEdit)}
        onClose={() => setOpenEdit(false)}
        user={profileUser}
      />
    </Box>
  );
};

export default ProfileMain;