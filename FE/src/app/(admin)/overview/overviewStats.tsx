"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import type { ReactNode } from "react";

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

const formatNumber = (value?: number) => {
  const number = Number(value || 0);

  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;

  return number.toString();
};

const OverviewStats = ({ data }: Props) => {
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

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          xl: "repeat(6, 1fr)",
        },
        gap: 2.5,
      }}
    >
      {stats.map((item) => (
        <Box
          key={item.label}
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "22px",
            background:
              "linear-gradient(180deg, rgba(24,26,27,0.98), rgba(12,14,15,0.98))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 22px 60px rgba(0,0,0,0.25)",
            p: 2.4,
            minHeight: 168,
            transition: "0.25s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              borderColor: "rgba(0,255,224,0.22)",
              boxShadow: "0 28px 80px rgba(0,0,0,0.38)",
            },
            "&::before": {
              content: '""',
              position: "absolute",
              width: 130,
              height: 130,
              borderRadius: "50%",
              right: -45,
              top: -50,
              background: item.gradient,
              opacity: 0.16,
            },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "16px",
              background: item.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 14px 28px rgba(0,0,0,0.28)",
              mb: 2,
              "& svg": {
                fontSize: 26,
              },
            }}
          >
            {item.icon}
          </Box>

          <Typography
            sx={{
              color: "#AEB7C2",
              fontSize: 13,
              fontWeight: 800,
              mb: 0.8,
            }}
          >
            {item.label}
          </Typography>

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: {
                xs: 26,
                sm: 28,
              },
              fontWeight: 950,
              lineHeight: 1,
              mb: 1.4,
            }}
          >
            {formatNumber(item.value)}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                px: 0.8,
                py: 0.35,
                borderRadius: "999px",
                background: "rgba(0,255,224,0.1)",
                color: "#00FFE0",
                display: "flex",
                alignItems: "center",
                gap: 0.3,
              }}
            >
              <TrendingUpRoundedIcon sx={{ fontSize: 15 }} />

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {item.growth}
              </Typography>
            </Box>

            <Typography
              sx={{
                color: "#7C8794",
                fontSize: 12,
                fontWeight: 700,
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
