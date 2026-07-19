"use client";

import { ReactNode } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

/* ========================================
   TYPES
======================================== */

export type OverviewStatsData = {
  totalUsers: number;
  totalTracks: number;
  totalPlays: number;
  totalLikes: number;
  totalComments: number;
  totalPlaylists: number;
};

type OverviewStatItem = {
  label: string;
  value: number;
  growth: string;
  helper: string;
  icon: ReactNode;
  gradient: string;
};

type Props = {
  data?: Partial<OverviewStatsData>;
};

/* ========================================
   HELPERS
======================================== */

const formatNumber = (value?: number) => {
  const number = Number(value || 0);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return number.toString();
};

/* ========================================
   OVERVIEW STATS
======================================== */

const OverviewStats = ({ data }: Props) => {
  /* ========================================
     STATS DATA
  ======================================== */

  const stats: OverviewStatItem[] = [
    {
      label: "Total Users",

      value: data?.totalUsers || 0,

      growth: "+12.5%",

      helper: "registered users",

      icon: <PeopleAltRoundedIcon />,

      gradient: "linear-gradient(135deg, #00B894, #00CEC9)",
    },

    {
      label: "Total Tracks",

      value: data?.totalTracks || 0,

      growth: "+8.2%",

      helper: "uploaded tracks",

      icon: <AudiotrackRoundedIcon />,

      gradient: "linear-gradient(135deg, #FF4D00, #FF9F1A)",
    },

    {
      label: "Total Plays",

      value: data?.totalPlays || 0,

      growth: "+18.7%",

      helper: "listening growth",

      icon: <PlayCircleRoundedIcon />,

      gradient: "linear-gradient(135deg, #0984E3, #74B9FF)",
    },

    {
      label: "Total Likes",

      value: data?.totalLikes || 0,

      growth: "+9.4%",

      helper: "user reactions",

      icon: <FavoriteRoundedIcon />,

      gradient: "linear-gradient(135deg, #E84393, #FD79A8)",
    },

    {
      label: "Comments",

      value: data?.totalComments || 0,

      growth: "+6.8%",

      helper: "community activity",

      icon: <ForumRoundedIcon />,

      gradient: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
    },

    {
      label: "Playlists",

      value: data?.totalPlaylists || 0,

      growth: "+4.1%",

      helper: "created by users",

      icon: <QueueMusicRoundedIcon />,

      gradient: "linear-gradient(135deg, #005B5F, #58D68D)",
    },
  ];

  /* ========================================
     VIEW
  ======================================== */

  return (
    <Box
      sx={{
        /* ========================================
           STATS GRID
        ======================================== */

        display: "grid",

        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",

          sm: "repeat(2, minmax(0, 1fr))",

          md: "repeat(3, minmax(0, 1fr))",

          xl: "repeat(6, minmax(0, 1fr))",
        },

        gap: {
          xs: 1.2,
          sm: 1.8,
          md: 2.2,
          xl: 2.5,
        },

        width: "100%",

        minWidth: 0,
      }}
    >
      {stats.map((item: OverviewStatItem) => (
        <Box
          key={item.label}
          sx={{
            /* ========================================
                 STAT CARD
              ======================================== */

            position: "relative",

            minWidth: 0,

            overflow: "hidden",

            borderRadius: {
              xs: "14px",
              sm: "18px",
              md: "22px",
            },

            background:
              "linear-gradient(180deg, rgba(24,26,27,0.98), rgba(12,14,15,0.98))",

            border: "1px solid rgba(255,255,255,0.08)",

            boxShadow: {
              xs: "0 10px 28px rgba(0,0,0,0.22)",

              md: "0 22px 60px rgba(0,0,0,0.25)",
            },

            p: {
              xs: 1.35,
              sm: 1.8,
              md: 2.4,
            },

            minHeight: {
              xs: 132,
              sm: 150,
              md: 168,
            },

            display: "flex",

            flexDirection: "column",

            justifyContent: "space-between",

            transition: "0.25s ease",

            "&:hover": {
              transform: {
                xs: "none",

                md: "translateY(-4px)",
              },

              borderColor: "rgba(0,255,224,0.22)",

              boxShadow: {
                xs: "0 10px 28px rgba(0,0,0,0.22)",

                md: "0 28px 80px rgba(0,0,0,0.38)",
              },
            },

            /* DECORATIVE CIRCLE */
            "&::before": {
              content: '""',

              position: "absolute",

              width: {
                xs: 80,
                sm: 100,
                md: 130,
              },

              height: {
                xs: 80,
                sm: 100,
                md: 130,
              },

              borderRadius: "50%",

              right: {
                xs: -30,
                md: -45,
              },

              top: {
                xs: -34,
                md: -50,
              },

              background: item.gradient,

              opacity: {
                xs: 0.13,
                md: 0.16,
              },

              pointerEvents: "none",
            },
          }}
        >
          {/* ========================================
                CARD CONTENT
            ======================================== */}

          <Box>
            {/* ICON */}
            <Box
              sx={{
                position: "relative",

                zIndex: 1,

                width: {
                  xs: 36,
                  sm: 42,
                  md: 48,
                },

                height: {
                  xs: 36,
                  sm: 42,
                  md: 48,
                },

                borderRadius: {
                  xs: "11px",
                  sm: "13px",
                  md: "16px",
                },

                background: item.gradient,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                color: "#ffffff",

                boxShadow: "0 10px 24px rgba(0,0,0,0.25)",

                mb: {
                  xs: 1,
                  sm: 1.4,
                  md: 2,
                },

                "& svg": {
                  fontSize: {
                    xs: 20,
                    sm: 23,
                    md: 26,
                  },
                },
              }}
            >
              {item.icon}
            </Box>

            {/* LABEL */}
            <Typography
              sx={{
                position: "relative",

                zIndex: 1,

                color: "#AEB7C2",

                fontSize: {
                  xs: 9.5,
                  sm: 11.5,
                  md: 13,
                },

                fontWeight: 800,

                lineHeight: 1.25,

                mb: {
                  xs: 0.4,
                  md: 0.8,
                },

                whiteSpace: "nowrap",

                overflow: "hidden",

                textOverflow: "ellipsis",
              }}
            >
              {item.label}
            </Typography>

            {/* VALUE */}
            <Typography
              sx={{
                position: "relative",

                zIndex: 1,

                color: "#ffffff",

                fontSize: {
                  xs: 22,
                  sm: 25,
                  md: 28,
                },

                fontWeight: 950,

                lineHeight: 1,

                mb: {
                  xs: 0.9,
                  md: 1.4,
                },
              }}
            >
              {formatNumber(item.value)}
            </Typography>
          </Box>

          {/* ========================================
                GROWTH / HELPER
            ======================================== */}

          <Box
            sx={{
              position: "relative",

              zIndex: 1,

              display: "flex",

              alignItems: "center",

              gap: {
                xs: 0.4,
                sm: 0.6,
                md: 0.8,
              },

              minWidth: 0,
            }}
          >
            {/* GROWTH BADGE */}
            <Box
              sx={{
                display: "inline-flex",

                alignItems: "center",

                justifyContent: "center",

                gap: 0.2,

                flexShrink: 0,

                px: {
                  xs: 0.5,
                  sm: 0.65,
                  md: 0.8,
                },

                py: {
                  xs: 0.25,
                  md: 0.35,
                },

                borderRadius: "999px",

                background: "rgba(0,255,224,0.1)",

                color: "#00FFE0",
              }}
            >
              <TrendingUpRoundedIcon
                sx={{
                  fontSize: {
                    xs: 10,
                    sm: 12,
                    md: 15,
                  },
                }}
              />

              <Typography
                component="span"
                sx={{
                  fontSize: {
                    xs: 8,
                    sm: 9.5,
                    md: 12,
                  },

                  fontWeight: 900,

                  lineHeight: 1.2,

                  whiteSpace: "nowrap",
                }}
              >
                {item.growth}
              </Typography>
            </Box>

            {/* HELPER TEXT */}
            <Typography
              sx={{
                minWidth: 0,

                color: "#7C8794",

                fontSize: {
                  xs: 7.5,
                  sm: 9.5,
                  md: 12,
                },

                fontWeight: 700,

                lineHeight: 1.2,

                whiteSpace: "nowrap",

                overflow: "hidden",

                textOverflow: "ellipsis",
              }}
            >
              {item.helper}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default OverviewStats;
