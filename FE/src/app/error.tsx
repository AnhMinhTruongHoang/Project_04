"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import Link from "next/link";

function ErrorIllustration() {
  return (
    <Box
      sx={{
        mx: "auto",
        mb: 4,
        width: { xs: 210, sm: 260 },
        height: { xs: 180, sm: 210 },
        display: "flex",
        flexDirection: "column",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(24,26,27,0.96), rgba(12,14,15,0.98))",
        boxShadow: "0 24px 80px rgba(0,0,0,0.45), 0 0 35px rgba(255,77,0,0.12)",
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          gap: "7px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          bgcolor: "rgba(255,255,255,0.03)",
        }}
      >
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            bgcolor: "#ff4d4f",
            opacity: 0.9,
          }}
        />
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            bgcolor: "#ffb020",
            opacity: 0.9,
          }}
        />
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            bgcolor: "#00c781",
            opacity: 0.9,
          }}
        />
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,77,0,0.18), transparent 70%)",
          }}
        />

        <ErrorOutlineRoundedIcon
          sx={{
            fontSize: 76,
            color: "#FF7A00",
            opacity: 0.9,
            filter: "drop-shadow(0 0 18px rgba(255,77,0,0.35))",
          }}
        />
      </Box>
    </Box>
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: 2,
        py: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        background:
          "radial-gradient(circle at 50% 15%, rgba(255,77,0,0.18), transparent 34%), radial-gradient(circle at 80% 75%, rgba(0,255,224,0.13), transparent 30%), linear-gradient(135deg, #050607 0%, #101214 45%, #1E2021 100%)",
        color: "#fff",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.25))",
        },
      }}
    >
      <Stack
        spacing={2}
        alignItems="center"
        textAlign="center"
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 620,
        }}
      >
        <ErrorIllustration />

        <Typography
          component="p"
          sx={{
            color: "#FF7A00",
            fontWeight: 900,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: 13,
          }}
        >
          Application Error
        </Typography>

        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 36, sm: 48 },
            lineHeight: 1.1,
            fontWeight: 900,
            color: "#FFFFFF",
          }}
        >
          Something went wrong
        </Typography>

        <Typography
          sx={{
            maxWidth: 540,
            color: "#B8B8B8",
            fontSize: { xs: 15, sm: 16 },
            lineHeight: 1.7,
          }}
        >
          The page could not be loaded properly. Please try again or return to
          the homepage to continue listening.
        </Typography>

        {error?.digest && (
          <Typography
            sx={{
              color: "#8B949E",
              fontSize: 12,
              mt: 0.5,
            }}
          >
            Error ID: {error.digest}
          </Typography>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mt: 2 }}
        >
          <Button
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => reset()}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: "999px",
              fontWeight: 800,
              textTransform: "none",
              color: "#fff",
              background: "linear-gradient(135deg, #FF4D00, #FF7A00)",
              boxShadow: "0 14px 32px rgba(255,77,0,0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #FF6A00, #FF9100)",
                boxShadow: "0 18px 38px rgba(255,77,0,0.38)",
              },
            }}
          >
            Try again
          </Button>

          <Button
            component={Link}
            href="/"
            variant="outlined"
            startIcon={<HomeRoundedIcon />}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: "999px",
              fontWeight: 800,
              textTransform: "none",
              color: "#00FFE0",
              borderColor: "rgba(0,255,224,0.45)",
              background: "rgba(0,255,224,0.06)",
              "&:hover": {
                borderColor: "#00FFE0",
                background: "rgba(0,255,224,0.12)",
              },
            }}
          >
            Return Home
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
