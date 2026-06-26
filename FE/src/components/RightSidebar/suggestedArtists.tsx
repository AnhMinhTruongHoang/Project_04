"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import { getArtistLeaderboard } from "@/utils/api";

type ArtistItem = {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  avatar?: string;
  followers?: number | null;
  following?: number | null;
  tracks?: number | null;
  trackCount?: number | null;
  totalTracks?: number | null;
};

const FALLBACK_ARTISTS: ArtistItem[] = [
  {
    name: "NCS",
    avatar: "/images/user/NCS.jpg",
    followers: 0,
    tracks: 0,
  },
  {
    name: "Unknown Brain",
    avatar: "/images/logo/Sc.png",
    followers: 0,
    tracks: 0,
  },
  {
    name: "Dirty Palm",
    avatar: "/images/logo/Sc.png",
    followers: 0,
    tracks: 0,
  },
];

const formatNumber = (value?: number | null) => {
  const num = value ?? 0;

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1)}K`;
  }

  return `${num}`;
};

const getArtistId = (artist: ArtistItem) => {
  return artist._id || artist.id || artist.email || artist.name;
};

const getArtistAvatar = (artist: ArtistItem) => {
  return artist.avatarUrl || artist.avatar || "/images/user/default.png";
};

const getTrackCount = (artist: ArtistItem) => {
  return artist.totalTracks || artist.trackCount || artist.tracks || 0;
};

const shuffleList = <T,>(items: T[]) => {
  return [...items].sort(() => Math.random() - 0.5);
};

const SuggestedArtists = () => {
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [rawArtists, setRawArtists] = useState<ArtistItem[]>([]);
  const [isAllZeroFollowers, setIsAllZeroFollowers] = useState(false);

  const loadArtists = async () => {
    try {
      const data: ArtistItem[] = await getArtistLeaderboard(10);

      const list: ArtistItem[] = data.length > 0 ? data : FALLBACK_ARTISTS;

      const allZero = list.every(
        (artist: ArtistItem) => (artist.followers || 0) === 0
      );

      setRawArtists(list);
      setIsAllZeroFollowers(allZero);

      if (allZero) {
        setArtists(shuffleList(list).slice(0, 3));
      } else {
        setArtists(list.slice(0, 3));
      }
    } catch (error) {
      console.error("Fetch suggested artists failed:", error);

      setRawArtists(FALLBACK_ARTISTS);
      setIsAllZeroFollowers(true);
      setArtists(shuffleList(FALLBACK_ARTISTS).slice(0, 3));
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const handleRefreshList = () => {
    if (isAllZeroFollowers) {
      setArtists(shuffleList(rawArtists).slice(0, 3));
      return;
    }

    loadArtists();
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.6,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 900,
            color: "#d8d8d8",
            textTransform: "uppercase",
          }}
        >
          Artists You Should Follow
        </Typography>

        <Typography
          onClick={handleRefreshList}
          sx={{
            fontSize: 12,
            color: "#9a9a9a",
            cursor: "pointer",
            userSelect: "none",
            "&:hover": {
              color: "#ffffff",
            },
          }}
        >
          Refresh list
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.7 }}>
        {artists.map((artist) => (
          <Box
            key={getArtistId(artist)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <Avatar
              src={getArtistAvatar(artist)}
              alt={artist.name}
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#111",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Typography
                  noWrap
                  sx={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: "#ffffff",
                  }}
                >
                  {artist.name}
                </Typography>

                <VerifiedRoundedIcon sx={{ fontSize: 16, color: "#4da3ff" }} />
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                  <PersonRoundedIcon sx={{ fontSize: 14, color: "#9a9a9a" }} />
                  <Typography sx={{ fontSize: 12, color: "#9a9a9a" }}>
                    {formatNumber(artist.followers)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                  <GraphicEqRoundedIcon
                    sx={{ fontSize: 14, color: "#9a9a9a" }}
                  />
                  <Typography sx={{ fontSize: 12, color: "#9a9a9a" }}>
                    {formatNumber(getTrackCount(artist))}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Button
              size="small"
              sx={{
                minWidth: "auto",
                px: 0,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 900,
                textTransform: "none",
                "&:hover": {
                  color: "#ff5500",
                  backgroundColor: "transparent",
                },
              }}
            >
              Follow
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SuggestedArtists;
