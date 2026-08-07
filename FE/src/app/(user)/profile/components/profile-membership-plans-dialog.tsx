"use client";

import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { useCallback, useEffect, useState } from "react";

import {
  createArtistMembershipPaymentApi,
  getArtistMembershipAccessApi,
  getArtistMembershipPlansApi,
} from "@/utils/api";

import ProfileMembershipPlanCard from "./profile-membership-plan-card";

const createEmptyMembershipAccess = (
  artistId: string
): IArtistMembershipAccess => ({
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
});

const ProfileMembershipPlansDialog = ({
  open,
  artistId,
  artistName,
  accessToken,
  isOwner = false,
  onClose,
  onRequireLogin,
}: IProfileMembershipPlansDialogProps) => {
  const [plans, setPlans] = useState<IArtistMembershipPlan[]>([]);

  const [membershipAccess, setMembershipAccess] =
    useState<IArtistMembershipAccess>(createEmptyMembershipAccess(artistId));

  const [loading, setLoading] = useState(false);

  const [joiningPlanId, setJoiningPlanId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  /*
   * =========================
   * LOAD MEMBERSHIP PLANS
   * =========================
   */
  const loadPlans = useCallback(async () => {
    if (!open || !artistId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const plansResponse = await getArtistMembershipPlansApi(
        artistId,
        accessToken
      );

      setPlans(Array.isArray(plansResponse?.data) ? plansResponse.data : []);

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
      console.error("Cannot load membership plans:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load membership plans."
      );
    } finally {
      setLoading(false);
    }
  }, [open, artistId, accessToken]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  /*
   * =========================
   * JOIN MEMBERSHIP PLAN
   * =========================
   */
  const handleJoinPlan = async (plan: IArtistMembershipPlan) => {
    if (isOwner) {
      setError("Artists cannot join their own membership plan.");

      return;
    }

    if (!accessToken) {
      onRequireLogin?.();

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100% - 20px)",
            sm: "calc(100% - 48px)",
          },
          maxWidth: 860,
          maxHeight: {
            xs: "calc(100dvh - 20px)",
            sm: "calc(100dvh - 64px)",
          },

          m: {
            xs: 1.25,
            sm: 3,
          },

          overflow: "hidden",

          bgcolor: "#101010",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,85,0,0.055) 0%, rgba(16,16,16,0) 180px)",

          color: "#FFFFFF",

          border: "1px solid rgba(255,255,255,0.10)",

          borderRadius: {
            xs: 2.5,
            sm: 3.5,
          },

          boxShadow:
            "0 30px 100px rgba(0,0,0,0.78), 0 0 0 1px rgba(255,255,255,0.025)",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(7px)",
          },
        },
      }}
    >
      {/* MEMBERSHIP PLANS HEADER */}
      <DialogTitle
        sx={{
          p: 0,

          bgcolor: "rgba(16,16,16,0.96)",

          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{
            minHeight: {
              xs: 68,
              sm: 76,
            },

            px: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          {/* MEMBERSHIP HEADER INFO */}
          <Stack direction="row" spacing={1.4} alignItems="center" minWidth={0}>
            <Box
              sx={{
                width: {
                  xs: 42,
                  sm: 46,
                },

                height: {
                  xs: 42,
                  sm: 46,
                },

                flexShrink: 0,

                display: "grid",
                placeItems: "center",

                color: "#FF6A1A",

                bgcolor: "rgba(255,85,0,0.12)",

                border: "1px solid rgba(255,85,0,0.28)",

                borderRadius: 2.25,
              }}
            >
              <WorkspacePremiumRoundedIcon
                sx={{
                  fontSize: {
                    xs: 24,
                    sm: 27,
                  },
                }}
              />
            </Box>

            <Box minWidth={0}>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: {
                    xs: 17,
                    sm: 20,
                  },

                  fontWeight: 900,
                  lineHeight: 1.2,

                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Membership
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,

                  color: "#8E8E8E",

                  fontSize: {
                    xs: 11.5,
                    sm: 12.5,
                  },

                  fontWeight: 600,

                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Support {artistName}
              </Typography>
            </Box>
          </Stack>

          {/* CLOSE MEMBERSHIP DIALOG */}
          <IconButton
            aria-label="Close membership plans"
            onClick={onClose}
            sx={{
              width: 40,
              height: 40,

              flexShrink: 0,

              color: "#A0A0A0",

              bgcolor: "rgba(255,255,255,0.035)",

              border: "1px solid rgba(255,255,255,0.07)",

              "&:hover": {
                color: "#FFFFFF",

                bgcolor: "#242424",

                borderColor: "rgba(255,255,255,0.14)",
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* MEMBERSHIP PLANS CONTENT */}
      <DialogContent
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },

          bgcolor: "transparent",

          overflowY: "auto",

          "&::-webkit-scrollbar": {
            width: 7,
          },

          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#383838",
            borderRadius: 10,
          },

          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
        }}
      >
        <Box
          sx={{
            width: "100%",

            maxWidth: 760,

            mx: "auto",
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
                mb: 2.5,

                color: "#FFD5D5",
                bgcolor: "#251313",

                border: "1px solid #653333",

                borderRadius: 2,

                "& .MuiAlert-icon": {
                  color: "#FF7777",
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* MEMBERSHIP INTRO */}
          <Box
            sx={{
              mb: {
                xs: 2.5,
                sm: 3,
              },

              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#FFFFFF",

                fontSize: {
                  xs: 21,
                  sm: 25,
                },

                fontWeight: 950,
                lineHeight: 1.25,
              }}
            >
              Choose a membership plan
            </Typography>

            <Typography
              sx={{
                maxWidth: 520,

                mx: "auto",
                mt: 0.8,

                color: "#8F8F8F",

                fontSize: {
                  xs: 13,
                  sm: 14,
                },

                lineHeight: 1.65,
              }}
            >
              Support {artistName} and unlock exclusive members-only content for
              30 days.
            </Typography>
          </Box>

          {/* MEMBERSHIP PLANS BODY */}
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1.5}
              sx={{
                minHeight: 260,
              }}
            >
              <CircularProgress
                size={36}
                thickness={4.5}
                sx={{
                  color: "#FF5500",
                }}
              />

              <Typography
                sx={{
                  color: "#777777",
                  fontSize: 13,
                }}
              >
                Loading membership plans...
              </Typography>
            </Stack>
          ) : plans.length === 0 ? (
            <Box
              sx={{
                maxWidth: 540,

                mx: "auto",

                py: {
                  xs: 4,
                  sm: 5,
                },

                px: 2.5,

                textAlign: "center",

                bgcolor: "#151515",

                border: "1px dashed rgba(255,255,255,0.14)",

                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  width: 58,
                  height: 58,

                  mx: "auto",

                  display: "grid",
                  placeItems: "center",

                  bgcolor: "rgba(255,85,0,0.08)",

                  border: "1px solid rgba(255,85,0,0.18)",

                  borderRadius: "50%",
                }}
              >
                <WorkspacePremiumRoundedIcon
                  sx={{
                    color: "#FF6A1A",
                    fontSize: 30,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  mt: 1.6,

                  color: "#FFFFFF",

                  fontSize: 16,
                  fontWeight: 850,
                }}
              >
                No membership plans available
              </Typography>

              <Typography
                sx={{
                  maxWidth: 390,

                  mx: "auto",
                  mt: 0.7,

                  color: "#777777",

                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                This artist has not published any membership plans yet.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",

                  md:
                    plans.length === 1
                      ? "minmax(0, 540px)"
                      : "repeat(2, minmax(0, 1fr))",
                },

                justifyContent: "center",

                gap: 2.25,

                "& > *": {
                  minWidth: 0,
                },
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
      </DialogContent>
    </Dialog>
  );
};

export default ProfileMembershipPlansDialog;
