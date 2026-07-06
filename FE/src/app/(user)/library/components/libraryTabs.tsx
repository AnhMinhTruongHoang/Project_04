"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type Props<T extends string> = {
  tabs: {
    label: string;
    value: T;
  }[];
  activeTab: T;
  onChange: (value: T) => void;
};

const LibraryTabs = <T extends string>({
  tabs,
  activeTab,
  onChange,
}: Props<T>) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 2, md: 3.2 },
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
              fontSize: 13,
              fontWeight: 950,
              cursor: "pointer",
              pb: 1.5,
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
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 950 }}>
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default LibraryTabs;
