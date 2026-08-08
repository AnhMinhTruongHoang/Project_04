"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";

import {
  followUserApi,
  getFollowStatusApi,
  unfollowUserApi,
} from "@/utils/api";
import { useToast } from "@/utils/toast";

import ProfileAllTab from "./profile-all-tab";
import ProfilePopularTracksTab from "./profile-popular-tracks-tab";
import ProfileTracksTab from "./profile-tracks-tab";
import ProfilePlaylistsTab from "./profile-playlists-tab";
import ProfileShareDialog from "./profile-share-dialog";
import ProfileEditDialog from "./profile-edit-dialog";
import { useTrackContext } from "@/lib/track.wrapper";
import { useSearchParams } from "next/navigation";
import ProfileMembershipTab from "./profile-membership-tab";
import ProfileMembershipPlansDialog from "./profile-membership-plans-dialog";
import ProfileConcertsTab from "./profile-concerts-tab";
import ProfileTicketsTab from "./profile-tickets-tab";

type Props = {
  user: Partial<IUser> | null;
  tracks: ITrackTop[];
};
const PROFILE_TABS = [
  "All",
  "Popular tracks",
  "Playlists",
  "Concerts / Tour",
  "Membership",
  "Tickets",
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number];

const OWNER_ONLY_PROFILE_TABS: ProfileTab[] = ["All", "Tickets"];

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const getUploaderId = (track?: ITrackTop | null) => {
  return track?.uploaderId || getItemId(track?.uploader) || "";
};

const ProfileEmptyTab = ({
  isOwner,
  displayName,
}: {
  isOwner: boolean;
  displayName: string;
}) => {
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
      <QueueMusicRoundedIcon
        sx={{
          fontSize: 52,
          color: "#ff5500",
          mb: 1,
        }}
      />
    </Box>
  );
};

