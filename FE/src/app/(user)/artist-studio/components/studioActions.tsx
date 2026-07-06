"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

const actions = [
  {
    label: "Upload or drop tracks",
    icon: <AddRoundedIcon />,
  },
  {
    label: "Distribute tracks",
    icon: <PublicRoundedIcon />,
  },
  {
    label: "Monetize tracks",
    icon: <AttachMoneyRoundedIcon />,
  },
  {
    label: "Master track audio",
    icon: <TuneRoundedIcon />,
  },
];

const StudioActions = () => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        flexWrap: "wrap",
      }}
    >
      {actions.map((item) => (
        <Button
          key={item.label}
          startIcon={item.icon}
          sx={{
            minHeight: 48,
            px: 2.2,
            borderRadius: "6px",
            color: "#D1D5DB",
            background: "#202020",
            border: "1px solid rgba(255,255,255,0.04)",
            textTransform: "none",
            fontWeight: 950,
            fontSize: 13,
            "& .MuiButton-startIcon svg": {
              fontSize: 20,
            },
            "&:hover": {
              color: "#ffffff",
              background: "#282828",
              borderColor: "rgba(255,85,0,0.35)",
            },
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
};

export default StudioActions;
