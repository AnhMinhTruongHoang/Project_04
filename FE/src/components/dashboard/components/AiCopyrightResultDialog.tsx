"use client";

import dayjs from "dayjs";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

const formatAiPercent = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  const normalizedValue = value <= 1 ? value * 100 : value;

  return `${normalizedValue.toFixed(2)}%`;
};

const getRiskStyle = (riskLevel?: string | null) => {
  const risk = String(riskLevel || "UNKNOWN").toUpperCase();

  if (risk === "LOW") {
    return {
      color: "#63e6a6",
      backgroundColor: "rgba(99,230,166,0.12)",
      border: "1px solid rgba(99,230,166,0.3)",
    };
  }

  if (risk === "MEDIUM") {
    return {
      color: "#ffbd69",
      backgroundColor: "rgba(255,189,105,0.12)",
      border: "1px solid rgba(255,189,105,0.32)",
    };
  }

  if (risk === "HIGH") {
    return {
      color: "#ff6b72",
      backgroundColor: "rgba(255,107,114,0.12)",
      border: "1px solid rgba(255,107,114,0.32)",
    };
  }

  return {
    color: "#b8b8b8",
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
  };
};

const AiCopyrightResultDialog = ({
  open,
  track,
  onClose,
}: IAiCopyrightResultDialogProps) => {
  const riskLevel = String(
    track?.copyrightRiskLevel || "UNKNOWN"
  ).toUpperCase();

  const resultItems = [
    {
      label: "Copyright status",
      value: track?.copyrightStatus || "UNKNOWN",
    },
    {
      label: "Processing status",
      value: track?.processingStatus || "UNKNOWN",
    },
    {
      label: "Copyright score",
      value: formatAiPercent(track?.copyrightScore),
    },
    {
      label: "Fingerprint similarity",
      value: formatAiPercent(track?.fingerprintScore),
    },
    {
      label: "Matched duration",
      value: formatAiPercent(track?.matchedDurationRatio),
    },
    {
      label: "Scanned at",
      value: track?.scannedAt
        ? dayjs(track.scannedAt).format("DD/MM/YYYY HH:mm:ss")
        : "—",
    },
    {
      label: "Algorithm",
      value: track?.fingerprintAlgorithm || "CHROMAPRINT",
    },
    {
      label: "Algorithm version",
      value: track?.fingerprintVersion || "—",
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100% - 24px)",
            sm: "100%",
          },
          maxHeight: "calc(100vh - 32px)",
          color: "#ffffff",
          backgroundColor: "#181A1B",
          backgroundImage: "none",
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.12)",
        },
      }}
    >
      {/* DIALOG HEADER */}
      <DialogTitle
        sx={{
          color: "#ffffff",
          fontWeight: 900,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          textAlign: "center",
        }}
      >
        AI Copyright Check Result
      </DialogTitle>

      <DialogContent
        sx={{
          pt: "24px !important",
        }}
      >
        {/* MOBILE AND DESKTOP RESULT HEADER */}
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
            gap: 1.5,
            mb: 3,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#8f8f8f",
                fontSize: 12,
                fontWeight: 800,
                mb: 0.4,
              }}
            >
              Track
            </Typography>

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 17,
                fontWeight: 900,
                overflowWrap: "anywhere",
              }}
            >
              {track?.title || "Unknown track"}
            </Typography>
          </Box>

          <Chip
            label={riskLevel}
            sx={{
              ...getRiskStyle(riskLevel),
              height: 30,
              fontWeight: 900,

              "& .MuiChip-label": {
                color: "inherit",
              },
            }}
          />
        </Box>

        {/* AI RESULT DETAILS */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {resultItems.map((item) => (
            <Box
              key={item.label}
              sx={{
                minWidth: 0,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "#111314",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography
                sx={{
                  color: "#858585",
                  fontSize: 11,
                  fontWeight: 800,
                  mb: 0.5,
                }}
              >
                {item.label}
              </Typography>

              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 900,
                  overflowWrap: "anywhere",
                }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* MATCHED TRACK */}
        {track?.matchedTrackId && (
          <Box
            sx={{
              mt: 2,
              p: 1.7,
              borderRadius: 2,
              backgroundColor: "rgba(255,189,105,0.08)",
              border: "1px solid rgba(255,189,105,0.2)",
            }}
          >
            <Typography
              sx={{
                color: "#ffbd69",
                fontSize: 12,
                fontWeight: 900,
                mb: 0.6,
              }}
            >
              Matched track
            </Typography>

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
                overflowWrap: "anywhere",
              }}
            >
              {track.matchedTrackTitle || "Matched track"}
            </Typography>

            <Typography
              sx={{
                color: "#9b9b9b",
                fontSize: 11,
                fontWeight: 700,
                mt: 0.5,
                overflowWrap: "anywhere",
              }}
            >
              ID: {track.matchedTrackId}
            </Typography>
          </Box>
        )}

        {/* AI ANALYSIS MESSAGE */}
        <Box
          sx={{
            mt: 2,
            p: 1.7,
            borderRadius: 2,
            backgroundColor: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.2)",
          }}
        >
          <Typography
            sx={{
              color: "#c4b5fd",
              fontSize: 12,
              fontWeight: 900,
              mb: 0.7,
            }}
          >
            AI analysis
          </Typography>

          <Typography
            sx={{
              color: "#d6d6d6",
              fontSize: 13,
              lineHeight: 1.6,
              overflowWrap: "anywhere",
            }}
          >
            {track?.copyrightMessage || "No AI analysis message is available."}
          </Typography>
        </Box>

        {/* AI DISCLAIMER */}
        <Typography
          sx={{
            color: "#777777",
            fontSize: 11,
            lineHeight: 1.5,
            mt: 2,
          }}
        >
          This result is an AI-assisted copyright risk assessment. Final
          approval or rejection must be reviewed by an administrator.
        </Typography>
      </DialogContent>

      {/* DIALOG ACTIONS */}
      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            backgroundColor: "#7c3aed",

            "&:hover": {
              backgroundColor: "#6d28d9",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AiCopyrightResultDialog;
