"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

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
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import type { AlertColor } from "@mui/material";

import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CancelScheduleSendRoundedIcon from "@mui/icons-material/CancelScheduleSendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { cancelSubscriptionApi } from "@/utils/api";

const formatCurrency = (amount?: number | null): string => {
  if (typeof amount !== "number") {
    return "—";
  }

  if (amount <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value?: string | null): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(date);
};

const calculateRemainingDays = (value?: string | null): number => {
  if (!value) {
    return 0;
  }

  const periodEnd = new Date(value);

  if (Number.isNaN(periodEnd.getTime())) {
    return 0;
  }

  const remainingMilliseconds = periodEnd.getTime() - Date.now();

  return Math.max(Math.ceil(remainingMilliseconds / (1000 * 60 * 60 * 24)), 0);
};

export default function ArtistSubscriptionManager({
  data,
  accessToken,
  loading = false,
  error = "",
  onUpdated,
}: IArtistSubscriptionManagerProps) {
  const router = useRouter();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const [canceling, setCanceling] = useState(false);

  const [noticeOpen, setNoticeOpen] = useState(false);

  const [noticeSeverity, setNoticeSeverity] = useState<AlertColor>("success");

  const [noticeMessage, setNoticeMessage] = useState("");

  const plan = data?.plan;
  const subscription = data?.subscription;
  const usage = data?.usage;

  const planCode = String(plan?.code || "BASIC").toUpperCase();

  const subscriptionStatus = String(
    subscription?.status || "UNKNOWN"
  ).toUpperCase();

  const isBasicPlan = planCode === "BASIC";

  const cancellationScheduled = Boolean(subscription?.cancelAtPeriodEnd);

  const isActive = subscriptionStatus === "ACTIVE";

  const remainingDays = useMemo(
    () => calculateRemainingDays(subscription?.currentPeriodEnd),
    [subscription?.currentPeriodEnd]
  );

  const usagePercentage = Math.min(
    Math.max(Number(usage?.percentage || 0), 0),
    100
  );

  const uploadedMinutes = Number(usage?.uploadedMinutes || 0);

  const remainingMinutes = Number(usage?.remainingMinutes || 0);

  const uploadLimitMinutes = Number(usage?.limitMinutes || 0);

  const unlimitedUploads = Boolean(usage?.unlimited || plan?.unlimitedUploads);

  const canCancel =
    !isBasicPlan && isActive && !cancellationScheduled && Boolean(accessToken);

  const planFeatures = useMemo(
    () => [
      {
        label: "Upload allowance",
        enabled: true,
        value: unlimitedUploads
          ? "Unlimited uploads"
          : `${uploadLimitMinutes.toFixed(0)} minutes per period`,
        icon: <CloudUploadRoundedIcon />,
      },
      {
        label: "Distribution",
        enabled: Boolean(plan?.canDistribute),
        value: plan?.canDistribute ? "Available" : "Not included",
        icon: <LibraryMusicRoundedIcon />,
      },
      {
        label: "Monetization",
        enabled: Boolean(plan?.canMonetize),
        value: plan?.canMonetize ? "Available" : "Not included",
        icon: <MonetizationOnRoundedIcon />,
      },
      {
        label: "Scheduled releases",
        enabled: Boolean(plan?.canScheduleRelease),
        value: plan?.canScheduleRelease ? "Available" : "Not included",
        icon: <CalendarMonthRoundedIcon />,
      },
      {
        label: "Advanced insights",
        enabled: Number(plan?.advancedInsightsDays || 0) > 0,
        value:
          Number(plan?.advancedInsightsDays || 0) > 0
            ? `${plan?.advancedInsightsDays} days`
            : "Not included",
        icon: <InsightsRoundedIcon />,
      },
      {
        label: "Membership benefits",
        enabled: Boolean(plan?.hasMembershipBenefits),
        value: plan?.hasMembershipBenefits ? "Available" : "Not included",
        icon: <WorkspacePremiumRoundedIcon />,
      },
    ],
    [plan, unlimitedUploads, uploadLimitMinutes]
  );

  const showNotice = (severity: AlertColor, message: string) => {
    setNoticeSeverity(severity);
    setNoticeMessage(message);
    setNoticeOpen(true);
  };

  const handleCancelSubscription = async () => {
    if (!canCancel || canceling) {
      return;
    }

    try {
      setCanceling(true);

      const response = await cancelSubscriptionApi(accessToken);

      if (
        response?.error ||
        Number(response?.statusCode) >= 400 ||
        !response?.data
      ) {
        showNotice(
          "error",
          response?.message || "Unable to schedule subscription cancellation."
        );

        return;
      }

      onUpdated(response.data);
      setCancelDialogOpen(false);

      showNotice(
        "success",
        "Cancellation has been scheduled. Your plan remains active until the end of the current period."
      );
    } catch (cancelError) {
      console.error("Cannot cancel subscription:", cancelError);

      showNotice("error", "Unable to schedule subscription cancellation.");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          minHeight: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#151515",
          border: "1px solid #2b2b2b",
          borderRadius: 3,
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={40} />

          <Typography color="#bdbdbd">Loading subscription...</Typography>
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          bgcolor: "rgba(211, 47, 47, 0.14)",
          color: "#ffffff",
          border: "1px solid rgba(239, 83, 80, 0.42)",
          "& .MuiAlert-icon": {
            color: "#ef5350",
          },
        }}
      >
        {error}
      </Alert>
    );
  }

  if (!data || !plan || !subscription) {
    return (
      <Alert
        severity="warning"
        sx={{
          bgcolor: "rgba(237, 108, 2, 0.14)",
          color: "#ffffff",
          border: "1px solid rgba(255, 167, 38, 0.4)",
          "& .MuiAlert-icon": {
            color: "#ffa726",
          },
        }}
      >
        Subscription information is not available.
      </Alert>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        {/* CURRENT SUBSCRIPTION OVERVIEW */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#151515",
            color: "#ffffff",
            border: "1px solid #2b2b2b",
            borderRadius: 3,
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={3}
            justifyContent="space-between"
          >
            <Stack
              spacing={1.5}
              sx={{
                minWidth: 0,
              }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={plan.name}
                  color={isBasicPlan ? "default" : "primary"}
                  icon={<WorkspacePremiumRoundedIcon />}
                  sx={{
                    color: "#ffffff",
                    fontWeight: 700,
                    bgcolor: isBasicPlan ? "#343434" : undefined,
                  }}
                />

                <Chip
                  label={subscriptionStatus}
                  color={isActive ? "success" : "warning"}
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                  }}
                />

                {cancellationScheduled && (
                  <Chip
                    label="Cancellation scheduled"
                    color="warning"
                    variant="filled"
                    sx={{
                      fontWeight: 700,
                    }}
                  />
                )}
              </Stack>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  fontSize: {
                    xs: "1.7rem",
                    sm: "2.125rem",
                  },
                }}
              >
                {plan.name}
              </Typography>

              <Typography
                color="#bdbdbd"
                sx={{
                  maxWidth: 620,
                }}
              >
                {plan.description ||
                  "Manage your SoundClone subscription and creator access."}
              </Typography>

              <Typography variant="h5" fontWeight={800}>
                {formatCurrency(plan.monthlyPrice)}
                {!isBasicPlan && (
                  <Typography
                    component="span"
                    color="#9e9e9e"
                    fontSize="0.95rem"
                    ml={0.5}
                  >
                    / period
                  </Typography>
                )}
              </Typography>
            </Stack>

            {/* DESKTOP SUBSCRIPTION ACTIONS */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
                md: "column",
              }}
              spacing={1.25}
              sx={{
                width: {
                  xs: "100%",
                  md: 220,
                },
                flexShrink: 0,
              }}
            >
              <Button
                fullWidth
                variant="contained"
                startIcon={<CreditCardRoundedIcon />}
                onClick={() => router.push("/plans")}
                sx={{
                  minHeight: 46,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                View plans
              </Button>

              {!isBasicPlan && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<CancelScheduleSendRoundedIcon />}
                  disabled={!canCancel}
                  onClick={() => setCancelDialogOpen(true)}
                  sx={{
                    minHeight: 46,
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  {cancellationScheduled
                    ? "Cancellation scheduled"
                    : "Cancel at period end"}
                </Button>
              )}
            </Stack>
          </Stack>

          {cancellationScheduled && (
            <Alert
              severity="warning"
              sx={{
                mt: 3,
                bgcolor: "rgba(237, 108, 2, 0.14)",
                color: "#ffffff",
                border: "1px solid rgba(255, 167, 38, 0.4)",
                "& .MuiAlert-icon": {
                  color: "#ffa726",
                },
              }}
            >
              Your {plan.name} access remains active until{" "}
              <strong>{formatDate(subscription.currentPeriodEnd)}</strong>. It
              will not renew automatically.
            </Alert>
          )}
        </Paper>

        {/* SUBSCRIPTION PERIOD */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#151515",
            color: "#ffffff",
            border: "1px solid #2b2b2b",
            borderRadius: 3,
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <Typography variant="h6" fontWeight={800} mb={2.5}>
            Subscription period
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            <SubscriptionInfoCard
              label="Activated"
              value={formatDate(subscription.startedAt)}
            />

            <SubscriptionInfoCard
              label="Period started"
              value={formatDate(subscription.currentPeriodStart)}
            />

            <SubscriptionInfoCard
              label="Active until"
              value={formatDate(subscription.currentPeriodEnd)}
            />

            <SubscriptionInfoCard
              label="Days remaining"
              value={`${remainingDays} day${remainingDays === 1 ? "" : "s"}`}
            />
          </Box>
        </Paper>

        {/* UPLOAD QUOTA */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#151515",
            color: "#ffffff",
            border: "1px solid #2b2b2b",
            borderRadius: 3,
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
            justifyContent="space-between"
            mb={2}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Upload quota
              </Typography>

              <Typography color="#9e9e9e" fontSize="0.92rem">
                Usage for the current subscription period.
              </Typography>
            </Box>

            <Typography fontWeight={700} color="#ffffff">
              {unlimitedUploads
                ? `${uploadedMinutes.toFixed(1)} minutes uploaded`
                : `${uploadedMinutes.toFixed(1)} / ${uploadLimitMinutes.toFixed(
                    0
                  )} minutes`}
            </Typography>
          </Stack>

          <LinearProgress
            variant={unlimitedUploads ? "indeterminate" : "determinate"}
            value={usagePercentage}
            sx={{
              height: 10,
              borderRadius: 999,
              bgcolor: "#2b2b2b",
            }}
          />

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
            justifyContent="space-between"
            mt={1.5}
          >
            <Typography color="#9e9e9e" fontSize="0.9rem">
              {unlimitedUploads
                ? "Unlimited upload allowance"
                : `${remainingMinutes.toFixed(1)} minutes remaining`}
            </Typography>

            {!unlimitedUploads && (
              <Typography color="#9e9e9e" fontSize="0.9rem">
                {usagePercentage.toFixed(1)}% used
              </Typography>
            )}
          </Stack>
        </Paper>

        {/* PLAN FEATURES */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#151515",
            color: "#ffffff",
            border: "1px solid #2b2b2b",
            borderRadius: 3,
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <Typography variant="h6" fontWeight={800} mb={2.5}>
            Plan features
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
              },
              gap: 1.5,
            }}
          >
            {planFeatures.map((feature) => (
              <Stack
                key={feature.label}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  minWidth: 0,
                  bgcolor: "#1d1d1d",
                  border: "1px solid #303030",
                  borderRadius: 2,
                  p: 1.75,
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
                    borderRadius: 2,
                    bgcolor: feature.enabled
                      ? "rgba(33, 150, 243, 0.14)"
                      : "rgba(255, 255, 255, 0.06)",
                    color: feature.enabled ? "#42a5f5" : "#757575",
                  }}
                >
                  {feature.icon}
                </Box>

                <Box
                  sx={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <Typography fontWeight={700}>{feature.label}</Typography>

                  <Typography
                    color={feature.enabled ? "#bdbdbd" : "#757575"}
                    fontSize="0.9rem"
                  >
                    {feature.value}
                  </Typography>
                </Box>

                <CheckCircleRoundedIcon
                  sx={{
                    color: feature.enabled ? "#66bb6a" : "#555555",
                    flexShrink: 0,
                  }}
                />
              </Stack>
            ))}
          </Box>
        </Paper>
      </Stack>

      {/* CANCEL SUBSCRIPTION DIALOG */}
      <Dialog
        open={cancelDialogOpen}
        onClose={canceling ? undefined : () => setCancelDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#171717",
            color: "#ffffff",
            border: "1px solid #333333",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle fontWeight={800}>Cancel {plan.name}?</DialogTitle>

        <Divider
          sx={{
            borderColor: "#303030",
          }}
        />

        <DialogContent>
          <Stack spacing={2}>
            <Alert
              severity="warning"
              sx={{
                bgcolor: "rgba(237, 108, 2, 0.14)",
                color: "#ffffff",
                border: "1px solid rgba(255, 167, 38, 0.4)",
                "& .MuiAlert-icon": {
                  color: "#ffa726",
                },
              }}
            >
              Your plan will remain active until{" "}
              <strong>{formatDate(subscription.currentPeriodEnd)}</strong>.
            </Alert>

            <Typography color="#bdbdbd">
              Canceling prevents the paid subscription from continuing after the
              current period. Your uploads and creator features remain available
              until the period ends.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            flexDirection: {
              xs: "column-reverse",
              sm: "row",
            },
            gap: 1,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            disabled={canceling}
            onClick={() => setCancelDialogOpen(false)}
            sx={{
              minHeight: 44,
              color: "#ffffff",
              borderColor: "#555555",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Keep subscription
          </Button>

          <Button
            fullWidth
            variant="contained"
            color="error"
            disabled={canceling}
            onClick={handleCancelSubscription}
            sx={{
              minHeight: 44,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {canceling ? "Scheduling..." : "Confirm cancellation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUBSCRIPTION NOTICE */}
      <Snackbar
        open={noticeOpen}
        autoHideDuration={5000}
        onClose={() => setNoticeOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity={noticeSeverity}
          variant="filled"
          onClose={() => setNoticeOpen(false)}
          sx={{
            width: "100%",
          }}
        >
          {noticeMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

function SubscriptionInfoCard({ label, value }: ISubscriptionInfoCardProps) {
  return (
    <Box
      sx={{
        bgcolor: "#1d1d1d",
        border: "1px solid #303030",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Typography color="#9e9e9e" fontSize="0.88rem" mb={0.75}>
        {label}
      </Typography>

      <Typography
        fontWeight={800}
        color="#ffffff"
        sx={{
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
