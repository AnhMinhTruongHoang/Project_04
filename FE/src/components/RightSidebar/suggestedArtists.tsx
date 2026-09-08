"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";

import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";

import {
  followUserApi,
  getArtistLeaderboard,
  getFollowStatusApi,
  unfollowUserApi,
} from "@/utils/api";

import { getUserHref } from "@/utils/actions/navigation";
import { useToast } from "@/utils/toast";

type ArtistItem = {
  _id?: string;
  id?: string;

  name: string;

  email?: string;
  username?: string;

  avatarUrl?: string;
  avatar?: string;

  followers?: number | null;
  following?: number | null;

  tracks?: number | null;
  trackCount?: number | null;
  totalTracks?: number | null;
};

const FALLBACK_ARTISTS: ArtistItem[] = [
  {
    name: "NCS",
    avatar: "/images/user/NCS.jpg",
    followers: 0,
    tracks: 0,
  },
  {
    name: "Unknown Brain",
    avatar: "/images/logo/Sc.png",
    followers: 0,
    tracks: 0,
  },
  {
    name: "Dirty Palm",
    avatar: "/images/logo/Sc.png",
    followers: 0,
    tracks: 0,
  },
];

/*
 * =========================================
 * FORMAT NUMBER
 * =========================================
 */
const formatNumber = (value?: number | null) => {
  const num = Number(value || 0);

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1)}K`;
  }

  return `${num}`;
};

/*
 * =========================================
 * REAL USER ID
 * =========================================
 *
 * Follow API cần ID thật.
 * Không dùng email/name làm ID cho Follow API.
 */
const getArtistUserId = (artist?: ArtistItem | null) => {
  return artist?._id || artist?.id || "";
};

/*
 * Dùng cho React key.
 */
const getArtistKey = (artist: ArtistItem) => {
  return (
    getArtistUserId(artist) || artist.email || artist.username || artist.name
  );
};

const getArtistAvatar = (artist: ArtistItem) => {
  return artist.avatarUrl || artist.avatar || "/images/user/default.png";
};

const getTrackCount = (artist: ArtistItem) => {
  return Number(artist.totalTracks || artist.trackCount || artist.tracks || 0);
};

const shuffleList = <T,>(items: T[]) => {
  return [...items].sort(() => Math.random() - 0.5);
};

const SuggestedArtists = () => {
  const { data: session } = useSession();

  const toast = useToast();

  /*
   * =========================================
   * ARTIST DATA
   * =========================================
   */
  const [artists, setArtists] = useState<ArtistItem[]>([]);

  const [rawArtists, setRawArtists] = useState<ArtistItem[]>([]);

  const [isAllZeroFollowers, setIsAllZeroFollowers] = useState(false);

  /*
   * =========================================
   * FOLLOW STATES
   * =========================================
   *
   * {
   *   artistId: true / false
   * }
   */
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  /*
   * Loading riêng cho từng artist.
   *
   * {
   *   artistId: true / false
   * }
   */
  const [followLoadingMap, setFollowLoadingMap] = useState<
    Record<string, boolean>
  >({});

  /*
   * =========================================
   * CURRENT USER / ACCESS TOKEN
   * =========================================
   */
  const currentUserId =
    (session as any)?.user?._id || (session as any)?.user?.id || "";

  const accessToken =
    (session as any)?.accessToken ||
    (session as any)?.access_token ||
    (session as any)?.user?.access_token ||
    "";

  /*
   * =========================================
   * LOAD SUGGESTED ARTISTS
   * =========================================
   */
  const loadArtists = async () => {
    try {
      const data: ArtistItem[] = await getArtistLeaderboard(10);

      const list: ArtistItem[] = data.length > 0 ? data : FALLBACK_ARTISTS;

      /*
       * Không suggest chính user đang login.
       */
      const filteredList = currentUserId
        ? list.filter((artist) => getArtistUserId(artist) !== currentUserId)
        : list;

      const allZero = filteredList.every(
        (artist) => Number(artist.followers || 0) === 0
      );

      setRawArtists(filteredList);

      setIsAllZeroFollowers(allZero);

      if (allZero) {
        setArtists(shuffleList(filteredList).slice(0, 3));
      } else {
        setArtists(filteredList.slice(0, 3));
      }
    } catch (error) {
      console.error("Fetch suggested artists failed:", error);

      setRawArtists(FALLBACK_ARTISTS);

      setIsAllZeroFollowers(true);

      setArtists(shuffleList(FALLBACK_ARTISTS).slice(0, 3));
    }
  };

  useEffect(() => {
    void loadArtists();
  }, [currentUserId]);

  /*
   * =========================================
   * LOAD FOLLOW STATUS
   * =========================================
   *
   * Sau khi danh sách suggested artists thay đổi,
   * check từng artist xem current user đã follow chưa.
   */
  useEffect(() => {
    if (!accessToken || artists.length === 0) {
      setFollowingMap({});
      return;
    }

    let cancelled = false;

    const loadFollowStatuses = async () => {
      const nextFollowingMap: Record<string, boolean> = {};

      await Promise.all(
        artists.map(async (artist) => {
          const artistId = getArtistUserId(artist);

          /*
           * Fallback artist không có ID thật
           * thì không gọi API.
           */
          if (!artistId) {
            return;
          }

          /*
           * Không cần check follow chính mình.
           */
          if (currentUserId && artistId === currentUserId) {
            return;
          }

          try {
            const response = await getFollowStatusApi(artistId, accessToken);

            if (cancelled) {
              return;
            }

            const following = Boolean(
              response?.data?.following ?? response?.data?.isFollowing
            );

            nextFollowingMap[artistId] = following;

            /*
             * Nếu BE trả follower count mới nhất
             * thì đồng bộ luôn UI.
             */
            if (typeof response?.data?.targetFollowers === "number") {
              const targetFollowers = response.data.targetFollowers;

              setArtists((currentArtists) =>
                currentArtists.map((item) =>
                  getArtistUserId(item) === artistId
                    ? {
                        ...item,
                        followers: targetFollowers,
                      }
                    : item
                )
              );
            }
          } catch (error) {
            console.error(`Cannot load follow status for ${artistId}:`, error);
          }
        })
      );

      if (!cancelled) {
        setFollowingMap((current) => ({
          ...current,
          ...nextFollowingMap,
        }));
      }
    };

    void loadFollowStatuses();

    return () => {
      cancelled = true;
    };
  }, [artists.length, accessToken, currentUserId]);

  /*
   * =========================================
   * FOLLOW / UNFOLLOW
   * =========================================
   */
  const handleToggleFollow = async (artist: ArtistItem) => {
    const artistId = getArtistUserId(artist);

    /*
     * Không có ID thật.
     *
     * Trường hợp FALLBACK_ARTISTS hiện tại
     * không có _id / id.
     */
    if (!artistId) {
      toast.error("Artist account not found.");
      return;
    }

    /*
     * Chưa login.
     */
    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    /*
     * Không follow chính mình.
     */
    if (currentUserId && artistId === currentUserId) {
      toast.error("You cannot follow yourself.");
      return;
    }

    /*
     * Chặn double click.
     */
    if (followLoadingMap[artistId]) {
      return;
    }

    const isFollowing = Boolean(followingMap[artistId]);

    try {
      setFollowLoadingMap((current) => ({
        ...current,
        [artistId]: true,
      }));

      const response = isFollowing
        ? await unfollowUserApi(artistId, accessToken)
        : await followUserApi(artistId, accessToken);

      if (!response?.data) {
        toast.error(response?.message || "Follow failed.");
        return;
      }

      const responseData = response.data;

      const nextFollowing = Boolean(
        responseData.following ?? responseData.isFollowing
      );

      /*
       * Update Following / Follow text.
       */
      setFollowingMap((current) => ({
        ...current,
        [artistId]: nextFollowing,
      }));

      /*
       * Update followers count ngay trên UI.
       */
      setArtists((currentArtists) =>
        currentArtists.map((item) => {
          if (getArtistUserId(item) !== artistId) {
            return item;
          }

          const currentFollowers = Number(item.followers || 0);

          const nextFollowers =
            typeof responseData.targetFollowers === "number"
              ? responseData.targetFollowers
              : nextFollowing
              ? currentFollowers + 1
              : Math.max(currentFollowers - 1, 0);

          return {
            ...item,
            followers: nextFollowers,
          };
        })
      );

      /*
       * Đồng bộ cả rawArtists,
       * tránh Refresh list quay về follower count cũ.
       */

      setRawArtists((currentArtists) =>
        currentArtists.map((item) => {
          if (getArtistUserId(item) !== artistId) {
            return item;
          }

          const currentFollowers = Number(item.followers || 0);

          const nextFollowers =
            typeof responseData.targetFollowers === "number"
              ? responseData.targetFollowers
              : nextFollowing
              ? currentFollowers + 1
              : Math.max(currentFollowers - 1, 0);

          return {
            ...item,
            followers: nextFollowers,
          };
        })
      );

      toast.success(nextFollowing ? "Followed." : "Unfollowed.");
    } catch (error) {
      console.error("Toggle follow failed:", error);

      toast.error("Follow failed.");
    } finally {
      setFollowLoadingMap((current) => ({
        ...current,
        [artistId]: false,
      }));
    }
  };

  /*
   * =========================================
   * REFRESH SUGGESTIONS
   * =========================================
   */
  const handleRefreshList = () => {
    if (isAllZeroFollowers) {
      setArtists(shuffleList(rawArtists).slice(0, 3));

      return;
    }

    void loadArtists();
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.6,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 900,
            color: "#d8d8d8",
            textTransform: "uppercase",
          }}
        >
          Artists You Should Follow
        </Typography>

        <Typography
          onClick={handleRefreshList}
          sx={{
            fontSize: 12,
            color: "#9a9a9a",
            cursor: "pointer",
            userSelect: "none",

            "&:hover": {
              color: "#ffffff",
            },
          }}
        >
          Refresh list
        </Typography>
      </Box>

      {/* ARTISTS */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.7,
        }}
      >
        {artists.map((artist) => {
          const artistId = getArtistUserId(artist);

          const isFollowing = artistId
            ? Boolean(followingMap[artistId])
            : false;

          const followLoading = artistId
            ? Boolean(followLoadingMap[artistId])
            : false;

          const isSelf = Boolean(
            artistId && currentUserId && artistId === currentUserId
          );

          return (
            <Box
              key={getArtistKey(artist)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
              }}
            >
              {/* AVATAR */}
              <Box
                component={Link}
                href={getUserHref(artist)}
                sx={{
                  textDecoration: "none",
                }}
              >
                <Avatar
                  src={getArtistAvatar(artist)}
                  alt={artist.name}
                  sx={{
                    width: 44,
                    height: 44,
                    cursor: "pointer",
                  }}
                />
              </Box>

              {/* INFO */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.4,
                  }}
                >
                  <Typography
                    component={Link}
                    href={getUserHref(artist)}
                    sx={{
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 900,
                      textDecoration: "none",
                      cursor: "pointer",

                      "&:hover": {
                        color: "#ff5500",
                      },
                    }}
                  >
                    {artist.name}
                  </Typography>

                  <VerifiedRoundedIcon
                    sx={{
                      fontSize: 16,
                      color: "#4da3ff",
                    }}
                  />
                </Box>

                {/* STATS */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.3,
                  }}
                >
                  {/* FOLLOWERS */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.3,
                    }}
                  >
                    <PersonRoundedIcon
                      sx={{
                        fontSize: 14,
                        color: "#9a9a9a",
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#9a9a9a",
                      }}
                    >
                      {formatNumber(artist.followers)}
                    </Typography>
                  </Box>

                  {/* TRACKS */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.3,
                    }}
                  >
                    <GraphicEqRoundedIcon
                      sx={{
                        fontSize: 14,
                        color: "#9a9a9a",
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#9a9a9a",
                      }}
                    >
                      {formatNumber(getTrackCount(artist))}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* FOLLOW BUTTON */}
              {!isSelf && (
                <Button
                  size="small"
                  disabled={followLoading || !artistId}
                  onClick={() => handleToggleFollow(artist)}
                  sx={{
                    minWidth: 72,

                    px: 1.2,

                    color: isFollowing ? "#ff5500" : "#ffffff",

                    fontSize: 13,
                    fontWeight: 900,

                    textTransform: "none",

                    backgroundColor: "transparent",

                    "&:hover": {
                      color: isFollowing ? "#ffffff" : "#ff5500",

                      backgroundColor: "transparent",
                    },

                    "&.Mui-disabled": {
                      color: "#666666",
                    },
                  }}
                >
                  {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SuggestedArtists;
