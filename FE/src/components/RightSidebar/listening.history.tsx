import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";

const ListeningHistory = () => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
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
          Listening History
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
          View all
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1.2 }}>
        <Box
          component="img"
          src="/images/user/zexsing.jpg"
          alt="History track"
          sx={{
            width: 44,
            height: 44,
            objectFit: "cover",
            borderRadius: "2px",
            bgcolor: "#111",
          }}
        />

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            sx={{
              fontSize: 13,
              color: "#ffffff",
              fontWeight: 900,
              lineHeight: 1.3,
            }}
          >
            NCS
          </Typography>

          <Typography
            noWrap
            sx={{
              fontSize: 13,
              color: "#ffffff",
              fontWeight: 900,
              lineHeight: 1.3,
              mt: 0.2,
            }}
          >
            ZEXSING, MXRCURY, Pharmagut - Overdrive
          </Typography>

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.9, mt: 0.7 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
              <PlayArrowRoundedIcon sx={{ fontSize: 14, color: "#9a9a9a" }} />
              <Typography sx={{ fontSize: 11, color: "#9a9a9a" }}>
                11.4K
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
              <FavoriteRoundedIcon sx={{ fontSize: 13, color: "#9a9a9a" }} />
              <Typography sx={{ fontSize: 11, color: "#9a9a9a" }}>
                327
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
              <RepeatRoundedIcon sx={{ fontSize: 13, color: "#9a9a9a" }} />
              <Typography sx={{ fontSize: 11, color: "#9a9a9a" }}>
                21
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
              <ChatBubbleRoundedIcon sx={{ fontSize: 12, color: "#9a9a9a" }} />
              <Typography sx={{ fontSize: 11, color: "#9a9a9a" }}>
                11
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ListeningHistory;
