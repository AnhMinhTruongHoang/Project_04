"use client";

import { signOut } from "next-auth/react";

import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

type Props = {
  user: any;
  collapsed: boolean;
  onToggleSidebar: () => void;
};

const getInitials = (name?: string, email?: string) => {
  const value = name?.trim() || email?.trim() || "Admin";
  const words = value.split(" ").filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
};

const DashboardTopbar = ({ user, collapsed, onToggleSidebar }: Props) => {
  return (
    <Box
      sx={{
        height: 64,
        px: { xs: 2, md: 3 },
        backgroundColor: "#111314",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Tooltip
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          arrow
        >
          <IconButton
            onClick={onToggleSidebar}
            sx={{
              width: 38,
              height: 38,
              color: "#b8b8b8",
              backgroundColor: "rgba(255,255,255,0.05)",
              display: { xs: "none", md: "inline-flex" },
              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
          </IconButton>
        </Tooltip>

        <Box>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{
              color: "#9a9a9a",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Manage Sound Clone data
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: "#ff5500",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: 13,
          }}
        >
          {getInitials(user?.name, user?.email)}
        </Avatar>

        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {user?.name || "Admin"}
          </Typography>

          <Typography
            sx={{
              color: "#9a9a9a",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {user?.role || "ADMIN"}
          </Typography>
        </Box>

        <Button
          startIcon={<LogoutRoundedIcon />}
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          sx={{
            height: 36,
            px: 1.6,
            borderRadius: "999px",
            color: "#ffffff",
            backgroundColor: "#242729",
            textTransform: "none",
            fontWeight: 900,
            "&:hover": {
              backgroundColor: "#303335",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardTopbar;
