"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";

import {
  clearReadNotificationsApi,
  deleteNotificationApi,
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "@/utils/api";

type NotificationFilter = "all" | "unread";

const PAGE_SIZE = 15;

const getNotificationIcon = (type: INotification["type"]) => {
  switch (type) {
    case "TRACK_LIKE":
      return (
        <FavoriteRoundedIcon
          sx={{
            fontSize: 22,
          }}
        />
      );

    case "TRACK_COMMENT":
      return (
        <CommentRoundedIcon
          sx={{
            fontSize: 22,
          }}
        />
      );

    case "NEW_FOLLOW":
      return (
        <PersonAddAltRoundedIcon
          sx={{
            fontSize: 22,
          }}
        />
      );

    case "TRACK_APPROVED":
    case "TRACK_REJECTED":
    case "COPYRIGHT_APPROVED":
    case "COPYRIGHT_REJECTED":
    case "TRACK_PROCESSING_COMPLETED":
      return (
        <LibraryMusicRoundedIcon
          sx={{
            fontSize: 22,
          }}
        />
      );

    case "SUBSCRIPTION_CHANGED":
    case "SUBSCRIPTION_CANCEL_SCHEDULED":
    case "SUBSCRIPTION_RENEWED":
    case "SUBSCRIPTION_EXPIRING":
    case "UPLOAD_QUOTA_WARNING":
    case "UPLOAD_QUOTA_EXCEEDED":
      return (
        <WorkspacePremiumRoundedIcon
          sx={{
            fontSize: 22,
          }}
        />
      );

    default:
      return (
        <InfoRoundedIcon
          sx={{
            fontSize: 22,
          }}
        />
      );
  }
};

const formatNotificationTime = (value?: string) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMilliseconds = Date.now() - date.getTime();

  const diffMinutes = Math.floor(diffMilliseconds / 60_000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const NotificationsPage = () => {
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();

  const [notifications, setNotifications] = useState<INotification[]>([]);

  const [filter, setFilter] = useState<NotificationFilter>("all");

  const [page, setPage] = useState(0);

  const [lastPage, setLastPage] = useState(true);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [markingAll, setMarkingAll] = useState(false);

  const [clearingRead, setClearingRead] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token ||
    (session as any)?.user?.accessToken ||
    "";

  const readCount = useMemo(
    () => notifications.filter((notification) => notification.isRead).length,
    [notifications]
  );

  const loadUnreadCount = useCallback(async () => {
    if (!accessToken) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getUnreadNotificationCountApi(accessToken);

      if (response?.error || Number(response?.statusCode) >= 400) {
        return;
      }

      setUnreadCount(Number(response?.data?.unreadCount || 0));
    } catch (error) {
      console.error("Cannot load unread notification count:", error);
    }
  }, [accessToken]);

  const loadNotifications = useCallback(
    async (
      requestedPage: number,
      requestedFilter: NotificationFilter,
      append: boolean
    ) => {
      if (!accessToken) {
        setNotifications([]);
        setLastPage(true);
        return;
      }

      try {
        setErrorMessage("");

        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await getNotificationsApi(
          requestedPage,
          PAGE_SIZE,
          requestedFilter,
          accessToken
        );

        if (response?.error || Number(response?.statusCode) >= 400) {
          throw new Error(response?.message || "Cannot load notifications");
        }

        const items = Array.isArray(response?.data?.content)
          ? response.data.content
          : [];

        setNotifications((current) =>
          append
            ? [
                ...current,
                ...items.filter(
                  (newItem) =>
                    !current.some(
                      (currentItem) => currentItem.id === newItem.id
                    )
                ),
              ]
            : items
        );

        setPage(requestedPage);

        setLastPage(Boolean(response?.data?.last));
      } catch (error) {
        console.error("Cannot load notifications:", error);

        setErrorMessage(
          error instanceof Error ? error.message : "Cannot load notifications"
        );

        if (!append) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !accessToken) {
      if (sessionStatus !== "loading") {
        setLoading(false);
      }

      return;
    }

    void Promise.all([loadNotifications(0, filter, false), loadUnreadCount()]);
  }, [sessionStatus, accessToken, filter, loadNotifications, loadUnreadCount]);

  const handleFilterChange = (nextFilter: NotificationFilter) => {
    if (nextFilter === filter) {
      return;
    }

    setFilter(nextFilter);
    setPage(0);
    setLastPage(true);
    setNotifications([]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    await Promise.all([loadNotifications(0, filter, false), loadUnreadCount()]);
  };

  const handleLoadMore = async () => {
    if (loadingMore || lastPage) {
      return;
    }

    await loadNotifications(page + 1, filter, true);
  };

  const handleNotificationClick = async (notification: INotification) => {
    if (!accessToken) {
      return;
    }

    if (!notification.isRead) {
      try {
        const response = await markNotificationAsReadApi(
          notification.id,
          accessToken
        );

        if (!response?.error && Number(response?.statusCode) < 400) {
          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    isRead: true,
                    readAt: new Date().toISOString(),
                  }
                : item
            )
          );

          setUnreadCount((current) => Math.max(current - 1, 0));

          if (filter === "unread") {
            setNotifications((current) =>
              current.filter((item) => item.id !== notification.id)
            );
          }
        }
      } catch (error) {
        console.error("Cannot mark notification as read:", error);
      }
    }

    if (notification.redirectUrl) {
      router.push(notification.redirectUrl);
    }
  };

  const handleDelete = async (
    event: React.MouseEvent | React.KeyboardEvent,
    notificationId: string
  ) => {
    event.stopPropagation();

    if (!accessToken) {
      return;
    }

    try {
      setDeletingId(notificationId);

      const notification = notifications.find(
        (item) => item.id === notificationId
      );

      const response = await deleteNotificationApi(notificationId, accessToken);

      if (response?.error || Number(response?.statusCode) >= 400) {
        throw new Error(response?.message || "Cannot delete notification");
      }

      setNotifications((current) =>
        current.filter((item) => item.id !== notificationId)
      );

      if (notification && !notification.isRead) {
        setUnreadCount((current) => Math.max(current - 1, 0));
      }
    } catch (error) {
      console.error("Cannot delete notification:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Cannot delete notification"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!accessToken || unreadCount <= 0) {
      return;
    }

    try {
      setMarkingAll(true);
      setErrorMessage("");

      const response = await markAllNotificationsAsReadApi(accessToken);

      if (response?.error || Number(response?.statusCode) >= 400) {
        throw new Error(
          response?.message || "Cannot mark all notifications as read"
        );
      }

      setUnreadCount(0);

      if (filter === "unread") {
        setNotifications([]);
      } else {
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt || new Date().toISOString(),
          }))
        );
      }
    } catch (error) {
      console.error("Cannot mark all notifications as read:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Cannot mark all notifications as read"
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClearRead = async () => {
    if (!accessToken || readCount <= 0) {
      return;
    }

    try {
      setClearingRead(true);
      setErrorMessage("");

      const response = await clearReadNotificationsApi(accessToken);

      if (response?.error || Number(response?.statusCode) >= 400) {
        throw new Error(response?.message || "Cannot clear read notifications");
      }

      setNotifications((current) =>
        current.filter((notification) => !notification.isRead)
      );
    } catch (error) {
      console.error("Cannot clear read notifications:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Cannot clear read notifications"
      );
    } finally {
      setClearingRead(false);
    }
  };

  if (sessionStatus === "loading") {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "#0d0d0d",
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Skeleton
            variant="rounded"
            height={70}
            sx={{
              bgcolor: "rgba(255,255,255,0.06)",
              mb: 2,
            }}
          />

          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={100}
              sx={{
                bgcolor: "rgba(255,255,255,0.045)",
                mb: 1,
              }}
            />
          ))}
        </Container>
      </Box>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Paper
          sx={{
            width: "100%",
            maxWidth: 450,
            p: 4,
            textAlign: "center",
            color: "#ffffff",
            backgroundColor: "#151515",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
          }}
        >
          <NotificationsNoneRoundedIcon
            sx={{
              fontSize: 54,
              color: "#ff5500",
              mb: 1.5,
            }}
          />

          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Sign in required
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#999999",
              fontSize: 14,
            }}
          >
            Sign in to view your notifications.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#0d0d0d",
        color: "#ffffff",
        py: {
          xs: 2,
          md: 4,
        },
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            mb: 2.5,
            display: "flex",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            justifyContent: "space-between",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                fontSize: {
                  xs: 28,
                  md: 34,
                },
                fontWeight: 950,
                letterSpacing: "-0.035em",
              }}
            >
              Notifications
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                color: "#929292",
                fontSize: 14,
              }}
            >
              {unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "You're all caught up"}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              flexWrap: "wrap",
            }}
          >
            <Tooltip title="Refresh">
              <span>
                <IconButton
                  onClick={() => void handleRefresh()}
                  disabled={refreshing}
                  sx={{
                    color: "#b8b8b8",
                    border: "1px solid rgba(255,255,255,0.12)",

                    "&:hover": {
                      color: "#ffffff",
                      borderColor: "rgba(255,255,255,0.3)",
                      backgroundColor: "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  {refreshing ? (
                    <CircularProgress
                      size={20}
                      sx={{
                        color: "#ff5500",
                      }}
                    />
                  ) : (
                    <RefreshRoundedIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            <Button
              startIcon={
                markingAll ? (
                  <CircularProgress
                    size={15}
                    sx={{
                      color: "inherit",
                    }}
                  />
                ) : (
                  <DoneAllRoundedIcon />
                )
              }
              disabled={unreadCount <= 0 || markingAll}
              onClick={() => void handleMarkAllAsRead()}
              sx={{
                minHeight: 40,
                px: 1.5,
                color: "#ffffff",
                textTransform: "none",
                fontSize: 12,
                fontWeight: 850,
                border: "1px solid rgba(255,255,255,0.12)",

                "&:hover": {
                  borderColor: "#ff5500",
                  backgroundColor: "rgba(255,85,0,0.08)",
                },

                "&.Mui-disabled": {
                  color: "#555555",
                  borderColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              Mark all read
            </Button>

            <Button
              startIcon={
                clearingRead ? (
                  <CircularProgress
                    size={15}
                    sx={{
                      color: "inherit",
                    }}
                  />
                ) : (
                  <CleaningServicesRoundedIcon />
                )
              }
              disabled={readCount <= 0 || clearingRead}
              onClick={() => void handleClearRead()}
              sx={{
                minHeight: 40,
                px: 1.5,
                color: "#b8b8b8",
                textTransform: "none",
                fontSize: 12,
                fontWeight: 850,
                border: "1px solid rgba(255,255,255,0.12)",

                "&:hover": {
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                },

                "&.Mui-disabled": {
                  color: "#555555",
                  borderColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              Clear read
            </Button>
          </Box>
        </Box>

        <Paper
          sx={{
            overflow: "hidden",
            color: "#ffffff",
            backgroundColor: "#131313",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 2.5,
            boxShadow: "0 18px 50px rgba(0,0,0,0.2)",
          }}
        >
          <Box
            sx={{
              px: {
                xs: 1.2,
                sm: 2,
              },
              py: 1.2,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Button
              onClick={() => handleFilterChange("all")}
              sx={{
                minWidth: 70,
                px: 1.5,
                py: 0.7,
                borderRadius: "999px",
                color: filter === "all" ? "#ffffff" : "#8e8e8e",
                backgroundColor: filter === "all" ? "#ff5500" : "transparent",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 900,

                "&:hover": {
                  backgroundColor:
                    filter === "all" ? "#ff5500" : "rgba(255,255,255,0.06)",
                },
              }}
            >
              All
            </Button>

            <Button
              onClick={() => handleFilterChange("unread")}
              sx={{
                minWidth: 85,
                px: 1.5,
                py: 0.7,
                borderRadius: "999px",
                color: filter === "unread" ? "#ffffff" : "#8e8e8e",
                backgroundColor:
                  filter === "unread" ? "#ff5500" : "transparent",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 900,

                "&:hover": {
                  backgroundColor:
                    filter === "unread" ? "#ff5500" : "rgba(255,255,255,0.06)",
                },
              }}
            >
              Unread
              {unreadCount > 0 ? ` ${unreadCount}` : ""}
            </Button>
          </Box>

          <Divider
            sx={{
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />

          {errorMessage && (
            <Alert
              severity="error"
              onClose={() => setErrorMessage("")}
              sx={{
                m: 2,
                color: "#ffffff",
                backgroundColor: "rgba(211,47,47,0.15)",

                "& .MuiAlert-icon": {
                  color: "#ff6b6b",
                },
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {loading ? (
            <Box>
              {[1, 2, 3, 4, 5].map((item) => (
                <Box
                  key={item}
                  sx={{
                    px: 2,
                    py: 1.7,
                    display: "flex",
                    gap: 1.5,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Skeleton
                    variant="circular"
                    width={48}
                    height={48}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.07)",
                      flexShrink: 0,
                    }}
                  />

                  <Box
                    sx={{
                      flex: 1,
                    }}
                  >
                    <Skeleton
                      width="42%"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.07)",
                      }}
                    />

                    <Skeleton
                      width="78%"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.05)",
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                minHeight: 360,
                px: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Box>
                <Avatar
                  sx={{
                    width: 74,
                    height: 74,
                    mx: "auto",
                    mb: 2,
                    color: "#ff5500",
                    backgroundColor: "rgba(255,85,0,0.1)",
                  }}
                >
                  <NotificationsNoneRoundedIcon
                    sx={{
                      fontSize: 38,
                    }}
                  />
                </Avatar>

                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 900,
                  }}
                >
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.7,
                    color: "#858585",
                    fontSize: 13,
                  }}
                >
                  {filter === "unread"
                    ? "You have read all of your notifications."
                    : "New likes, comments and follows will appear here."}
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {notifications.map((notification) => (
                <Box
                  key={notification.id}
                  component="button"
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  sx={{
                    appearance: "none",
                    width: "100%",
                    px: {
                      xs: 1.4,
                      sm: 2,
                    },
                    py: 1.6,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: {
                      xs: 1.1,
                      sm: 1.5,
                    },
                    color: "#ffffff",
                    textAlign: "left",
                    border: 0,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: notification.isRead
                      ? "transparent"
                      : "rgba(255,85,0,0.055)",
                    cursor: notification.redirectUrl ? "pointer" : "default",
                    transition: "background-color 150ms ease",

                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.055)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      color: notification.isRead ? "#9a9a9a" : "#ffffff",
                      backgroundColor: notification.isRead
                        ? "rgba(255,255,255,0.07)"
                        : "#ff5500",
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>

                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: notification.isRead ? 750 : 950,
                          lineHeight: 1.4,
                        }}
                      >
                        {notification.title}
                      </Typography>

                      <Typography
                        sx={{
                          flexShrink: 0,
                          color: "#6f6f6f",
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatNotificationTime(notification.createdAt)}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "#a0a0a0",
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.55,
                      }}
                    >
                      {notification.message}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      minHeight: 42,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    {!notification.isRead && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          flexShrink: 0,
                          borderRadius: "50%",
                          backgroundColor: "#ff5500",
                        }}
                      />
                    )}

                    <Tooltip title="Delete">
                      <span>
                        <IconButton
                          size="small"
                          disabled={deletingId === notification.id}
                          onClick={(event) =>
                            void handleDelete(event, notification.id)
                          }
                          sx={{
                            color: "#757575",

                            "&:hover": {
                              color: "#ff6b6b",
                              backgroundColor: "rgba(255,80,80,0.08)",
                            },
                          }}
                        >
                          {deletingId === notification.id ? (
                            <CircularProgress
                              size={17}
                              sx={{
                                color: "#ff5500",
                              }}
                            />
                          ) : (
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              ))}

              {!lastPage && (
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    onClick={() => void handleLoadMore()}
                    disabled={loadingMore}
                    sx={{
                      minWidth: 135,
                      height: 40,
                      color: "#ffffff",
                      textTransform: "none",
                      fontSize: 13,
                      fontWeight: 900,
                      border: "1px solid rgba(255,255,255,0.15)",

                      "&:hover": {
                        borderColor: "#ff5500",
                        backgroundColor: "rgba(255,85,0,0.08)",
                      },
                    }}
                  >
                    {loadingMore ? (
                      <CircularProgress
                        size={20}
                        sx={{
                          color: "#ff5500",
                        }}
                      />
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default NotificationsPage;
