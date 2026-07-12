"use client";

import { useCallback } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

interface IProps {
  setValue: React.Dispatch<React.SetStateAction<number>>;

  setTrackUpload: React.Dispatch<React.SetStateAction<TrackUploadState>>;

  trackUpload: TrackUploadState;
}

const Step1 = (props: IProps) => {
  const { trackUpload } = props;

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      const audio = acceptedFiles?.[0];

      if (!audio) {
        return;
      }

      props.setTrackUpload((previous) => ({
        ...previous,
        fileName: audio.name,
        uploadedTrackName: audio.name.replace(/\.[^/.]+$/, ""),
        audioFile: audio,
        percent: 0,
      }));

      props.setValue(1);
    },
    [props.setTrackUpload, props.setValue]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/mp4": [".m4a"],
      "audio/wav": [".wav"],
      "audio/x-wav": [".wav"],
    },
  });

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 110px)",
        backgroundColor: "#0f1111",
        color: "#ffffff",
        display: "flex",
        justifyContent: "center",
        px: 2,
        py: 5,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1040,
        }}
      >
        {/* Usage bar */}
        <Box
          sx={{
            width: "100%",
            height: 66,
            backgroundColor: "#181a1b",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <CloudUploadRoundedIcon sx={{ fontSize: 22, color: "#d8d8d8" }} />
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
              {trackUpload?.percent || 0}% tải lên được sử dụng
            </Typography>
          </Box>

          <Button
            sx={{
              height: 36,
              px: 3,
              borderRadius: "999px",
              backgroundColor: "#050505",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 900,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#111111",
              },
            }}
          >
            Tải lên không giới hạn
          </Button>
        </Box>

        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 24, md: 30 },
            fontWeight: 900,
            mb: 2,
          }}
        >
          Tải lên các tệp âm thanh của bạn.
        </Typography>

        <Typography
          sx={{
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            mb: 3.5,
          }}
        >
          Để có chất lượng tốt nhất, hãy sử dụng WAV, FLAC, AIFF hoặc ALAC. Kích
          thước tệp tối đa là 4GB không nén.{" "}
          <Box
            component="span"
            sx={{
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Tìm hiểu thêm.
          </Box>
        </Typography>

        {/* Dropzone */}
        <Box
          {...getRootProps()}
          sx={{
            height: 290,
            borderRadius: "4px",
            border: isDragActive
              ? "1px dashed #ff5500"
              : "1px dashed rgba(255,255,255,0.13)",
            backgroundColor: isDragActive ? "rgba(255,85,0,0.06)" : "#0f1111",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            mb: 3,
            transition: "0.18s ease",
            cursor: "default",
            "&:hover": {
              borderColor: "rgba(255,255,255,0.26)",
              backgroundColor: "#111313",
            },
          }}
        >
          <input {...getInputProps()} />

          <CloudUploadRoundedIcon
            sx={{
              fontSize: 64,
              color: "#f2f2f2",
              mb: 2,
            }}
          />

          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 900,
              mb: 2,
            }}
          >
            {isDragActive
              ? "Thả tệp âm thanh vào đây..."
              : "Kéo và thả các tệp âm thanh để bắt đầu."}
          </Typography>

          <Button
            onClick={open}
            sx={{
              height: 38,
              px: 3,
              borderRadius: "999px",
              backgroundColor: "#181a1b",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 900,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#232627",
              },
            }}
          >
            Chọn tệp
          </Button>

          {trackUpload?.fileName && (
            <Box sx={{ width: "60%", mt: 3 }}>
              <Typography
                noWrap
                sx={{
                  color: "#cfcfcf",
                  fontSize: 13,
                  mb: 1,
                }}
              >
                {trackUpload.fileName}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={trackUpload.percent || 0}
                sx={{
                  height: 4,
                  borderRadius: 99,
                  backgroundColor: "#2a2d2f",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#ff5500",
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* Record by mic */}
        <Box
          sx={{
            minHeight: 86,
            borderRadius: "6px",
            backgroundColor: "#181a1b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            position: "relative",
          }}
        >
          <MicRoundedIcon
            sx={{
              position: "absolute",
              left: 28,
              color: "#ffffff",
              fontSize: 22,
            }}
          />

          <Box
            sx={{
              textAlign: "center",
              px: 6,
            }}
          >
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 900,
                color: "#ffffff",
              }}
            >
              Hoặc ghi âm bằng micro
            </Typography>

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                mt: 0.8,
              }}
            >
              Tải lên bản ghi nhớ thoại, cập nhật, tin tức hoặc phần giới thiệu
              đã ghi cho các bản phát hành mới.
            </Typography>
          </Box>

          <KeyboardArrowDownRoundedIcon
            sx={{
              position: "absolute",
              right: 28,
              color: "#ffffff",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Step1;
