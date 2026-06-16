"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";

import { fetchDefaultImages, sendRequest } from "@/utils/api";
import { useToast } from "@/utils/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  user: Partial<IUser> | null;
};

const inputSx = {
  "& .MuiInputBase-root": {
    backgroundColor: "#242729",
    color: "#ffffff",
    borderRadius: "4px",
    fontWeight: 700,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.08)",
  },

  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.24)",
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

const ProfileEditDialog = ({ open, onClose, user }: Props) => {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();

  const [displayName, setDisplayName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const avatar = useMemo(() => {
    return fetchDefaultImages(user?.type);
  }, [user?.type]);

  useEffect(() => {
    if (!open) return;

    const name = user?.name || "";
    const parts = name.split(" ");

    setDisplayName(name);
    setProfileUrl(`soundclone.com/${user?._id || ""}`);
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setCity("");
    setCountry(user?.address || "");
    setBio("");
  }, [open, user]);

  const handleSave = async () => {
    if (!user?._id) {
      toast.error("User not found.");
      return;
    }

    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }

    try {
      setLoading(true);

      const addressValue = [city.trim(), country.trim()]
        .filter(Boolean)
        .join(", ");

      const res = await sendRequest<IBackendRes<IUser>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        method: "PATCH",
        body: {
          _id: user._id,
          name: displayName.trim(),
          address: addressValue || user.address || "",
          role: user.role,
        },
        headers: {
          Authorization: `Bearer ${(session as any)?.access_token}`,
        },
      });

      if (res?.data) {
        toast.success("Profile updated successfully.");

        await sendRequest<IBackendRes<any>>({
          url: "/api/revalidate",
          method: "POST",
          queryParams: {
            tag: "profile-user",
            secret: "justArandomString",
          },
        });

        onClose();
        router.refresh();
      } else {
        toast.error(res?.message || "Update profile failed.");
      }
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
          width: 850,
          maxWidth: "calc(100vw - 48px)",
          backgroundColor: "#0f1111",
          color: "#ffffff",
          borderRadius: "4px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Typography
          sx={{
            fontSize: 25,
            fontWeight: 900,
            color: "#ffffff",
            mb: 3,
          }}
        >
          Edit your Profile
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "220px 1fr" },
            gap: 4,
          }}
        >
          {/* Avatar */}
          <Box>
            <Box
              sx={{
                width: 185,
                height: 185,
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "#111",
                position: "relative",
                mx: { xs: "auto", md: 0 },
                border: "3px solid rgba(255,255,255,0.12)",
              }}
            >
              <Box
                component="img"
                src={avatar}
                alt={displayName}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              <Button
                component="label"
                sx={{
                  position: "absolute",
                  left: "50%",
                  bottom: 18,
                  transform: "translateX(-50%)",
                  height: 34,
                  borderRadius: "4px",
                  color: "#ffffff",
                  backgroundColor: "rgba(0,0,0,0.78)",
                  textTransform: "none",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  px: 1.8,
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.92)",
                  },
                }}
              >
                Update image
                <input hidden type="file" accept="image/*" />
              </Button>
            </Box>

            <Box sx={{ mt: 18, display: { xs: "none", md: "block" } }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  sx={{
                    height: 36,
                    px: 1.5,
                    borderRadius: "4px",
                    color: "#ffffff",
                    backgroundColor: "#242729",
                    textTransform: "none",
                    fontWeight: 900,
                    "&:hover": { backgroundColor: "#303335" },
                  }}
                >
                  Add link
                </Button>

                <Button
                  sx={{
                    height: 36,
                    px: 1.5,
                    borderRadius: "4px",
                    color: "#ffffff",
                    backgroundColor: "#242729",
                    textTransform: "none",
                    fontWeight: 900,
                    "&:hover": { backgroundColor: "#303335" },
                  }}
                >
                  Add support link
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Form */}
          <Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
              <TextField
                label="Display name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                size="small"
                sx={inputSx}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  size="small"
                  sx={inputSx}
                />

                <TextField
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  size="small"
                  sx={inputSx}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  fullWidth
                  size="small"
                  sx={inputSx}
                />

                <TextField
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  fullWidth
                  size="small"
                  sx={inputSx}
                />
              </Box>

              <TextField
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world a little bit about yourself. The shorter the better."
                fullWidth
                multiline
                rows={3}
                sx={inputSx}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mt: 3 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.2,
            mt: 2,
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              height: 38,
              px: 2.2,
              borderRadius: "4px",
              color: "#ffffff",
              backgroundColor: "#242729",
              textTransform: "none",
              fontWeight: 900,
              "&:hover": {
                backgroundColor: "#303335",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading || !displayName.trim()}
            sx={{
              height: 38,
              px: 2.2,
              borderRadius: "4px",
              color: "#ffffff",
              backgroundColor: "#ff5500",
              textTransform: "none",
              fontWeight: 900,
              opacity: loading || !displayName.trim() ? 0.5 : 1,
              "&:hover": {
                backgroundColor: "#ff6a00",
              },
              "&.Mui-disabled": {
                color: "#777",
                backgroundColor: "#181A1B",
              },
            }}
          >
            Save changes
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ProfileEditDialog;
