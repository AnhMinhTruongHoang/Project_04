"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { alpha } from "@mui/material/styles";

import CancelScheduleSendRoundedIcon from "@mui/icons-material/CancelScheduleSendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { useCallback, useEffect, useState } from "react";

import {
  cancelArtistMembershipApi,
  createArtistMembershipPaymentApi,
  getArtistMembershipAccessApi,
  getArtistMembershipPlansApi,
} from "@/utils/api";

import ProfileMembershipCommentsDialog from "./profile-membership-comments-dialog";
import ProfileMembershipFeed from "./profile-membership-feed";
import ProfileMembershipManagePlansDialog from "./profile-membership-manage-plans-dialog";
import ProfileMembershipCreatePostDialog from "./profile-membership-create-post-dialog";

const createEmptyMembershipAccess = (
  artistId: string
): IArtistMembershipAccess => {
  return {
    artistId,

    hasMembership: false,
    active: false,

    status: null,

    subscriptionId: null,
    memberId: null,

    planId: null,
    planCode: null,
    planName: null,

    badgeName: null,
    badgeColor: null,

    startedAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,

    cancelAtPeriodEnd: false,
  };
};

const formatMembershipDate = (value?: string | null) => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const ProfileMembershipTab = ({
  artistId,
  artistName,
  accessToken,
  isOwner = false,
  onRequireLogin,
  onPlayTrack,
  onOpenPlans,
}: IProfileMembershipTabProps) => {
  const [plans, setPlans] = useState<IArtistMembershipPlan[]>([]);

  const [membershipAccess, setMembershipAccess] =
    useState<IArtistMembershipAccess>(createEmptyMembershipAccess(artistId));

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [joiningPlanId, setJoiningPlanId] = useState<string | null>(null);

  const [cancelingMembership, setCancelingMembership] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const [managePlansOpen, setManagePlansOpen] = useState(false);

  const [createPostOpen, setCreatePostOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [selectedPost, setSelectedPost] =
    useState<IArtistMembershipPost | null>(null);

  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);

  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  /*
   * =========================
   * LOAD PLANS AND ACCESS
   * =========================
   */
  const loadMembershipData = useCallback(
    async (showFullLoading = true) => {
      if (!artistId?.trim()) {
        setPlans([]);

        setMembershipAccess(createEmptyMembershipAccess(""));

        setLoading(false);

        return;
      }

      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        /*
         * =========================
         * PUBLIC MEMBERSHIP PLANS
         * =========================
         */
        const plansResponse = await getArtistMembershipPlansApi(
          artistId,
          accessToken
        );

        setPlans(Array.isArray(plansResponse?.data) ? plansResponse.data : []);

        /*
         * =========================
         * CURRENT MEMBER ACCESS
         * =========================
         *
         * Anonymous user không gọi API
         * access vì Backend yêu cầu token.
         */
        if (!accessToken) {
          setMembershipAccess(createEmptyMembershipAccess(artistId));

          return;
        }

        const accessResponse = await getArtistMembershipAccessApi(
          artistId,
          accessToken
        );

        setMembershipAccess(
          accessResponse?.data || createEmptyMembershipAccess(artistId)
        );
      } catch (requestError) {
        console.error("Cannot load artist membership:", requestError);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load membership information."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, artistId]
  );

  /*
   * =========================
   * RESET WHEN ARTIST CHANGES
   * =========================
   */
  useEffect(() => {
    setPlans([]);

    setMembershipAccess(createEmptyMembershipAccess(artistId));

    setSelectedPost(null);

    setCommentsDialogOpen(false);

    setFeedRefreshKey(0);
  }, [artistId]);

  /*
   * =========================
   * INITIAL LOAD
   * =========================
   */
  useEffect(() => {
    void loadMembershipData(true);
  }, [loadMembershipData]);

  /*
   * =========================
   * REQUIRE LOGIN
   * =========================
   */
  const requireLogin = () => {
    setError("Please sign in to join this membership.");

    onRequireLogin?.();
  };

  /*
   * =========================
   * JOIN OR CHANGE PLAN
   * =========================
   */
  const handleJoinPlan = async (plan: IArtistMembershipPlan) => {
    if (isOwner) {
      setError("Artists cannot join their own membership plan.");

      return;
    }

    if (!accessToken) {
      requireLogin();

      return;
    }

    if (joiningPlanId || !plan.active) {
      return;
    }

    setJoiningPlanId(plan.id);

    setError(null);

    try {
      const response = await createArtistMembershipPaymentApi(
        {
          planId: plan.id,
          locale: "en",
        },
        accessToken
      );

      const payment = response?.data;

      if (!payment?.paymentUrl) {
        throw new Error(
          response?.message || "Unable to get the VNPay payment URL."
        );
      }

      /*
       * =========================
       * REDIRECT TO VNPAY
       * =========================
       */
      window.location.assign(payment.paymentUrl);
    } catch (requestError) {
      console.error("Cannot create membership payment:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the membership payment."
      );

      setJoiningPlanId(null);
    }
  };

  /*
   * =========================
   * CANCEL AT PERIOD END
   * =========================
   */
  /*
   * =========================
   * OPEN CANCEL MEMBERSHIP DIALOG
   * =========================
   */
  const handleCancelMembership = () => {
    if (
      !accessToken ||
      !membershipAccess.subscriptionId ||
      cancelingMembership
    ) {
      return;
    }

    setCancelDialogOpen(true);
  };

  /*
   * =========================
   * CONFIRM CANCEL AT PERIOD END
   * =========================
   */
  const handleConfirmCancelMembership = async () => {
    const subscriptionId = membershipAccess.subscriptionId;

    if (!accessToken || !subscriptionId || cancelingMembership) {
      return;
    }

    setCancelingMembership(true);
    setError(null);

    try {
      const response = await cancelArtistMembershipApi(
        subscriptionId,
        accessToken
      );

      const updatedAccess = response?.data;

      if (!updatedAccess) {
        throw new Error(
          response?.message || "Unable to cancel the membership."
        );
      }

      setMembershipAccess((previous) => ({
        ...previous,
        ...updatedAccess,
      }));

      setCancelDialogOpen(false);
    } catch (requestError) {
      console.error("Cannot cancel artist membership:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel the membership."
      );
    } finally {
      setCancelingMembership(false);
    }
  };

  /*
   * =========================
   * OPEN COMMENTS
   * =========================
   */
  const handleOpenComments = (post: IArtistMembershipPost) => {
    setSelectedPost(post);

    setCommentsDialogOpen(true);
  };

  /*
   * =========================
   * COMMENT COUNT CHANGED
   * =========================
   */
  const handleCommentChanged = () => {
    setFeedRefreshKey((previous) => previous + 1);
  };

  /*
   * =========================
   * LOADING
   * =========================
   */
  if (loading) {
    return (
      <Stack
        spacing={2.5}
        sx={{
          width: "100%",
        }}
      >
        <Skeleton
          variant="rounded"
          height={170}
          sx={{
            bgcolor: "#1B1B1B",
            borderRadius: 3,
          }}
        />

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
            },

            gap: 2,
          }}
        >
          {Array.from({
            length: 2,
          }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={310}
              sx={{
                bgcolor: "#1B1B1B",

                borderRadius: 3,
              }}
            />
          ))}
        </Box>

        <Skeleton
          variant="rounded"
          height={260}
          sx={{
            bgcolor: "#1B1B1B",
            borderRadius: 3,
          }}
        />
      </Stack>
    );
  }

  return (
    <>
      <Stack
        spacing={{
          xs: 2.5,
          sm: 3,
        }}
        sx={{
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* MEMBERSHIP ERROR */}
        {error && (
          <Alert
            severity="error"
            onClose={() => {
              setError(null);
            }}
            sx={{
              color: "#FFD5D5",
              bgcolor: "#251313",

              border: "1px solid #653333",

              borderRadius: 2,

              "& .MuiAlert-icon": {
                color: "#FF7777",
              },

              "& .MuiAlert-action": {
                color: "#FFD5D5",
              },
            }}
          >
            {error}
          </Alert>
        )}

        {/* MEMBERSHIP HERO */}
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",

            px: {
              xs: 2,
              sm: 3,
            },

            py: {
              xs: 2.5,
              sm: 3,
            },

            bgcolor: "#111111",

            backgroundImage:
              "linear-gradient(135deg, rgba(255,85,0,0.15), rgba(255,85,0,0.02) 48%, rgba(167,139,250,0.08))",

            border: "1px solid #303030",

            borderRadius: 3,
          }}
        >
          {/* HERO DECORATION */}
          <Box
            sx={{
              position: "absolute",

              top: -75,
              right: -55,

              width: 190,
              height: 190,

              borderRadius: "50%",

              bgcolor: "rgba(255,85,0,0.08)",

              filter: "blur(2px)",

              pointerEvents: "none",
            }}
          />

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            justifyContent="space-between"
            spacing={2}
            sx={{
              position: "relative",

              zIndex: 1,
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              minWidth={0}
            >
              <Box
                sx={{
                  width: {
                    xs: 48,
                    sm: 56,
                  },

                  height: {
                    xs: 48,
                    sm: 56,
                  },

                  flexShrink: 0,

                  display: "grid",
                  placeItems: "center",

                  color: "#FF6A1A",

                  bgcolor: "rgba(255,85,0,0.13)",

                  border: "1px solid rgba(255,85,0,0.3)",

                  borderRadius: 2.5,
                }}
              >
                <WorkspacePremiumRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 27,
                      sm: 31,
                    },
                  }}
                />
              </Box>

              <Box minWidth={0}>
                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: {
                      xs: 21,
                      sm: 26,
                    },

                    fontWeight: 950,
                    lineHeight: 1.25,
                  }}
                >
                  Membership{" "}
                  {artistName?.trim() ? `by ${artistName}` : "artist"}
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 680,

                    mt: 0.75,

                    color: "#AFAFAF",

                    fontSize: {
                      xs: 13,
                      sm: 14,
                    },

                    lineHeight: 1.7,
                  }}
                >
                  Support artists and unlock posts, images, polls along with
                  exclusive listening previews for members.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              disabled={refreshing}
              onClick={() => {
                void loadMembershipData(false);
              }}
              startIcon={
                refreshing ? (
                  <CircularProgress
                    size={16}
                    thickness={5}
                    sx={{
                      color: "inherit",
                    }}
                  />
                ) : (
                  <RefreshRoundedIcon />
                )
              }
              sx={{
                minHeight: 42,

                px: 1.75,

                color: "#C6C6C6",

                borderColor: "#484848",

                borderRadius: 2,

                fontWeight: 800,
                textTransform: "none",

                "&:hover": {
                  color: "#FFFFFF",

                  bgcolor: "#202020",

                  borderColor: "#666666",
                },

                "&.Mui-disabled": {
                  color: "#666666",

                  borderColor: "#333333",
                },
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Paper>

        {/* CURRENT MEMBERSHIP STATUS */}
        {membershipAccess.active && (
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2,
                sm: 2.5,
              },

              bgcolor: "#111111",

              border: `1px solid ${alpha(
                membershipAccess.badgeColor || "#FF5500",
                0.38
              )}`,

              borderRadius: 3,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 44,
                    height: 44,

                    flexShrink: 0,

                    display: "grid",
                    placeItems: "center",

                    color: membershipAccess.badgeColor || "#FF5500",

                    bgcolor: alpha(
                      membershipAccess.badgeColor || "#FF5500",
                      0.13
                    ),

                    borderRadius: 2,
                  }}
                >
                  <CheckCircleRoundedIcon />
                </Box>

                <Box minWidth={0}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                    gap={0.75}
                  >
                    <Typography
                      sx={{
                        color: "#FFFFFF",

                        fontSize: 17,
                        fontWeight: 900,
                      }}
                    >
                      Active member
                    </Typography>

                    <Chip
                      size="small"
                      label={
                        membershipAccess.badgeName ||
                        membershipAccess.planName ||
                        "Member"
                      }
                      sx={{
                        color: membershipAccess.badgeColor || "#FF5500",

                        bgcolor: alpha(
                          membershipAccess.badgeColor || "#FF5500",
                          0.12
                        ),

                        border: `1px solid ${alpha(
                          membershipAccess.badgeColor || "#FF5500",
                          0.3
                        )}`,

                        fontWeight: 800,
                      }}
                    />
                  </Stack>

                  <Typography
                    sx={{
                      mt: 0.65,

                      color: "#A7A7A7",

                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    Plan{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "#FFFFFF",

                        fontWeight: 800,
                      }}
                    >
                      {membershipAccess.planName ||
                        membershipAccess.planCode ||
                        "Membership"}
                    </Box>
                  </Typography>

                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={{
                      xs: 0.5,
                      sm: 2,
                    }}
                    sx={{
                      mt: 0.75,
                    }}
                  >
                    <Stack direction="row" spacing={0.65} alignItems="center">
                      <EventAvailableRoundedIcon
                        sx={{
                          color: "#808080",

                          fontSize: 17,
                        }}
                      />

                      <Typography
                        sx={{
                          color: "#858585",

                          fontSize: 12,
                        }}
                      >
                        Expires:{" "}
                        {formatMembershipDate(
                          membershipAccess.currentPeriodEnd
                        )}
                      </Typography>
                    </Stack>
                  </Stack>

                  {membershipAccess.cancelAtPeriodEnd && (
                    <Typography
                      sx={{
                        mt: 1,

                        color: "#F1A64A",

                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Membership will end at the end of the current cycle.
                    </Typography>
                  )}
                </Box>
              </Stack>

              {!membershipAccess.cancelAtPeriodEnd &&
                membershipAccess.subscriptionId && (
                  <Button
                    variant="outlined"
                    disabled={cancelingMembership}
                    onClick={handleCancelMembership}
                    startIcon={
                      cancelingMembership ? (
                        <CircularProgress
                          size={15}
                          thickness={5}
                          sx={{
                            color: "inherit",
                          }}
                        />
                      ) : (
                        <CancelScheduleSendRoundedIcon />
                      )
                    }
                    sx={{
                      minHeight: 42,

                      flexShrink: 0,

                      color: "#D58C8C",

                      borderColor: "#613A3A",

                      borderRadius: 2,

                      fontWeight: 800,
                      textTransform: "none",

                      "&:hover": {
                        color: "#FFAAAA",

                        bgcolor: "rgba(255,80,80,0.07)",

                        borderColor: "#925151",
                      },
                    }}
                  >
                    Cancel membership
                  </Button>
                )}
            </Stack>
          </Paper>
        )}

        {/* OWNER MEMBERSHIP ACTIONS */}
        {isOwner && (
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",

              p: {
                xs: 1.75,
                sm: 2,
              },

              bgcolor: "#111111",

              backgroundImage:
                "linear-gradient(135deg, rgba(255,85,0,0.055), rgba(255,255,255,0.01))",

              border: "1px solid rgba(255,255,255,0.10)",

              borderRadius: 3,

              "&::before": {
                content: '""',

                position: "absolute",

                top: 0,
                left: 0,

                width: 3,
                height: "100%",

                bgcolor: "#FF5500",
              },
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              alignItems={{
                xs: "stretch",
                md: "center",
              }}
              justifyContent="space-between"
              spacing={2}
            >
              {/* OWNER TOOL INFO */}
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                minWidth={0}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,

                    flexShrink: 0,

                    display: "grid",
                    placeItems: "center",

                    color: "#FF6A1A",

                    bgcolor: "rgba(255,85,0,0.10)",

                    border: "1px solid rgba(255,85,0,0.22)",

                    borderRadius: 2,
                  }}
                >
                  <WorkspacePremiumRoundedIcon
                    sx={{
                      fontSize: 23,
                    }}
                  />
                </Box>

                <Box minWidth={0}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",

                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    Creator tools
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,

                      color: "#7F7F7F",

                      fontSize: 12.5,
                      lineHeight: 1.5,
                    }}
                  >
                    Publish exclusive content and manage your membership plans.
                  </Typography>
                </Box>
              </Stack>

              {/* OWNER TOOL ACTIONS */}
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
                sx={{
                  flexShrink: 0,

                  width: {
                    xs: "100%",
                    md: "auto",
                  },
                }}
              >
                {/* CREATE MEMBERSHIP POST */}
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => {
                    setCreatePostOpen(true);
                  }}
                  sx={{
                    minHeight: 42,

                    px: 2.25,

                    width: {
                      xs: "100%",
                      sm: "auto",
                    },

                    color: "#FFFFFF",
                    bgcolor: "#FF5500",

                    borderRadius: 2,

                    fontSize: 13,
                    fontWeight: 850,

                    textTransform: "none",

                    boxShadow: "none",

                    "&:hover": {
                      bgcolor: "#FF6A1A",

                      boxShadow: "none",
                    },
                  }}
                >
                  Create post
                </Button>

                {/* MANAGE MEMBERSHIP PLANS */}
                <Button
                  variant="outlined"
                  startIcon={<SettingsRoundedIcon />}
                  onClick={() => {
                    setManagePlansOpen(true);
                  }}
                  sx={{
                    minHeight: 42,

                    px: 2.25,

                    width: {
                      xs: "100%",
                      sm: "auto",
                    },

                    color: "#E7E7E7",

                    bgcolor: "#1B1B1B",

                    borderColor: "rgba(255,255,255,0.13)",

                    borderRadius: 2,

                    fontSize: 13,
                    fontWeight: 850,

                    textTransform: "none",

                    "&:hover": {
                      color: "#FFFFFF",

                      bgcolor: "#242424",

                      borderColor: "rgba(255,255,255,0.26)",
                    },
                  }}
                >
                  Manage plans
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
        <Divider
          sx={{
            borderColor: "#292929",
          }}
        />

        {/* COMMUNITY FEED */}
        <ProfileMembershipFeed
          artistId={artistId}
          accessToken={accessToken}
          refreshKey={feedRefreshKey}
          onPlayTrack={onPlayTrack}
          onOpenComments={handleOpenComments}
          onJoinMembership={() => {
            onOpenPlans?.();
          }}
          onRequireLogin={requireLogin}
        />
      </Stack>

      {/* MANAGE MEMBERSHIP PLANS DIALOG */}
      {isOwner && (
        <ProfileMembershipManagePlansDialog
          open={managePlansOpen}
          accessToken={accessToken}
          onClose={() => {
            setManagePlansOpen(false);
          }}
          onChanged={() => {
            void loadMembershipData(false);
          }}
        />
      )}

      {/* MANAGE MEMBERSHIP PLANS DIALOG */}
      {isOwner && (
        <ProfileMembershipManagePlansDialog
          open={managePlansOpen}
          accessToken={accessToken}
          onClose={() => {
            setManagePlansOpen(false);
          }}
          onChanged={() => {
            void loadMembershipData(false);
          }}
        />
      )}

      {/* CREATE MEMBERSHIP POST DIALOG */}
      {isOwner && (
        <ProfileMembershipCreatePostDialog
          open={createPostOpen}
          accessToken={accessToken}
          onClose={() => {
            setCreatePostOpen(false);
          }}
          onCreated={() => {
            setFeedRefreshKey((previous) => previous + 1);
          }}
        />
      )}

      {/* CANCEL MEMBERSHIP DIALOG */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          if (!cancelingMembership) {
            setCancelDialogOpen(false);
          }
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "#121212",
            backgroundImage: "none",

            color: "#FFFFFF",

            border: "1px solid rgba(255,255,255,0.12)",

            borderRadius: 3,

            boxShadow: "0 24px 70px rgba(0,0,0,0.65)",
          },
        }}
      >
        {/* CANCEL MEMBERSHIP HEADER */}
        <DialogTitle
          sx={{
            pb: 1,
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,

                flexShrink: 0,

                display: "grid",
                placeItems: "center",

                borderRadius: 2,

                color: "#FF9A9A",
                bgcolor: "rgba(255,80,80,0.10)",

                border: "1px solid rgba(255,100,100,0.22)",
              }}
            >
              <WarningAmberRoundedIcon />
            </Box>

            <Typography
              sx={{
                color: "#FFFFFF",

                fontSize: 19,
                fontWeight: 900,
              }}
            >
              Cancel membership?
            </Typography>
          </Stack>
        </DialogTitle>

        {/* CANCEL MEMBERSHIP CONTENT */}
        <DialogContent>
          <Typography
            sx={{
              color: "#B8B8B8",

              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            Your membership will remain active until the end of the current
            billing period.
          </Typography>

          {membershipAccess.currentPeriodEnd && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,

                borderRadius: 2,

                bgcolor: "#191919",

                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography
                sx={{
                  color: "#858585",

                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Membership access until
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,

                  color: "#FFFFFF",

                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {formatMembershipDate(membershipAccess.currentPeriodEnd)}
              </Typography>
            </Box>
          )}

          <Typography
            sx={{
              mt: 2,

              color: "#8F8F8F",

              fontSize: 13,
              lineHeight: 1.65,
            }}
          >
            You will keep access to members-only posts, polls, comments, and
            track previews until that date. No new membership period will be
            started automatically.
          </Typography>
        </DialogContent>

        {/* CANCEL MEMBERSHIP ACTIONS */}
        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 1,

            gap: 1,
          }}
        >
          {/* KEEP MEMBERSHIP */}
          <Button
            disabled={cancelingMembership}
            onClick={() => {
              setCancelDialogOpen(false);
            }}
            sx={{
              minHeight: 42,

              px: 2,

              color: "#FFFFFF",
              bgcolor: "#252525",

              borderRadius: 2,

              fontWeight: 800,
              textTransform: "none",

              "&:hover": {
                bgcolor: "#303030",
              },

              "&.Mui-disabled": {
                color: "#666666",
                bgcolor: "#1D1D1D",
              },
            }}
          >
            Keep membership
          </Button>

          {/* CONFIRM CANCELLATION */}
          <Button
            variant="contained"
            disabled={cancelingMembership}
            onClick={() => {
              void handleConfirmCancelMembership();
            }}
            startIcon={
              cancelingMembership ? (
                <CircularProgress
                  size={16}
                  thickness={5}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : (
                <CancelScheduleSendRoundedIcon />
              )
            }
            sx={{
              minHeight: 42,

              px: 2,

              color: "#FFFFFF",
              bgcolor: "#C83F3F",

              borderRadius: 2,

              fontWeight: 800,
              textTransform: "none",

              boxShadow: "none",

              "&:hover": {
                bgcolor: "#D94A4A",
                boxShadow: "none",
              },

              "&.Mui-disabled": {
                color: "#777777",
                bgcolor: "#292929",
              },
            }}
          >
            {cancelingMembership ? "Canceling..." : "Confirm cancellation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* COMMUNITY COMMENTS DIALOG */}
      <ProfileMembershipCommentsDialog
        open={commentsDialogOpen}
        post={selectedPost}
        accessToken={accessToken}
        onClose={() => {
          setCommentsDialogOpen(false);

          setSelectedPost(null);
        }}
        onCommentChanged={handleCommentChanged}
        onRequireLogin={requireLogin}
      />
    </>
  );
};

export default ProfileMembershipTab;
