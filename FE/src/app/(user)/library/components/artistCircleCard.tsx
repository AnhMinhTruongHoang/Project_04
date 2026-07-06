"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getAvatarUrl, getUserId } from "@/utils/api";

type Props = {
  artist: any;
};

const getArtistName = (artist?: any) => {
  return (
    artist?.name ||
    artist?.fullName ||
    artist?.username ||
    artist?.email ||
    "Unknown artist"
  );
};

const getArtistFollowers = (artist?: any) => {
  const followers = Number(artist?.followers || 0);

  if (followers >= 1000000)
    return `${(followers / 1000000).toFixed(1)}M followers`;
  if (followers >= 1000) return `${(followers / 1000).toFixed(1)}K followers`;

  return `${followers} followers`;
};

const ArtistCircleCard = ({ artist }: Props) => {
  const artistId = getUserId(artist);
  const name = getArtistName(artist);
  const avatar = getAvatarUrl(
    artist?.avatarUrl || artist?.avatar || artist?.image
  );

  return (
    <Box
      data-artist-id={artistId}
      sx={{
        minWidth: 0,
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 108,
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(255,85,0,0.2), rgba(0,255,224,0.14))",
          border: "1px solid rgba(255,255,255,0.08)",
          mx: "auto",
          mb: 1.2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {avatar ? (
          <Box
            component="img"
            src={avatar}
            alt={name}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 950,
              letterSpacing: "-0.04em",
            }}
          >
            {name.charAt(0).toUpperCase()}
          </Typography>
        )}
      </Box>

      <Typography
        noWrap
        sx={{
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 950,
          lineHeight: 1.25,
        }}
      >
        {name}
      </Typography>

      <Typography
        noWrap
        sx={{
          color: "#8B949E",
          fontSize: 11,
          fontWeight: 750,
        }}
      >
        {getArtistFollowers(artist)}
      </Typography>
    </Box>
  );
};

export default ArtistCircleCard;
