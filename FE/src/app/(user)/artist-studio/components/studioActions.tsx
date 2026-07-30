"use client";

import type { ReactNode } from "react";
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
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

type Props = {
  plan: ISubscriptionPlan | null;
  loading?: boolean;
  onDistributionClick?: () => void;
};

type StudioActionKey = "upload" | "distribution" | "monetization";

type StudioAction = {
  key: StudioActionKey;
  label: string;
  description: string;
  enabled: boolean;
  requiredPlan?: string;
  icon: ReactNode;
  onClick: () => void;
};

const UPLOAD_ROUTE = "/track/upload";
const PLANS_ROUTE = "/plans";

const getUploadDescription = (plan?: ISubscriptionPlan | null) => {
  if (plan?.unlimitedUploads) {
    return "Unlimited uploads included";
  }

  const limit = Number(plan?.uploadMinutesLimit);

  if (Number.isFinite(limit) && limit > 0) {
    return `${limit} upload minutes`;
  }

  return "Upload tracks and audio files";
};

const StudioActions = ({
  plan,
  loading = false,
  onDistributionClick,
}: Props) => {
  const router = useRouter();

  const [noticeOpen, setNoticeOpen] = useState(false);

  const planCode: SubscriptionPlanCode = plan?.code || "BASIC";

  const canDistribute = Boolean(plan?.canDistribute);
  const canMonetize = Boolean(plan?.canMonetize);

  const goToPlans = () => {
    router.push(PLANS_ROUTE);
  };

  const actions = useMemo<StudioAction[]>(() => {
    return [
      {
        key: "upload",
        label: "Upload or drop tracks",
        description: getUploadDescription(plan),
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
            goToPlans();
            return;
          }

          if (onDistributionClick) {
            onDistributionClick();
            return;
          }

          router.replace("/artist-studio?tab=distribution", {
            scroll: false,
          });
        },
      },
      {
        key: "monetization",
        label: "Monetize tracks",
        description: canMonetize
          ? "Available with Artist Pro"
          : "Artist Pro required",
        enabled: canMonetize,
        requiredPlan: "Artist Pro",
        icon: <AttachMoneyRoundedIcon />,
        onClick: () => {
          if (!canMonetize) {
            goToPlans();
            return;
          }

          setNoticeOpen(true);
        },
      },
    ];
  }, [plan, canDistribute, canMonetize, onDistributionClick, router]);

  if (loading) {
    return (
      <Box
        aria-label="Loading Artist Studio actions"
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
          alignItems: "stretch",
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
                type="button"
                onClick={item.onClick}
                startIcon={item.icon}
                endIcon={locked ? <LockRoundedIcon /> : undefined}
                aria-label={
                  locked
                    ? `${item.label}. Requires ${item.requiredPlan}.`
                    : item.label
                }
                sx={{
                  position: "relative",
                  minHeight: 58,
                  minWidth: {
                    xs: "100%",
                    sm: 215,
                  },
                  flex: {
                    xs: "1 1 100%",
                    sm: "0 1 235px",
                  },
                  px: 2.2,
                  borderRadius: "7px",
                  color: locked ? "#9da3ab" : "#ffffff",
                  backgroundColor: locked
                    ? "rgba(255,255,255,0.035)"
                    : "#202020",
                  border: locked
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(255,255,255,0.07)",
                  textTransform: "none",
                  justifyContent: "flex-start",
                  opacity: locked ? 0.72 : 1,
                  transition:
                    "background-color 150ms ease, border-color 150ms ease, opacity 150ms ease",
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
                    backgroundColor: locked
                      ? "rgba(255,85,0,0.08)"
                      : "#282828",
                    borderColor: locked
                      ? "rgba(255,85,0,0.45)"
                      : "rgba(255,85,0,0.35)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #FF5500",
                    outlineOffset: "2px",
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
            width: {
              xs: "100%",
              sm: "auto",
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
              flexShrink: 0,
            }}
          />

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              noWrap
              sx={{
                color: "inherit",
                fontSize: 11,
                fontWeight: 950,
              }}
            >
              {plan?.name || "Basic"}
            </Typography>

            <Typography
              noWrap
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
              component="button"
              type="button"
              onClick={goToPlans}
              size="small"
              label="Upgrade"
              sx={{
                ml: "auto",
                height: 22,
                border: 0,
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
                "&:focus-visible": {
                  outline: "2px solid #ffffff",
                  outlineOffset: "2px",
                },
              }}
            />
          )}
        </Box>
      </Box>

      <Snackbar
        open={noticeOpen}
        autoHideDuration={4000}
        onClose={() => setNoticeOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setNoticeOpen(false)}
        >
          Your plan supports monetization, but the track monetization workspace
          has not been connected yet.
        </Alert>
      </Snackbar>
    </>
  );
};

export default StudioActions;