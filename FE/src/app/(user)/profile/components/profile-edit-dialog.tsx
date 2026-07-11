"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import { sendRequest, updateUserApi, uploadImageApi } from "@/utils/api";
import { useToast } from "@/utils/toast";
import { getInitials, getUserAvatarUrl } from "@/utils/actions/getImages";

type Props = {
  open: boolean;
  onClose: () => void;
  user: IUser | null;
};

const inputSx = {
  "& .MuiInputBase-root": {
    backgroundColor: "#1e1f20",
    color: "#ffffff",
    borderRadius: "6px",
    fontWeight: 700,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.06)",
  },

  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.18)",
  },

  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#ff5500 !important",
  },

  "& .MuiInputLabel-root": {
    color: "#cfcfcf",
    fontWeight: 800,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#ff5500",
  },

  "& textarea": {
    color: "#ffffff",
  },
};

export default function ProfileEditDialog({ open, onClose, user }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  // preview and uploaded urls
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const getUserId = (u?: IUser | null) => u?._id ?? "";
  const currentAvatarUrl = avatarPreview ?? getUserAvatarUrl(user);
  const [avatarSrc, setAvatarSrc] = useState(currentAvatarUrl);

  // helper to extract uploaded url from uploadImageApi response
  const parseUploadResult = (res: any): string | undefined => {
    return (
      res?.data?.url ??
      res?.data?.path ??
      res?.data?.fileUrl ??
      res?.data?.file?.url ??
      res?.data?.filePath ??
      res?.data?.pathName
    );
  };

  useEffect(() => {
    setAvatarSrc(currentAvatarUrl);
  }, [currentAvatarUrl]);

  useEffect(() => {
    if (!open) return;

    setDisplayName(user?.name ?? "");
    setWebsite(user?.website ?? "");
    setBio(user?.bio ?? "");

    setAvatarPreview(null);
    setAvatarFile(null);
  }, [open, user]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setAvatarFile(file);

    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const userId = getUserId(user);

    const accessToken = (session as any)?.access_token;

    if (!userId) {
      toast.error("User not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }

    try {
      setLoading(true);

      let avatarUrl = user?.avatarUrl;

      if (avatarFile) {
        const uploadRes = await uploadImageApi(avatarFile, accessToken);

        avatarUrl = parseUploadResult(uploadRes);

        if (!avatarUrl) {
          toast.error("Upload avatar failed.");
          return;
        }
      }

      const payload: UpdateUserPayload = {
        _id: userId,
        name: displayName.trim(),
        website: website.trim(),
        bio: bio.trim(),
        avatarUrl,
        subscriptionTier: user?.subscriptionTier,
      };

      const res = await updateUserApi(payload, accessToken);

      if (res?.data) {
        toast.success("Profile updated successfully.");

        try {
          await sendRequest<IBackendRes<any>>({
            url: "/api/revalidate",

            method: "POST",

            queryParams: {
              tag: "profile-user",

              secret: "justArandomString",
            },
          });
        } catch {}

        onClose();

        router.refresh();
      } else {
        toast.error(res?.message ?? "Update profile failed.");
      }
    } catch (err) {
      console.error(err);

      toast.error("Update profile failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: 880,
          maxWidth: "calc(100vw - 32px)",
          background: "#111",
          color: "#fff",
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 700,
            mb: 3,
          }}
        >
          Edit your profile
        </Typography>

        <Grid container spacing={4}>
          {/* Avatar */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "6px solid rgba(0,0,0,0.6)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                }}
              >
                <Avatar
                  src={avatarSrc || "/images/logo/Sc.png"}
                  alt={user?.name ?? "User"}
                  imgProps={{
                    onError: (e) => {
                      e.currentTarget.src = "/images/logo/Sc.png";
                    },
                  }}
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    backgroundColor: "#222",
                    fontSize: 40,
                    fontWeight: 900,
                  }}
                >
                  {getInitials(user?.name, user?.email)}
                </Avatar>
              </Box>
              <Button
                component="label"
                variant="outlined"
                sx={{
                  textTransform: "none",
                  borderColor: "grey",
                  backgroundColor: "rgba(255,255,255,.04)",
                  color: "#fff",
                  marginTop: 2,
                }}
              >
                Update image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                />
              </Button>
            </Box>
          </Grid>

          {/* Form */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TextField
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                sx={inputSx}
              />

              <TextField
                label="Website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                fullWidth
                sx={inputSx}
              />

              <TextField
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                multiline
                fullWidth
                sx={inputSx}
              />
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ borderColor: "rgba(255,255,255,.08)", my: 3 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              color: "rgba(255,255,255,.45)",
            }}
          >
            Changes will be saved to your profile.
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Button
              onClick={onClose}
              disabled={loading}
              variant="outlined"
              sx={{
                minWidth: 95,
                height: 38,
                borderRadius: "4px",
                textTransform: "none",
                borderColor: "#4a4a4a",
                color: "#fff",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#666",
                  backgroundColor: "rgba(255,255,255,.04)",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || !displayName.trim()}
              sx={{
                minWidth: 130,
                height: 38,
                borderRadius: "4px",
                textTransform: "none",
                fontWeight: 700,
                backgroundColor: "#ff5500",
                color: "#fff",

                "&:hover": {
                  backgroundColor: "#ff6600",
                },

                "&.Mui-disabled": {
                  backgroundColor: "#444",
                  color: "#999",
                },
              }}
            >
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
