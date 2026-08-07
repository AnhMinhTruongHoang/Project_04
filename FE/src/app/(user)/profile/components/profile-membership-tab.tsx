"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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

import { useCallback, useEffect, useRef, useState } from "react";

import {
  cancelArtistMembershipApi,
  createArtistMembershipPaymentApi,
  getArtistMembershipAccessApi,
  getArtistMembershipPlansApi,
} from "@/utils/api";

import ProfileMembershipCommentsDialog from "./profile-membership-comments-dialog";
import ProfileMembershipFeed from "./profile-membership-feed";
import ProfileMembershipPlanCard from "./profile-membership-plan-card";

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
    return "Không xác định";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
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
}: IProfileMembershipTabProps) => {
  const plansSectionRef = useRef<HTMLDivElement | null>(null);

  const [plans, setPlans] = useState<IArtistMembershipPlan[]>([]);

  const [membershipAccess, setMembershipAccess] =
    useState<IArtistMembershipAccess>(createEmptyMembershipAccess(artistId));

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [joiningPlanId, setJoiningPlanId] = useState<string | null>(null);

  const [cancelingMembership, setCancelingMembership] = useState(false);

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
            : "Không thể tải thông tin hội viên."
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
    setError("Vui lòng đăng nhập để tham gia hội viên.");

    onRequireLogin?.();
  };

  /*
   * =========================
   * SCROLL TO PLANS
   * =========================
   */
  const scrollToPlans = () => {
    plansSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /*
   * =========================
   * JOIN OR CHANGE PLAN
   * =========================
   */
  const handleJoinPlan = async (plan: IArtistMembershipPlan) => {
    if (isOwner) {
      setError("Nghệ sĩ không thể tham gia gói hội viên của chính mình.");

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
          locale: "vn",
        },
        accessToken
      );

      const payment = response?.data;

      if (!payment?.paymentUrl) {
        throw new Error(
          response?.message || "Không nhận được đường dẫn thanh toán VNPay."
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
          : "Không thể tạo giao dịch hội viên."
      );

      setJoiningPlanId(null);
    }
  };

  /*
   * =========================
   * CANCEL AT PERIOD END
   * =========================
   */
  const handleCancelMembership = async () => {
    const subscriptionId = membershipAccess.subscriptionId;

    if (!accessToken || !subscriptionId || cancelingMembership) {
      return;
    }

    const confirmed = window.confirm(
      "Hội viên vẫn hoạt động đến cuối chu kỳ hiện tại. Bạn có chắc muốn hủy gia hạn không?"
    );

    if (!confirmed) {
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
        throw new Error(response?.message || "Không thể hủy hội viên.");
      }

      setMembershipAccess((previous) => ({
        ...previous,
        ...updatedAccess,
      }));
    } catch (requestError) {
      console.error("Cannot cancel artist membership:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể hủy hội viên."
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
                  {artistName?.trim() ? `của ${artistName}` : "nghệ sĩ"}
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
              Làm mới
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
                      Hội viên đang hoạt động
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
                    Gói{" "}
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
                        Hết hạn:{" "}
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
                      Hội viên sẽ kết thúc vào cuối chu kỳ hiện tại.
                    </Typography>
                  )}
                </Box>
              </Stack>

              {!membershipAccess.cancelAtPeriodEnd &&
                membershipAccess.subscriptionId && (
                  <Button
                    variant="outlined"
                    disabled={cancelingMembership}
                    onClick={() => {
                      void handleCancelMembership();
                    }}
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
                    Hủy cuối kỳ
                  </Button>
                )}
            </Stack>
          </Paper>
        )}

        {/* OWNER NOTICE */}
        {isOwner && (
          <Alert
            severity="info"
            sx={{
              color: "#D5D5D5",
              bgcolor: "#171717",

              border: "1px solid #363636",

              borderRadius: 2,

              "& .MuiAlert-icon": {
                color: "#FF6A1A",
              },
            }}
          >
            Đây là trang Membership của bạn. Bạn có thể xem toàn bộ nội dung,
            nhưng không thể tự tham gia gói của chính mình.
          </Alert>
        )}

        {/* MEMBERSHIP PLANS */}
        <Box
          ref={plansSectionRef}
          sx={{
            scrollMarginTop: "90px",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "flex-start",
              sm: "flex-end",
            }}
            justifyContent="space-between"
            spacing={1}
            sx={{
              mb: 1.75,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: {
                    xs: 18,
                    sm: 21,
                  },

                  fontWeight: 900,
                }}
              >
                Choose membership plan
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,

                  color: "#858585",

                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                Each payment will activate membership rights for 30 days.
              </Typography>
            </Box>

            {plans.length > 0 && (
              <Typography
                sx={{
                  color: "#707070",

                  fontSize: 12,
                }}
              >
                {plans.length} available plans
              </Typography>
            )}
          </Stack>

          {plans.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 4,

                textAlign: "center",

                bgcolor: "#111111",

                border: "1px dashed #383838",

                borderRadius: 3,
              }}
            >
              <WorkspacePremiumRoundedIcon
                sx={{
                  color: "#646464",

                  fontSize: 36,
                }}
              />

              <Typography
                sx={{
                  mt: 1,

                  color: "#FFFFFF",

                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                No membership plans available
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  color: "#777777",

                  fontSize: 13,
                }}
              >
                The artist has not opened any membership package.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  md:
                    plans.length === 1
                      ? "minmax(0, 620px)"
                      : "repeat(2, minmax(0, 1fr))",
                },

                gap: 2,
              }}
            >
              {plans.map((plan) => (
                <ProfileMembershipPlanCard
                  key={plan.id}
                  plan={plan}
                  membershipAccess={membershipAccess}
                  isOwner={isOwner}
                  loading={joiningPlanId === plan.id}
                  onJoin={handleJoinPlan}
                />
              ))}
            </Box>
          )}
        </Box>

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
            scrollToPlans();
          }}
          onRequireLogin={requireLogin}
        />
      </Stack>

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
