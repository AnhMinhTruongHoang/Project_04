"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  approveTrackApi,
  approveTrackLicenseApi,
  getAdminTracksApi,
  getAudioUrl,
  getImageUrl,
  getLicenseUrl,
  rejectTrackApi,
  rejectTrackLicenseApi,
  scanTrackCopyrightApi,
  sendRequest,
} from "@/utils/api";

import { useToast } from "@/utils/toast";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DashboardTableToolbar from "@/components/dashboard/components/DashboardTableToolbar";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AiCopyrightResultDialog from "../components/AiCopyrightResultDialog";
import AiCopyrightTestGuide from "@/test/AiCopyrightTestGuide";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import GppBadRoundedIcon from "@mui/icons-material/GppBadRounded";

type Props = {
  tracks: ITrackTop[];
  accessToken?: string;
};

const getItemId = (item?: Partial<ITrackTop> | null) => {
  return (item as any)?.id || (item as any)?._id || "";
};

const formatFileSize = (size?: number | null) => {
  const safeSize = Number(size);

  if (!Number.isFinite(safeSize) || safeSize <= 0) {
    return "";
  }

  if (safeSize < 1024) {
    return `${safeSize} B`;
  }

  if (safeSize < 1024 * 1024) {
    return `${(safeSize / 1024).toFixed(1)} KB`;
  }

  return `${(safeSize / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusStyle = (value?: string | null) => {
  const status = String(value || "UNKNOWN").toUpperCase();

  if (
    status === "APPROVED" ||
    status === "COMPLETED" ||
    status === "CLEAN" ||
    status === "MANUAL_APPROVED"
  ) {
    return {
      color: "#63e6a6",
      backgroundColor: "rgba(99,230,166,0.1)",
      border: "1px solid rgba(99,230,166,0.25)",
    };
  }

  if (
    status === "REJECTED" ||
    status === "FAILED" ||
    status === "MANUAL_REJECTED"
  ) {
    return {
      color: "#ff7b7b",
      backgroundColor: "rgba(255,123,123,0.12)",
      border: "1px solid rgba(255,123,123,0.32)",
    };
  }

  return {
    color: "#ffbd69",
    backgroundColor: "rgba(255,189,105,0.12)",
    border: "1px solid rgba(255,189,105,0.32)",
  };
};

const StatusChip = ({ value }: { value?: string | null }) => {
  const label = String(value || "UNKNOWN").replaceAll("_", " ");

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        ...getStatusStyle(value),
        height: 24,
        fontSize: 10,
        fontWeight: 900,

        "& .MuiChip-label": {
          color: "inherit",
          px: 1,
        },
      }}
    />
  );
};

const TracksTable = ({ tracks, accessToken }: Props) => {
  const toast = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [rows, setRows] = useState<ITrackTop[]>(tracks);

  const [searchValue, setSearchValue] = useState("");

  const [deletingId, setDeletingId] = useState("");

  const [moderatingId, setModeratingId] = useState("");

  const [scanningTrackId, setScanningTrackId] = useState("");

  const [confirmTrack, setConfirmTrack] = useState<ITrackTop | null>(null);

  const [rejectingTrack, setRejectingTrack] = useState<ITrackTop | null>(null);

  const [rejectReason, setRejectReason] = useState("");

  const [previewTrackId, setPreviewTrackId] = useState("");

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const [aiResultTrack, setAiResultTrack] = useState<ITrackTop | null>(null);

  const [licenseModeratingId, setLicenseModeratingId] = useState("");

  const [rejectingLicenseTrack, setRejectingLicenseTrack] =
    useState<ITrackTop | null>(null);

  const [licenseRejectReason, setLicenseRejectReason] = useState("");

  useEffect(() => {
    setRows(tracks);
  }, [tracks]);

  const reloadTracks = useCallback(async () => {
    if (!accessToken) return;

    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    try {
      const response = await getAdminTracksApi(accessToken, {
        current: 1,
        pageSize: 100,
      });

      const responseData = response?.data as any;

      const nextTracks: ITrackTop[] = Array.isArray(responseData?.result)
        ? responseData.result
        : Array.isArray(responseData?.content)
        ? responseData.content
        : Array.isArray(responseData)
        ? responseData
        : [];

      setRows(nextTracks);
    } catch (error) {
      console.error("Cannot refresh admin tracks:", error);
    }
  }, [accessToken]);

  useEffect(() => {
    void reloadTracks();

    const intervalId = window.setInterval(() => {
      void reloadTracks();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void reloadTracks();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reloadTracks]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;

      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
    };
  }, []);

  const filteredTracks = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter((track) => {
      return [
        track.title,
        track.description,
        track.category,
        (track as any).categoryName,
        track.uploader?.name,
        track.uploader?.email,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });
  }, [rows, searchValue]);

  const handlePreviewTrack = async (track: ITrackTop) => {
    const trackId = getItemId(track);
    const audio = audioRef.current;

    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!audio) {
      toast.error("Audio player is unavailable.");
      return;
    }

    const audioUrl = getAudioUrl(track.trackUrl);

    if (!audioUrl) {
      toast.error("Audio file not found.");
      return;
    }

    if (previewTrackId === trackId && !audio.paused) {
      audio.pause();
      return;
    }

    try {
      if (previewTrackId !== trackId) {
        audio.pause();

        audio.src = audioUrl;
        audio.currentTime = 0;

        setPreviewTrackId(trackId);
      }

      await audio.play();
    } catch (error) {
      console.error("Cannot preview track:", error);

      setIsPreviewPlaying(false);

      toast.error("Cannot play this audio file.");
    }
  };

  const deleteTrack = async (track: ITrackTop) => {
    const trackId = getItemId(track);

    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    setDeletingId(trackId);

    try {
      const response = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/${trackId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response?.statusCode !== 200) {
        toast.error(response?.message || "Delete track failed.");
        return;
      }

      if (previewTrackId === trackId && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");

        setPreviewTrackId("");
        setIsPreviewPlaying(false);
      }

      setRows((currentRows) =>
        currentRows.filter((item) => getItemId(item) !== trackId)
      );

      toast.success("Delete track successfully.");
    } catch (error) {
      console.error("Delete track failed:", error);

      toast.error("Delete track failed.");
    } finally {
      setDeletingId("");
    }
  };

  const handleDeleteTrack = (track: ITrackTop) => {
    const trackId = getItemId(track);

    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    setConfirmTrack(track);
  };

  const handleModeration = async (
    track: ITrackTop,
    action: "approve" | "reject",
    reason = ""
  ) => {
    const trackId = getItemId(track);

    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (action === "reject" && !reason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }

    setModeratingId(trackId);

    try {
      const response =
        action === "approve"
          ? await approveTrackApi(trackId, accessToken)
          : await rejectTrackApi(trackId, reason, accessToken);

      if (response?.statusCode !== 200 || !response?.data) {
        toast.error(response?.message || `Cannot ${action} track.`);
        return;
      }

      const updatedTrack = response.data as ITrackTop;

      setRows((currentRows) =>
        currentRows.map((item) =>
          getItemId(item) === trackId
            ? {
                ...item,
                ...updatedTrack,
              }
            : item
        )
      );

      setRejectingTrack(null);
      setRejectReason("");

      toast.success(
        action === "approve" ? "Track approved." : "Track rejected."
      );
    } catch (error) {
      console.error(`Cannot ${action} track:`, error);

      toast.error(`Cannot ${action} track.`);
    } finally {
      setModeratingId("");
    }
  };

  /* =========================
   COPYRIGHT LICENSE REVIEW
========================= */

  const handleLicenseModeration = async (
    track: ITrackTop,
    action: "approve" | "reject",
    reason = ""
  ) => {
    const trackId = getItemId(track);

    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (!track.licenseUrl) {
      toast.error("This track does not have a license document.");
      return;
    }

    const cleanReason = reason.trim();

    if (action === "reject" && !cleanReason) {
      toast.error("License rejection reason is required.");
      return;
    }

    if (cleanReason.length > 1000) {
      toast.error("License rejection reason must not exceed 1000 characters.");
      return;
    }

    setLicenseModeratingId(trackId);

    try {
      const response =
        action === "approve"
          ? await approveTrackLicenseApi(trackId, accessToken)
          : await rejectTrackLicenseApi(trackId, cleanReason, accessToken);

      if (response?.statusCode !== 200 || !response?.data) {
        toast.error(
          response?.message ||
            (action === "approve"
              ? "Cannot verify license."
              : "Cannot reject license.")
        );

        return;
      }

      const updatedTrack = response.data as ITrackTop;

      setRows((currentRows) =>
        currentRows.map((item) =>
          getItemId(item) === trackId
            ? {
                ...item,
                ...updatedTrack,
              }
            : item
        )
      );

      setRejectingLicenseTrack(null);
      setLicenseRejectReason("");

      toast.success(
        action === "approve"
          ? "Copyright license verified."
          : "Copyright license rejected."
      );
    } catch (error) {
      console.error(`Cannot ${action} copyright license:`, error);

      toast.error(
        action === "approve"
          ? "Cannot verify copyright license."
          : "Cannot reject copyright license."
      );
    } finally {
      setLicenseModeratingId("");
    }
  };

  /* =========================
   AI COPYRIGHT SCAN
========================= */

  const handleCopyrightScan = async (track: ITrackTop) => {
    const trackId = getItemId(track);

    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (scanningTrackId) {
      return;
    }

    setScanningTrackId(trackId);

    setRows((currentRows) =>
      currentRows.map((item) =>
        getItemId(item) === trackId
          ? {
              ...item,
              processingStatus: "PROCESSING",
              copyrightStatus: "SCANNING",
              copyrightMessage: "Analyzing audio fingerprint",
            }
          : item
      )
    );

    try {
      const response = await scanTrackCopyrightApi(trackId, accessToken);

      if (response?.statusCode !== 200 || !response?.data) {
        toast.error(response?.message || "Copyright scan failed.");

        await reloadTracks();
        return;
      }

      const scanResult = response.data as any;

      setRows((currentRows) =>
        currentRows.map((item) =>
          getItemId(item) === trackId
            ? {
                ...item,
                processingStatus: scanResult.processingStatus || "COMPLETED",
                copyrightStatus: scanResult.copyrightStatus || "UNKNOWN",
                copyrightRiskLevel: scanResult.riskLevel || null,
                copyrightScore: scanResult.copyrightScore ?? null,
                fingerprintScore: scanResult.fingerprintScore ?? null,
                matchedDurationRatio: scanResult.matchedDurationRatio ?? null,
                matchedTrackId: scanResult.matchedTrackId || null,
                copyrightMessage:
                  scanResult.message || "Copyright scan completed",
                scannedAt: scanResult.scannedAt || new Date().toISOString(),
              }
            : item
        )
      );

      const matchedTrackTitle = scanResult.matchedTrackTitle;

      const riskLevel = String(scanResult.riskLevel || "UNKNOWN").toUpperCase();

      if (riskLevel === "HIGH") {
        toast.error(
          matchedTrackTitle
            ? `High copyright risk. Matched "${matchedTrackTitle}".`
            : "High copyright risk detected."
        );
      } else if (riskLevel === "MEDIUM") {
        toast.error(
          matchedTrackTitle
            ? `Possible match with "${matchedTrackTitle}". Manual review is recommended.`
            : "Possible copyright match detected."
        );
      } else {
        toast.success("Copyright scan completed. No high-risk match detected.");
      }
    } catch (error) {
      console.error("Copyright scan failed:", error);

      toast.error("Copyright scan failed.");

      await reloadTracks();
    } finally {
      setScanningTrackId("");
    }
  };

  const columns: GridColDef<ITrackTop>[] = [
    {
      field: "title",
      headerName: "Track",
      flex: 1.4,
      minWidth: 300,
      sortable: true,

      renderCell: (params) => {
        const track = params.row;
        const trackId = getItemId(track);

        const isThisTrackPlaying =
          previewTrackId === trackId && isPreviewPlaying;

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.4,
              width: "100%",
              minWidth: 0,
            }}
          >
            <Tooltip
              title={isThisTrackPlaying ? "Pause preview" : "Play preview"}
              arrow
            >
              <span>
                <IconButton
                  aria-label={
                    isThisTrackPlaying
                      ? `Pause ${track.title}`
                      : `Preview ${track.title}`
                  }
                  disabled={!track.trackUrl}
                  onClick={(event) => {
                    event.stopPropagation();

                    void handlePreviewTrack(track);
                  }}
                  sx={{
                    position: "relative",
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    p: 0,
                    overflow: "hidden",
                    borderRadius: 1.5,
                    border: isThisTrackPlaying
                      ? "2px solid #ff7a2f"
                      : "1px solid rgba(255,255,255,0.12)",
                    backgroundColor: "#202223",

                    "&:hover": {
                      borderColor: "#ff7a2f",
                    },

                    "&:hover .track-preview-overlay": {
                      opacity: 1,
                    },

                    "&.Mui-disabled": {
                      opacity: 0.45,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={getImageUrl(track.imgUrl)}
                    alt={track.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;

                      event.currentTarget.src = "/images/logo/Sc.png";
                    }}
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />

                  <Box
                    className="track-preview-overlay"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      backgroundColor: "rgba(0,0,0,0.55)",
                      opacity: isThisTrackPlaying ? 1 : 0,
                      transition: "opacity 150ms ease",
                    }}
                  >
                    {isThisTrackPlaying ? (
                      <PauseRoundedIcon fontSize="small" />
                    ) : (
                      <PlayArrowRoundedIcon fontSize="small" />
                    )}
                  </Box>
                </IconButton>
              </span>
            </Tooltip>

            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                title={track.title}
                sx={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.title}
              </Typography>

              <Typography
                title={track.description || "No description"}
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.description || "No description"}
              </Typography>
            </Box>
          </Box>
        );
      },
    },

    {
      field: "category",
      headerName: "Category",
      width: 150,

      renderCell: (params) => (
        <Chip
          label={
            (params.row as any).categoryName || params.row.category || "Unknown"
          }
          size="small"
          sx={{
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.08)",
            fontWeight: 800,
          }}
        />
      ),
    },

    {
      field: "uploader",
      headerName: "Uploader",
      width: 220,

      valueGetter: (params) =>
        params.row.uploader?.name || params.row.uploader?.email || "Unknown",

      renderCell: (params) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {params.row.uploader?.name || "Unknown"}
          </Typography>

          <Typography
            sx={{
              color: "#8f8f8f",
              fontSize: 12,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {params.row.uploader?.email || ""}
          </Typography>
        </Box>
      ),
    },

    {
      field: "countPlay",
      headerName: "Plays",
      width: 100,
      align: "center",
      headerAlign: "center",
    },

    {
      field: "countLike",
      headerName: "Likes",
      width: 100,
      align: "center",
      headerAlign: "center",
    },

    {
      field: "processingStatus",
      headerName: "Processing",
      width: 145,
      sortable: true,

      renderCell: (params) => (
        <StatusChip value={params.row.processingStatus} />
      ),
    },

    {
      field: "copyrightStatus",
      headerName: "Copyright",
      width: 165,
      sortable: true,

      renderCell: (params) => (
        <Tooltip
          title={params.row.copyrightMessage || "No copyright message"}
          arrow
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <StatusChip value={params.row.copyrightStatus} />
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "licenseReviewStatus",
      headerName: "License",
      width: 300,
      sortable: true,

      renderCell: (params) => {
        const track = params.row;
        const trackId = getItemId(track);

        const licenseStatus = String(
          track.licenseReviewStatus || "MISSING"
        ).toUpperCase();

        const hasLicense = Boolean(track.licenseUrl);

        const licenseUrl = getLicenseUrl(track.licenseUrl);

        const isUpdatingThisLicense = licenseModeratingId === trackId;

        const hasLicenseRequest = Boolean(licenseModeratingId);

        const isVerified = licenseStatus === "VERIFIED";

        return (
          <Box
            sx={{
              width: "100%",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            {/* LICENSE INFORMATION */}
            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <StatusChip value={licenseStatus} />

              <Typography
                title={track.licenseFileName || "No license document"}
                sx={{
                  mt: 0.4,
                  color: hasLicense ? "#bdbdbd" : "#737373",
                  fontSize: 10.5,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.licenseFileName || "No PDF attached"}
              </Typography>

              {hasLicense && (
                <Typography
                  sx={{
                    color: "#777777",
                    fontSize: 9.5,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {String(track.licenseType || "UNKNOWN").replaceAll("_", " ")}

                  {track.licenseFileSize
                    ? ` • ${formatFileSize(track.licenseFileSize)}`
                    : ""}
                </Typography>
              )}
            </Box>

            {/* LICENSE ACTIONS */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Tooltip
                title={hasLicense ? "View license PDF" : "No license document"}
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={!hasLicense}
                    onClick={(event) => {
                      event.stopPropagation();

                      if (!licenseUrl) return;

                      window.open(licenseUrl, "_blank", "noopener,noreferrer");
                    }}
                    sx={{
                      color: "#f87171",

                      "&:hover": {
                        color: "#fca5a5",
                        backgroundColor: "rgba(248,113,113,0.14)",
                      },

                      "&.Mui-disabled": {
                        color: "#f87171",
                        opacity: 0.25,
                      },
                    }}
                  >
                    <PictureAsPdfRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  isVerified
                    ? "License already verified"
                    : hasLicense
                    ? "Verify license"
                    : "No license document"
                }
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={!hasLicense || hasLicenseRequest || isVerified}
                    onClick={(event) => {
                      event.stopPropagation();

                      void handleLicenseModeration(track, "approve");
                    }}
                    sx={{
                      color: "#63e6a6",

                      "&:hover": {
                        backgroundColor: "rgba(99,230,166,0.14)",
                      },

                      "&.Mui-disabled": {
                        color: "#63e6a6",
                        opacity: 0.3,
                      },
                    }}
                  >
                    {isUpdatingThisLicense ? (
                      <CircularProgress
                        size={17}
                        thickness={5}
                        sx={{
                          color: "#63e6a6",
                        }}
                      />
                    ) : (
                      <VerifiedRoundedIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip
                title={
                  hasLicense
                    ? licenseStatus === "REJECTED"
                      ? "Review or update license rejection"
                      : "Reject license"
                    : "No license document"
                }
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={!hasLicense || hasLicenseRequest}
                    onClick={(event) => {
                      event.stopPropagation();

                      setRejectingLicenseTrack(track);

                      setLicenseRejectReason(track.licenseReviewReason || "");
                    }}
                    sx={{
                      color: "#ff5f67",

                      "&:hover": {
                        backgroundColor: "rgba(255,95,103,0.14)",
                      },

                      "&.Mui-disabled": {
                        color: "#ff5f67",
                        opacity: 0.3,
                      },
                    }}
                  >
                    <GppBadRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        );
      },
    },

    {
      field: "approvalStatus",
      headerName: "Approval",
      width: 130,
      sortable: true,

      renderCell: (params) => <StatusChip value={params.row.approvalStatus} />,
    },

    {
      field: "createdAt",
      headerName: "Created",
      width: 150,

      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      field: "copyrightScore",
      headerName: "Score",
      width: 90,
      align: "center",
      headerAlign: "center",

      valueGetter: (params) => params.row.copyrightScore ?? null,

      renderCell: (params) => {
        const score = params.row.copyrightScore;

        return (
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {typeof score === "number"
              ? `${Math.round(score <= 1 ? score * 100 : score)}%`
              : "—"}
          </Typography>
        );
      },
    },

    {
      field: "actions",
      headerName: "Actions",
      width: 225,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,

      renderCell: (params) => {
        const track = params.row;
        const trackId = getItemId(track);

        const approvalStatus = String(track.approvalStatus || "").toUpperCase();

        const isScanning = scanningTrackId === trackId;

        const copyrightStatus = String(
          track.copyrightStatus || ""
        ).toUpperCase();

        const hasAiResult = Boolean(
          track.copyrightRiskLevel ||
            track.fingerprintAlgorithm ||
            track.scannedAt ||
            ["CLEAN", "MATCHED", "REVIEW_REQUIRED", "SCAN_FAILED"].includes(
              copyrightStatus
            )
        );

        ///
        const licenseReviewStatus = String(
          track.licenseReviewStatus || ""
        ).toUpperCase();

        const isLicenseVerified = licenseReviewStatus === "VERIFIED";

        const isUpdating =
          moderatingId === trackId ||
          isScanning ||
          licenseModeratingId === trackId;
        ///

        const trackRouteKey = trackId;

        const href =
          `/track/${encodeURIComponent(trackRouteKey)}.html` +
          `?audio=${encodeURIComponent(
            getAudioUrl(track.trackUrl)
          )}&autoplay=1`;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            {/* AI COPYRIGHT CHECK */}
            <Tooltip
              title={
                isScanning
                  ? "Analyzing audio fingerprint..."
                  : track.copyrightStatus === "CLEAN"
                  ? "Run copyright scan again"
                  : "AI-assisted copyright scan"
              }
              arrow
            >
              <span>
                <IconButton
                  size="small"
                  disabled={
                    isScanning || Boolean(moderatingId) || !track.trackUrl
                  }
                  onClick={(event) => {
                    event.stopPropagation();

                    void handleCopyrightScan(track);
                  }}
                  sx={{
                    color: "#a78bfa",

                    "&:hover": {
                      color: "#c4b5fd",
                      backgroundColor: "rgba(167,139,250,0.14)",
                    },

                    "&.Mui-disabled": {
                      color: "#a78bfa",
                      opacity: 0.4,
                    },
                  }}
                >
                  {isScanning ? (
                    <CircularProgress
                      size={18}
                      thickness={5}
                      sx={{
                        color: "#a78bfa",
                      }}
                    />
                  ) : (
                    <SmartToyRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            {/* VIEW AI COPYRIGHT RESULT */}
            <Tooltip
              title={
                hasAiResult
                  ? "View AI copyright result"
                  : "Run AI copyright scan first"
              }
              arrow
            >
              <span>
                <IconButton
                  size="small"
                  disabled={!hasAiResult || isScanning}
                  onClick={(event) => {
                    event.stopPropagation();

                    setAiResultTrack(track);
                  }}
                  sx={{
                    color: "#60a5fa",

                    "&:hover": {
                      color: "#93c5fd",
                      backgroundColor: "rgba(96,165,250,0.14)",
                    },

                    "&.Mui-disabled": {
                      color: "#60a5fa",
                      opacity: 0.3,
                    },
                  }}
                >
                  <VisibilityRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              title={
                approvalStatus === "APPROVED"
                  ? "Track already approved"
                  : !isLicenseVerified
                  ? `Verify copyright license first (${
                      licenseReviewStatus || "MISSING"
                    })`
                  : "Approve track"
              }
            >
              <span>
                <IconButton
                  size="small"
                  disabled={
                    isUpdating ||
                    approvalStatus === "APPROVED" ||
                    !isLicenseVerified
                  }
                  onClick={() => void handleModeration(track, "approve")}
                  sx={{
                    color: "#63e6a6",

                    "&:hover": {
                      backgroundColor: "rgba(99,230,166,0.14)",
                    },

                    "&.Mui-disabled": {
                      color: "#63e6a6",
                      opacity: 0.4,
                    },
                  }}
                >
                  <CheckCircleRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              title={
                approvalStatus === "REJECTED"
                  ? "Review rejection reason"
                  : "Reject track"
              }
            >
              <span>
                <IconButton
                  size="small"
                  disabled={isUpdating}
                  onClick={() => {
                    setRejectingTrack(track);

                    setRejectReason(track.rejectionReason || "");
                  }}
                  sx={{
                    color: "#ff5f67",

                    "&:hover": {
                      backgroundColor: "rgba(255,95,103,0.14)",
                    },

                    "&.Mui-disabled": {
                      color: "#ff5f67",
                      opacity: 0.4,
                    },
                  }}
                >
                  <CancelRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {approvalStatus === "APPROVED" ? (
              <Tooltip title="Open track">
                <IconButton
                  component={Link}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{
                    color: "#aeb4bb",

                    "&:hover": {
                      color: "#ffffff",
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Track must be approved first">
                <span>
                  <IconButton
                    disabled
                    size="small"
                    sx={{
                      "&.Mui-disabled": {
                        color: "#6f757b",
                        opacity: 0.55,
                      },
                    }}
                  >
                    <OpenInNewRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            <Tooltip title="Delete track">
              <span>
                <IconButton
                  size="small"
                  disabled={deletingId === trackId || isUpdating}
                  onClick={() => handleDeleteTrack(track)}
                  sx={{
                    color: "#ff5f67",

                    "&:hover": {
                      backgroundColor: "rgba(255,95,103,0.14)",
                    },

                    "&.Mui-disabled": {
                      color: "#ff5f67",
                      opacity: 0.35,
                    },
                  }}
                >
                  <DeleteRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPreviewPlaying(true)}
        onPause={() => setIsPreviewPlaying(false)}
        onEnded={() => {
          setIsPreviewPlaying(false);
          setPreviewTrackId("");
        }}
        onError={() => {
          setIsPreviewPlaying(false);

          toast.error("Unable to load audio preview.");
        }}
      />

      {/* AI COPYRIGHT TEST GUIDE */}
      <AiCopyrightTestGuide />

      <DashboardTableToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <Box
        sx={{
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "#111314",
          border: "1px solid rgba(255,255,255,0.08)",

          "& .MuiDataGrid-root": {
            border: "none",
            color: "#ffffff",
            backgroundColor: "#111314",
          },

          "& .MuiDataGrid-columnHeaders": {
            color: "#ffffff",
            backgroundColor: "#181A1B",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-columnHeaderTitle": {
            color: "#ffffff",
            fontWeight: 900,
          },

          "& .MuiDataGrid-sortIcon": {
            color: "#ffffff",
            opacity: 1,
          },

          "& .MuiDataGrid-menuIconButton": {
            color: "#cfcfcf",
          },

          "& .MuiDataGrid-menuIconButton:hover": {
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-iconSeparator": {
            color: "rgba(255,255,255,0.35)",
          },

          "& .MuiDataGrid-columnHeader .MuiIconButton-root": {
            color: "#cfcfcf",
          },

          "& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon": {
            color: "#63e6a6",
          },

          "& .MuiDataGrid-cell": {
            color: "#ffffff",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(255,255,255,0.035)",
          },

          "& .MuiDataGrid-footerContainer": {
            color: "#ffffff",
            backgroundColor: "#181A1B",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiTablePagination-root": {
            color: "#ffffff",
          },

          "& .MuiTablePagination-actions .MuiIconButton-root": {
            color: "#ffffff",
          },

          "& .MuiDataGrid-overlay": {
            color: "#9a9a9a",
            backgroundColor: "#111314",
            fontWeight: 800,
          },
        }}
      >
        <DataGrid
          rows={filteredTracks}
          columns={columns}
          getRowId={(row) => getItemId(row)}
          rowHeight={64}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 20, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
                page: 0,
              },
            },
          }}
        />
      </Box>

      {/* AI COPYRIGHT RESULT DIALOG */}
      <AiCopyrightResultDialog
        open={Boolean(aiResultTrack)}
        track={aiResultTrack}
        onClose={() => setAiResultTrack(null)}
      />

      {/* DELETE DIALOG */}
      <Dialog
        open={Boolean(confirmTrack)}
        onClose={() => {
          if (deletingId) return;

          setConfirmTrack(null);
        }}
        PaperProps={{
          sx: {
            minWidth: 380,
            color: "#ffffff",
            backgroundColor: "#181A1B",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#ffffff",
            fontWeight: 900,
          }}
        >
          Delete track?
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#bdbdbd",
              fontSize: 14,
            }}
          >
            Are you sure you want to delete{" "}
            <Box
              component="span"
              sx={{
                color: "#ffffff",
                fontWeight: 900,
              }}
            >
              {confirmTrack?.title}
            </Box>
            ?
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button
            disabled={Boolean(deletingId)}
            onClick={() => setConfirmTrack(null)}
            sx={{
              color: "#cfcfcf",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={Boolean(deletingId)}
            onClick={() => {
              const selectedTrack = confirmTrack;

              if (!selectedTrack) return;

              setConfirmTrack(null);

              void deleteTrack(selectedTrack);
            }}
            sx={{
              color: "#ffffff",
              fontWeight: 900,
              backgroundColor: "#ff4d4f",

              "&:hover": {
                backgroundColor: "#ff2f32",
              },

              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,77,79,0.2)",
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog
        open={Boolean(rejectingTrack)}
        onClose={() => {
          if (moderatingId) return;

          setRejectingTrack(null);
          setRejectReason("");
        }}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 520,
            color: "#ffffff",
            backgroundColor: "#181A1B",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          Reject track
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#bdbdbd",
              fontSize: 14,
              mb: 2,
              textAlign: "center",
            }}
          >
            Enter a clear reason for{" "}
            <Box
              component="span"
              sx={{
                color: "#ff5f67",
                fontWeight: 900,
              }}
            >
              rejecting
            </Box>{" "}
            <Box
              component="span"
              sx={{
                color: "#ffffff",
                fontWeight: 900,
              }}
            >
              {rejectingTrack?.title}
            </Box>
            .
          </Typography>

          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Example: Audio quality is too low..."
            inputProps={{
              maxLength: 500,
            }}
            helperText={`${rejectReason.length}/500`}
            sx={{
              "& .MuiInputBase-root": {
                color: "#ffffff",
                backgroundColor: "#111314",
              },

              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.16)",
              },

              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.3)",
              },

              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "#ff5f67",
                },

              "& .MuiFormHelperText-root": {
                color: "#8f8f8f",
                textAlign: "right",
              },

              "& textarea::placeholder": {
                color: "#777777",
                opacity: 1,
              },
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button
            disabled={Boolean(moderatingId)}
            onClick={() => {
              setRejectingTrack(null);
              setRejectReason("");
            }}
            sx={{
              color: "#cfcfcf",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={Boolean(moderatingId) || !rejectReason.trim()}
            onClick={() => {
              if (!rejectingTrack) return;

              void handleModeration(rejectingTrack, "reject", rejectReason);
            }}
            sx={{
              color: "#ffffff",
              fontWeight: 900,
              backgroundColor: "#ff4d4f",

              "&:hover": {
                backgroundColor: "#ff2f32",
              },

              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,77,79,0.2)",
              },
            }}
          >
            Reject track
          </Button>
        </DialogActions>
      </Dialog>

      {/* LICENSE REJECT DIALOG */}
      <Dialog
        open={Boolean(rejectingLicenseTrack)}
        onClose={() => {
          if (licenseModeratingId) return;

          setRejectingLicenseTrack(null);
          setLicenseRejectReason("");
        }}
        PaperProps={{
          sx: {
            width: "calc(100% - 32px)",
            maxWidth: 560,
            color: "#ffffff",
            backgroundColor: "#181A1B",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          Reject copyright license
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#bdbdbd",
              fontSize: 14,
              mb: 1,
              textAlign: "center",
            }}
          >
            Enter a clear reason for rejecting the license attached to{" "}
            <Box
              component="span"
              sx={{
                color: "#ffffff",
                fontWeight: 900,
              }}
            >
              {rejectingLicenseTrack?.title}
            </Box>
            .
          </Typography>

          {rejectingLicenseTrack?.licenseFileName && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: 2,
                backgroundColor: "#111314",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <PictureAsPdfRoundedIcon
                sx={{
                  color: "#f87171",
                }}
              />

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 800,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {rejectingLicenseTrack.licenseFileName}
                </Typography>

                <Typography
                  sx={{
                    color: "#8f8f8f",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {String(
                    rejectingLicenseTrack.licenseType || "UNKNOWN"
                  ).replaceAll("_", " ")}

                  {rejectingLicenseTrack.licenseFileSize
                    ? ` • ${formatFileSize(
                        rejectingLicenseTrack.licenseFileSize
                      )}`
                    : ""}
                </Typography>
              </Box>
            </Box>
          )}

          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            value={licenseRejectReason}
            onChange={(event) => setLicenseRejectReason(event.target.value)}
            placeholder="Example: The document does not prove ownership or distribution rights..."
            inputProps={{
              maxLength: 1000,
            }}
            helperText={`${licenseRejectReason.length}/1000`}
            sx={{
              "& .MuiInputBase-root": {
                color: "#ffffff",
                backgroundColor: "#111314",
              },

              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.16)",
              },

              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255,255,255,0.3)",
              },

              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "#ff5f67",
                },

              "& .MuiFormHelperText-root": {
                color: "#8f8f8f",
                textAlign: "right",
              },

              "& textarea::placeholder": {
                color: "#777777",
                opacity: 1,
              },
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button
            disabled={Boolean(licenseModeratingId)}
            onClick={() => {
              setRejectingLicenseTrack(null);
              setLicenseRejectReason("");
            }}
            sx={{
              color: "#cfcfcf",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={
              Boolean(licenseModeratingId) || !licenseRejectReason.trim()
            }
            onClick={() => {
              if (!rejectingLicenseTrack) return;

              void handleLicenseModeration(
                rejectingLicenseTrack,
                "reject",
                licenseRejectReason
              );
            }}
            sx={{
              color: "#ffffff",
              fontWeight: 900,
              backgroundColor: "#ff4d4f",

              "&:hover": {
                backgroundColor: "#ff2f32",
              },

              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,77,79,0.2)",
              },
            }}
          >
            Reject license
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TracksTable;
