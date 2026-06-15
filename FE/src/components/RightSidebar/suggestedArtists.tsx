import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";

const artists = [
  {
    name: "NCS",
    avatar: "/images/user/NCS.jpg",
    followers: "1.54M",
    tracks: "1,923",
  },
  {
    name: "Tobu",
    avatar: "/images/user/tobu.jpg",
    followers: "309K",
    tracks: "144",
  },
  {
    name: "Jim Yosef",
    avatar: "/images/user/jimY.png",
    followers: "66.8K",
    tracks: "62",
  },
];

const SuggestedArtists = () => {
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
          sx={{
            fontSize: 12,
            color: "#9a9a9a",
            cursor: "pointer",
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
            key={artist.name}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <Avatar
              src={artist.avatar}
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
                    {artist.followers}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                  <GraphicEqRoundedIcon
                    sx={{ fontSize: 14, color: "#9a9a9a" }}
                  />
                  <Typography sx={{ fontSize: 12, color: "#9a9a9a" }}>
                    {artist.tracks}
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
