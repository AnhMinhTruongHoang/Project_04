"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type Props = {
  tabs: {
    label: string;
    value: StudioTab;
  }[];
  activeTab: StudioTab;
  onChange: (value: StudioTab) => void;
};

export const studioTabs: {
  label: string;
  value: StudioTab;
}[] = [
  {
    label: "SoundClone Tracks",
    value: "tracks",
  },
  {
    label: "Distribution",
    value: "distribution",
  },
  {
    label: "Vinyl Records",
    value: "vinyl",
  },
  {
    label: "Comments",
    value: "comments",
  },
  {
    label: "Earnings",
    value: "earnings",
  },
  {
    value: "subscription",
    label: "Subscription",
  },
  {
    label: "Benefits",
    value: "benefits",
  },
];

const StudioTabs = ({ tabs, activeTab, onChange }: Props) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 2, md: 4 },
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        overflowX: "auto",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.value;

        return (
          <Box
            key={tab.value}
            component="button"
            onClick={() => onChange(tab.value)}
            sx={{
              appearance: "none",
              border: "none",
              background: "transparent",
              color: active ? "#ffffff" : "#9CA3AF",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              pb: 1.8,
              px: 0,
              whiteSpace: "nowrap",
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -1,
                height: 2,
                background: active ? "#ffffff" : "transparent",
              },
              "&:hover": {
                color: "#ffffff",
              },
            }}
          >
            <Typography component="span" sx={{ fontSize: 14, fontWeight: 900 }}>
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default StudioTabs;
