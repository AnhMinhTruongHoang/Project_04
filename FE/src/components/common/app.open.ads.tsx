"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useRouter } from "next/navigation";

const ADS_STORAGE_KEY = "soundcloud_app_open_ads_seen";

const AppOpenAds = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenAds = sessionStorage.getItem(ADS_STORAGE_KEY);

    if (!hasSeenAds) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(ADS_STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleGoToMagazine = () => {
    sessionStorage.setItem(ADS_STORAGE_KEY, "true");
    setOpen(false);
    router.push("/eMagazine/weeknd");
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          position: "relative",
          width: {
            xs: "92vw",
            sm: "82vw",
            md: "760px",
            lg: "860px",
          },
          maxWidth: "920px",
          maxHeight: "88vh",
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#111314",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 34px 100px rgba(0,0,0,0.78)",
          cursor: "pointer",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(6px)",
          },
        },
      }}
    >
      <IconButton
        onClick={(event) => {
          event.stopPropagation();
          handleClose();
        }}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 3,
          width: 38,
          height: 38,
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.58)",
          border: "1px solid rgba(255,255,255,0.16)",

          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.82)",
          },
        }}
      >
        <CloseRoundedIcon />
      </IconButton>

      <Box
        onClick={handleGoToMagazine}
        sx={{
          width: "100%",
          maxHeight: "88vh",
          backgroundColor: "#000000",
        }}
      >
        <Box
          component="img"
          src="/images/media/weeknd01.jpg"
          alt="Sơn Tùng eMagazine"
          sx={{
            width: "100%",
            maxHeight: "88vh",
            display: "block",
            objectFit: "contain",
          }}
        />
      </Box>
    </Dialog>
  );
};

export default AppOpenAds;
