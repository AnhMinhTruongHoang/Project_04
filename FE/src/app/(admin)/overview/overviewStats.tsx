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

type OverviewStatItem = {
  label: string;
  value: number;
  growth: string;
  helper: string;
  icon: React.ReactNode;
  gradient: string;
};

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;

  return value.toString();
};

const stats: OverviewStatItem[] = [
  {
    label: "Total Users",
    value: 1245,
    growth: "+12.5%",
    helper: "from last month",
    icon: <PeopleAltRoundedIcon />,
    gradient: "linear-gradient(135deg, #00B894, #00CEC9)",
  },
  {
    label: "Total Tracks",
    value: 368,
    growth: "+8.2%",
    helper: "new uploads",
    icon: <AudiotrackRoundedIcon />,
    gradient: "linear-gradient(135deg, #FF4D00, #FF9F1A)",
  },
  {
    label: "Total Plays",
    value: 24890,
    growth: "+18.7%",
    helper: "listening growth",
    icon: <PlayCircleRoundedIcon />,
    gradient: "linear-gradient(135deg, #0984E3, #74B9FF)",
  },
  {
    label: "Total Likes",
    value: 8420,
    growth: "+9.4%",
    helper: "user reactions",
    icon: <FavoriteRoundedIcon />,
    gradient: "linear-gradient(135deg, #E84393, #FD79A8)",
  },
  {
    label: "Comments",
    value: 2130,
    growth: "+6.8%",
    helper: "community activity",
    icon: <ForumRoundedIcon />,
    gradient: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
  },
  {
    label: "Playlists",
    value: 742,
    growth: "+4.1%",
    helper: "created by users",
    icon: <QueueMusicRoundedIcon />,
    gradient: "linear-gradient(135deg, #005B5F, #58D68D)",
  },
];

const OverviewStats = () => {
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
            background: "#ffffff",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow: "0 22px 60px rgba(15,23,42,0.06)",
            p: 2.4,
            minHeight: 168,
            transition: "0.25s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 28px 80px rgba(15,23,42,0.1)",
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
              opacity: 0.11,
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
              boxShadow: "0 14px 28px rgba(15,23,42,0.16)",
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
              color: "#64748B",
              fontSize: 13,
              fontWeight: 800,
              mb: 0.8,
            }}
          >
            {item.label}
          </Typography>

          <Typography
            sx={{
              color: "#07111f",
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
                background: "rgba(0,184,148,0.1)",
                color: "#00856F",
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
                color: "#94A3B8",
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
