"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

const UploadQuotaBar = () => {
  return (
    <Box
      sx={{
        borderRadius: "2px",
        background: "#202020",
        border: "1px solid rgba(255,255,255,0.04)",
        px: { xs: 2, md: 2.5 },
        py: 1.4,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, flex: 1 }}>
        <CloudUploadRoundedIcon sx={{ color: "#ffffff", fontSize: 18 }} />

        <Typography
          sx={{
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          0% of Uploads Used
        </Typography>

        <Box
          sx={{
            width: { xs: 120, sm: 180 },
            height: 4,
            background: "rgba(255,255,255,0.18)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "0%",
              height: "100%",
              background: "#FF5500",
            }}
          />
        </Box>
      </Box>

      <Button
        variant="outlined"
        sx={{
          borderRadius: "999px",
          px: { xs: 2, sm: 4 },
          color: "#ffffff",
          borderColor: "rgba(255,255,255,0.24)",
          textTransform: "none",
          fontSize: 12,
          fontWeight: 950,
          display: { xs: "none", sm: "inline-flex" },
          "&:hover": {
            borderColor: "#FF5500",
            background: "rgba(255,85,0,0.08)",
          },
        }}
      >
        Get unlimited uploads
      </Button>
    </Box>
  );
};

export default UploadQuotaBar;
