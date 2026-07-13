"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useSession } from "next-auth/react";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

import { getWhoToFollowApi } from "@/utils/api";
import { getInitials, getUserAvatarUrl } from "@/utils/actions/getImages";
import { getUserHref } from "@/utils/actions/navigation";

const FOOTER_LINKS = [
  "Legal",
  "Privacy",
  "Cookie Policy",
  "Cookie Manager",
  "Imprint",
  "Artist Resources",
  "Newsroom",
  "Topics",
  "Charts",
  "Transparency Reports",
];

const getUserId = (user?: Partial<IUser> | null) => {
  return String((user as any)?.id || (user as any)?._id || "").trim();
};

const getDisplayName = (user?: Partial<IUser> | null) => {
  const name = String(
    user?.name || user?.username || user?.email || "SoundClone user"
  ).trim();

  if (name.includes("@")) {
    return name.split("@")[0];
  }

  return name;
};

const formatFollowers = (value?: number | null) => {
  const count = Math.max(Number(value) || 0, 0);

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count >= 100_000 ? 0 : 1)}K`;
  }

  return String(count);
};

const isVerifiedUser = (user?: Partial<IUser> | null) => {
  return Boolean((user as any)?.verified || (user as any)?.isVerify);
};

const LoadingGrid = () => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
          lg: "repeat(6, minmax(0, 1fr))",
        },
        columnGap: {
          xs: 2,
          md: 3,
        },
        rowGap: 5,
      }}
    >
      {Array.from({
        length: 12,
      }).map((_, index) => (
        <Box key={index}>
          <Skeleton
            variant="circular"
            sx={{
              width: "100%",
              maxWidth: 176,
              aspectRatio: "1 / 1",
              height: "auto",
              mx: "auto",
              bgcolor: "rgba(255,255,255,0.08)",
            }}
          />

          <Skeleton
            width="72%"
            height={24}
            sx={{
              mt: 1.4,
              bgcolor: "rgba(255,255,255,0.08)",
            }}
          />

          <Skeleton
            width="55%"
            height={20}
            sx={{
              bgcolor: "rgba(255,255,255,0.06)",
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

const WhoToFollow = () => {
  const { data: session } = useSession();

  const [users, setUsers] = useState<IUser[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const sessionUserId = String(
    (session as any)?.user?.id || (session as any)?.user?._id || ""
  );

  useEffect(() => {
    let cancelled = false;

    const loadSuggestions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getWhoToFollowApi(13);

        if (cancelled) {
          return;
        }

        const responseData = response?.data as any;

        const result: IUser[] = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.result)
          ? responseData.result
          : Array.isArray(responseData?.content)
          ? responseData.content
          : [];

        setUsers(result);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        console.error("Cannot load who to follow:", loadError);

        setUsers([]);
        setError("Cannot load suggested profiles.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleUsers = useMemo(() => {
    const uniqueUsers = new Map<string, IUser>();

    users.forEach((user) => {
      const userId = getUserId(user);

      if (!userId) {
        return;
      }

      if (sessionUserId && userId === sessionUserId) {
        return;
      }

      if (!uniqueUsers.has(userId)) {
        uniqueUsers.set(userId, user);
      }
    });

    return Array.from(uniqueUsers.values()).slice(0, 12);
  }, [users, sessionUserId]);

  return (
    <Box
      component="section"
      sx={{
        width: "100%",
        minHeight: "100vh",
        color: "#ffffff",
        backgroundColor: "#111111",
        px: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        pt: {
          xs: 4,
          md: 6,
        },
        pb: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,
          mx: "auto",
        }}
      >
        <Typography
          component="h1"
          sx={{
            color: "#ffffff",
            fontSize: {
              xs: 23,
              md: 26,
              textAlign: "center",
            },
            fontWeight: 950,
            letterSpacing: "-0.025em",
          }}
        >
          Who to follow
        </Typography>

        <Typography
          sx={{
            mt: 0.55,
            mb: {
              xs: 3.5,
              md: 4.5,
              textAlign: "center",
              mt: 2,
            },
            color: "#a4a4a4",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Suggested artist profiles to discover on SoundClone.
        </Typography>

        {loading && <LoadingGrid />}

        {!loading && error && (
          <Box
            sx={{
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              color: "#9a9a9a",
              backgroundColor: "#181818",
              border: "1px solid rgba(255,255,255,0.08)",
              fontWeight: 800,
            }}
          >
            {error}
          </Box>
        )}

        {!loading && !error && !visibleUsers.length && (
          <Box
            sx={{
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              color: "#9a9a9a",
              backgroundColor: "#181818",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <PersonRoundedIcon
              sx={{
                mb: 1,
                fontSize: 46,
                color: "#ff5500",
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              No suggested profiles yet
            </Typography>
          </Box>
        )}

        {!loading && !error && visibleUsers.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
                lg: "repeat(6, minmax(0, 1fr))",
              },
              columnGap: {
                xs: 2,
                md: 3,
              },
              rowGap: {
                xs: 4,
                md: 5.5,
              },
            }}
          >
            {visibleUsers.map((user) => {
              const userId = getUserId(user);

              const name = getDisplayName(user);

              const profileHref = getUserHref(user);

              const canOpenProfile = profileHref !== "#";

              const avatarUrl = getUserAvatarUrl(user);

              const verified = isVerifiedUser(user);

              return (
                <Box
                  key={userId}
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Box
                    component={Link}
                    href={profileHref}
                    onClick={(event) => {
                      if (!canOpenProfile) {
                        event.preventDefault();
                      }
                    }}
                    sx={{
                      display: "block",
                      width: "100%",
                      maxWidth: 176,
                      aspectRatio: "1 / 1",
                      mx: "auto",
                      borderRadius: "50%",
                      overflow: "hidden",
                      textDecoration: "none",
                      backgroundColor: "#202020",
                      border: "2px solid transparent",
                      boxShadow: "0 14px 36px rgba(0,0,0,0.32)",
                      transition:
                        "transform 180ms ease, border-color 180ms ease",

                      "&:hover": {
                        transform: "translateY(-3px)",
                        borderColor: "rgba(255,85,0,0.85)",
                      },
                    }}
                  >
                    <Avatar
                      src={avatarUrl}
                      alt={name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        color: "#ffffff",
                        backgroundColor: "#ff5500",
                        fontSize: {
                          xs: 28,
                          md: 42,
                        },
                        fontWeight: 950,
                      }}
                    >
                      {getInitials(name, user.email)}
                    </Avatar>
                  </Box>

                  <Box
                    sx={{
                      mt: 1.35,
                      px: 0.2,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.35,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        component={Link}
                        href={profileHref}
                        onClick={(event) => {
                          if (!canOpenProfile) {
                            event.preventDefault();
                          }
                        }}
                        title={name}
                        sx={{
                          minWidth: 0,
                          color: "#ffffff",
                          fontSize: 14,
                          lineHeight: 1.35,
                          fontWeight: 950,
                          textDecoration: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",

                          "&:hover": {
                            color: "#ff5500",
                          },
                        }}
                      >
                        {name}
                      </Typography>

                      {verified && (
                        <VerifiedRoundedIcon
                          sx={{
                            flexShrink: 0,
                            color: "#6ca8ff",
                            fontSize: 16,
                          }}
                        />
                      )}
                    </Box>

                    <Box
                      sx={{
                        mt: 0.25,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.35,
                        color: "#9b9b9b",
                      }}
                    >
                      <PersonRoundedIcon
                        sx={{
                          fontSize: 15,
                        }}
                      />

                      <Typography
                        sx={{
                          color: "#9b9b9b",
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatFollowers(user.followers)} followers
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <Box
          component="footer"
          sx={{
            mt: {
              xs: 8,
              md: 11,
            },
            pt: 2,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              columnGap: 0.6,
              rowGap: 0.7,
              mt: 4,
              mb: 2,
              width: "100%",
              textAlign: "center",
            }}
          >
            {FOOTER_LINKS.map((label, index) => (
              <Box
                key={label}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.6,
                }}
              >
                {index > 0 && (
                  <Typography
                    component="span"
                    sx={{
                      color: "#777777",
                      fontSize: 12,
                    }}
                  >
                    ·
                  </Typography>
                )}

                <Typography
                  component="button"
                  type="button"
                  sx={{
                    p: 0,
                    border: 0,
                    color: "#9b9b9b",
                    backgroundColor: "transparent",
                    fontSize: 12,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    textAlign: "center",

                    "&:hover": {
                      color: "#ffffff",
                    },
                  }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography
            sx={{
              mt: 2.5,
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            Language:{" "}
            <Box
              component="span"
              sx={{
                color: "#4d9cff",
              }}
            >
              English (US)
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default WhoToFollow;
