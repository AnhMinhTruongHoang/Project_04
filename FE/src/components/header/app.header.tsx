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
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CloudRoundedIcon from "@mui/icons-material/CloudRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
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
import NotificationBell from "../../app/(user)/notifications/components/notificationBell";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

const AppHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const isSessionLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && Boolean(session);
  const isAdmin = isAuthenticated && user?.role === "ADMIN";
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [mobileNavAnchorEl, setMobileNavAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const mobileNavOpen = Boolean(mobileNavAnchorEl);

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

          height: {
            xs: 56,
            md: 46,
          },

          backgroundColor: "#111111",
          borderBottom: "1px solid #050505",
        }}
      >
        <Container
          maxWidth="lg"
          disableGutters
          sx={{
            height: {
              xs: 56,
              md: 46,
            },
          }}
        >
          <Toolbar
            disableGutters
            sx={{
              height: {
                xs: "56px !important",
                md: "46px !important",
              },

              minHeight: {
                xs: "56px !important",
                md: "46px !important",
              },

              px: {
                xs: 1,
                sm: 1.5,
                md: 0,
              },

              display: "flex",
              alignItems: "center",
              gap: {
                xs: 0.5,
                md: 0,
              },
            }}
          >
            {/* LOGO */}
            <Box
              component={Link}
              href="/"
              sx={{
                width: {
                  xs: 42,
                  sm: 58,
                  md: 88,
                },

                height: {
                  xs: 56,
                  md: 46,
                },

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

                  display: {
                    xs: "none",
                    sm: "block",
                  },
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
                  display: {
                    xs: "block",
                    sm: "none",
                  },

                  color: "#ffffff",
                  fontSize: 29,
                }}
              />
            </Box>

            {/* DESKTOP NAV */}
            <Box
              sx={{
                display: {
                  xs: "none",
                  md: "flex",
                },

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
                <Divider
                  sx={{
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                />
              )}
            </Box>

            {/* SEARCH */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,

                px: {
                  xs: 0.5,
                  sm: 1,
                  md: 2,
                },

                maxWidth: {
                  xs: isAuthenticated
                    ? "calc(100vw - 125px)"
                    : "calc(100vw - 115px)",

                  sm: "calc(100vw - 160px)",

                  md: "none",
                },

                display: "flex",
                alignItems: "center",

                // Quan trọng:
                // Không dùng overflow hidden vì sẽ cắt dropdown search.
                overflow: "visible",

                position: "relative",
                zIndex: 1301,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  minWidth: 0,

                  position: "relative",

                  "& > *": {
                    width: "100%",
                    maxWidth: "100%",
                  },
                }}
              >
                <SearchDropdown
                  onEmptySearch={() => {
                    router.push("/search");
                  }}
                />
              </Box>
            </Box>

            {/* DESKTOP RIGHT ACTIONS */}
            <Box
              sx={{
                display: {
                  xs: "none",
                  md: "flex",
                },

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

              {/* DESKTOP AUTH ACTIONS */}
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
                </Box>
              ) : isAuthenticated ? (
                <>
                  {/* USER AVATAR */}
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

                  {/* NOTIFICATION */}
                  <NotificationBell />

                  {/* MORE ACTIONS */}
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
                /* SIGN IN */
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

                    whiteSpace: "nowrap",

                    "&:hover": {
                      backgroundColor: "#ff6a00",
                    },
                  }}
                >
                  Sign in
                </Button>
              )}
            </Box>

            {/* MOBILE RIGHT ACTIONS */}
            <Box
              sx={{
                display: {
                  xs: "flex",
                  md: "none",
                },
                alignItems: "center",
                gap: 0.25,
                flexShrink: 0,
              }}
            >
              {/* HAMBURGER */}
              <IconButton
                aria-label="Open navigation"
                onClick={(event) => {
                  setMobileNavAnchorEl(event.currentTarget);
                }}
                sx={{
                  width: 36,
                  height: 36,
                  color: "#d8d8d8",

                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.07)",
                  },
                }}
              >
                <MenuRoundedIcon
                  sx={{
                    fontSize: 25,
                  }}
                />
              </IconButton>

              {isSessionLoading ? (
                <Box
                  sx={{
                    width: 31,
                    height: 31,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.1)",
                  }}
                />
              ) : isAuthenticated ? (
                <IconButton
                  onClick={(event) => {
                    setAnchorEl(event.currentTarget);
                  }}
                  sx={{
                    p: 0.25,
                  }}
                >
                  <Avatar
                    src={user?.avatarUrl || user?.avatar || ""}
                    alt={user?.name || "User"}
                    sx={{
                      width: 31,
                      height: 31,
                      bgcolor: "#ff5500",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 900,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {getInitials(user?.name, user?.email)}
                  </Avatar>
                </IconButton>
              ) : null}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Menu
        anchorEl={mobileNavAnchorEl}
        open={mobileNavOpen}
        onClose={() => {
          setMobileNavAnchorEl(null);
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 245,
              maxWidth: "calc(100vw - 20px)",

              backgroundColor: "#111111",
              color: "#ffffff",

              border: "1px solid rgba(255,255,255,0.09)",

              borderRadius: "10px",

              boxShadow: "0 18px 45px rgba(0,0,0,0.5)",

              "& .MuiMenuItem-root": {
                minHeight: 46,
                px: 2,
                fontSize: 14,
                fontWeight: 800,

                "&:hover": {
                  backgroundColor: "#202020",
                },
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setMobileNavAnchorEl(null);
            router.push("/");
          }}
        >
          Home
        </MenuItem>

        <MenuItem
          onClick={() => {
            setMobileNavAnchorEl(null);
            router.push("/blog");
          }}
        >
          Feed
        </MenuItem>

        <MenuItem
          onClick={() => {
            setMobileNavAnchorEl(null);
            router.push("/library");
          }}
        >
          Library
        </MenuItem>

        {/* MOBILE AUTH ACTIONS */}
        <Divider
          sx={{
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {isAuthenticated ? (
          <MenuItem
            onClick={async () => {
              setMobileNavAnchorEl(null);

              await signOut({
                callbackUrl: "/",
              });
            }}
            sx={{
              color: "#f2f2f2",
            }}
          >
            <LogoutRoundedIcon fontSize="small" />
            Logout
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              setMobileNavAnchorEl(null);

              router.push("/auth/signin");
            }}
            sx={{
              color: "#ff5500 !important",

              fontWeight: "900 !important",
            }}
          >
            <PersonRoundedIcon fontSize="small" />
            Sign in
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            setMobileNavAnchorEl(null);
            router.push("/plans");
          }}
          sx={{
            color: "#ff5500 !important",
          }}
        >
          Upgrade plan
        </MenuItem>

        <MenuItem
          onClick={() => {
            setMobileNavAnchorEl(null);
            router.push("/artist-studio");
          }}
        >
          Artist Studio
        </MenuItem>

        <MenuItem
          onClick={() => {
            setMobileNavAnchorEl(null);
            router.push("/track/upload");
          }}
        >
          Upload
        </MenuItem>

        {isAdmin && (
          <Divider
            sx={{
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />
        )}

        {isAdmin && (
          <MenuItem
            onClick={() => {
              setMobileNavAnchorEl(null);
              router.push("/dashboard");
            }}
          >
            Dashboard
          </MenuItem>
        )}
      </Menu>

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

              minWidth: {
                xs: 230,
                sm: 210,
              },

              maxWidth: "calc(100vw - 24px)",

              maxHeight: "calc(100dvh - 80px)",

              backgroundColor: "#111111",
              color: "#f2f2f2",

              border: "1px solid rgba(255,255,255,0.08)",

              borderRadius: {
                xs: "10px",
                md: 0,
              },

              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",

              overflowY: "auto",

              "& .MuiList-root": {
                py: 0.5,
              },

              "& .MuiMenuItem-root": {
                minHeight: {
                  xs: 44,
                  md: 36,
                },

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
