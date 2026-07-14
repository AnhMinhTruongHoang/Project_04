"use client";

import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import LockRoundedIcon from "@mui/icons-material/LockRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import type { ISubscriptionPlan } from "@/utils/api";

import type { StudioBenefit } from "../../../../utils/actions/artistStudioData";

type Props = {
  plan: ISubscriptionPlan | null;
  loading?: boolean;
  benefits: StudioBenefit[];
};

const ArtistBenefits = ({ plan, loading = false, benefits }: Props) => {
  const router = useRouter();

  const unlocked = Boolean(plan?.hasMembershipBenefits);

  const isArtistPro = plan?.code === "ARTIST_PRO";

  const actionLabel = isArtistPro
    ? "View all benefits"
    : "Upgrade to Artist Pro";

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 300,
          borderRadius: "8px",
          background: "#202020",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{
            color: "#8B949E",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          Loading membership benefits...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",

        background: unlocked
          ? "linear-gradient(180deg, #202020, #191a1b)"
          : "linear-gradient(180deg, #1c1d1e, #151617)",

        border: unlocked
          ? "1px solid rgba(244,197,66,0.22)"
          : "1px solid rgba(255,255,255,0.06)",

        px: {
          xs: 2,
          md: 3,
        },

        py: 2.5,
      }}
    >
      <Box
        sx={{
          display: "flex",

          alignItems: {
            xs: "flex-start",
            sm: "center",
          },

          justifyContent: "space-between",

          gap: 2,

          mb: 2.5,

          flexDirection: {
            xs: "column",
            sm: "row",
          },
        }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 0.8,
            }}
          >
            <WorkspacePremiumRoundedIcon
              sx={{
                color: unlocked ? "#f4c542" : "#8B949E",
                fontSize: 24,
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 950,
              }}
            >
              Artist Pro Membership Benefits
            </Typography>

            {unlocked ? (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.4,
                  px: 1,
                  py: 0.4,
                  borderRadius: "999px",

                  color: "#f4c542",

                  background: "rgba(244,197,66,0.09)",

                  border: "1px solid rgba(244,197,66,0.25)",

                  fontSize: 9,
                  fontWeight: 950,
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{
                    fontSize: 13,
                  }}
                />
                ACTIVE
              </Box>
            ) : (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.4,
                  px: 1,
                  py: 0.4,
                  borderRadius: "999px",

                  color: "#9CA3AF",

                  background: "rgba(255,255,255,0.045)",

                  border: "1px solid rgba(255,255,255,0.09)",

                  fontSize: 9,
                  fontWeight: 950,
                }}
              >
                <LockRoundedIcon
                  sx={{
                    fontSize: 12,
                  }}
                />
                ARTIST PRO
              </Box>
            )}
          </Box>

          <Typography
            sx={{
              color: unlocked ? "#D1D5DB" : "#8B949E",

              fontSize: 13,
              fontWeight: 750,
              lineHeight: 1.6,
              maxWidth: 760,
            }}
          >
            {unlocked
              ? "Your Artist Pro plan includes premium creator tools, partner offers and membership benefits."
              : "Upgrade to Artist Pro to unlock premium creator tools and exclusive membership benefits."}
          </Typography>
        </Box>

        <Button
          onClick={() => router.push("/plans")}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            borderRadius: "999px",

            px: 2.4,
            minWidth: 190,

            color: unlocked ? "#111111" : "#ffffff",

            backgroundColor: unlocked ? "#f4c542" : "#FF5500",

            border: unlocked ? "1px solid #f4c542" : "1px solid #FF5500",

            textTransform: "none",
            fontWeight: 950,
            flexShrink: 0,

            "&:hover": {
              backgroundColor: unlocked ? "#ffd75e" : "#ff6a1a",

              borderColor: unlocked ? "#ffd75e" : "#ff6a1a",
            },
          }}
        >
          {actionLabel}
        </Button>
      </Box>

      <Box
        sx={{
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },

            gap: 2.2,

            filter: unlocked ? "none" : "grayscale(0.65)",

            opacity: unlocked ? 1 : 0.38,

            pointerEvents: unlocked ? "auto" : "none",

            userSelect: unlocked ? "auto" : "none",
          }}
        >
          {benefits.map((item) => (
            <Box key={item.id}>
              <Box
                sx={{
                  height: 150,
                  borderRadius: "4px",

                  background: item.gradient,

                  border: "1px solid rgba(255,255,255,0.08)",

                  mb: 1.8,

                  position: "relative",
                  overflow: "hidden",

                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,

                    background:
                      "linear-gradient(180deg, transparent, rgba(0,0,0,0.38))",
                  },
                }}
              />

              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 950,
                  lineHeight: 1.45,
                  mb: 1,
                }}
              >
                {item.title}
              </Typography>

              <Typography
                sx={{
                  color: "#AEB7C2",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.5,
                  mb: 1.5,
                }}
              >
                {item.description}
              </Typography>

              <Box
                sx={{
                  display: "inline-flex",

                  px: 1.4,
                  py: 0.7,

                  borderRadius: "999px",

                  background: "#087A46",
                  color: "#ffffff",

                  fontSize: 12,
                  fontWeight: 950,
                }}
              >
                {item.saveLabel}
              </Box>
            </Box>
          ))}
        </Box>

        {!unlocked && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              borderRadius: "6px",

              background:
                "linear-gradient(180deg, rgba(15,16,17,0.28), rgba(15,16,17,0.82))",

              backdropFilter: "blur(3px)",
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 410,

                px: 3,
                py: 3,

                textAlign: "center",

                borderRadius: "12px",

                background: "rgba(17,18,19,0.92)",

                border: "1px solid rgba(255,255,255,0.12)",

                boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,

                  mx: "auto",
                  mb: 1.4,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  borderRadius: "50%",

                  color: "#f4c542",

                  background: "rgba(244,197,66,0.1)",

                  border: "1px solid rgba(244,197,66,0.24)",
                }}
              >
                <LockRoundedIcon
                  sx={{
                    fontSize: 25,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: 950,
                }}
              >
                Unlock Artist Pro Benefits
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,

                  color: "#8B949E",

                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.6,
                }}
              >
                Your current {plan?.name || "Basic"} plan does not include
                premium membership benefits.
              </Typography>

              <Button
                fullWidth
                onClick={() => router.push("/plans")}
                sx={{
                  mt: 2,

                  height: 40,

                  borderRadius: "999px",

                  color: "#111111",

                  backgroundColor: "#f4c542",

                  textTransform: "none",

                  fontSize: 12,
                  fontWeight: 950,

                  "&:hover": {
                    backgroundColor: "#ffd75e",
                  },
                }}
              >
                Upgrade to Artist Pro
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ArtistBenefits;
