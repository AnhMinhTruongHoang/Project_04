"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudQueueRoundedIcon from "@mui/icons-material/CloudQueueRounded";
import Step1 from "./steps/step1";
import Step2 from "./steps/step2";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`upload-tabpanel-${index}`}
      aria-labelledby={`upload-tab-${index}`}
      {...other}
      sx={{
        width: "100%",
      }}
    >
      {value === index && children}
    </Box>
  );
}

const UploadTabs = () => {
  const [value, setValue] = React.useState(0);

  const [trackUpload, setTrackUpload] = React.useState<TrackUploadState>({
    fileName: "",
    percent: 0,
    uploadedTrackName: "",
    audioFile: null,
  });

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#0f1111",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.8)",
        position: "relative",
        overflow: "hidden",
        marginTop: 5,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 64,
          px: { xs: 2, md: 4 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#0f1111",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          <CloudQueueRoundedIcon sx={{ fontSize: 30, color: "#ffffff" }} />
          Upload
        </Box>

        <IconButton
          sx={{
            width: 38,
            height: 38,
            backgroundColor: "#1b1d1e",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#2a2d2f",
            },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <CustomTabPanel value={value} index={0}>
        <Step1
          setValue={setValue}
          setTrackUpload={setTrackUpload}
          trackUpload={trackUpload}
        />
      </CustomTabPanel>

      <CustomTabPanel value={value} index={1}>
        <Box
          sx={{
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#0f1111",
            color: "#ffffff",
            px: 3,
            py: 4,
          }}
        >
          <Step2
            trackUpload={trackUpload}
            setTrackUpload={setTrackUpload}
            setValue={setValue}
          />
        </Box>
      </CustomTabPanel>
    </Box>
  );
};

export default UploadTabs;
