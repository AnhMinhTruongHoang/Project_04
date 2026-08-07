"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  alpha,
} from "@mui/material";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

const formatMembershipPrice = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const ProfileMembershipPlanCard = ({
  plan,
  membershipAccess,
  isOwner = false,
  loading = false,
  onJoin,
}: IProfileMembershipPlanCardProps) => {
  const accentColor = /^#[0-9A-F]{6}$/i.test(plan.badgeColor || "")
    ? plan.badgeColor
    : "#FF5500";

  const isCurrentPlan =
    Boolean(membershipAccess?.active) && membershipAccess?.planId === plan.id;

  const hasOtherActivePlan =
    Boolean(membershipAccess?.active) && membershipAccess?.planId !== plan.id;

  const isDisabled = loading || isOwner || !plan.active || isCurrentPlan;

  const getButtonLabel = () => {
    if (loading) {
      return "Processing";
    }

    if (isOwner) {
      return "Your plan";
    }

    if (!plan.active) {
      return "Paused";
    }

    if (isCurrentPlan) {
      return "Currently a member";
    }

    if (hasOtherActivePlan) {
      return "Switch to this plan";
    }

    return "Join now";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",

        width: "100%",
        minWidth: 0,

        p: {
          xs: 2,
          sm: 2.5,
        },

        borderRadius: 3,

        bgcolor: "#111111",

        border: `1px solid ${alpha(accentColor, isCurrentPlan ? 0.85 : 0.32)}`,

        boxShadow: isCurrentPlan
          ? `0 0 0 1px ${alpha(
              accentColor,
              0.18
            )}, 0 14px 38px rgba(0, 0, 0, 0.34)`
          : "0 12px 32px rgba(0, 0, 0, 0.2)",

        transition:
          "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",

        "&:hover": {
          transform: {
            xs: "none",
            sm: "translateY(-3px)",
          },

          borderColor: alpha(accentColor, 0.72),

          boxShadow: "0 18px 42px rgba(0, 0, 0, 0.34)",
        },
      }}
    >
      {/* PLAN ACCENT */}
      <Box
        sx={{
          position: "absolute",
          inset: "0 auto 0 0",

          width: 4,

          bgcolor: accentColor,
        }}
      />

      <Stack
        spacing={2}
        sx={{
          height: "100%",
        }}
      >
        {/* PLAN HEADER */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
          justifyContent="space-between"
        >
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

                borderRadius: 2,

                bgcolor: alpha(accentColor, 0.14),

                border: `1px solid ${alpha(accentColor, 0.3)}`,
              }}
            >
              <WorkspacePremiumOutlinedIcon
                sx={{
                  color: accentColor,
                  fontSize: 24,
                }}
              />
            </Box>

            <Box minWidth={0}>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: {
                    xs: 16,
                    sm: 18,
                  },

                  fontWeight: 800,
                  lineHeight: 1.25,

                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {plan.name}
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,

                  color: "#8F8F8F",
                  fontSize: 12,
                  fontWeight: 600,

                  textTransform: "uppercase",

                  letterSpacing: "0.06em",
                }}
              >
                {plan.code}
              </Typography>
            </Box>
          </Stack>

          {/* PLAN STATUS */}
          {isCurrentPlan ? (
            <Chip
              size="small"
              icon={<CheckCircleOutlineRoundedIcon />}
              label="Current"
              sx={{
                flexShrink: 0,

                color: accentColor,

                bgcolor: alpha(accentColor, 0.14),

                border: `1px solid ${alpha(accentColor, 0.32)}`,

                "& .MuiChip-icon": {
                  color: accentColor,
                },
              }}
            />
          ) : !plan.active ? (
            <Chip
              size="small"
              icon={<LockOutlinedIcon />}
              label="Paused"
              sx={{
                flexShrink: 0,

                color: "#A6A6A6",
                bgcolor: "#202020",

                border: "1px solid #363636",

                "& .MuiChip-icon": {
                  color: "#8C8C8C",
                },
              }}
            />
          ) : null}
        </Stack>

        {/* MEMBERSHIP BADGE */}
        <Box>
          <Chip
            size="small"
            label={plan.badgeName || "Member"}
            sx={{
              maxWidth: "100%",

              color: accentColor,
              fontWeight: 700,

              bgcolor: alpha(accentColor, 0.12),

              border: `1px solid ${alpha(accentColor, 0.3)}`,

              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        </Box>

        {/* PLAN DESCRIPTION */}
        <Typography
          sx={{
            color: "#B8B8B8",

            fontSize: 14,
            lineHeight: 1.65,

            minHeight: {
              xs: "auto",
              sm: 46,
            },

            overflowWrap: "anywhere",
          }}
        >
          {plan.description?.trim() ||
            "Support the artist and access members-only content."}
        </Typography>

        {/* PLAN PRICE */}
        <Box
          sx={{
            py: 1.5,

            borderTop: "1px solid #292929",
            borderBottom: "1px solid #292929",
          }}
        >
          <Stack
            direction="row"
            alignItems="baseline"
            flexWrap="wrap"
            columnGap={0.75}
          >
            <Typography
              sx={{
                color: "#FFFFFF",

                fontSize: {
                  xs: 23,
                  sm: 26,
                },

                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              {formatMembershipPrice(plan.monthlyPrice)}
            </Typography>

            <Typography
              sx={{
                color: "#818181",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              / 30 days
            </Typography>
          </Stack>
        </Box>

        {/* PLAN ACTION */}
        <Box
          sx={{
            mt: "auto !important",
          }}
        >
          <Button
            fullWidth
            variant={isCurrentPlan ? "outlined" : "contained"}
            disabled={isDisabled}
            onClick={() => {
              onJoin?.(plan);
            }}
            startIcon={
              loading ? (
                <CircularProgress
                  size={17}
                  thickness={5}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : isCurrentPlan ? (
                <CheckCircleOutlineRoundedIcon />
              ) : (
                <WorkspacePremiumOutlinedIcon />
              )
            }
            sx={{
              minHeight: 46,

              borderRadius: 2,

              fontSize: 14,
              fontWeight: 800,

              textTransform: "none",

              color: isCurrentPlan ? accentColor : "#FFFFFF",

              bgcolor: isCurrentPlan ? "transparent" : accentColor,

              borderColor: alpha(accentColor, 0.62),

              boxShadow: "none",

              "&:hover": {
                bgcolor: isCurrentPlan
                  ? alpha(accentColor, 0.08)
                  : alpha(accentColor, 0.86),

                borderColor: accentColor,

                boxShadow: "none",
              },

              "&.Mui-disabled": {
                color: isCurrentPlan ? alpha(accentColor, 0.7) : "#777777",

                bgcolor: isCurrentPlan ? alpha(accentColor, 0.06) : "#252525",

                borderColor: isCurrentPlan
                  ? alpha(accentColor, 0.28)
                  : "#383838",
              },
            }}
          >
            {getButtonLabel()}
          </Button>

          {isCurrentPlan && membershipAccess?.cancelAtPeriodEnd && (
            <Typography
              sx={{
                mt: 1.25,

                color: "#F0A84B",
                fontSize: 12,
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              "Support this artist and unlock members-only content."
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default ProfileMembershipPlanCard;
