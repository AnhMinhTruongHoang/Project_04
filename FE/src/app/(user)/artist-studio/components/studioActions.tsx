"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

type Props = {
  plan: ISubscriptionPlan | null;
  loading?: boolean;

  onDistributionClick?: () => void;
};

const UPLOAD_ROUTE = "/track/upload";

type StudioAction = {
  key: "upload" | "distribution" | "monetization";

  label: string;
  description: string;

  enabled: boolean;
  requiredPlan?: string;

  icon: React.ReactNode;

  onClick: () => void;
};

const StudioActions = ({
  plan,
  loading = false,
  onDistributionClick,
}: Props) => {
  const router = useRouter();

  const [noticeOpen, setNoticeOpen] = useState(false);

  const planCode = plan?.code || "BASIC";

  const canDistribute = Boolean(plan?.canDistribute);

  const canMonetize = Boolean(plan?.canMonetize);

  const actions = useMemo<StudioAction[]>(() => {
    return [
      {
        key: "upload",

        label: "Upload or drop tracks",

        description: plan?.unlimitedUploads
          ? "Unlimited uploads included"
          : `${Number(plan?.uploadMinutesLimit || 0)} upload minutes`,

        enabled: true,

        icon: <AddRoundedIcon />,

        onClick: () => {
          router.push(UPLOAD_ROUTE);
        },
      },

      {
        key: "distribution",

        label: "Distribute tracks",

        description: canDistribute
          ? "Distribution is included"
          : "Artist plan required",

        enabled: canDistribute,

        requiredPlan: "Artist",

        icon: <PublicRoundedIcon />,

        onClick: () => {
          if (!canDistribute) {
            router.push("/plans");

            return;
          }

          onDistributionClick?.();
        },
      },

      {
        key: "monetization",

        label: "Monetize tracks",

        description: canMonetize
          ? "Monetization is included"
          : "Artist Pro required",

        enabled: canMonetize,

        requiredPlan: "Artist Pro",

        icon: <AttachMoneyRoundedIcon />,

        onClick: () => {
          if (!canMonetize) {
            router.push("/plans");

            return;
          }

          /*
           * Quyền đã mở.
           * UI monetization sẽ được
           * triển khai ở module sau.
           */
          setNoticeOpen(true);
        },
      },
    ];
  }, [plan, canDistribute, canMonetize, router, onDistributionClick]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 72,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          borderRadius: "8px",

          backgroundColor: "rgba(255,255,255,0.025)",

          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <CircularProgress
          size={25}
          sx={{
            color: "#FF5500",
          }}
        />
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        {actions.map((item) => {
          const locked = !item.enabled;

          return (
            <Tooltip
              key={item.key}
              arrow
              title={
                locked
                  ? `Upgrade to ${item.requiredPlan} to unlock this feature`
                  : item.description
              }
            >
              <Button
                onClick={item.onClick}
                startIcon={item.icon}
                endIcon={locked ? <LockRoundedIcon /> : undefined}
                sx={{
                  position: "relative",

                  minHeight: 58,

                  minWidth: {
                    xs: "100%",
                    sm: 215,
                  },

                  px: 2.2,

                  borderRadius: "7px",

                  color: locked ? "#9da3ab" : "#ffffff",

                  backgroundColor: locked
                    ? "rgba(255,255,255,0.035)"
                    : "#202020",

                  border: locked
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(255,255,255,0.06)",

                  textTransform: "none",

                  justifyContent: "flex-start",

                  opacity: locked ? 0.72 : 1,

                  "& .MuiButton-startIcon": {
                    color: locked ? "#757b84" : "#ffffff",

                    mr: 1.2,
                  },

                  "& .MuiButton-startIcon svg": {
                    fontSize: 21,
                  },

                  "& .MuiButton-endIcon": {
                    ml: "auto",
                    color: "#9da3ab",
                  },

                  "& .MuiButton-endIcon svg": {
                    fontSize: 17,
                  },

                  "&:hover": {
                    color: "#ffffff",

                    opacity: 1,

                    backgroundColor: locked ? "rgba(255,85,0,0.08)" : "#282828",

                    borderColor: locked
                      ? "rgba(255,85,0,0.45)"
                      : "rgba(255,85,0,0.35)",
                  },
                }}
              >
                <Box
                  sx={{
                    minWidth: 0,
                    textAlign: "left",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      display: "block",

                      color: "inherit",

                      fontSize: 13,
                      fontWeight: 950,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.label}
                  </Typography>

                  <Typography
                    component="span"
                    sx={{
                      display: "block",

                      mt: 0.35,

                      color: locked ? "#777e87" : "#8B949E",

                      fontSize: 10.5,
                      fontWeight: 750,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Button>
            </Tooltip>
          );
        })}

        <Box
          sx={{
            ml: {
              xs: 0,
              lg: "auto",
            },

            minHeight: 58,

            px: 2,

            display: "flex",
            alignItems: "center",
            gap: 1,

            borderRadius: "7px",

            color: planCode === "ARTIST_PRO" ? "#f4c542" : "#AEB4BD",

            backgroundColor:
              planCode === "ARTIST_PRO"
                ? "rgba(244,197,66,0.07)"
                : "rgba(255,255,255,0.025)",

            border:
              planCode === "ARTIST_PRO"
                ? "1px solid rgba(244,197,66,0.26)"
                : "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <WorkspacePremiumRoundedIcon
            sx={{
              fontSize: 19,
            }}
          />

          <Box>
            <Typography
              sx={{
                color: "inherit",
                fontSize: 11,
                fontWeight: 950,
              }}
            >
              {plan?.name || "Basic"}
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color: "#777e87",
                fontSize: 9.5,
                fontWeight: 750,
              }}
            >
              Current Studio plan
            </Typography>
          </Box>

          {planCode !== "ARTIST_PRO" && (
            <Chip
              onClick={() => router.push("/plans")}
              size="small"
              label="Upgrade"
              sx={{
                ml: 1,

                height: 22,

                color: "#ffffff",

                backgroundColor: "#FF5500",

                fontSize: 9,
                fontWeight: 900,

                cursor: "pointer",

                "& .MuiChip-label": {
                  px: 1.1,
                },

                "&:hover": {
                  backgroundColor: "#ff6a1a",
                },
              }}
            />
          )}
        </Box>
      </Box>

      <Snackbar
        open={noticeOpen}
        autoHideDuration={3500}
        onClose={() => setNoticeOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setNoticeOpen(false)}
        >
          Monetization is unlocked for your plan. The monetization workspace
          will be connected next.
        </Alert>
      </Snackbar>
    </>
  );
};

export default StudioActions;
