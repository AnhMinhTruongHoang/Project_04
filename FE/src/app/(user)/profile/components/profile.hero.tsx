"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Avatar } from "@mui/material";
import { getUserAvatarUrl, getUserCoverUrl } from "@/utils/actions/getImages";
import { updateUserApi, uploadImageApi } from "@/utils/api";
import { useToast } from "@/utils/toast";

type Props = {
  user: Partial<IUser> | null;
  trackCount: number;
};

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
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

  const showArtistBadge = String(user?.type || "").toUpperCase() === "ARTIST";

  const [coverSrc, setCoverSrc] = useState(getUserCoverUrl(user));

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCoverSrc(getUserCoverUrl(user));
  }, [user]);

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

            {showArtistBadge && (
              <VerifiedRoundedIcon
                sx={{
                  fontSize: { xs: 22, md: 28 },
                  color: "#4da3ff",
                  flexShrink: 0,
                }}
              />
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
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileHero;
