import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import FlareRoundedIcon from "@mui/icons-material/FlareRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InsertCommentRoundedIcon from "@mui/icons-material/InsertCommentRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";

const tools = [
  {
    title: "Amplify",
    icon: <BoltRoundedIcon />,
  },
  {
    title: "Replace",
    icon: <SwapHorizRoundedIcon />,
  },
  {
    title: "Distribute",
    icon: <PublicRoundedIcon />,
  },
  {
    title: "Master",
    icon: <EmojiEventsRoundedIcon />,
  },
  {
    title: "Monetize",
    icon: <MonetizationOnRoundedIcon />,
  },
  {
    title: "Spotlight",
    icon: <FlareRoundedIcon />,
  },
  {
    title: "Top fans",
    icon: <GroupsRoundedIcon />,
  },
  {
    title: "Comments",
    icon: <InsertCommentRoundedIcon />,
  },
];

const ArtistTools = () => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 900,
          color: "#d8d8d8",
          mb: 1.2,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        Artist Tools
      </Typography>

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
          },

          gap: {
            xs: 1,
            sm: 0.8,
          },
        }}
      >
        {tools.map((item) => (
          <Box
            key={item.title}
            sx={{
              position: "relative",
              height: {
                xs: 82,
                sm: 76,
              },
              borderRadius: "8px",
              backgroundColor: "#111315",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.7,
              cursor: "pointer",
              transition: "0.18s ease",
              "&:hover": {
                backgroundColor: "#1f2224",
                borderColor: "rgba(255,85,0,0.45)",
              },
              "& .MuiSvgIcon-root": {
                fontSize: 25,
                color: "#ffffff",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 7,
                right: 7,
                width: 15,
                height: 15,
                borderRadius: "50%",
                backgroundColor: "#24135c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AddCircleRoundedIcon
                sx={{
                  fontSize: "14px !important",
                  color: "#8b6cff !important",
                }}
              />
            </Box>

            {item.icon}

            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 800,
                color: "#f1f1f1",
                textAlign: "center",
              }}
            >
              {item.title}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          mt: 1.4,
          height: 42,
          px: 1.5,
          borderRadius: "2px",
          backgroundColor: "#15084c",
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
        }}
      >
        <AddCircleRoundedIcon sx={{ color: "#8b6cff", fontSize: 18 }} />

        <Typography
          sx={{
            fontSize: 12,
            color: "#ffffff",
            fontWeight: 800,
          }}
        >
          Unlock Artist tools from ₫40,000/month.
        </Typography>
      </Box>
    </Box>
  );
};

export default ArtistTools;
