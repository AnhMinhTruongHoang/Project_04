"use client";

import type { ReactNode } from "react";

import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import EqualizerRoundedIcon from "@mui/icons-material/EqualizerRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

type ArtistStudioStatsData = {
  plays: number;
  reposts: number;
  downloads: number;
  likes: number;
  comments: number;
  earnings: number;
  fans: number;
};

type Props = {
  plan: ISubscriptionPlan | null;
  loading?: boolean;
  error?: string;
  stats?: Partial<ArtistStudioStatsData>;
};

type StatKey =
  | "plays"
  | "reposts"
  | "downloads"
  | "likes"
  | "comments"
  | "insights"
  | "earnings"
  | "fans"
  | "benefits";

type StatItem = {
  key: StatKey;
  label: string;
  icon: ReactNode;
};

const statItems: StatItem[] = [
  {
    key: "plays",
    label: "SC plays",
    icon: <PlayCircleFilledRoundedIcon />,
  },
  {
    key: "reposts",
    label: "Reposts",
    icon: <RepeatRoundedIcon />,
  },
  {
    key: "downloads",
    label: "Downloads",
    icon: <FileDownloadRoundedIcon />,
  },
  {
    key: "likes",
    label: "Likes",
    icon: <FavoriteRoundedIcon />,
  },
  {
    key: "comments",
    label: "Comments",
    icon: <CommentRoundedIcon />,
  },
  {
    key: "insights",
    label: "Insights",
    icon: <EqualizerRoundedIcon />,
  },
  {
    key: "earnings",
    label: "Earnings",
    icon: <PaidRoundedIcon />,
  },
  {
    key: "fans",
    label: "Fans",
    icon: <GroupsRoundedIcon />,
  },
  {
    key: "benefits",
    label: "Benefits",
    icon: <WorkspacePremiumRoundedIcon />,
  },
];

const defaultStats: ArtistStudioStatsData = {
  plays: 0,
  reposts: 0,
  downloads: 0,
  likes: 0,
  comments: 0,
  earnings: 0,
  fans: 0,
};

