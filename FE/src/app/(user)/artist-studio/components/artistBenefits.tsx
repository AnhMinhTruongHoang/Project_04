"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { getBenefitImageUrl } from "@/utils/actions/getImages";

type Props = {
  plan: ISubscriptionPlan | null;
  benefits: IArtistBenefit[];
  loading?: boolean;
  error?: string;
};

type BenefitImageProps = {
  imageUrl?: string | null;
  title: string;
};

const BenefitImage = ({ imageUrl, title }: BenefitImageProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  const hasUsableImage = Boolean(imageUrl) && !imageFailed;

  if (!hasUsableImage) {
    return (
      <Box
        aria-label={`No image available for ${title}`}
        sx={{
          width: "100%",
          aspectRatio: "16 / 9",
          minHeight: 140,
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.8,
        }}
      >
        <ImageNotSupportedRoundedIcon
          sx={{
            color: "#5f6670",
            fontSize: 34,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={getBenefitImageUrl(imageUrl)}
      alt={title}
      loading="lazy"
      onError={() => setImageFailed(true)}
      sx={{
        width: "100%",
        aspectRatio: "16 / 9",
        minHeight: 140,
        display: "block",
        objectFit: "cover",
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "#202223",
        mb: 1.8,
      }}
    />
  );
};

const ArtistBenefits = ({
  plan,
  benefits,
  loading = false,
  error = "",
}: Props) => {
  const router = useRouter();

  const isArtistPro = plan?.code === "ARTIST_PRO";

  /*
   * Một số response cũ không trả hasMembershipBenefits.
   * ARTIST_PRO chỉ bị khóa khi backend trả rõ ràng false.
   */
  const unlocked =
    isArtistPro && plan?.hasMembershipBenefits !== false;

  const goToPlans = () => {
    router.push("/plans");
  };

  if (loading) {
    return (
      <Box
        aria-label="Loading Artist Pro membership benefits"
        sx={{
          minHeight: 260,
          borderRadius: "8px",
          background:
            "linear-gradient(180deg, #202020 0%, #191a1b 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
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
      component="section"
      aria-labelledby="artist-benefits-title"
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",
        background: unlocked
          ? "linear-gradient(180deg, #202020 0%, #191a1b 100%)"
          : "linear-gradient(180deg, #1c1d1e 0%, #151617 100%)",
        border: unlocked
          ? "1px solid rgba(244,197,66,0.22)"
          : "1px solid rgba(255,255,255,0.07)",
        px: {
          xs: 2,
          md: 3,
        },
        py: {
          xs: 2.2,
          md: 2.7,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "stretch",
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
        <Box
          sx={{
            minWidth: 0,
          }}
        >
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
                flexShrink: 0,
              }}
            />

            <Typography
              id="artist-benefits-title"
              component="h2"
              sx={{
                color: "#ffffff",
                fontSize: {
                  xs: 18,
                  md: 20,
                },
                fontWeight: 950,
                lineHeight: 1.3,
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
                  backgroundColor: "rgba(244,197,66,0.09)",
                  border: "1px solid rgba(244,197,66,0.25)",
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{
                    fontSize: 13,
                  }}
                />

                <Typography
                  component="span"
                  sx={{
                    color: "inherit",
                    fontSize: 9,
                    fontWeight: 950,
                    lineHeight: 1,
                  }}
                >
                  ACTIVE
                </Typography>
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
                  backgroundColor: "rgba(255,255,255,0.045)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <LockRoundedIcon
                  sx={{
                    fontSize: 12,
                  }}
                />

                <Typography
                  component="span"
                  sx={{
                    color: "inherit",
                    fontSize: 9,
                    fontWeight: 950,
                    lineHeight: 1,
                  }}
                >
                  ARTIST PRO
                </Typography>
              </Box>
            )}
          </Box>

          <Typography
            sx={{
              maxWidth: 680,
              color: unlocked ? "#D1D5DB" : "#8B949E",
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            {unlocked
              ? "Your Artist Pro membership benefits are active and available below."
              : "Upgrade to Artist Pro to unlock partner offers and membership benefits."}
          </Typography>
        </Box>

        {!isArtistPro && (
          <Button
            type="button"
            onClick={goToPlans}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              width: {
                xs: "100%",
                sm: "auto",
              },
              minWidth: {
                sm: 190,
              },
              borderRadius: "999px",
              px: 2.4,
              color: "#ffffff",
              backgroundColor: "#FF5500",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 950,
              flexShrink: 0,
              "&:hover": {
                backgroundColor: "#ff6a1a",
              },
              "&:focus-visible": {
                outline: "2px solid #ffffff",
                outlineOffset: "2px",
              },
            }}
          >
            Upgrade to Artist Pro
          </Button>
        )}
      </Box>

      {error ? (
        <Box
          role="alert"
          sx={{
            minHeight: 160,
            px: 3,
            py: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            borderRadius: "8px",
            border: "1px solid rgba(255,80,80,0.22)",
            backgroundColor: "rgba(255,80,80,0.045)",
          }}
        >
          <Box>
            <ErrorOutlineRoundedIcon
              sx={{
                color: "#ff6b73",
                fontSize: 30,
                mb: 0.8,
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              Membership benefits could not be loaded
            </Typography>

            <Typography
              sx={{
                mt: 0.6,
                color: "#ff9da5",
                fontSize: 12,
                fontWeight: 700,
                overflowWrap: "anywhere",
              }}
            >
              {error}
            </Typography>
          </Box>
        </Box>
      ) : benefits.length === 0 ? (
        <Box
          sx={{
            minHeight: 180,
            px: 3,
            py: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            borderRadius: "8px",
            border: "1px dashed rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        >
          <Box>
            <WorkspacePremiumRoundedIcon
              sx={{
                color: "#6f7680",
                fontSize: 36,
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
              Benefits will appear when active offers are added by an
              administrator.
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
            aria-hidden={!unlocked}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: {
                xs: 2,
                md: 2.2,
              },
              filter: unlocked ? "none" : "grayscale(0.7)",
              opacity: unlocked ? 1 : 0.34,
              pointerEvents: unlocked ? "auto" : "none",
              transition: "filter 180ms ease, opacity 180ms ease",
            }}
          >
            {benefits.map((item) => (
              <Box
                key={item.id}
                sx={{
                  minWidth: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "8px",
                  p: 1.2,
                  backgroundColor: "rgba(255,255,255,0.018)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  transition:
                    "background-color 150ms ease, border-color 150ms ease, transform 150ms ease",
                  "&:hover": {
                    transform: unlocked ? "translateY(-2px)" : "none",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <BenefitImage
                  imageUrl={item.imageUrl}
                  title={item.title}
                />

                <Typography
                  sx={{
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 950,
                    lineHeight: 1.4,
                    mb: 0.8,
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  sx={{
                    color: "#AEB7C2",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.55,
                    mb: 1.5,
                    flex: 1,
                  }}
                >
                  {item.description || "No description available."}
                </Typography>

                {item.saveLabel && (
                  <Box
                    sx={{
                      alignSelf: "flex-start",
                      display: "inline-flex",
                      px: 1.4,
                      py: 0.65,
                      borderRadius: "999px",
                      backgroundColor: "#087A46",
                      color: "#ffffff",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        color: "inherit",
                        fontSize: 11.5,
                        fontWeight: 950,
                        lineHeight: 1,
                      }}
                    >
                      {item.saveLabel}
                    </Typography>
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
                px: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                background:
                  "linear-gradient(180deg, rgba(15,16,17,0.3), rgba(15,16,17,0.86))",
                backdropFilter: "blur(3px)",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 410,
                  px: {
                    xs: 2.5,
                    sm: 3,
                  },
                  py: 3,
                  textAlign: "center",
                  borderRadius: "12px",
                  backgroundColor: "rgba(17,18,19,0.96)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
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

                <Typography
                  sx={{
                    mt: 0.7,
                    color: "#9CA3AF",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.55,
                  }}
                >
                  Upgrade your plan to access all active membership offers.
                </Typography>

                <Button
                  type="button"
                  fullWidth
                  onClick={goToPlans}
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
                    "&:focus-visible": {
                      outline: "2px solid #ffffff",
                      outlineOffset: "2px",
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