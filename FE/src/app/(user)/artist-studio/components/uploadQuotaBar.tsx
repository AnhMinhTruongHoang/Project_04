"use client";

import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import type { IMySubscriptionData, SubscriptionPlanCode } from "@/utils/api";

type Props = {
  data: IMySubscriptionData | null;
  loading?: boolean;
  error?: string;
};

const formatMinutes = (value?: number) => {
  const minutes = Number(value || 0);

  if (!Number.isFinite(minutes)) {
    return "0";
  }

  if (Math.abs(minutes - Math.round(minutes)) < 0.01) {
    return String(Math.round(minutes));
  }

  return minutes.toFixed(1);
};

const formatDate = (value?: string) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getActionLabel = (code?: SubscriptionPlanCode) => {
  if (code === "ARTIST_PRO") {
    return "Manage subscription";
  }

  if (code === "ARTIST") {
    return "Upgrade to Artist Pro";
  }

  return "Upgrade plan";
};

const UploadQuotaBar = ({ data, loading = false, error = "" }: Props) => {
  const router = useRouter();

  const plan = data?.plan;
  const usage = data?.usage;
  const subscription = data?.subscription;

  const unlimited =
    Boolean(plan?.unlimitedUploads) || Boolean(usage?.unlimited);

  const percentage = Math.min(Math.max(Number(usage?.percentage || 0), 0), 100);

  const usageText = unlimited
    ? "Unlimited uploads"
    : `${formatMinutes(usage?.uploadedMinutes)} / ${formatMinutes(
        usage?.limitMinutes
      )} minutes used`;

  const progressColor =
    percentage >= 95 ? "#ff3040" : percentage >= 80 ? "#ffb020" : "#FF5500";

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 65,

          borderRadius: "4px",
          background: "#202020",

          border: "1px solid rgba(255,255,255,0.06)",

          px: {
            xs: 2,
            md: 2.5,
          },

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          size={23}
          sx={{
            color: "#FF5500",
          }}
        />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          minHeight: 65,

          borderRadius: "4px",
          background: "rgba(255,48,64,0.06)",

          border: "1px solid rgba(255,48,64,0.2)",

          px: {
            xs: 2,
            md: 2.5,
          },

          py: 1.4,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ErrorOutlineRoundedIcon
            sx={{
              color: "#ff6673",
              fontSize: 20,
            }}
          />

          <Typography
            sx={{
              color: "#ff9da5",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {error || "Subscription data is unavailable."}
          </Typography>
        </Box>

        <Button
          onClick={() => router.push("/plans")}
          sx={{
            borderRadius: "999px",

            color: "#ffffff",

            border: "1px solid rgba(255,255,255,0.3)",

            textTransform: "none",

            fontSize: 12,
            fontWeight: 900,
          }}
        >
          View plans
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: "4px",

        background: "linear-gradient(90deg, #202020 0%, #1a1b1c 100%)",

        border: "1px solid rgba(255,255,255,0.06)",

        px: {
          xs: 2,
          md: 2.5,
        },

        py: 1.5,

        display: "flex",

        alignItems: {
          xs: "stretch",
          sm: "center",
        },

        justifyContent: "space-between",

        flexDirection: {
          xs: "column",
          sm: "row",
        },

        gap: {
          xs: 1.5,
          sm: 2,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.2,
          minWidth: 0,
          flex: 1,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,

            borderRadius: "50%",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            flexShrink: 0,

            color: unlimited ? "#f4c542" : "#ffffff",

            backgroundColor: unlimited
              ? "rgba(244,197,66,0.12)"
              : "rgba(255,255,255,0.07)",
          }}
        >
          {unlimited ? (
            <WorkspacePremiumRoundedIcon
              sx={{
                fontSize: 20,
              }}
            />
          ) : (
            <CloudUploadRoundedIcon
              sx={{
                fontSize: 19,
              }}
            />
          )}
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
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 950,
              }}
            >
              {usageText}
            </Typography>

            <Typography
              sx={{
                color: plan?.code === "ARTIST_PRO" ? "#f4c542" : "#8B949E",

                fontSize: 11,
                fontWeight: 850,
              }}
            >
              {plan?.name}
            </Typography>
          </Box>

          {!unlimited && (
            <Box
              sx={{
                mt: 0.85,

                width: {
                  xs: "100%",
                  sm: 250,
                  md: 340,
                },

                maxWidth: "100%",

                height: 5,

                borderRadius: "999px",

                background: "rgba(255,255,255,0.16)",

                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${percentage}%`,
                  height: "100%",

                  borderRadius: "999px",

                  background: progressColor,

                  transition: "width 280ms ease",
                }}
              />
            </Box>
          )}

          <Typography
            sx={{
              mt: 0.65,
              color: "#7f8791",
              fontSize: 10.5,
              fontWeight: 700,
            }}
          >
            {unlimited
              ? `Active until ${formatDate(subscription?.currentPeriodEnd)}`
              : `${formatMinutes(
                  usage?.remainingMinutes
                )} minutes remaining · resets ${formatDate(
                  subscription?.currentPeriodEnd
                )}`}
          </Typography>
        </Box>
      </Box>

      <Tooltip
        title={
          plan?.code === "ARTIST_PRO"
            ? "View and manage your current plan"
            : "Compare available subscription plans"
        }
        arrow
      >
        <Button
          onClick={() => router.push("/plans")}
          variant="outlined"
          sx={{
            borderRadius: "999px",

            px: {
              xs: 2,
              sm: 3.5,
            },

            minWidth: {
              xs: "100%",
              sm: 185,
            },

            color: "#ffffff",

            borderColor:
              plan?.code === "ARTIST_PRO"
                ? "rgba(244,197,66,0.7)"
                : "rgba(255,255,255,0.28)",

            backgroundColor:
              plan?.code === "ARTIST_PRO"
                ? "rgba(244,197,66,0.06)"
                : "transparent",

            textTransform: "none",

            fontSize: 12,
            fontWeight: 950,

            "&:hover": {
              borderColor: plan?.code === "ARTIST_PRO" ? "#f4c542" : "#FF5500",

              background:
                plan?.code === "ARTIST_PRO"
                  ? "rgba(244,197,66,0.12)"
                  : "rgba(255,85,0,0.08)",
            },
          }}
        >
          {getActionLabel(plan?.code)}
        </Button>
      </Tooltip>
    </Box>
  );
};

export default UploadQuotaBar;
