"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type StudioTabItem = {
  label: string;
  value: StudioTab;
};

type Props = {
  tabs: StudioTabItem[];
  activeTab: StudioTab;
  onChange: (value: StudioTab) => void;
};

export const studioTabs: StudioTabItem[] = [
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
    label: "Subscription",
    value: "subscription",
  },
  {
    label: "Benefits",
    value: "benefits",
  },
];

const StudioTabs = ({ tabs, activeTab, onChange }: Props) => {
  return (
    <Box
      role="tablist"
      aria-label="Artist Studio sections"
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: {
          xs: 2.5,
          md: 4,
        },
        minHeight: 46,
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "none",
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
            id={`artist-studio-tab-${tab.value}`}
            role="tab"
            aria-selected={active}
            aria-controls={`artist-studio-panel-${tab.value}`}
            tabIndex={active ? 0 : -1}
            component="button"
            type="button"
            onClick={() => onChange(tab.value)}
            sx={{
              appearance: "none",
              minHeight: 46,
              border: 0,
              borderRadius: 0,
              background: "transparent",
              color: active ? "#ffffff" : "#9CA3AF",
              cursor: "pointer",
              px: 0,
              py: 0,
              flexShrink: 0,
              whiteSpace: "nowrap",
              position: "relative",
              transition: "color 150ms ease",
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -1,
                height: 2,
                backgroundColor: active ? "#ffffff" : "transparent",
                transition: "background-color 150ms ease",
              },
              "&:hover": {
                color: "#ffffff",
              },
              "&:focus-visible": {
                outline: "2px solid #FF5500",
                outlineOffset: "-2px",
              },
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: 14,
                fontWeight: active ? 950 : 800,
                lineHeight: 1,
              }}
            >
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default StudioTabs;