"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CloudRoundedIcon from "@mui/icons-material/CloudRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import StarsRoundedIcon from "@mui/icons-material/StarsRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { PlaylistPlaySharp } from "@mui/icons-material";
import SearchDropdown from "@/app/search/components/search.dropdown";

const AppHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const isSessionLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && Boolean(session);
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  const [keyword, setKeyword] = React.useState("");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const navItemSx = (active: boolean) => ({
    height: 46,
    px: 2.3,
    display: "flex",
    alignItems: "center",
    color: active ? "#ffffff" : "#b8b8b8",
    backgroundColor: active ? "#111111" : "transparent",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: active ? 800 : 700,
    borderLeft: "1px solid rgba(255,255,255,0.06)",
    borderRight: active ? "1px solid rgba(255,255,255,0.06)" : "none",
    transition: "0.18s ease",
    "&:hover": {
      color: "#ffffff",
      backgroundColor: "#111111",
    },
  });

  const rightTextSx = {
    color: "#b8b8b8",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: "nowrap",
    transition: "0.18s ease",
    "&:hover": {
      color: "#ffffff",
    },
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    await signOut({ callbackUrl: "/" });
  };

  ///get Al avatar
  const getInitials = (name?: string, email?: string) => {
    const value = name?.trim() || email?.trim() || "User";

    const words = value.split(" ").filter(Boolean);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return value.slice(0, 2).toUpperCase();
  };

  ///

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1200,
          height: 46,
          backgroundColor: "#111111",
          borderBottom: "1px solid #050505",
        }}
      >
        <Container
          maxWidth="lg"
          disableGutters
          sx={{
            height: 46,
          }}
        >
          <Toolbar
            disableGutters
            sx={{
              height: "46px !important",
              minHeight: "46px !important",
              px: { xs: 1, md: 0 },
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Logo */}
            <Box
              component={Link}
              href="/"
              sx={{
                width: { xs: 58, sm: 88 },
                height: 46,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 30,
                  position: "relative",
                  display: { xs: "none", sm: "block" },
                }}
              >
                <Image
                  src="/images/logo/Sc.png"
                  alt="SoundClone"
                  fill
                  sizes="38px"
                  style={{
                    objectFit: "contain",
                  }}
                  priority
                />
              </Box>

              <CloudRoundedIcon
                sx={{
                  display: { xs: "block", sm: "none" },
                  color: "#ffffff",
                  fontSize: 30,
                }}
              />
            </Box>

            {/* Left nav */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                height: 46,
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Box component={Link} href="/" sx={navItemSx(isActive("/"))}>
                Home
              </Box>

              <Box
                component={Link}
                href="/blog"
                sx={navItemSx(isActive("/feed"))}
              >
                Feed
              </Box>

              <Box
                component={Link}
                href="/library"
                sx={navItemSx(isActive("/library"))}
              >
                Library
              </Box>
              {isAdmin && (
                <Box
                  component={Link}
                  href="/dashboard"
                  sx={{
                    ...navItemSx(isActive("/dashboard")),
                    color: isActive("/dashboard") ? "#ffffff" : "#ffb088",
                    "&:hover": {
                      color: "#ffffff",
                      backgroundColor: "#1b1b1b",
                    },
                  }}
                >
                  Dashboard
                </Box>
              )}
            </Box>

            {/* Search */}
            <Box
              sx={{
                flex: 1,
                px: { xs: 1, md: 2 },
                display: "flex",
                alignItems: "center",
              }}
            >
              <SearchDropdown
                onEmptySearch={() => {
                  router.push("/search");
                }}
              />
            </Box>

            {/* Right actions */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 2.2,
                height: 46,
                flexShrink: 0,
              }}
            >
              <Button
                component={Link}
                href="/plans"
                variant="outlined"
                sx={{
                  height: 30,
                  px: 1.6,
                  borderRadius: "4px",
                  borderColor: "#ff5500",
                  color: "#ff5500",
                  textTransform: "none",
                  fontSize: 13,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: "#ff6a00",
                    backgroundColor: "rgba(255,85,0,0.1)",
                  },
                }}
              >
                Upgrade now
              </Button>

              <Box component={Link} href="/artist-studio" sx={rightTextSx}>
                Artist Studio
              </Box>

              <Box component={Link} href="/track/upload" sx={rightTextSx}>
                Upload
              </Box>

              {isSessionLoading ? (
                <Box
                  sx={{
                    width: 142,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 1.2,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      animation: "headerPulse 1.2s ease-in-out infinite",

                      "@keyframes headerPulse": {
                        "0%, 100%": {
                          opacity: 0.45,
                        },
                        "50%": {
                          opacity: 0.9,
                        },
                      },
                    }}
                  />

                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.08)",
                    }}
                  />

                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.08)",
                    }}
                  />
                </Box>
              ) : isAuthenticated ? (
                <>
                  <Box
                    onClick={(event) => setAnchorEl(event.currentTarget)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      cursor: "pointer",
                    }}
                  >
                    <Avatar
                      src={user?.avatarUrl || user?.avatar || ""}
                      alt={user?.name || "User"}
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "#ff5500",
                        color: "#ffffff",
                        fontWeight: 900,
                        fontSize: 12,
                      }}
                    >
                      {getInitials(user?.name, user?.email)}
                    </Avatar>

                    <KeyboardArrowDownRoundedIcon
                      sx={{
                        color: "#9b9b9b",
                        fontSize: 22,
                      }}
                    />
                  </Box>

                  <IconButton
                    size="small"
                    sx={{
                      color: "#b8b8b8",
                      p: 0.5,
                      "&:hover": {
                        color: "#ffffff",
                      },
                    }}
                  >
                    <NotificationsNoneRoundedIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    sx={{
                      color: "#b8b8b8",
                      p: 0.5,
                      position: "relative",

                      "&:hover": {
                        color: "#ffffff",
                      },

                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: 4,
                        right: 3,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: "#ff5500",
                      },
                    }}
                  >
                    <MailOutlineRoundedIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    sx={{
                      color: "#b8b8b8",
                      p: 0.5,

                      "&:hover": {
                        color: "#ffffff",
                      },
                    }}
                  >
                    <MoreHorizRoundedIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <Button
                  component={Link}
                  href="/auth/signin"
                  sx={{
                    height: 30,
                    px: 1.8,
                    color: "#ffffff",
                    backgroundColor: "#ff5500",
                    borderRadius: "4px",
                    textTransform: "none",
                    fontSize: 13,
                    fontWeight: 900,

                    "&:hover": {
                      backgroundColor: "#ff6a00",
                    },
                  }}
                >
                  Sign in
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        transformOrigin={{ horizontal: "center", vertical: "top" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 210,
              backgroundColor: "#111111",
              color: "#f2f2f2",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 0,
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              overflow: "hidden",

              "& .MuiList-root": {
                py: 0.5,
              },

              "& .MuiMenuItem-root": {
                minHeight: 36,
                px: 2,
                gap: 1.2,
                fontSize: 14,
                fontWeight: 800,
                color: "#f2f2f2",
                transition: "0.16s ease",
              },

              "& .MuiMenuItem-root:hover": {
                backgroundColor: "#222222",
                color: "#ffffff",
              },

              "& .MuiSvgIcon-root": {
                fontSize: 18,
                color: "#ffffff",
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            const userId = user?._id || user?.id;

            if (userId) {
              router.push(`/profile/${userId}`);
            }
          }}
        >
          <PersonRoundedIcon fontSize="small" />
          Profile
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/like");
          }}
        >
          <FavoriteRoundedIcon fontSize="small" />
          Likes
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/playlist");
          }}
        >
          <PlaylistPlaySharp fontSize="small" />
          Playlists
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/people");
          }}
        >
          <GroupsRoundedIcon fontSize="small" />
          Who to follow
        </MenuItem>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 0.5 }} />

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/plans");
          }}
        >
          <StarsRoundedIcon
            fontSize="small"
            sx={{ color: "#ff5500 !important" }}
          />
          Try Artist Pro
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/track/upload");
          }}
        >
          <UploadRoundedIcon fontSize="small" />
          Tracks
        </MenuItem>

        {isAdmin && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              router.push("/dashboard");
            }}
          >
            <BarChartRoundedIcon fontSize="small" />
            Insights
          </MenuItem>
        )}

        {isAdmin && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              router.push("/dashboard");
            }}
          >
            <DashboardRoundedIcon fontSize="small" />
            Dashboard
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/distribute");
          }}
        >
          <CloudRoundedIcon fontSize="small" />
          Distribute
        </MenuItem>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 0.5 }} />

        <MenuItem onClick={handleLogout}>
          <LogoutRoundedIcon fontSize="small" />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default AppHeader;
