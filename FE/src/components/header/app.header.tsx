"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CloudRoundedIcon from "@mui/icons-material/CloudRounded";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

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

const AppHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  const [keyword, setKeyword] = React.useState("");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const handleSearch = () => {
    const value = keyword.trim();
    if (!value) return;

    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    await signOut({ callbackUrl: "/" });
  };

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
                  display: "flex",
                  alignItems: "center",
                  gap: 0.2,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 22,
                    position: "relative",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  <Image
                    src="/images/logo/Sc.png"
                    alt="SoundCloud"
                    fill
                    sizes="32px"
                    style={{
                      objectFit: "contain",
                      filter: "brightness(0) invert(1)",
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
                href="/feed"
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
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 460,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#222222",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.04)",
                  overflow: "hidden",
                  transition: "0.18s ease",
                  "&:focus-within": {
                    backgroundColor: "#2a2a2a",
                    borderColor: "rgba(255,255,255,0.16)",
                  },
                }}
              >
                <InputBase
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="Search"
                  sx={{
                    flex: 1,
                    height: "100%",
                    px: 2,
                    color: "#ffffff",
                    fontSize: 14,
                    "& input::placeholder": {
                      color: "#9b9b9b",
                      opacity: 1,
                    },
                  }}
                />

                <IconButton
                  onClick={handleSearch}
                  sx={{
                    width: 42,
                    height: 34,
                    borderRadius: 0,
                    color: "#b8b8b8",
                    "&:hover": {
                      color: "#ffffff",
                      backgroundColor: "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  <SearchRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
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
                href="/premium"
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

              {isAdmin && (
                <Box component={Link} href="/dashboard" sx={rightTextSx}>
                  Artist Studio
                </Box>
              )}

              <Box component={Link} href="/track/upload" sx={rightTextSx}>
                Upload
              </Box>

              {session ? (
                <>
                  <Box
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      cursor: "pointer",
                    }}
                  >
                    <Avatar
                      src={(user?.image as string) || "/images/logo/Sc.png"}
                      alt={user?.name || "User"}
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "#ff5500",
                        border: "1px solid rgba(255,255,255,0.18)",
                      }}
                    />

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
                      "&:hover": { color: "#ffffff" },
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
                      "&:hover": { color: "#ffffff" },
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
                      "&:hover": { color: "#ffffff" },
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

      {/* User menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 190,
            backgroundColor: "#181818",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            "& .MuiMenuItem-root": {
              gap: 1.2,
              fontSize: 14,
              "&:hover": {
                backgroundColor: "rgba(255,85,0,0.14)",
                color: "#ff5500",
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/profile");
          }}
        >
          <PersonRoundedIcon fontSize="small" />
          Profile
        </MenuItem>

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

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

        <MenuItem onClick={handleLogout}>
          <LogoutRoundedIcon fontSize="small" />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default AppHeader;
