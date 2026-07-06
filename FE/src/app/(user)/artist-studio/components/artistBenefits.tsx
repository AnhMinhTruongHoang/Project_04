"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { StudioBenefit } from "../../../../utils/actions/artistStudioData";

type Props = {
  benefits: StudioBenefit[];
};

const ArtistBenefits = ({ benefits }: Props) => {
  return (
    <Box
      sx={{
        borderRadius: "8px",
        background: "#202020",
        border: "1px solid rgba(255,255,255,0.06)",
        px: { xs: 2, md: 3 },
        py: 2.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2.5,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 950,
              mb: 0.8,
            }}
          >
            Artist Pro Membership Benefits
          </Typography>

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Jump start your music career with Artist Pro and immediately unlock
            $100+ in premium music tools and services.
          </Typography>
        </Box>

        <Button
          sx={{
            borderRadius: "999px",
            px: 2.4,
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.8)",
            textTransform: "none",
            fontWeight: 950,
            flexShrink: 0,
            "&:hover": {
              borderColor: "#FF5500",
              background: "rgba(255,85,0,0.08)",
            },
          }}
        >
          See all
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2.2,
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
                    "linear-gradient(180deg, transparent, rgba(0,0,0,0.32))",
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
    </Box>
  );
};

export default ArtistBenefits;
