import Link from "next/link";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

function NotFoundIllustration() {
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
        boxShadow:
          "0 24px 80px rgba(0,0,0,0.45), 0 0 35px rgba(0,255,224,0.08)",
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
            width: 110,
            height: 110,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,224,0.15), transparent 70%)",
          }}
        />

        <SearchOffRoundedIcon
          sx={{
            fontSize: 72,
            color: "#00FFE0",
            opacity: 0.75,
            filter: "drop-shadow(0 0 18px rgba(0,255,224,0.32))",
          }}
        />
      </Box>
    </Box>
  );
}

export default function NotFound() {
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
        <NotFoundIllustration />

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
          404 Error
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
          Page not found
        </Typography>

        <Typography
          sx={{
            maxWidth: 520,
            color: "#B8B8B8",
            fontSize: { xs: 15, sm: 16 },
            lineHeight: 1.7,
          }}
        >
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị thay đổi đường dẫn.
          Hãy quay về trang chủ để tiếp tục nghe nhạc.
        </Typography>

        <Button
          component={Link}
          href="/"
          variant="contained"
          startIcon={<HomeRoundedIcon />}
          sx={{
            mt: 2,
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
          Return Home
        </Button>
      </Stack>
    </Box>
  );
}