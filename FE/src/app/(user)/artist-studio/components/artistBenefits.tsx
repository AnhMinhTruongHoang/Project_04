"use client";

import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import LockRoundedIcon from "@mui/icons-material/LockRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";
import { getBenefitImageUrl } from "@/utils/actions/getImages";

type Props = {
  plan: ISubscriptionPlan | null;
  benefits: IArtistBenefit[];
  loading?: boolean;
  error?: string;
};

const ArtistBenefits = ({
  plan,
  benefits,
  loading = false,
  error = "",
}: Props) => {
  const router = useRouter();

  const unlocked = Boolean(plan?.hasMembershipBenefits);

  const isArtistPro = plan?.code === "ARTIST_PRO";

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 260,

          borderRadius: "8px",

          background: "#202020",

          border: "1px solid rgba(255,255,255,0.06)",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          size={27}
          sx={{
            color: "#FF5500",
          }}
        />
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

            flexDirection: {
              xs: "column",
              sm: "row",
            },

            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
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
              }}
            >
              {unlocked
                ? "Your Artist Pro membership benefits are active."
                : "Upgrade to Artist Pro to unlock membership benefits."}
            </Typography>
          </Box>

          {!isArtistPro && (
            <Button
              onClick={() => router.push("/plans")}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                borderRadius: "999px",

                px: 2.4,
                minWidth: 190,

                color: "#ffffff",

                backgroundColor: "#FF5500",

                textTransform: "none",
                fontWeight: 950,

                "&:hover": {
                  backgroundColor: "#ff6a1a",
                },
              }}
            >
              Upgrade to Artist Pro
            </Button>
          )}
        </Box>

      {error ? (
        <Box
          sx={{
            minHeight: 150,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "8px",

            border: "1px solid rgba(255,80,80,0.2)",

            background: "rgba(255,80,80,0.04)",
          }}
        >
          <Typography
            sx={{
              color: "#ff8f98",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {error}
          </Typography>
        </Box>
      ) : benefits.length === 0 ? (
        <Box
          sx={{
            minHeight: 170,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            textAlign: "center",

            borderRadius: "8px",

            border: "1px dashed rgba(255,255,255,0.12)",

            background: "rgba(255,255,255,0.02)",
          }}
        >
          <Box>
            <WorkspacePremiumRoundedIcon
              sx={{
                color: "#6f7680",
                fontSize: 34,
              }}
            />

            <Typography
              sx={{
                mt: 1,

                color: "#AEB7C2",

                fontSize: 14,
                fontWeight: 850,
              }}
            >
              No membership benefits available
            </Typography>

            <Typography
              sx={{
                mt: 0.5,

                color: "#6f7680",

                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Benefits will appear when they are added to the database.
            </Typography>
          </Box>
        </Box>
      ) : (
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

              filter: unlocked ? "none" : "grayscale(0.7)",

              opacity: unlocked ? 1 : 0.38,

              pointerEvents: unlocked ? "auto" : "none",
            }}
          >
            {benefits.map((item) => (
              <Box key={item.id}>
                {item.imageUrl ? (
                  <Box
                    component="img"
                    src={getBenefitImageUrl(item.imageUrl)}
                    alt={item.title}
                    sx={{
                      width: "100%",
                      height: 150,

                      display: "block",

                      objectFit: "cover",

                      borderRadius: "6px",

                      border: "1px solid rgba(255,255,255,0.08)",

                      mb: 1.8,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 150,

                      borderRadius: "6px",

                      border: "1px solid rgba(255,255,255,0.08)",

                      background: "rgba(255,255,255,0.035)",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      mb: 1.8,
                    }}
                  >
                    <ImageNotSupportedRoundedIcon
                      sx={{
                        color: "#5f6670",

                        fontSize: 32,
                      }}
                    />
                  </Box>
                )}

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
                  {item.description || "No description available."}
                </Typography>

                {item.saveLabel && (
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
                )}
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
                  "linear-gradient(180deg, rgba(15,16,17,0.28), rgba(15,16,17,0.84))",

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

                  background: "rgba(17,18,19,0.94)",

                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <LockRoundedIcon
                  sx={{
                    color: "#f4c542",
                    fontSize: 30,
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,

                    color: "#ffffff",

                    fontSize: 18,
                    fontWeight: 950,
                  }}
                >
                  Unlock Artist Pro Benefits
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
      )}
    </Box>
  );
};

export default ArtistBenefits;
