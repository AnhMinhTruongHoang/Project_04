"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { convertSlugUrl, sendRequest } from "@/utils/api";
import { useToast } from "@/utils/toast";
import { getTrackImageUrl } from "@/utils/actions/getAvatar";
import ProfileShareDialog from "./profile-share-dialog";
import ProfileEditDialog from "./profile-edit-dialog";

type Props = {
  user: Partial<IUser> | null;
  tracks: ITrackTop[];
};

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const ProfileMain = ({ user, tracks }: Props) => {
  const DEFAULT_AUDIO = "/audio/DemoS.mp3";

  const toast = useToast();
  const { data: session } = useSession();

  const displayName = user?.name || user?.email || "User";
  const mainTrack = tracks[0];

  const profileUserId = getItemId(user);
  const currentUserId = getItemId((session as any)?.user);
  const isOwner = Boolean(profileUserId && currentUserId === profileUserId);

  const [openEdit, setOpenEdit] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [followersCount, setFollowersCount] = useState(user?.followers ?? 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setFollowersCount(user?.followers ?? 0);

    if (!profileUserId) return;

    const followedUsers = JSON.parse(
      localStorage.getItem("soundclone-followed-users") || "[]"
    ) as string[];

    setIsFollowing(followedUsers.includes(profileUserId));
  }, [profileUserId, user?.followers]);

  const getTrackHref = (track: ITrackTop) => {
    const trackId = getItemId(track);

    return `/track/${convertSlugUrl(
      track.title
    )}-${trackId}.html?audio=${encodeURIComponent(
      track.trackUrl || DEFAULT_AUDIO
    )}`;
  };

  const saveFollowState = (userId: string, followed: boolean) => {
    const followedUsers = JSON.parse(
      localStorage.getItem("soundclone-followed-users") || "[]"
    ) as string[];

    const nextUsers = followed
      ? Array.from(new Set([...followedUsers, userId]))
      : followedUsers.filter((id) => id !== userId);

    localStorage.setItem(
      "soundclone-followed-users",
      JSON.stringify(nextUsers)
    );
  };

  const handleToggleFollow = async () => {
    const accessToken =
      (session as any)?.accessToken ||
      (session as any)?.access_token ||
      (session as any)?.user?.access_token;

    if (!profileUserId) {
      toast.error("User not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (isOwner) {
      toast.error("You cannot follow yourself.");
      return;
    }

    const nextFollowState = !isFollowing;

    try {
      setFollowLoading(true);

      const res = await sendRequest<IBackendRes<IUser>>({
        url: `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/v1/users/${profileUserId}/${
          nextFollowState ? "follow" : "unfollow"
        }`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        setIsFollowing(nextFollowState);
        saveFollowState(profileUserId, nextFollowState);
        setFollowersCount(res.data.followers ?? followersCount);

        toast.success(nextFollowState ? "Followed." : "Unfollowed.");
        return;
      }

      toast.error(res?.message || "Follow failed.");
    } catch (error) {
      toast.error("Follow failed.");
    } finally {
      setFollowLoading(false);
    }
  };

  const WaveBars = () => {
    return (
      <Box
        sx={{
          height: 58,
          display: "flex",
          alignItems: "center",
          gap: "2px",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 90 }).map((_, index) => {
          const height = 14 + ((index * 13) % 42);

          return (
            <Box
              key={index}
              sx={{
                width: 3,
                height,
                backgroundColor: "#b8b8b8",
                opacity: index > 72 ? 0.25 : 0.9,
                borderRadius: "2px",
              }}
            />
          );
        })}
      </Box>
    );
  };

  const tabs = [
    "All",
    "Popular tracks",
    "Tracks",
    "Albums",
    "Playlists",
    "Reposts",
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 330px" },
        gap: 4,
        px: { xs: 2, md: 0 },
        py: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
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
          <Stack direction="row" spacing={2.5} sx={{ overflowX: "auto" }}>
            {tabs.map((tab) => (
              <Typography
                key={tab}
                sx={{
                  color: tab === "Playlists" ? "#ffffff" : "#b8b8b8",
                  fontSize: 14,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  pb: 1.2,
                  borderBottom:
                    tab === "Playlists"
                      ? "2px solid rgba(255,255,255,0.35)"
                      : "2px solid transparent",
                  cursor: "pointer",
                  "&:hover": {
                    color: "#ffffff",
                  },
                }}
              >
                {tab}
              </Typography>
            ))}
          </Stack>

          <Stack direction="row" spacing={1}>
            {!isOwner && (
              <Button
                onClick={handleToggleFollow}
                disabled={followLoading}
                sx={{
                  height: 36,
                  px: 1.8,
                  borderRadius: "5px",
                  color: "#ffffff",
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
                color: "#ffffff",
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

            <Button
              startIcon={<EditRoundedIcon />}
              onClick={() => setOpenEdit(true)}
              sx={{
                height: 36,
                px: 1.8,
                borderRadius: "5px",
                color: "#ffffff",
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
          </Stack>
        </Box>

        {!tracks.length && (
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
            }}
          >
            No tracks found.
          </Box>
        )}

        {mainTrack && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "180px 1fr" },
              gap: 3,
              mb: 3,
            }}
          >
            <Box
              component={Link}
              href={getTrackHref(mainTrack)}
              sx={{
                position: "relative",
                width: { xs: 180, md: 180 },
                height: 180,
                borderRadius: "4px",
                overflow: "hidden",
                backgroundColor: "#111",
                border: "1px solid rgba(255,255,255,0.08)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box
                component="img"
                src={getTrackImageUrl(mainTrack.imgUrl)}
                alt={mainTrack.title}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, transparent, rgba(0,0,0,0.35))",
                }}
              />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  component={Link}
                  href={getTrackHref(mainTrack)}
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    backgroundColor: "#ff5500",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  <PlayArrowRoundedIcon sx={{ fontSize: 34, ml: "2px" }} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: "#b8b8b8",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {displayName}
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

                <Typography
                  sx={{
                    ml: "auto",
                    color: "#9a9a9a",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  20 hours ago
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <WaveBars />
              </Box>

              <Box sx={{ mt: 2 }}>
                {tracks.slice(0, 5).map((track, index) => (
                  <Box
                    key={getItemId(track) || index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr auto",
                      alignItems: "center",
                      gap: 1.2,
                      py: 0.8,
                      color: index >= 4 ? "#777" : "#ffffff",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#b8b8b8",
                        fontSize: 15,
                        fontWeight: 900,
                        textAlign: "right",
                      }}
                    >
                      {index + 1}
                    </Typography>

                    <Typography
                      component={Link}
                      href={getTrackHref(track)}
                      sx={{
                        color: "inherit",
                        fontSize: 14,
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

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.4,
                        color: "#9a9a9a",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {index === 4 ? (
                        <>
                          <LocationOnRoundedIcon sx={{ fontSize: 14 }} />
                          Not available in Viet Nam
                        </>
                      ) : (
                        <>
                          <PlayArrowRoundedIcon sx={{ fontSize: 15 }} />
                          {track.countPlay ?? 0}
                        </>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>

              {tracks.length > 5 && (
                <Typography
                  sx={{
                    mt: 1.2,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: "pointer",
                    "&:hover": {
                      color: "#ff5500",
                    },
                  }}
                >
                  View {tracks.length} tracks
                </Typography>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                {[
                  ShareRoundedIcon,
                  ContentCopyRoundedIcon,
                  EditRoundedIcon,
                  FavoriteRoundedIcon,
                  MoreHorizRoundedIcon,
                ].map((Icon, index) => (
                  <Button
                    key={index}
                    sx={{
                      minWidth: 42,
                      width: 42,
                      height: 38,
                      borderRadius: "5px",
                      color: "#ffffff",
                      backgroundColor: "#242729",
                      "&:hover": {
                        backgroundColor: "#303335",
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </Button>
                ))}
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: { xs: "none", lg: "block" },
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
            ["Following", user?.following ?? 0],
            ["Tracks", tracks.length],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography
                sx={{
                  color: "#9a9a9a",
                  fontSize: 14,
                  fontWeight: 900,
                  mb: 0.6,
                }}
              >
                {label}
              </Typography>

              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 34,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            backgroundColor: "#0f1111",
            border: "1px solid rgba(255,255,255,0.08)",
            p: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 2 }}>
            <EventAvailableRoundedIcon
              sx={{ color: "#b8b8b8", fontSize: 18 }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              On tour
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.5,
              mb: 2,
            }}
          >
            With an Artist Pro account, you can create ticketed live events on
            Sound Clone and list existing events.
          </Typography>

          <Button
            fullWidth
            sx={{
              height: 42,
              borderRadius: "999px",
              color: "#ffffff",
              backgroundColor: "#181A1B",
              textTransform: "none",
              fontWeight: 900,
              "&:hover": {
                backgroundColor: "#242729",
              },
            }}
          >
            Upgrade to Artist Pro
          </Button>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

        <Typography
          sx={{
            color: "#9a9a9a",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          Legal · Privacy · Cookie Policy · Cookie Manager · Imprint · Artist
          Resources · Newsroom · Topics · Charts · Transparency Reports
        </Typography>

        <Typography
          sx={{
            color: "#d8d8d8",
            fontSize: 13,
            mt: 2,
          }}
        >
          Language:{" "}
          <Box component="span" sx={{ color: "#4da3ff" }}>
            English (US)
          </Box>
        </Typography>
      </Box>

      <ProfileShareDialog
        open={openShare}
        onClose={() => setOpenShare(false)}
        user={user}
      />

      <ProfileEditDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        user={user}
      />
    </Box>
  );
};

export default ProfileMain;
