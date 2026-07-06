"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EqualizerRoundedIcon from "@mui/icons-material/EqualizerRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import { studioStats } from "../../../../utils/actions/artistStudioData";

const iconMap: Record<string, React.ReactNode> = {
  plays: <PlayCircleFilledRoundedIcon />,
  reposts: <RepeatRoundedIcon />,
  downloads: <FileDownloadRoundedIcon />,
  likes: <FavoriteRoundedIcon />,
  comments: <CommentRoundedIcon />,
  insights: <EqualizerRoundedIcon />,
  earnings: <PaidRoundedIcon />,
  fans: <GroupsRoundedIcon />,
  benefits: <WorkspacePremiumRoundedIcon />,
};

const ArtistStudioStats = () => {
  return (
    <Box
      sx={{
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(18,20,22,0.98), rgba(11,13,14,0.98))",
        px: { xs: 2.5, md: 3 },
        py: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Typography
          sx={{
            color: "#ffffff",
            fontSize: { xs: 24, md: 28 },
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
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(5, 1fr)",
            lg: "repeat(9, 1fr)",
          },
          gap: { xs: 2, md: 1 },
        }}
      >
        {studioStats.map((item, index) => (
          <Box
            key={item.key}
            sx={{
              minHeight: 64,
              px: { xs: 0, md: 1.6 },
              borderRight: {
                xs: "none",
                lg:
                  index < studioStats.length - 1
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "none",
              },
              display: "flex",
              alignItems: "center",
              justifyContent: {
                xs: "flex-start",
                lg: item.value ? "flex-start" : "center",
              },
            }}
          >
            {item.value ? (
              <Box>
                <Typography
                  sx={{
                    color: "#ffffff",
                    fontSize: 22,
                    fontWeight: 950,
                    lineHeight: 1,
                    mb: 1,
                  }}
                >
                  {item.value}
                </Typography>

                <Typography
                  sx={{
                    color: "#8B949E",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  color: "#ffffff",
                  "& svg": {
                    fontSize: 27,
                    mb: 1,
                  },
                }}
              >
                {iconMap[item.key]}

                <Typography
                  sx={{
                    color: "#ffffff",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ArtistStudioStats;
