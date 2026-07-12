"use client";

import Link from "next/link";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

type Props = {
  upgradeHref?: string;
  learnMoreHref?: string;
};

const ProfileSupportTab = ({
  upgradeHref = "/upgrade",
  learnMoreHref = "/artist-studio",
}: Props) => {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: {
          xs: 460,
          md: 395,
        },
        overflow: "hidden",
        backgroundColor: "#0d0f0f",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.2)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 72% 50%, rgba(255,85,0,0.06), transparent 30%), linear-gradient(90deg, rgba(13,15,15,1) 0%, rgba(13,15,15,0.98) 52%, rgba(13,15,15,0.88) 100%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          minHeight: "inherit",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
          },
          alignItems: "center",
          gap: {
            xs: 2,
            md: 4,
          },
          px: {
            xs: 3,
            sm: 4,
            md: 5,
          },
          py: {
            xs: 4,
            md: 3,
          },
        }}
      >
        <Box
          sx={{
            maxWidth: 520,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              px: 0.9,
              py: 0.35,
              mb: 1.4,
              borderRadius: "4px",
              color: "#ffffff",
              backgroundColor: "#202324",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <WorkspacePremiumRoundedIcon
              sx={{
                fontSize: 16,
                color: "#d9bd5c",
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 11,
                fontWeight: 900,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              Artist Pro
            </Typography>
          </Box>

          <Typography
            component="h2"
            sx={{
              m: 0,
              color: "#ffffff",
              fontSize: {
                xs: 25,
                sm: 29,
                md: 31,
              },
              fontWeight: 950,
              lineHeight: 1.15,
              letterSpacing: "-0.035em",
            }}
          >
            Your music. On vinyl. On demand.
          </Typography>

          <Typography
            sx={{
              mt: 2,
              maxWidth: 500,
              color: "#ffffff",
              fontSize: {
                xs: 14,
                md: 15,
              },
              fontWeight: 650,
              lineHeight: 1.55,
            }}
          >
            Release your albums on vinyl, on demand, with no upfront cost. You
            and your fans can purchase just one record or a thousand — either
            way, you get paid for every sale.
          </Typography>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
            sx={{
              mt: 3.4,
              alignItems: {
                xs: "stretch",
                sm: "center",
              },
            }}
          >
            <Button
              component={Link}
              href={upgradeHref}
              sx={{
                minHeight: 44,
                px: 2.5,
                borderRadius: "999px",
                color: "#ffffff",
                backgroundColor: "#202324",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 900,
                boxShadow: "none",

                "&:hover": {
                  backgroundColor: "#2b2e30",
                  boxShadow: "none",
                },
              }}
            >
              Get Artist Pro
            </Button>

            <Button
              component={Link}
              href={learnMoreHref}
              sx={{
                minHeight: 44,
                px: 2.5,
                borderRadius: "999px",
                color: "#ffffff",
                backgroundColor: "#202324",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 900,
                boxShadow: "none",

                "&:hover": {
                  backgroundColor: "#2b2e30",
                  boxShadow: "none",
                },
              }}
            >
              Learn More
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            position: "relative",
            minHeight: {
              xs: 220,
              md: 300,
            },
            display: "flex",
            alignItems: "center",
            justifyContent: {
              xs: "center",
              md: "flex-end",
            },
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src="/images/logo/getAristPro.png"
            alt="Artist Pro vinyl on demand"
            onError={(event: any) => {
              event.currentTarget.style.display = "none";
            }}
            sx={{
              display: "block",
              width: {
                xs: "100%",
                sm: "82%",
                md: "100%",
              },
              maxWidth: 470,
              height: "auto",
              objectFit: "contain",
              objectPosition: "center",
              filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.45))",
              transform: {
                xs: "none",
                md: "translateX(10px)",
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileSupportTab;
