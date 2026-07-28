"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Switch,
  Typography,
} from "@mui/material";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";

import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "@/utils/api";

const getNotificationIcon = (type: INotification["type"]) => {
  switch (type) {
    /* =========================
       SOCIAL
    ========================= */
    case "TRACK_LIKE":
      return (
        <FavoriteRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    case "TRACK_COMMENT":
      return (
        <CommentRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    case "NEW_FOLLOW":
      return (
        <PersonAddAltRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    /* =========================
       TRACK
    ========================= */
    case "TRACK_APPROVED":
    case "TRACK_REJECTED":
    case "COPYRIGHT_APPROVED":
    case "COPYRIGHT_REJECTED":
    case "TRACK_PROCESSING_COMPLETED":
      return (
        <LibraryMusicRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    /* =========================
       PAYMENT
    ========================= */
    case "PAYMENT_PAID":
      return (
        <PaymentRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    case "PAYMENT_FAILED":
      return (
        <ErrorOutlineRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    case "PAYMENT_CANCELED":
      return (
        <CancelRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    case "PAYMENT_EXPIRED":
      return (
        <ScheduleRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    /* =========================
       SUBSCRIPTION
    ========================= */
    case "SUBSCRIPTION_ACTIVATED":
    case "SUBSCRIPTION_CHANGED":
    case "SUBSCRIPTION_CANCEL_SCHEDULED":
    case "SUBSCRIPTION_RENEWED":
    case "SUBSCRIPTION_EXPIRING":
    case "SUBSCRIPTION_EXPIRED":
    case "UPLOAD_QUOTA_WARNING":
    case "UPLOAD_QUOTA_EXCEEDED":
      return (
        <WorkspacePremiumRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    /* =========================
       ARTIST EARNING
    ========================= */
    case "EARNING_AVAILABLE":
      return (
        <PaidRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    /* =========================
       ARTIST PAYOUT
    ========================= */
    case "PAYOUT_REQUESTED":
      return (
        <AccountBalanceWalletRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    case "PAYOUT_APPROVED":
    case "PAYOUT_PAID":
      return (
        <CheckCircleRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    case "PAYOUT_REJECTED":
    case "PAYOUT_CANCELED":
      return (
        <CancelRoundedIcon
          sx={{
            fontSize: 18,
          }}
        />
      );

    default:
      return (
        <InfoRoundedIcon
          sx={{
            fontSize: 18,
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
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const NotificationBell = () => {
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const [notifications, setNotifications] = useState<INotification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const [markingAll, setMarkingAll] = useState(false);

  const open = Boolean(anchorElement);

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token ||
    (session as any)?.user?.accessToken ||
    "";

  ////
  useEffect(() => {
    const savedValue = localStorage.getItem("notifications-enabled");

    if (savedValue !== null) {
      setNotificationsEnabled(savedValue === "true");
    }
  }, []);
  ////

  const loadUnreadCount = useCallback(async () => {
    if (!accessToken || !notificationsEnabled) {
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
      console.error("Cannot load unread notifications:", error);
    }
  }, [accessToken, notificationsEnabled]);

  const loadNotifications = useCallback(async () => {
    if (!accessToken || !notificationsEnabled) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);

      const response = await getNotificationsApi(0, 5, "all", accessToken);

      if (response?.error || Number(response?.statusCode) >= 400) {
        setNotifications([]);
        return;
      }

      const notificationContent = response?.data?.content;

      setNotifications(
        Array.isArray(notificationContent) ? notificationContent : []
      );
    } catch (error) {
      console.error("Cannot load notifications:", error);

      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, notificationsEnabled]);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !notificationsEnabled) {
      setUnreadCount(0);
      return;
    }

    void loadUnreadCount();

    const intervalId = window.setInterval(() => {
      void loadUnreadCount();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [sessionStatus, notificationsEnabled, loadUnreadCount]);

  const handleOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElement(event.currentTarget);

    await Promise.all([loadNotifications(), loadUnreadCount()]);
  };

  const handleClose = () => {
    setAnchorElement(null);
  };

  const handleNotificationClick = async (notification: INotification) => {
    if (!notification.isRead && accessToken) {
      try {
        await markNotificationAsReadApi(notification.id, accessToken);

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
      } catch (error) {
        console.error("Cannot mark notification as read:", error);
      }
    }

    handleClose();

    if (notification.redirectUrl) {
      router.push(notification.redirectUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!accessToken || unreadCount <= 0) {
      return;
    }

    try {
      setMarkingAll(true);

      const response = await markAllNotificationsAsReadApi(accessToken);

      if (response?.error || Number(response?.statusCode) >= 400) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Cannot mark all notifications as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        aria-label="Notifications"
        aria-controls={open ? "notification-popover" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{
          color: open ? "#ffffff" : "#b8b8b8",

          p: 0.5,

          "&:hover": {
            color: "#ffffff",
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          max={99}
          invisible={unreadCount <= 0}
          sx={{
            "& .MuiBadge-badge": {
              minWidth: 16,
              height: 16,

              px: 0.45,

              color: "#ffffff",

              backgroundColor: "#ff5500",

              border: "2px solid #111111",

              fontSize: 9,
              fontWeight: 900,

              top: 1,
              right: 0,
            },
          }}
        >
          <NotificationsNoneRoundedIcon fontSize="small" />
        </Badge>
      </IconButton>

      <Popover
        id="notification-popover"
        open={open}
        anchorEl={anchorElement}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: 340,
                sm: 400,
              },

              maxWidth: "calc(100vw - 24px)",

              mt: 1.1,

              overflow: "hidden",

              borderRadius: "6px",

              color: "#ffffff",

              backgroundColor: "#111111",

              border: "1px solid rgba(255,255,255,0.14)",

              boxShadow: "0 18px 55px rgba(0,0,0,0.58)",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            marginLeft: 1.5,
          }}
        >
          <Typography
            sx={{
              color: notificationsEnabled ? "#ffffff" : "#777777",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {notificationsEnabled ? "On" : "Off"}
          </Typography>

          <Switch
            size="small"
            checked={notificationsEnabled}
            onChange={(event) => {
              const enabled = event.target.checked;

              setNotificationsEnabled(enabled);

              localStorage.setItem("notifications-enabled", String(enabled));

              if (!enabled) {
                setUnreadCount(0);
                setNotifications([]);
              } else {
                void loadUnreadCount();
                void loadNotifications();
              }
            }}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#ff5500",
              },

              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#ff5500",
                opacity: 1,
              },

              "& .MuiSwitch-track": {
                backgroundColor: "#555555",
              },
            }}
          />
        </Box>

        {unreadCount > 0 && (
          <Box
            sx={{
              px: 2,
              pb: 1,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={() => void handleMarkAllAsRead()}
              disabled={markingAll}
              sx={{
                minWidth: 0,
                p: 0,

                color: "#9da5af",

                textTransform: "none",

                fontSize: 11,
                fontWeight: 800,

                "&:hover": {
                  color: "#ffffff",
                  background: "transparent",
                },

                "&.Mui-disabled": {
                  color: "#606770",
                },
              }}
            >
              {markingAll ? "Updating..." : "Mark all as read"}
            </Button>
          </Box>
        )}

        <Divider
          sx={{
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        <Box
          sx={{
            maxHeight: 410,
            overflowY: "auto",

            "&::-webkit-scrollbar": {
              width: 6,
            },

            "&::-webkit-scrollbar-thumb": {
              borderRadius: "999px",

              backgroundColor: "rgba(255,255,255,0.18)",
            },
          }}
        >
          {loading ? (
            <Box
              sx={{
                minHeight: 150,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress
                size={25}
                sx={{
                  color: "#ff5500",
                }}
              />
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                minHeight: 125,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                textAlign: "center",
                px: 2,
              }}
            >
              <Typography
                sx={{
                  color: "#8e949c",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                No notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <Box
                key={notification.id}
                component="button"
                type="button"
                onClick={() => void handleNotificationClick(notification)}
                sx={{
                  appearance: "none",

                  width: "100%",

                  px: 2,
                  py: 1.45,

                  display: "flex",
                  alignItems: "flex-start",

                  gap: 1.25,

                  color: "#ffffff",

                  textAlign: "left",

                  border: 0,

                  borderBottom: "1px solid rgba(255,255,255,0.06)",

                  backgroundColor: notification.isRead
                    ? "transparent"
                    : "rgba(255,85,0,0.055)",

                  cursor: "pointer",

                  transition: "background-color 150ms ease",

                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.055)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,

                    flexShrink: 0,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    borderRadius: "50%",

                    color: notification.isRead ? "#9da5af" : "#ffffff",

                    backgroundColor: notification.isRead
                      ? "rgba(255,255,255,0.065)"
                      : "#ff5500",
                  }}
                >
                  {getNotificationIcon(notification.type)}
                </Box>

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
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        flex: 1,

                        color: "#ffffff",

                        fontSize: 13,
                        fontWeight: notification.isRead ? 750 : 950,

                        lineHeight: 1.35,
                      }}
                    >
                      {notification.title}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#707780",

                        fontSize: 10,
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

                      color: "#9da5af",

                      fontSize: 12,
                      fontWeight: 650,
                      lineHeight: 1.45,

                      display: "-webkit-box",

                      WebkitLineClamp: 2,

                      WebkitBoxOrient: "vertical",

                      overflow: "hidden",
                    }}
                  >
                    {notification.message}
                  </Typography>
                </Box>

                {!notification.isRead && (
                  <Box
                    sx={{
                      width: 7,
                      height: 7,

                      mt: 0.7,

                      flexShrink: 0,

                      borderRadius: "50%",

                      backgroundColor: "#ff5500",
                    }}
                  />
                )}
              </Box>
            ))
          )}
        </Box>

        <Button
          fullWidth
          onClick={() => {
            handleClose();

            router.push("/notifications");
          }}
          sx={{
            height: 48,

            borderRadius: 0,

            color: "#ffffff",

            textTransform: "none",

            fontSize: 13,
            fontWeight: 950,

            borderTop: "1px solid rgba(255,255,255,0.08)",

            "&:hover": {
              color: "#ff5500",

              backgroundColor: "rgba(255,255,255,0.035)",
            },
          }}
        >
          View all notifications
        </Button>
      </Popover>
    </>
  );
};

export default NotificationBell;
