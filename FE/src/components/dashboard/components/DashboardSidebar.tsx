"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

const menuItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: <DashboardRoundedIcon />,
  },
  {
    label: "Tracks",
    href: "/dashboard/tracks",
    icon: <LibraryMusicRoundedIcon />,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: <PeopleAltRoundedIcon />,
  },
  {
    label: "Playlists",
    href: "/dashboard/playlists",
    icon: <QueueMusicRoundedIcon />,
  },
  {
    label: "Comments",
    href: "/dashboard/comments",
    icon: <CommentRoundedIcon />,
  },
];

const DashboardSidebar = ({ collapsed, onToggle }: Props) => {
  const pathname = usePathname();
  const sidebarWidth = collapsed ? 78 : 260;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Box
      sx={{
        width: sidebarWidth,
        minHeight: "100vh",
        flexShrink: 0,
        backgroundColor: "#111314",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        transition: "width 0.22s ease",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 73,
          px: collapsed ? 1.2 : 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 1,
        }}
      >
        {!collapsed ? (
          <Box
            component={Link}
            href="/"
            sx={{
              minWidth: 0,
              cursor: "pointer",
              userSelect: "none",
              textDecoration: "none",
              "&:hover .dashboard-logo-title": {
                color: "#ff5500",
              },
            }}
          >
            <Typography
              className="dashboard-logo-title"
              sx={{
                fontSize: 20,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                transition: "0.18s ease",
              }}
            >
              Sound Clone
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: 12,
                fontWeight: 700,
                color: "#9a9a9a",
                whiteSpace: "nowrap",
              }}
            >
              Admin Dashboard
            </Typography>
          </Box>
        ) : (
          <Box
            component={Link}
            href="/"
            sx={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              backgroundColor: "#ff5500",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 900,
              flexShrink: 0,
              cursor: "pointer",
              userSelect: "none",
              textDecoration: "none",
              transition: "0.18s ease",
              "&:hover": {
                backgroundColor: "#ff6a1a",
                transform: "translateY(-1px)",
              },
            }}
          >
            SC
          </Box>
        )}

        {!collapsed && (
          <IconButton
            onClick={onToggle}
            sx={{
              width: 34,
              height: 34,
              color: "#b8b8b8",
              backgroundColor: "rgba(255,255,255,0.05)",
              flexShrink: 0,
              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box sx={{ p: collapsed ? 1 : 1.5, flex: 1 }}>
        {menuItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Tooltip
              key={item.href}
              title={collapsed ? item.label : ""}
              placement="right"
              arrow
            >
              <Box
                component={Link}
                href={item.href}
                sx={{
                  height: 44,
                  px: collapsed ? 0 : 1.5,
                  mb: 0.7,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 1.2,
                  textDecoration: "none",
                  color: active ? "#ffffff" : "#b8b8b8",
                  backgroundColor: active
                    ? "rgba(255,85,0,0.16)"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(255,85,0,0.32)"
                    : "1px solid transparent",
                  fontSize: 14,
                  fontWeight: 900,
                  transition: "0.18s ease",
                  whiteSpace: "nowrap",

                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: active
                      ? "rgba(255,85,0,0.2)"
                      : "rgba(255,255,255,0.06)",
                  },

                  "& .MuiSvgIcon-root": {
                    fontSize: 21,
                    color: active ? "#ff5500" : "#b8b8b8",
                    flexShrink: 0,
                  },
                }}
              >
                {item.icon}

                {!collapsed && (
                  <Box component="span" sx={{ overflow: "hidden" }}>
                    {item.label}
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Box sx={{ p: collapsed ? 1 : 1.5 }}>
        {collapsed && (
          <Tooltip title="Expand sidebar" placement="right" arrow>
            <IconButton
              onClick={onToggle}
              sx={{
                width: "100%",
                height: 44,
                mb: 0.7,
                borderRadius: "10px",
                color: "#b8b8b8",
                backgroundColor: "rgba(255,255,255,0.04)",
                "&:hover": {
                  color: "#ffffff",
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip
          title={collapsed ? "Back to site" : ""}
          placement="right"
          arrow
        >
          <Box
            component={Link}
            href="/"
            sx={{
              height: 44,
              px: collapsed ? 0 : 1.5,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 1.2,
              textDecoration: "none",
              color: "#b8b8b8",
              fontSize: 14,
              fontWeight: 900,
              whiteSpace: "nowrap",

              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.06)",
              },

              "& .MuiSvgIcon-root": {
                fontSize: 21,
                flexShrink: 0,
              },
            }}
          >
            <HomeRoundedIcon />

            {!collapsed && <Box component="span">Back to site</Box>}
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default DashboardSidebar;