const ProfileMain = ({ user, tracks }: Props) => {
  const toast = useToast();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

  const [activeTab, setActiveTab] = useState<ProfileTab>("All");
  const [openEdit, setOpenEdit] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [openMembershipPlans, setOpenMembershipPlans] = useState(false);
  const [followersCount, setFollowersCount] = useState(
    Number(user?.followers || 0)
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const profileUserId = getItemId(user);
  const currentUserId = getItemId((session as any)?.user);

  const isOwner = Boolean(
    profileUserId && currentUserId && profileUserId === currentUserId
  );

  const displayName = user?.name || user?.email || "Sound Clone user";

  const accessToken =
    (session as any)?.accessToken ||
    (session as any)?.access_token ||
    (session as any)?.user?.access_token;

  const showArtistTabs =
    String(user?.type || "")
      .trim()
      .toUpperCase() === "ARTIST";

  const visibleProfileTabs = useMemo(
    () =>
      PROFILE_TABS.filter((tab) => {
        /* ARTIST-ONLY PROFILE TABS */
        if (
          (tab === "Membership" || tab === "Concerts / Tour") &&
          !showArtistTabs
        ) {
          return false;
        }

        /* OWNER-ONLY PROFILE TABS */
        if (OWNER_ONLY_PROFILE_TABS.includes(tab) && !isOwner) {
          return false;
        }

        return true;
      }),
    [isOwner, showArtistTabs]
  );

  /*
   * =========================
   * OPEN PROFILE TAB FROM URL
   * =========================
   */
  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (!requestedTab) {
      return;
    }

    const matchedTab = visibleProfileTabs.find((tab) => tab === requestedTab);

    if (!matchedTab) {
      return;
    }

    setActiveTab(matchedTab);
  }, [searchParams, visibleProfileTabs]);

  /*
   * =========================
   * RESET HIDDEN PROFILE TAB
   * =========================
   */
  useEffect(() => {
    if (visibleProfileTabs.includes(activeTab)) {
      return;
    }

    setActiveTab(visibleProfileTabs[0] ?? "Popular tracks");
  }, [activeTab, visibleProfileTabs]);

  const isWideProfileTab =
    activeTab === "Membership" ||
    activeTab === "Concerts / Tour" ||
    activeTab === "Tickets";

  const authoredTracks = useMemo(() => {
    if (!profileUserId) {
      return [];
    }

    const filteredTracks = tracks.filter((track) => {
      const uploaderId = getUploaderId(track);

      /*
       * Endpoint profile hiện có thể đã trả đúng track theo user
       * nhưng một số response không kèm uploaderId.
       */
      const belongsToProfile = !uploaderId || uploaderId === profileUserId;

      return belongsToProfile && !track.isDeleted;
    });

    return filteredTracks;
  }, [tracks, profileUserId]);

  useEffect(() => {
    setFollowersCount(Number(user?.followers || 0));
  }, [profileUserId, user?.followers]);

  useEffect(() => {
    if (!profileUserId || !accessToken || isOwner) {
      setIsFollowing(false);
      return;
    }

    let cancelled = false;

    const loadFollowStatus = async () => {
      try {
        const response = await getFollowStatusApi(profileUserId, accessToken);

        if (cancelled) return;

        if (!response?.data) {
          return;
        }

        const following = Boolean(
          response.data.following ?? response.data.isFollowing
        );

        setIsFollowing(following);

        if (typeof response.data.targetFollowers === "number") {
          setFollowersCount(response.data.targetFollowers);
        }
      } catch (error) {
        console.error("Cannot load follow status:", error);
      }
    };

    void loadFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [profileUserId, accessToken, isOwner]);

  const handleToggleFollow = async () => {
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

    if (followLoading) {
      return;
    }

    try {
      setFollowLoading(true);

      const response = isFollowing
        ? await unfollowUserApi(profileUserId, accessToken)
        : await followUserApi(profileUserId, accessToken);

      if (!response?.data) {
        toast.error(response?.message || "Follow failed.");
        return;
      }

      const nextFollowing = Boolean(
        response.data.following ?? response.data.isFollowing
      );

      setIsFollowing(nextFollowing);

      setFollowersCount(
        typeof response.data.targetFollowers === "number"
          ? response.data.targetFollowers
          : nextFollowing
          ? followersCount + 1
          : Math.max(followersCount - 1, 0)
      );

      toast.success(nextFollowing ? "Followed." : "Unfollowed.");
    } catch (error) {
      console.error("Toggle follow failed:", error);

      toast.error("Follow failed.");
    } finally {
      setFollowLoading(false);
    }
  };

  /*
   * =========================
   * PLAY MEMBERSHIP TRACK PREVIEW
   * =========================
   */
  const handlePlayMembershipTrack = (
    track: IArtistMembershipTrackPreview,
    post: IArtistMembershipPost
  ) => {
    if (!track.trackUrl?.trim()) {
      toast.error("Track preview URL is unavailable.");

      return;
    }

    const trackId = track.id?.trim();

    if (!trackId) {
      toast.error("Track preview ID is unavailable.");

      return;
    }

    const startSeconds = Math.max(Number(track.previewStartSeconds || 0), 0);

    const previewDuration = Number(track.previewDurationSeconds || 0);

    const previewEndSeconds =
      previewDuration > 0 ? startSeconds + previewDuration : undefined;

    const currentTrackId = getItemId(currentTrack);

    const isCurrentPreview =
      currentTrackId === trackId &&
      currentTrack?.membershipPreview === true &&
      currentTrack?.membershipPreviewPostId === post.id;

    /*
     * Bấm lại cùng preview đang phát:
     * chuyển sang pause.
     */
    if (isCurrentPreview && currentTrack?.isPlaying) {
      setCurrentTrack({
        ...currentTrack,

        isPlaying: false,

        source: "footer",
      } as IShareTrack);

      return;
    }

    /*
     * Phát qua AppFooter.
     *
     * seekTime + seekId buộc audio
     * nhảy đến previewStartSeconds.
     */
    setCurrentTrack({
      _id: trackId,
      id: trackId,

      title: track.title,

      imgUrl: track.imgUrl || "",

      trackUrl: track.trackUrl,

      durationSeconds: track.durationSeconds,

      isPlaying: true,

      source: "footer",

      currentTime: startSeconds,

      duration: Number(track.durationSeconds || 0),

      seekTime: startSeconds,

      seekId: Date.now(),

      membershipPreview: true,

      membershipPreviewPostId: post.id,

      previewStartSeconds: startSeconds,

      previewEndSeconds,
    } as IShareTrack);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "All":
        return <ProfileAllTab user={user} tracks={tracks} isOwner={isOwner} />;

      case "Popular tracks":
        return (
          <ProfilePopularTracksTab
            user={user}
            tracks={authoredTracks}
            isOwner={isOwner}
          />
        );

      case "Playlists":
        return <ProfilePlaylistsTab user={user} isOwner={isOwner} />;

      case "Tickets":
        return <ProfileTicketsTab accessToken={accessToken} />;

      case "Membership":
        if (!profileUserId) {
          return null;
        }

      case "Concerts / Tour":
        if (!profileUserId) {
          return null;
        }

        return (
          <ProfileConcertsTab
            artistId={profileUserId}
            artistName={displayName}
            accessToken={accessToken}
            isOwner={isOwner}
            onRequireLogin={() => {
              toast.error("Please login first.");
            }}
          />
        );

        return (
          <ProfileMembershipTab
            artistId={profileUserId}
            artistName={displayName}
            accessToken={accessToken}
            isOwner={isOwner}
            onPlayTrack={handlePlayMembershipTrack}
            onRequireLogin={() => {
              toast.error("Please login first.");
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",

          lg: isWideProfileTab ? "minmax(0, 1fr)" : "minmax(0, 1fr) 330px",
        },
        gap: 4,
        px: {
          xs: 2,
          md: 0,
        },
        py: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: {
              xs: "flex-start",
              md: "center",
            },
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
            flexDirection: {
              xs: "column",
              md: "row",
            },
          }}
        >
          <Stack
            direction="row"
            spacing={2.5}
            sx={{
              width: {
                xs: "100%",
                md: "auto",
              },
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",

              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            {visibleProfileTabs.map((tab) => {
              const selected = activeTab === tab;

              return (
                <Typography
                  key={tab}
                  component="button"
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-selected={selected}
                  sx={{
                    appearance: "none",
                    p: 0,
                    pb: 1.2,
                    border: 0,
                    borderBottom: selected
                      ? "2px solid rgba(255,255,255,0.42)"
                      : "2px solid transparent",
                    backgroundColor: "transparent",
                    color: selected ? "#ffffff" : "#b8b8b8",
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                    cursor: "pointer",

                    "&:hover": {
                      color: "#ffffff",
                    },
                  }}
                >
                  {tab}
                </Typography>
              );
            })}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexShrink: 0,
            }}
          >
            {!isOwner && (
              <Button
                onClick={handleToggleFollow}
                disabled={followLoading}
                sx={{
                  minHeight: 36,
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
                    color: "#777777",
                    backgroundColor: "#181A1B",
                  },
                }}
              >
                {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </Button>
            )}

            {/* ARTIST MEMBERSHIP ACTION */}
            {showArtistTabs && (
              <Button
                onClick={() => {
                  setOpenMembershipPlans(true);
                }}
                sx={{
                  minHeight: 36,
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
                Membership
              </Button>
            )}
            {/* SHARE ACTION */}
            <Button
              startIcon={<ShareRoundedIcon />}
              onClick={() => setOpenShare(true)}
              sx={{
                minHeight: 36,
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

            {isOwner && (
              <Button
                startIcon={<EditRoundedIcon />}
                onClick={() => setOpenEdit(true)}
                sx={{
                  minHeight: 36,
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
            )}
          </Stack>
        </Box>

        <Box
          key={activeTab}
          sx={{
            minWidth: 0,
          }}
        >
          {renderActiveTab()}
        </Box>
      </Box>

      {/* PROFILE SIDEBAR */}
      {!isWideProfileTab && (
        <Box
          sx={{
            borderLeft: "1px solid rgba(255,255,255,0.08)",

            pl: {
              xs: 0,
              lg: 3,
            },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 2,
              mb: 3,
            }}
          >
            {[
              ["Followers", followersCount],
              ["Following", Number(user?.following || 0)],
              ["Tracks", authoredTracks.length],
            ].map(([label, value]) => (
              <Box key={String(label)}>
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

          <Box>
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
          </Box>

          <Box
            sx={{
              mt: 2.5,
              pt: 2.5,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <ProfileTracksTab />
          </Box>

          <Divider
            sx={{
              borderColor: "rgba(255,255,255,0.08)",
              mb: 2,
            }}
          />

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
      )}

      {/* MEMBERSHIP PLANS DIALOG */}
      {profileUserId && (
        <ProfileMembershipPlansDialog
          open={openMembershipPlans}
          artistId={profileUserId}
          artistName={displayName}
          accessToken={accessToken}
          isOwner={isOwner}
          onClose={() => {
            setOpenMembershipPlans(false);
          }}
          onRequireLogin={() => {
            toast.error("Please login first.");
          }}
        />
      )}

      <ProfileShareDialog
        open={openShare}
        onClose={() => setOpenShare(false)}
        user={user}
      />

      <ProfileEditDialog
        open={isOwner && openEdit}
        onClose={() => setOpenEdit(false)}
        user={user}
      />
    </Box>
  );
};

export default ProfileMain;
