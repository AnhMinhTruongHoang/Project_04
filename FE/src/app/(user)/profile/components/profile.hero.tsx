"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import { Avatar, Chip, Tooltip } from "@mui/material";
import { getUserAvatarUrl, getUserCoverUrl } from "@/utils/actions/getImages";
import { getUserBadgesApi, updateUserApi, uploadImageApi } from "@/utils/api";
import { useToast } from "@/utils/toast";

type Props = {
  user: Partial<IUser> | null;
  trackCount: number;
};

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const getBadgeIcon = (code: string) => {
  switch (code.toUpperCase()) {
    case "VERIFIED_ARTIST":
      return <VerifiedRoundedIcon />;

    case "FOUNDING_ARTIST":
      return <MilitaryTechRoundedIcon />;

    case "EARLY_SUPPORTER":
      return <FavoriteRoundedIcon />;

    case "TOP_LISTENER":
      return <HeadphonesRoundedIcon />;

    default:
      return <WorkspacePremiumRoundedIcon />;
  }
};

const ProfileHero = ({ user }: Props) => {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token;

  const profileUserId = getItemId(user);
  const currentUserId = getItemId((session as any)?.user);

  const isOwner = Boolean(
    profileUserId && currentUserId && profileUserId === currentUserId
  );

  const displayName = user?.name || user?.email || "User";

  const subName = user?.email || user?.type || "Sound Clone user";

  const [coverSrc, setCoverSrc] = useState(getUserCoverUrl(user));

  const [userBadges, setUserBadges] = useState<IUserBadge[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCoverSrc(getUserCoverUrl(user));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadUserBadges = async () => {
      if (!profileUserId) {
        setUserBadges([]);
        return;
      }

      try {
        const response = await getUserBadgesApi(profileUserId);

        if (cancelled) {
          return;
        }

        if (Number(response?.statusCode) !== 200) {
          setUserBadges([]);
          return;
        }

        setUserBadges(
          Array.isArray(response?.data)
            ? response.data.filter(
                (item) => item.active && item.badge && item.badge.active
              )
            : []
        );
      } catch (error) {
        console.error("Cannot load user badges:", error);

        if (!cancelled) {
          setUserBadges([]);
        }
      }
    };

    void loadUserBadges();

    return () => {
      cancelled = true;
    };
  }, [profileUserId]);

  const getInitials = (name?: string, email?: string) => {
    const value = name?.trim() || email?.trim() || "User";

    const words = value.split(" ").filter(Boolean);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return value.slice(0, 2).toUpperCase();
  };

  const handleCoverChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!isOwner) {
      toast.error("You cannot edit this profile.");
      event.target.value = "";
      return;
    }

    ///no token return
    if (!accessToken) {
      toast.error("Please login first.");
      event.target.value = "";
      return;
    }

    if (!profileUserId) {
      toast.error("User not found.");
      event.target.value = "";
      return;
    }

    try {
      const uploadResponse = await uploadImageApi(file, accessToken);

      const coverUrl = uploadResponse?.data?.url;

      if (!coverUrl) {
        toast.error(uploadResponse?.message || "Upload cover failed.");
        return;
      }

      const updateResponse = await updateUserApi(
        {
          _id: profileUserId,
          coverUrl,
        },
        accessToken
      );

      if (!updateResponse?.data) {
        toast.error(updateResponse?.message || "Update cover failed.");
        return;
      }

      setCoverSrc(coverUrl);
      toast.success("Cover updated.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Upload cover failed.");
    } finally {
      event.target.value = "";
    }
  };

  const verifiedArtistBadge = userBadges.find(
    (item) => item.badge.code === "VERIFIED_ARTIST"
  );

  const secondaryBadges = userBadges
    .filter((item) => item.badge.code !== "VERIFIED_ARTIST")
    .slice(0, 3);

  const remainingBadgeCount = Math.max(
    userBadges.length - secondaryBadges.length - (verifiedArtistBadge ? 1 : 0),
    0
  );

  return (
    <Box
      sx={{
        height: { xs: 260, md: 300 },
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Cover Image */}
      <Box
        component="img"
        src={coverSrc}
        alt="Cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "/images/user/default-cover.jpg";
        }}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Dark Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.35))",
        }}
      />

      {/* Upload Cover */}
      {isOwner && (
        <Button
          component="label"
          startIcon={<CameraAltRoundedIcon />}
          sx={{
            position: "absolute",
            top: 24,
            right: 32,
            height: 38,
            px: 2.2,
            borderRadius: "4px",
            color: "#ffffff",
            backgroundColor: "#050505",
            fontWeight: 900,
            fontSize: 13,
            textTransform: "none",
            zIndex: 2,

            "&:hover": {
              backgroundColor: "#111111",
            },
          }}
        >
          Upload header image
          <input
            hidden
            ref={fileInputRef}
            accept="image/*"
            type="file"
            onChange={handleCoverChange}
          />
        </Button>
      )}

      {/* Avatar + Info */}
      <Box
        sx={{
          position: "absolute",
          left: { xs: 24, md: 34 },
          bottom: { xs: 28, md: 42 },
          display: "flex",
          alignItems: "center",
          gap: 3,
          zIndex: 2,
        }}
      >
        <Avatar
          src={getUserAvatarUrl(user) || "/images/logo/Sc.png"}
          alt={displayName}
          imgProps={{
            onError: (e) => {
              e.currentTarget.src = "/images/logo/Sc.png";
            },
          }}
          sx={{
            width: { xs: 140, md: 190 },
            height: { xs: 140, md: 190 },
            bgcolor: "#ff5500",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: { xs: 42, md: 58 },
            border: "4px solid rgba(255,255,255,0.12)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          }}
        >
          {!getUserAvatarUrl(user) && getInitials(user?.name, user?.email)}
        </Avatar>

        <Box>
          <Box
            component="h1"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              width: "fit-content",
              px: 1,
              py: 0.4,
              m: 0,
              mb: 1,
              backgroundColor: "rgba(0,0,0,0.72)",
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            <Typography
              component="span"
              sx={{
                color: "#ffffff",
                fontSize: { xs: 26, md: 34 },
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </Typography>
            {/* VERIFIED ARTIST BADGE */}
            {verifiedArtistBadge && (
              <Tooltip
                title={
                  verifiedArtistBadge.badge.description ||
                  verifiedArtistBadge.badge.name
                }
                arrow
              >
                <VerifiedRoundedIcon
                  aria-label={verifiedArtistBadge.badge.name}
                  sx={{
                    fontSize: {
                      xs: 22,
                      md: 28,
                    },
                    color: verifiedArtistBadge.badge.color || "#4da3ff",
                    flexShrink: 0,
                    filter: `drop-shadow(0 0 6px ${
                      verifiedArtistBadge.badge.color || "#4da3ff"
                    }66)`,
                  }}
                />
              </Tooltip>
            )}
          </Box>

          <Typography
            sx={{
              display: "inline-block",
              px: 1,
              py: 0.4,
              backgroundColor: "rgba(0,0,0,0.72)",
              color: "#cfcfcf",
              fontSize: 16,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {subName}
          </Typography>
          {/* USER PROFILE BADGES */}
          {secondaryBadges.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 0.8,
                mt: 1,
                maxWidth: {
                  xs: 210,
                  sm: 360,
                  md: 520,
                },
              }}
            >
              {secondaryBadges.map((userBadge) => {
                const badge = userBadge.badge;
                const badgeColor = badge.color || "#ffb020";

                return (
                  <Tooltip
                    key={userBadge.id}
                    title={badge.description || badge.name}
                    arrow
                  >
                    <Chip
                      icon={getBadgeIcon(badge.code)}
                      label={badge.name}
                      size="small"
                      sx={{
                        height: 27,
                        maxWidth: {
                          xs: 180,
                          sm: 230,
                        },

                        color: badgeColor,
                        backgroundColor: `${badgeColor}20`,
                        border: `1px solid ${badgeColor}66`,

                        fontSize: {
                          xs: 10,
                          sm: 11,
                        },
                        fontWeight: 900,

                        backdropFilter: "blur(8px)",

                        "& .MuiChip-label": {
                          px: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },

                        "& .MuiChip-icon": {
                          ml: 0.7,
                          color: `${badgeColor} !important`,
                          fontSize: 17,
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}

              {remainingBadgeCount > 0 && (
                <Tooltip
                  title={`${remainingBadgeCount} more badge${
                    remainingBadgeCount > 1 ? "s" : ""
                  }`}
                  arrow
                >
                  <Chip
                    label={`+${remainingBadgeCount}`}
                    size="small"
                    sx={{
                      height: 27,
                      color: "#d7d7d7",
                      backgroundColor: "rgba(0,0,0,0.72)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileHero;
