"use client";

import { useEffect, useState } from "react";

import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";

type Props = {
  open: boolean;
  onClose: () => void;
  user: Partial<IUser> | null;
};

const ProfileShareDialog = ({ open, onClose, user }: Props) => {
  const [profileUrl, setProfileUrl] = useState("");
  const [shorten, setShorten] = useState(true);
  const [tab, setTab] = useState<"share" | "message">("share");

  useEffect(() => {
    if (!open) return;

    if (typeof window !== "undefined") {
      setProfileUrl(window.location.href);
    }
  }, [open]);

  const handleCopy = async () => {
    if (!profileUrl) return;

    await navigator.clipboard.writeText(profileUrl);
  };

  const socialItems = [
    {
      label: "Twitter",
      icon: <TwitterIcon />,
      bg: "#1da1f2",
    },
    {
      label: "Facebook",
      icon: <FacebookIcon />,
      bg: "#145dbf",
    },
    {
      label: "Tumblr",
      text: "t",
      bg: "#35465c",
    },
    {
      label: "Pinterest",
      text: "p",
      bg: "#bd081c",
    },
    {
      label: "Email",
      icon: <EmailRoundedIcon />,
      bg: "#2f3437",
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          width: 620,
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
      <Box sx={{ p: 3 }}>
        {/* Tabs */}
        <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
          <Typography
            onClick={() => setTab("share")}
            sx={{
              color: tab === "share" ? "#ffffff" : "#a8a8a8",
              fontSize: 25,
              fontWeight: 900,
              cursor: "pointer",
              pb: 1,
              borderBottom:
                tab === "share"
                  ? "1px solid rgba(255,255,255,0.32)"
                  : "1px solid transparent",
            }}
          >
            Share
          </Typography>

          <Typography
            onClick={() => setTab("message")}
            sx={{
              color: tab === "message" ? "#ffffff" : "#a8a8a8",
              fontSize: 25,
              fontWeight: 900,
              cursor: "pointer",
              pb: 1,
              borderBottom:
                tab === "message"
                  ? "1px solid rgba(255,255,255,0.32)"
                  : "1px solid transparent",
            }}
          >
            Message
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

        {tab === "share" && (
          <>
            {/* Social buttons */}
            <Box sx={{ display: "flex", gap: 1.3, mb: 2 }}>
              {socialItems.map((item) => (
                <Tooltip key={item.label} title={item.label}>
                  <IconButton
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      backgroundColor: item.bg,
                      color: "#ffffff",
                      fontSize: 30,
                      fontWeight: 900,
                      "&:hover": {
                        filter: "brightness(1.12)",
                        backgroundColor: item.bg,
                      },
                    }}
                  >
                    {item.icon ? item.icon : item.text}
                  </IconButton>
                </Tooltip>
              ))}
            </Box>

            {/* URL row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#242729",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "4px",
                overflow: "hidden",
                mb: 1.4,
              }}
            >
              <Box
                component="input"
                value={profileUrl}
                readOnly
                sx={{
                  flex: 1,
                  height: 42,
                  px: 1.5,
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              />

              <IconButton
                onClick={handleCopy}
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 0,
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <ContentCopyRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                checked={shorten}
                onChange={(e) => setShorten(e.target.checked)}
                sx={{
                  p: 0,
                  color: "#b8b8b8",
                  "&.Mui-checked": {
                    color: "#ffffff",
                  },
                }}
              />

              <Typography
                sx={{
                  color: "#d8d8d8",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Shorten link
              </Typography>
            </Box>
          </>
        )}

        {tab === "message" && (
          <Box
            sx={{
              minHeight: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9a9a9a",
              border: "1px dashed rgba(255,255,255,0.12)",
              borderRadius: "4px",
              fontWeight: 800,
            }}
          >
            Messaging is not available yet.
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default ProfileShareDialog;
