"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import type { ReactNode } from "react";

type Props = {
  title: string;
  rightSlot?: ReactNode;
  emptyText?: string;
  children?: ReactNode;
};

const skeletonItems = Array.from({ length: 6 });

const LibrarySection = ({ title, rightSlot, emptyText, children }: Props) => {
  const hasChildren = Boolean(children);

  return (
    <Box sx={{ mb: 5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 1.8,
        }}
      >
        <Typography
          sx={{
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 950,
          }}
        >
          {title}
        </Typography>

        {rightSlot && (
          <Box
            sx={{
              color: "#C7CCD3",
              fontSize: 12,
              fontWeight: 850,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {rightSlot === "All" ? (
              <Box
                sx={{
                  minWidth: 54,
                  height: 26,
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.4,
                  color: "#ffffff",
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 950 }}>
                  All
                </Typography>
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
              </Box>
            ) : (
              rightSlot
            )}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
            lg: "repeat(6, minmax(0, 1fr))",
          },
          gap: { xs: 1.4, md: 2 },
        }}
      >
        {hasChildren ? children : null}

        {!hasChildren &&
          skeletonItems.map((_, index) => (
            <Box
              key={index}
              sx={{
                aspectRatio: "1 / 1",
                borderRadius: "3px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.15))",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            />
          ))}
      </Box>

      {!hasChildren && emptyText && (
        <Typography
          sx={{
            color: "#8B949E",
            fontSize: 12,
            fontWeight: 750,
            mt: 1.5,
          }}
        >
          {emptyText}
        </Typography>
      )}
    </Box>
  );
};

export default LibrarySection;