const formatNumber = (value?: number) => {
  const safeValue = Math.max(Number(value) || 0, 0);

  return new Intl.NumberFormat("en-US", {
    notation: safeValue >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(safeValue);
};

const getInsightsLabel = (plan?: ISubscriptionPlan | null) => {
  if (plan?.code === "ARTIST_PRO") {
    return "Unlimited";
  }

  const fallbackDays = plan?.code === "ARTIST" ? 30 : 7;
  const configuredDays = Number(plan?.advancedInsightsDays);

  const days =
    Number.isFinite(configuredDays) && configuredDays > 0
      ? configuredDays
      : fallbackDays;

  return `${days} days`;
};

const isUnlocked = (key: StatKey, planCode: SubscriptionPlanCode) => {
  if (
    key === "plays" ||
    key === "likes" ||
    key === "comments" ||
    key === "insights"
  ) {
    return true;
  }

  if (key === "reposts" || key === "downloads") {
    return planCode === "ARTIST" || planCode === "ARTIST_PRO";
  }

  if (key === "earnings" || key === "fans" || key === "benefits") {
    return planCode === "ARTIST_PRO";
  }

  return false;
};

const getRequiredPlan = (key: StatKey) => {
  if (key === "reposts" || key === "downloads") {
    return "Artist";
  }

  if (key === "earnings" || key === "fans" || key === "benefits") {
    return "Artist Pro";
  }

  return "Basic";
};

const ArtistStudioStats = ({
  plan,
  loading = false,
  error = "",
  stats: providedStats,
}: Props) => {
  const router = useRouter();

  const stats: ArtistStudioStatsData = {
    ...defaultStats,
    ...providedStats,
  };

  const planCode: SubscriptionPlanCode = plan?.code || "BASIC";

  const getStatValue = (key: StatKey) => {
    if (key === "insights") {
      return getInsightsLabel(plan);
    }

    if (key === "benefits") {
      return planCode === "ARTIST_PRO" ? "Active" : "";
    }

    return formatNumber(stats[key as keyof ArtistStudioStatsData]);
  };

  if (loading) {
    return (
      <Box
        aria-label="Loading Artist Studio statistics"
        sx={{
          minHeight: 180,
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(180deg, rgba(18,20,22,0.98), rgba(11,13,14,0.98))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          size={28}
          sx={{
            color: "#FF5500",
          }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        role="alert"
        sx={{
          minHeight: 180,
          borderRadius: "16px",
          border: "1px solid rgba(255,85,0,0.24)",
          background:
            "linear-gradient(180deg, rgba(28,18,14,0.98), rgba(11,13,14,0.98))",
          px: 3,
          py: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Box>
          <ErrorOutlineRoundedIcon
            sx={{
              color: "#FF5500",
              fontSize: 30,
              mb: 1,
            }}
          />

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 900,
            }}
          >
            Artist Studio stats are unavailable
          </Typography>

          <Typography
            sx={{
              mt: 0.7,
              color: "#9CA3AF",
              fontSize: 12,
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(18,20,22,0.98), rgba(11,13,14,0.98))",
        px: {
          xs: 2.5,
          md: 3,
        },
        py: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Typography
            component="h1"
            sx={{
              color: "#ffffff",
              fontSize: {
                xs: 24,
                md: 28,
              },
              fontWeight: 950,
              letterSpacing: "-0.04em",
            }}
          >
            Artist Studio
          </Typography>

          <Typography
            sx={{
              color: "#8B949E",
              fontSize: 12,
              fontWeight: 800,
              mt: 0.6,
            }}
          >
            All time stats updated daily
          </Typography>
        </Box>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.8,
            px: 1.4,
            py: 0.65,
            borderRadius: "999px",
            color: planCode === "ARTIST_PRO" ? "#f4c542" : "#ffffff",
            backgroundColor:
              planCode === "ARTIST_PRO"
                ? "rgba(244,197,66,0.09)"
                : "rgba(255,255,255,0.05)",
            border:
              planCode === "ARTIST_PRO"
                ? "1px solid rgba(244,197,66,0.3)"
                : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <WorkspacePremiumRoundedIcon
            sx={{
              fontSize: 16,
            }}
          />

          <Typography
            sx={{
              color: "inherit",
              fontSize: 10.5,
              fontWeight: 950,
            }}
          >
            {plan?.name || "Basic"}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: "repeat(5, minmax(0, 1fr))",
            lg: "repeat(9, minmax(0, 1fr))",
          },
          gap: {
            xs: 1,
            md: 0,
          },
        }}
      >
        {statItems.map((item, index) => {
          const unlocked = isUnlocked(item.key, planCode);
          const requiredPlan = getRequiredPlan(item.key);

          return (
            <Tooltip
              key={item.key}
              arrow
              title={
                unlocked
                  ? item.label
                  : `Upgrade to ${requiredPlan} to unlock ${item.label}`
              }
            >
              <Box
                component="button"
                type="button"
                onClick={() => {
                  if (!unlocked) {
                    router.push("/plans");
                  }
                }}
                aria-label={
                  unlocked
                    ? `${item.label}: ${getStatValue(item.key)}`
                    : `${item.label} requires ${requiredPlan}`
                }
                sx={{
                  appearance: "none",
                  width: "100%",
                  minHeight: 82,
                  px: {
                    xs: 1,
                    md: 1.6,
                  },
                  py: 1.2,
                  borderTop: 0,
                  borderBottom: 0,
                  borderLeft: 0,
                  borderRight: {
                    xs: "none",
                    lg:
                      index < statItems.length - 1
                        ? "1px solid rgba(255,255,255,0.12)"
                        : "none",
                  },
                  borderRadius: {
                    xs: "8px",
                    lg: 0,
                  },
                  backgroundColor: unlocked
                    ? "transparent"
                    : "rgba(255,255,255,0.018)",
                  color: unlocked ? "#ffffff" : "#676e77",
                  cursor: unlocked ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  transition:
                    "background-color 160ms ease, color 160ms ease",
                  "&:hover": {
                    color: unlocked ? "#ffffff" : "#FF5500",
                    backgroundColor: unlocked
                      ? "rgba(255,255,255,0.025)"
                      : "rgba(255,85,0,0.06)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #FF5500",
                    outlineOffset: "-2px",
                  },
                }}
              >
                {unlocked ? (
                  <Box
                    sx={{
                      width: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        color:
                          item.key === "earnings" ||
                          item.key === "benefits"
                            ? "#f4c542"
                            : "#ffffff",
                        "& svg": {
                          fontSize: 22,
                        },
                      }}
                    >
                      {item.icon}
                    </Box>

                    <Typography
                      sx={{
                        mt: 0.45,
                        color:
                          item.key === "benefits" &&
                          planCode === "ARTIST_PRO"
                            ? "#f4c542"
                            : "#ffffff",
                        fontSize: item.key === "insights" ? 13 : 19,
                        fontWeight: 950,
                        lineHeight: 1.1,
                      }}
                    >
                      {getStatValue(item.key)}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.65,
                        color: "#8B949E",
                        fontSize: 10.5,
                        fontWeight: 800,
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-flex",
                        mb: 0.6,
                      }}
                    >
                      <Box
                        sx={{
                          color: "#5f6670",
                          "& svg": {
                            fontSize: 23,
                          },
                        }}
                      >
                        {item.icon}
                      </Box>

                      <LockRoundedIcon
                        sx={{
                          position: "absolute",
                          right: -8,
                          bottom: -3,
                          color: "#8B949E",
                          fontSize: 13,
                        }}
                      />
                    </Box>

                    <Typography
                      sx={{
                        color: "#747b84",
                        fontSize: 10.5,
                        fontWeight: 900,
                      }}
                    >
                      {item.label}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "#FF5500",
                        fontSize: 9,
                        fontWeight: 900,
                      }}
                    >
                      Upgrade
                    </Typography>
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default ArtistStudioStats;