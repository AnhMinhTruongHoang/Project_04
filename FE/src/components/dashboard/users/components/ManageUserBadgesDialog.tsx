"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";

import { sendRequest } from "@/utils/api";
import { useToast } from "@/utils/toast";
import { getInitials, getUserAvatarUrl } from "@/utils/actions/getImages";

const getUserId = (user?: IUser | null) => {
  return user?._id || user?.id || "";
};

const ManageUserBadgesDialog = ({
  open,
  user,
  accessToken,
  onClose,
}: IManageUserBadgesDialogProps) => {
  const toast = useToast();
  const toastRef = useRef(toast);

  const isMobile = useMediaQuery("(max-width:599.95px)");

  const userId = getUserId(user);

  const [badges, setBadges] = useState<IBadge[]>([]);
  const [userBadges, setUserBadges] = useState<IUserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingBadgeId, setSavingBadgeId] = useState("");

  const assignedBadges = useMemo(() => {
    return new Map(
      userBadges
        .filter((item) => item.active)
        .map((item) => [item.badge.id, item])
    );
  }, [userBadges]);

  const loadBadgeData = useCallback(async () => {
    if (!open || !userId || !accessToken) {
      return;
    }

    setLoading(true);

    try {
      const [allBadgesResponse, userBadgesResponse] = await Promise.all([
        sendRequest<IBackendRes<IBadge[]>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/badges`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),

        sendRequest<IBackendRes<IUserBadge[]>>({
          url: `${
            process.env.NEXT_PUBLIC_BACKEND_URL
          }/api/v1/users/${encodeURIComponent(userId)}/badges`,
          method: "GET",
        }),
      ]);

      if (Number(allBadgesResponse?.statusCode) !== 200) {
        throw new Error(
          allBadgesResponse?.message || "Unable to fetch available badges."
        );
      }

      if (Number(userBadgesResponse?.statusCode) !== 200) {
        throw new Error(
          userBadgesResponse?.message || "Unable to fetch user badges."
        );
      }

      setBadges(
        Array.isArray(allBadgesResponse?.data) ? allBadgesResponse.data : []
      );

      setUserBadges(
        Array.isArray(userBadgesResponse?.data) ? userBadgesResponse.data : []
      );
    } catch (error) {
      toastRef.current.error(
        error instanceof Error
          ? error.message
          : "Unable to load badge information."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, open, userId]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    if (!open) {
      setBadges([]);
      setUserBadges([]);
      setSavingBadgeId("");
      return;
    }

    void loadBadgeData();
  }, [loadBadgeData, open]);

  const handleAwardBadge = async (badge: IBadge) => {
    if (!userId || !accessToken) {
      toast.error("Administrator session not found.");
      return;
    }

    setSavingBadgeId(badge.id);

    try {
      const response = await sendRequest<IBackendRes<IUserBadge>>({
        url: `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/v1/admin/users/${encodeURIComponent(
          userId
        )}/badges/${encodeURIComponent(badge.id)}`,
        method: "POST",
        body: {
          note: `Badge awarded from the administrator dashboard: ${badge.name}`,
          expiresAt: null,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (Number(response?.statusCode) !== 200) {
        toast.error(response?.message || "Unable to award this badge.");
        return;
      }

      toast.success(response?.message || "Badge awarded successfully.");

      await loadBadgeData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to award this badge."
      );
    } finally {
      setSavingBadgeId("");
    }
  };

  const handleRevokeBadge = async (badge: IBadge) => {
    if (!userId || !accessToken) {
      toast.error("Administrator session not found.");
      return;
    }

    setSavingBadgeId(badge.id);

    try {
      const response = await sendRequest<IBackendRes<IUserBadge>>({
        url: `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/v1/admin/users/${encodeURIComponent(
          userId
        )}/badges/${encodeURIComponent(badge.id)}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (Number(response?.statusCode) !== 200) {
        toast.error(response?.message || "Unable to revoke this badge.");
        return;
      }

      toast.success(response?.message || "Badge revoked successfully.");

      await loadBadgeData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to revoke this badge."
      );
    } finally {
      setSavingBadgeId("");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (savingBadgeId) return;

        onClose();
      }}
      fullWidth
      fullScreen={isMobile}
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: "#111314",
          color: "#ffffff",
          borderRadius: {
            xs: 0,
            sm: 3,
          },
          border: {
            xs: "none",
            sm: "1px solid rgba(255,255,255,0.1)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "#ffffff",
          fontWeight: 950,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <WorkspacePremiumRoundedIcon
          sx={{
            color: "#ffb020",
          }}
        />
        Manage badges
      </DialogTitle>

      <DialogContent
        sx={{
          px: {
            xs: 2,
            sm: 3,
          },
          py: 3,
        }}
      >
        {/* SELECTED USER */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.4,
            p: 1.5,
            mb: 2.5,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Avatar
            src={getUserAvatarUrl(user)}
            alt={user?.name || "User"}
            sx={{
              width: 46,
              height: 46,
              bgcolor: "#ff5500",
              color: "#ffffff",
              fontWeight: 900,
            }}
          >
            {getInitials(user?.name, user?.email)}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name || "Social user"}
            </Typography>

            <Typography
              sx={{
                color: "#8f8f8f",
                fontSize: 12,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>

        {/* BADGE LIST */}
        {loading ? (
          <Box
            sx={{
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress
              size={32}
              sx={{
                color: "#ff5500",
              }}
            />
          </Box>
        ) : badges.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: "center",
              color: "#8f8f8f",
            }}
          >
            No badges are available.
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.4,
            }}
          >
            {badges.map((badge) => {
              const userBadge = assignedBadges.get(badge.id);
              const assigned = Boolean(userBadge);
              const isSaving = savingBadgeId === badge.id;

              return (
                <Box
                  key={badge.id}
                  sx={{
                    display: "flex",
                    flexDirection: {
                      xs: "column",
                      sm: "row",
                    },
                    alignItems: {
                      xs: "stretch",
                      sm: "center",
                    },
                    gap: 1.5,
                    p: 1.6,
                    borderRadius: 2,
                    backgroundColor: assigned
                      ? `${badge.color || "#ff5500"}12`
                      : "rgba(255,255,255,0.025)",
                    border: `1px solid ${
                      assigned
                        ? `${badge.color || "#ff5500"}66`
                        : "rgba(255,255,255,0.08)"
                    }`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.3,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        color: badge.color || "#ffb020",
                        backgroundColor: `${badge.color || "#ffb020"}18`,
                        border: `1px solid ${badge.color || "#ffb020"}55`,
                      }}
                    >
                      <WorkspacePremiumRoundedIcon />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 0.8,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#ffffff",
                            fontSize: 14,
                            fontWeight: 950,
                          }}
                        >
                          {badge.name}
                        </Typography>

                        <Chip
                          label={badge.category}
                          size="small"
                          sx={{
                            height: 20,
                            color: badge.color || "#d7d7d7",
                            backgroundColor: `${badge.color || "#ffffff"}14`,
                            fontSize: 9,
                            fontWeight: 900,
                          }}
                        />

                        {assigned && (
                          <Chip
                            icon={<CheckCircleRoundedIcon />}
                            label="Assigned"
                            size="small"
                            sx={{
                              height: 20,
                              color: "#63e6a6",
                              backgroundColor: "rgba(99,230,166,0.1)",
                              fontSize: 9,
                              fontWeight: 900,

                              "& .MuiChip-icon": {
                                color: "#63e6a6",
                                fontSize: 14,
                              },
                            }}
                          />
                        )}
                      </Box>

                      <Typography
                        sx={{
                          mt: 0.5,
                          color: "#9a9a9a",
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        {badge.description || "No description provided."}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    disabled={isSaving || (!badge.active && !assigned)}
                    onClick={() => {
                      if (assigned) {
                        void handleRevokeBadge(badge);
                        return;
                      }

                      void handleAwardBadge(badge);
                    }}
                    startIcon={
                      isSaving ? (
                        <CircularProgress
                          size={15}
                          sx={{
                            color: "inherit",
                          }}
                        />
                      ) : assigned ? (
                        <RemoveCircleOutlineRoundedIcon />
                      ) : (
                        <WorkspacePremiumRoundedIcon />
                      )
                    }
                    sx={{
                      minWidth: {
                        xs: "100%",
                        sm: 112,
                      },
                      color: assigned ? "#ff8b8b" : "#ffffff",
                      backgroundColor: assigned
                        ? "rgba(255,90,90,0.1)"
                        : badge.color || "#ff5500",
                      border: assigned
                        ? "1px solid rgba(255,90,90,0.25)"
                        : "none",
                      textTransform: "none",
                      fontWeight: 900,

                      "&:hover": {
                        backgroundColor: assigned
                          ? "rgba(255,90,90,0.18)"
                          : `${badge.color || "#ff5500"}cc`,
                      },

                      "&.Mui-disabled": {
                        color: "rgba(255,255,255,0.35)",
                        backgroundColor: "rgba(255,255,255,0.08)",
                      },
                    }}
                  >
                    {isSaving ? "Saving..." : assigned ? "Revoke" : "Award"}
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Button
          onClick={onClose}
          disabled={Boolean(savingBadgeId)}
          sx={{
            color: "#d7d7d7",
            textTransform: "none",
            fontWeight: 900,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageUserBadgesDialog;
