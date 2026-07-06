"use client";

import { useState } from "react";
import {
  studioBenefits,
  studioTabs,
  studioTracks,
  type StudioTab,
} from "../../../../utils/actions/artistStudioData";
import { Box, Typography } from "@mui/material";
import UploadQuotaBar from "./uploadQuotaBar";
import ArtistStudioStats from "./artistStudioStats";
import StudioTabs from "./studioTabs";
import StudioActions from "./studioActions";
import ArtistTracksTable from "./artistTracksTable";
import ArtistBenefits from "./artistBenefits";

const ArtistStudioView = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>("tracks");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 0%, rgba(255,77,0,0.08), transparent 32%), linear-gradient(180deg, #111314 0%, #0b0d0e 100%)",
        color: "#ffffff",
        px: { xs: 2, md: 3.5 },
        py: 3,
        pb: 10,
      }}
    >
      <UploadQuotaBar />

      <Box sx={{ mt: 2 }}>
        <ArtistStudioStats />
      </Box>

      <Box sx={{ mt: 3.5 }}>
        <StudioTabs
          tabs={studioTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        {activeTab === "tracks" ? (
          <>
            <StudioActions />

            <Box sx={{ mt: 3 }}>
              <ArtistTracksTable tracks={studioTracks} />
            </Box>
          </>
        ) : (
          <Box
            sx={{
              minHeight: 260,
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.035)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 950, mb: 1 }}>
                {studioTabs.find((tab) => tab.value === activeTab)?.label}
              </Typography>

              <Typography
                sx={{
                  color: "#8B949E",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                This section is a hardcoded placeholder. You can connect real
                data later.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 4 }}>
        <ArtistBenefits benefits={studioBenefits} />
      </Box>
    </Box>
  );
};

export default ArtistStudioView;
