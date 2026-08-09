import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AppleIcon from "@mui/icons-material/Apple";
import ShopRoundedIcon from "@mui/icons-material/ShopRounded";

const SidebarFooter = () => {
  return (
    <Box
      sx={{
        pb: 2,
        width: "100%",
        textAlign: "center",
      }}
    >
      {/* GO MOBILE TITLE */}
      <Typography
        sx={{
          width: "100%",

          fontSize: 12,
          fontWeight: 900,

          color: "#d8d8d8",

          textTransform: "uppercase",
          textAlign: "center",

          mb: 1.2,
        }}
      >
        Go Mobile
      </Typography>

      {/* MOBILE APP BUTTONS */}
      <Box
        sx={{
          display: "flex",

          alignItems: "center",
          justifyContent: "center",

          flexWrap: "wrap",

          gap: 1,

          mb: 2,
        }}
      >
        {/* APP STORE */}
        <Box
          sx={{
            height: 36,
            px: 1,

            borderRadius: "5px",

            border: "1px solid rgba(255,255,255,0.35)",

            backgroundColor: "#000000",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            gap: 0.6,

            cursor: "pointer",
          }}
        >
          <AppleIcon
            sx={{
              fontSize: 21,
              color: "#ffffff",
            }}
          />

          <Box
            sx={{
              textAlign: "left",
            }}
          >
            <Typography
              sx={{
                fontSize: 7,
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              Download on the
            </Typography>

            <Typography
              sx={{
                fontSize: 13,
                color: "#ffffff",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              App Store
            </Typography>
          </Box>
        </Box>

        {/* GOOGLE PLAY */}
        <Box
          sx={{
            height: 36,
            px: 1,

            borderRadius: "5px",

            border: "1px solid rgba(255,255,255,0.35)",

            backgroundColor: "#000000",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            gap: 0.6,

            cursor: "pointer",
          }}
        >
          <ShopRoundedIcon
            sx={{
              fontSize: 20,
              color: "#29d35d",
            }}
          />

          <Box
            sx={{
              textAlign: "left",
            }}
          >
            <Typography
              sx={{
                fontSize: 7,
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              GET IT ON
            </Typography>

            <Typography
              sx={{
                fontSize: 13,
                color: "#ffffff",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              Google Play
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* FOOTER LINKS */}
      <Typography
        sx={{
          maxWidth: 300,

          mx: "auto",

          fontSize: 12,

          color: "#9a9a9a",

          lineHeight: 1.6,

          textAlign: "center",
        }}
      >
        Legal · Privacy · Cookie Policy · Cookie Manager · Imprint · Artist
        Resources · Newsroom · Topics · Charts · Transparency Reports
      </Typography>

      {/* LANGUAGE */}
      <Typography
        sx={{
          mt: 2,

          width: "100%",

          fontSize: 12,

          color: "#d8d8d8",

          textAlign: "center",
        }}
      >
        Language:{" "}
        <Box
          component="span"
          sx={{
            color: "#4da3ff",
            cursor: "pointer",
          }}
        >
          English (US)
        </Box>
      </Typography>
    </Box>
  );
};

export default SidebarFooter;
