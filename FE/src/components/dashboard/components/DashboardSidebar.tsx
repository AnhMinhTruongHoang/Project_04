"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";

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
    label: "Categories",
    href: "/dashboard/category",
    icon: <ArticleOutlinedIcon />,
  },
  {
    label: "Tracks",
    href: "/dashboard/tracks",
    icon: <LibraryMusicRoundedIcon />,
  },
  {
    label: "Ticket Events",
    href: "/dashboard/ticket-events",
    icon: <ConfirmationNumberRoundedIcon />,
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
  {
    label: "Earning Rates",
    href: "/dashboard/earning-rates",
    icon: <CurrencyExchangeRoundedIcon />,
  },
  {
    label: "Artist Payouts",
    href: "/dashboard/payouts",
    icon: <PaymentsRoundedIcon />,
  },
  {
    label: "Artist Benefits",
    href: "/dashboard/benefits",
    icon: <WorkspacePremiumRoundedIcon />,
  },
];

const DashboardSidebar = ({ collapsed, onToggle }: Props) => {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = collapsed ? 78 : 260;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /* ========================================
     MENU ITEM
  ======================================== */

  const renderMenuItem = (item: (typeof menuItems)[number], mobile = false) => {
    const active = isActive(item.href);

    const content = (
      <Box
        component={Link}
        href={item.href}
        onClick={() => {
          if (mobile) {
            setMobileOpen(false);
          }
        }}
        sx={{
          height: mobile ? 46 : 44,

          px: mobile || !collapsed ? 1.5 : 0,

          mb: 0.7,

          borderRadius: "10px",

          display: "flex",

          alignItems: "center",

          justifyContent: mobile || !collapsed ? "flex-start" : "center",

          gap: 1.2,

          textDecoration: "none",

          color: active ? "#ffffff" : "#b8b8b8",

          backgroundColor: active ? "rgba(255,85,0,0.16)" : "transparent",

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

        {(mobile || !collapsed) && (
          <Box
            component="span"
            sx={{
              overflow: "hidden",

              textOverflow: "ellipsis",
            }}
          >
            {item.label}
          </Box>
        )}
      </Box>
    );

    if (mobile || !collapsed) {
      return <Box key={item.href}>{content}</Box>;
    }

    return (
      <Tooltip key={item.href} title={item.label} placement="right" arrow>
        {content}
      </Tooltip>
    );
  };

  return (
    <>
      {/* ========================================
          MOBILE MENU BUTTON
      ======================================== */}
      <IconButton
        aria-label="Open dashboard navigation"
        onClick={() => {
          setMobileOpen(true);
        }}
        sx={{
          display: {
            xs: "flex",
            md: "none",
          },

          position: "fixed",

          top: 12,
          left: 12,

          zIndex: 1450,

          width: 38,
          height: 38,

          color: "#ffffff",

          backgroundColor: "#181a1b",

          border: "1px solid rgba(255,255,255,0.12)",

          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",

          "&:hover": {
            backgroundColor: "#242627",
          },
        }}
      >
        <MenuRoundedIcon
          sx={{
            fontSize: 23,
          }}
        />
      </IconButton>

      {/* ========================================
          MOBILE SIDEBAR DRAWER
      ======================================== */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => {
          setMobileOpen(false);
        }}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          "& .MuiDrawer-paper": {
            width: 280,

            maxWidth: "84vw",

            boxSizing: "border-box",

            backgroundColor: "#111314",

            color: "#ffffff",

            borderRight: "1px solid rgba(255,255,255,0.08)",

            boxShadow: "18px 0 45px rgba(0,0,0,0.55)",
          },
        }}
      >
        {/* MOBILE SIDEBAR HEADER */}
        <Box
          sx={{
            minHeight: 72,

            px: 2,

            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            gap: 1,
          }}
        >
          <Box
            component={Link}
            href="/"
            onClick={() => {
              setMobileOpen(false);
            }}
            sx={{
              minWidth: 0,

              textDecoration: "none",
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",

                fontSize: 18,

                fontWeight: 950,

                lineHeight: 1.2,
              }}
            >
              Sound Clone
            </Typography>

            <Typography
              sx={{
                mt: 0.35,

                color: "#8f9499",

                fontSize: 11,

                fontWeight: 700,
              }}
            >
              Admin Dashboard
            </Typography>
          </Box>

          <IconButton
            aria-label="Close dashboard navigation"
            onClick={() => {
              setMobileOpen(false);
            }}
            sx={{
              width: 36,
              height: 36,

              flexShrink: 0,

              color: "#b8b8b8",

              backgroundColor: "rgba(255,255,255,0.05)",

              "&:hover": {
                color: "#ffffff",

                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Divider
          sx={{
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* MOBILE NAVIGATION */}
        <Box
          sx={{
            flex: 1,

            p: 1.5,

            overflowY: "auto",

            WebkitOverflowScrolling: "touch",
          }}
        >
          {menuItems.map((item) => renderMenuItem(item, true))}
        </Box>

        {/* MOBILE BACK TO SITE */}
        <Box
          sx={{
            p: 1.5,

            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box
            component={Link}
            href="/"
            onClick={() => {
              setMobileOpen(false);
            }}
            sx={{
              height: 46,

              px: 1.5,

              borderRadius: "10px",

              display: "flex",

              alignItems: "center",

              gap: 1.2,

              textDecoration: "none",

              color: "#b8b8b8",

              fontSize: 14,

              fontWeight: 900,

              "&:hover": {
                color: "#ffffff",

                backgroundColor: "rgba(255,255,255,0.06)",
              },

              "& .MuiSvgIcon-root": {
                fontSize: 21,
              },
            }}
          >
            <HomeRoundedIcon />
            Back to site
          </Box>
        </Box>
      </Drawer>

      {/* ========================================
          DESKTOP SIDEBAR
      ======================================== */}
      <Box
        sx={{
          width: sidebarWidth,

          minHeight: "100vh",

          flexShrink: 0,

          backgroundColor: "#111314",

          borderRight: "1px solid rgba(255,255,255,0.08)",

          display: {
            xs: "none",
            md: "flex",
          },

          flexDirection: "column",

          transition: "width 0.22s ease",

          overflow: "hidden",
        }}
      >
        {/* DESKTOP SIDEBAR HEADER */}
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

        <Divider
          sx={{
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* DESKTOP NAVIGATION */}
        <Box
          sx={{
            p: collapsed ? 1 : 1.5,

            flex: 1,
          }}
        >
          {menuItems.map((item) => renderMenuItem(item))}
        </Box>

        {/* DESKTOP SIDEBAR FOOTER */}
        <Box
          sx={{
            p: collapsed ? 1 : 1.5,
          }}
        >
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
    </>
  );
};

export default DashboardSidebar;
