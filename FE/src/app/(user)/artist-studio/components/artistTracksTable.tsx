"use client";

import { useEffect, useMemo, useState } from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CopyrightRoundedIcon from "@mui/icons-material/CopyrightRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";

import { getImageUrl, getMyTracksApi } from "@/utils/api";

type TrackFilter = "all" | "public" | "private" | "rejected";
type TrackVisibility = "PUBLIC" | "PRIVATE" | "UNKNOWN";
type NoticeSeverity = "success" | "error" | "info";

type ArtistStudioTrack = {
  id: string;
  title: string;
  fileName: string;

  imgUrl?: string;
  trackUrl?: string;

  visibility: TrackVisibility;

  approvalStatus: string;
  processingStatus: string;
  copyrightStatus: string;

  copyrightMessage: string;
  rejectionReason: string;
  audioHash: string;

  createdAt?: string;

  countPlay: number;
  countLike: number;

  isDeleted: boolean;
};

type NoticeState = {
  open: boolean;
  message: string;
  severity: NoticeSeverity;
};

const UPLOAD_ROUTE = "/track/upload";

const headerSx = {
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
};

const cellSx = {
  color: "#D1D5DB",
  fontSize: 13,
  fontWeight: 800,
};

const getTrackId = (track?: any) => {
  return String(track?.id || track?._id || "").trim();
};

const normalizeStatus = (value?: string | null) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

const getFileName = (trackUrl?: string | null) => {
  if (!trackUrl) {
    return "Audio file";
  }

  try {
    const cleanUrl = trackUrl.split("?")[0].replaceAll("\\", "/");
    const fileName = cleanUrl.split("/").pop() || "Audio file";

    return decodeURIComponent(fileName);
  } catch {
    return "Audio file";
  }
};

const getVisibility = (track?: any): TrackVisibility => {
  const explicitBoolean =
    typeof track?.isPublic === "boolean"
      ? track.isPublic
      : typeof track?.public === "boolean"
      ? track.public
      : null;

  if (explicitBoolean === true) {
    return "PUBLIC";
  }

  if (explicitBoolean === false) {
    return "PRIVATE";
  }

  const rawVisibility = normalizeStatus(
    track?.visibility || track?.privacy || track?.access
  );

  if (
    rawVisibility === "PUBLIC" ||
    rawVisibility === "PUBLISHED" ||
    rawVisibility === "VISIBLE"
  ) {
    return "PUBLIC";
  }

  if (
    rawVisibility === "PRIVATE" ||
    rawVisibility === "HIDDEN" ||
    rawVisibility === "UNLISTED"
  ) {
    return "PRIVATE";
  }

  return "UNKNOWN";
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatCount = (value?: number) => {
  const safeValue = Math.max(Number(value) || 0, 0);

  return new Intl.NumberFormat("en-US", {
    notation: safeValue >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(safeValue);
};

const getTimestamp = (value?: string) => {
  const timestamp = new Date(value || 0).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const isRejectedTrack = (track: ArtistStudioTrack) => {
  const approvalStatus = normalizeStatus(track.approvalStatus);
  const copyrightStatus = normalizeStatus(track.copyrightStatus);

  return (
    approvalStatus === "REJECTED" ||
    [
      "REJECTED",
      "BLOCKED",
      "MATCHED",
      "COPYRIGHT_MATCH",
      "MANUAL_REJECTED",
      "DUPLICATE",
    ].includes(copyrightStatus)
  );
};

const isPublicTrack = (track: ArtistStudioTrack) => {
  if (track.isDeleted) {
    return false;
  }

  if (track.visibility === "PRIVATE") {
    return false;
  }

  if (track.visibility === "PUBLIC") {
    return normalizeStatus(track.approvalStatus) === "APPROVED";
  }

  return normalizeStatus(track.approvalStatus) === "APPROVED";
};

const isPrivateTrack = (track: ArtistStudioTrack) => {
  return track.visibility === "PRIVATE" && !track.isDeleted;
};

const getAdminNote = (track: ArtistStudioTrack) => {
  const rejectionReason = String(track.rejectionReason || "").trim();

  if (rejectionReason) {
    return rejectionReason;
  }

  const copyrightMessage = String(track.copyrightMessage || "").trim();

  if (copyrightMessage) {
    return copyrightMessage;
  }

  const approvalStatus = normalizeStatus(track.approvalStatus);

  if (approvalStatus === "PENDING") {
    return "Waiting for admin review.";
  }

  if (approvalStatus === "APPROVED") {
    return "Approved by admin.";
  }

  return "No admin note.";
};

const getStatusChipStyle = (status?: string) => {
  const normalized = normalizeStatus(status);

  if (
    normalized === "APPROVED" ||
    normalized === "CLEAN" ||
    normalized === "COMPLETED" ||
    normalized === "MANUAL_APPROVED"
  ) {
    return {
      color: "#63e6a6",
      backgroundColor: "rgba(99,230,166,0.1)",
      border: "1px solid rgba(99,230,166,0.3)",
    };
  }

  if (
    normalized === "REJECTED" ||
    normalized === "BLOCKED" ||
    normalized === "FAILED" ||
    normalized === "MATCHED" ||
    normalized === "MANUAL_REJECTED"
  ) {
    return {
      color: "#ff6b73",
      backgroundColor: "rgba(255,107,115,0.12)",
      border: "1px solid rgba(255,107,115,0.32)",
    };
  }

  return {
    color: "#ffbd69",
    backgroundColor: "rgba(255,189,105,0.12)",
    border: "1px solid rgba(255,189,105,0.32)",
  };
};

const mapTrack = (track: any): ArtistStudioTrack | null => {
  const id = getTrackId(track);

  if (!id) {
    return null;
  }

  return {
    id,

    title: String(track?.title || "").trim() || "Untitled track",

    fileName: getFileName(track?.trackUrl || track?.track_url),

    imgUrl: track?.imgUrl || track?.img_url || undefined,

    trackUrl: track?.trackUrl || track?.track_url || undefined,

    visibility: getVisibility(track),

    approvalStatus:
      normalizeStatus(track?.approvalStatus || track?.approval_status) ||
      "UNKNOWN",

    processingStatus:
      normalizeStatus(track?.processingStatus || track?.processing_status) ||
      "UNKNOWN",

    copyrightStatus:
      normalizeStatus(track?.copyrightStatus || track?.copyright_status) ||
      "UNKNOWN",

    copyrightMessage: String(
      track?.copyrightMessage || track?.copyright_message || ""
    ),

    rejectionReason: String(
      track?.rejectionReason || track?.rejection_reason || ""
    ),

    audioHash: String(track?.audioHash || track?.audio_hash || ""),

    createdAt: track?.createdAt || track?.created_at,

    countPlay: Number(track?.countPlay || track?.count_play || 0),

    countLike: Number(track?.countLike || track?.count_like || 0),

    isDeleted:
      track?.isDeleted === true ||
      track?.is_deleted === true ||
      normalizeStatus(track?.status) === "DELETED",
  };
};

const extractTracks = (response: any): any[] => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
};

const ArtistTracksTable = () => {
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();

  const [tracks, setTracks] = useState<ArtistStudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchValue, setSearchValue] = useState("");
  const [filter, setFilter] = useState<TrackFilter>("all");
  const [sortDescending, setSortDescending] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [retryNonce, setRetryNonce] = useState(0);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuTrack, setMenuTrack] = useState<ArtistStudioTrack | null>(null);

  const [notice, setNotice] = useState<NoticeState>({
    open: false,
    message: "",
    severity: "info",
  });

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token ||
    (session as any)?.user?.accessToken ||
    "";

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    let cancelled = false;

    const loadTracks = async () => {
      if (!accessToken) {
        setTracks([]);
        setSelectedIds([]);
        setLoadError("Please login to view your tracks.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const response = await getMyTracksApi(accessToken);

        if (cancelled) {
          return;
        }

        if (response?.error || Number(response?.statusCode) >= 400) {
          throw new Error(response?.message || "Cannot load your tracks.");
        }

        const mappedTracks = extractTracks(response)
          .map(mapTrack)
          .filter((track): track is ArtistStudioTrack => Boolean(track));

        setTracks(mappedTracks);

        setSelectedIds((previous) => {
          const validIds = new Set(mappedTracks.map((track) => track.id));

          return previous.filter((id) => validIds.has(id));
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Cannot load artist tracks:", error);

        setTracks([]);
        setSelectedIds([]);

        setLoadError(
          error instanceof Error ? error.message : "Cannot load your tracks."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTracks();

    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionStatus, retryNonce]);

  const filterCounts = useMemo(() => {
    return {
      all: tracks.length,
      public: tracks.filter(isPublicTrack).length,
      private: tracks.filter(isPrivateTrack).length,
      rejected: tracks.filter(isRejectedTrack).length,
    };
  }, [tracks]);

  const visibleTracks = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    return [...tracks]
      .filter((track) => {
        if (filter === "public") {
          return isPublicTrack(track);
        }

        if (filter === "private") {
          return isPrivateTrack(track);
        }

        if (filter === "rejected") {
          return isRejectedTrack(track);
        }

        return true;
      })
      .filter((track) => {
        if (!keyword) {
          return true;
        }

        return [
          track.title,
          track.fileName,
          track.audioHash,
          track.approvalStatus,
          track.processingStatus,
          track.copyrightStatus,
          track.copyrightMessage,
          track.rejectionReason,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      })
      .sort((first, second) => {
        const firstTime = getTimestamp(first.createdAt);
        const secondTime = getTimestamp(second.createdAt);

        return sortDescending
          ? secondTime - firstTime
          : firstTime - secondTime;
      });
  }, [tracks, searchValue, filter, sortDescending]);

  const selectedIdSet = useMemo(() => {
    return new Set(selectedIds);
  }, [selectedIds]);

  const visibleIds = useMemo(() => {
    return visibleTracks.map((track) => track.id);
  }, [visibleTracks]);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((trackId) => selectedIdSet.has(trackId));

  const someVisibleSelected =
    !allVisibleSelected &&
    visibleIds.some((trackId) => selectedIdSet.has(trackId));

  const toggleTrackSelection = (trackId: string) => {
    setSelectedIds((previous) => {
      if (previous.includes(trackId)) {
        return previous.filter((id) => id !== trackId);
      }

      return [...previous, trackId];
    });
  };

  const toggleVisibleSelection = () => {
    setSelectedIds((previous) => {
      const previousSet = new Set(previous);

      if (allVisibleSelected) {
        visibleIds.forEach((id) => previousSet.delete(id));
      } else {
        visibleIds.forEach((id) => previousSet.add(id));
      }

      return Array.from(previousSet);
    });
  };

  const openTrackMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    track: ArtistStudioTrack
  ) => {
    setMenuAnchor(event.currentTarget);
    setMenuTrack(track);
  };

  const closeTrackMenu = () => {
    setMenuAnchor(null);
    setMenuTrack(null);
  };

  const copyValue = async (value: string, successMessage: string) => {
    if (!value) {
      setNotice({
        open: true,
        message: "No value is available to copy.",
        severity: "error",
      });

      return;
    }

    try {
      await navigator.clipboard.writeText(value);

      setNotice({
        open: true,
        message: successMessage,
        severity: "success",
      });
    } catch {
      setNotice({
        open: true,
        message: "Cannot access the clipboard.",
        severity: "error",
      });
    } finally {
      closeTrackMenu();
    }
  };

  if (loading) {
    return (
      <Box
        aria-label="Loading your tracks"
        sx={{
          minHeight: 280,
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "rgba(255,255,255,0.018)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          size={30}
          sx={{
            color: "#FF5500",
          }}
        />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box
        role="alert"
        sx={{
          minHeight: 250,
          borderRadius: "12px",
          border: "1px solid rgba(255,85,0,0.2)",
          background:
            "linear-gradient(180deg, rgba(255,85,0,0.045), rgba(255,255,255,0.018))",
          px: 3,
          py: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Box>
          <WarningRoundedIcon
            sx={{
              color: "#FF5500",
              fontSize: 34,
              mb: 1,
            }}
          />

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 950,
            }}
          >
            Your tracks could not be loaded
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              color: "#9CA3AF",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {loadError}
          </Typography>

          {accessToken && (
            <Button
              type="button"
              onClick={() => setRetryNonce((value) => value + 1)}
              startIcon={<RefreshRoundedIcon />}
              sx={{
                mt: 2,
                borderRadius: "999px",
                px: 2.5,
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
                textTransform: "none",
                fontSize: 12,
                fontWeight: 900,
                "&:hover": {
                  borderColor: "#FF5500",
                  backgroundColor: "rgba(255,85,0,0.08)",
                },
              }}
            >
              Try again
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: {
              xs: "stretch",
              md: "center",
            },
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
            flexDirection: {
              xs: "column",
              md: "row",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
              flex: 1,
            }}
          >
            <Box
              sx={{
                width: {
                  xs: "100%",
                  sm: 320,
                },
                height: 36,
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "rgba(255,255,255,0.018)",
                display: "flex",
                alignItems: "center",
                px: 1.5,
                color: "#8B949E",
                transition: "border-color 150ms ease",
                "&:focus-within": {
                  borderColor: "#FF5500",
                },
              }}
            >
              <SearchRoundedIcon
                sx={{
                  fontSize: 18,
                  mr: 1,
                  flexShrink: 0,
                }}
              />

              <InputBase
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search tracks, hash or admin note"
                inputProps={{
                  "aria-label": "Search your tracks",
                }}
                sx={{
                  color: "#ffffff",
                  fontSize: 13,
                  flex: 1,
                  minWidth: 0,
                  "& input::placeholder": {
                    color: "#8B949E",
                    opacity: 1,
                  },
                }}
              />
            </Box>

            <FilterButton
              label="All"
              count={filterCounts.all}
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />

            <FilterButton
              label="Public"
              count={filterCounts.public}
              active={filter === "public"}
              onClick={() => setFilter("public")}
            />

            <FilterButton
              label="Private"
              count={filterCounts.private}
              active={filter === "private"}
              onClick={() => setFilter("private")}
            />

            <FilterButton
              label="Rejected"
              count={filterCounts.rejected}
              active={filter === "rejected"}
              onClick={() => setFilter("rejected")}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: {
                xs: "space-between",
                md: "flex-end",
              },
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 950,
              }}
            >
              {visibleTracks.length}{" "}
              {visibleTracks.length === 1 ? "track" : "tracks"}
            </Typography>

            <Button
              type="button"
              onClick={() => {
                setSortDescending((previous) => !previous);
              }}
              startIcon={<SortRoundedIcon />}
              sx={{
                color: "#ffffff",
                borderRadius: "999px",
                textTransform: "none",
                fontSize: 12,
                fontWeight: 900,
                px: 1.5,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              {sortDescending ? "Newest" : "Oldest"}
            </Button>
          </Box>
        </Box>

        {selectedIds.length > 0 && (
          <Box
            sx={{
              mb: 2,
              minHeight: 42,
              px: 1.5,
              borderRadius: "7px",
              border: "1px solid rgba(255,85,0,0.25)",
              backgroundColor: "rgba(255,85,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {selectedIds.length} selected
            </Typography>

            <Button
              type="button"
              onClick={() => setSelectedIds([])}
              sx={{
                color: "#FF8A50",
                textTransform: "none",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              Clear selection
            </Button>
          </Box>
        )}

        <Box
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.18)",
            display: "grid",
            gridTemplateColumns: {
              xs: "42px minmax(0,1fr) 42px",
              md: "42px minmax(260px,1.4fr) 125px 110px minmax(220px,1fr) 90px 42px",
            },
            alignItems: "center",
            columnGap: 1.5,
            pb: 1.2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Checkbox
              size="small"
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected}
              onChange={toggleVisibleSelection}
              disabled={visibleTracks.length === 0}
              inputProps={{
                "aria-label": "Select all visible tracks",
              }}
              sx={{
                color: "#ffffff",
                p: 0,
                "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                  color: "#FF5500",
                },
              }}
            />
          </Box>

          <Typography sx={headerSx}>Tracks</Typography>

          <Typography
            sx={{
              ...headerSx,
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            Status
          </Typography>

          <Typography
            sx={{
              ...headerSx,
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            Date
          </Typography>

          <Typography
            sx={{
              ...headerSx,
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            Admin note
          </Typography>

          <Typography
            sx={{
              ...headerSx,
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            Plays
          </Typography>

          <Box />
        </Box>

        {visibleTracks.length === 0 && (
          <Box
            sx={{
              minHeight: 260,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <MusicNoteRoundedIcon
              sx={{
                color: "#FF5500",
                fontSize: 48,
                mb: 1,
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              {tracks.length === 0
                ? "Upload your first track"
                : "No tracks match the current filters"}
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                color: "#8B949E",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {tracks.length === 0
                ? "Your uploaded tracks and review statuses will appear here."
                : "Change the search text or choose another filter."}
            </Typography>

            {tracks.length === 0 && (
              <Button
                type="button"
                onClick={() => router.push(UPLOAD_ROUTE)}
                startIcon={<UploadFileRoundedIcon />}
                sx={{
                  mt: 2,
                  borderRadius: "999px",
                  px: 2.5,
                  color: "#ffffff",
                  backgroundColor: "#FF5500",
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 900,
                  "&:hover": {
                    backgroundColor: "#ff6a1a",
                  },
                }}
              >
                Upload a track
              </Button>
            )}
          </Box>
        )}

        {visibleTracks.map((track) => {
          const rejected = isRejectedTrack(track);
          const adminNote = getAdminNote(track);
          const selected = selectedIdSet.has(track.id);

          return (
            <Box
              key={track.id}
              sx={{
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                display: "grid",
                gridTemplateColumns: {
                  xs: "42px minmax(0,1fr) 42px",
                  md: "42px minmax(260px,1.4fr) 125px 110px minmax(220px,1fr) 90px 42px",
                },
                alignItems: "center",
                columnGap: 1.5,
                py: 2,
                minHeight: 102,
                backgroundColor: selected
                  ? "rgba(255,85,0,0.055)"
                  : rejected
                  ? "rgba(255,48,64,0.025)"
                  : "transparent",
                transition: "background-color 140ms ease",
                "&:hover": {
                  backgroundColor: selected
                    ? "rgba(255,85,0,0.085)"
                    : rejected
                    ? "rgba(255,48,64,0.055)"
                    : "rgba(255,255,255,0.025)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Checkbox
                  size="small"
                  checked={selected}
                  onChange={() => toggleTrackSelection(track.id)}
                  inputProps={{
                    "aria-label": `Select ${track.title}`,
                  }}
                  sx={{
                    color: "#ffffff",
                    p: 0,
                    "&.Mui-checked": {
                      color: "#FF5500",
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.4,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 48,
                    height: 48,
                    borderRadius: "3px",
                    overflow: "hidden",
                    backgroundColor: "#202223",
                    border: "1px solid rgba(255,255,255,0.12)",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="img"
                    src={getImageUrl(track.imgUrl)}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = "/images/logo/Sc.png";
                    }}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  {rejected && (
                    <Tooltip title={adminNote} arrow>
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(0,0,0,0.58)",
                        }}
                      >
                        <CopyrightRoundedIcon
                          sx={{
                            color: "#ff5060",
                            fontSize: 25,
                          }}
                        />
                      </Box>
                    </Tooltip>
                  )}
                </Box>

                <Box
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.6,
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{
                        minWidth: 0,
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 950,
                        lineHeight: 1.35,
                      }}
                    >
                      {track.title}
                    </Typography>

                    {rejected && (
                      <Tooltip title={adminNote} arrow>
                        <WarningRoundedIcon
                          sx={{
                            color: "#ff5060",
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>

                  <Typography
                    noWrap
                    sx={{
                      color: "#b6b6b6",
                      fontSize: 12,
                      fontWeight: 750,
                      lineHeight: 1.35,
                    }}
                  >
                    {track.fileName}
                  </Typography>

                  {track.audioHash && (
                    <Tooltip title={track.audioHash} arrow>
                      <Typography
                        noWrap
                        sx={{
                          mt: 0.45,
                          maxWidth: 460,
                          color: "#4d9cff",
                          fontSize: 10.5,
                          fontWeight: 800,
                          fontFamily: "monospace",
                          cursor: "help",
                        }}
                      >
                        SHA-256: {track.audioHash}
                      </Typography>
                    </Tooltip>
                  )}

                  <Box
                    sx={{
                      mt: 0.5,
                      display: {
                        xs: "flex",
                        md: "none",
                      },
                      flexDirection: "column",
                      gap: 0.4,
                    }}
                  >
                    <Typography
                      sx={{
                        color: rejected ? "#ff6b73" : "#ffbd69",
                        fontSize: 11,
                        fontWeight: 850,
                      }}
                    >
                      {track.approvalStatus}
                    </Typography>

                    <Typography
                      sx={{
                        color: rejected ? "#ff7b7b" : "#9a9a9a",
                        fontSize: 11,
                        fontWeight: 750,
                        lineHeight: 1.4,
                      }}
                    >
                      {adminNote}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: {
                    xs: "none",
                    md: "flex",
                  },
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.7,
                }}
              >
                <Chip
                  size="small"
                  label={track.approvalStatus}
                  sx={{
                    ...getStatusChipStyle(track.approvalStatus),
                    height: 23,
                    fontSize: 10,
                    fontWeight: 900,
                    "& .MuiChip-label": {
                      px: 1,
                    },
                  }}
                />

                <Typography
                  sx={{
                    color: "#8B949E",
                    fontSize: 9.5,
                    fontWeight: 800,
                  }}
                >
                  {track.copyrightStatus}
                </Typography>
              </Box>

              <Typography
                sx={{
                  ...cellSx,
                  display: {
                    xs: "none",
                    md: "block",
                  },
                }}
              >
                {formatDate(track.createdAt)}
              </Typography>

              <Tooltip title={adminNote} arrow placement="top">
                <Typography
                  sx={{
                    display: {
                      xs: "none",
                      md: "-webkit-box",
                    },
                    color: rejected ? "#ff6b73" : "#b8b8b8",
                    fontSize: 12,
                    fontWeight: rejected ? 850 : 750,
                    lineHeight: 1.45,
                    overflow: "hidden",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 3,
                    wordBreak: "break-word",
                    cursor: "help",
                  }}
                >
                  {adminNote}
                </Typography>
              </Tooltip>

              <Box
                sx={{
                  display: {
                    xs: "none",
                    md: "block",
                  },
                }}
              >
                <Typography sx={cellSx}>
                  {formatCount(track.countPlay)}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color: "#777e87",
                    fontSize: 9.5,
                    fontWeight: 750,
                  }}
                >
                  {formatCount(track.countLike)} likes
                </Typography>
              </Box>

              <IconButton
                type="button"
                size="small"
                onClick={(event) => openTrackMenu(event, track)}
                aria-label={`Open actions for ${track.title}`}
                sx={{
                  justifySelf: "end",
                  color: "#ffffff",
                  "&:hover": {
                    color: "#FF5500",
                    backgroundColor: "rgba(255,85,0,0.1)",
                  },
                }}
              >
                <MoreVertRoundedIcon />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeTrackMenu}
        PaperProps={{
          sx: {
            minWidth: 190,
            color: "#ffffff",
            backgroundColor: "#202223",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.4)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            void copyValue(menuTrack?.id || "", "Track ID copied.");
          }}
          sx={{
            fontSize: 12,
            fontWeight: 800,
            gap: 1,
          }}
        >
          <ContentCopyRoundedIcon
            sx={{
              fontSize: 17,
            }}
          />
          Copy track ID
        </MenuItem>

        <MenuItem
          disabled={!menuTrack?.audioHash}
          onClick={() => {
            void copyValue(
              menuTrack?.audioHash || "",
              "Audio SHA-256 copied."
            );
          }}
          sx={{
            fontSize: 12,
            fontWeight: 800,
            gap: 1,
          }}
        >
          <ContentCopyRoundedIcon
            sx={{
              fontSize: 17,
            }}
          />
          Copy SHA-256
        </MenuItem>
      </Menu>

      <Snackbar
        open={notice.open}
        autoHideDuration={3000}
        onClose={() => {
          setNotice((previous) => ({
            ...previous,
            open: false,
          }));
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() => {
            setNotice((previous) => ({
              ...previous,
              open: false,
            }));
          }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </>
  );
};

type FilterButtonProps = {
  label: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
};

const FilterButton = ({
  label,
  count,
  active = false,
  onClick,
}: FilterButtonProps) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      sx={{
        height: 32,
        px: 1.7,
        borderRadius: "999px",
        color: active ? "#ffffff" : "#cfcfcf",
        backgroundColor: active ? "#FF5500" : "transparent",
        border: active
          ? "1px solid #FF5500"
          : "1px solid rgba(255,255,255,0.24)",
        textTransform: "none",
        fontSize: 11.5,
        fontWeight: 900,
        whiteSpace: "nowrap",
        "&:hover": {
          backgroundColor: active
            ? "#ff6a1a"
            : "rgba(255,255,255,0.06)",
          borderColor: active ? "#ff6a1a" : "#ffffff",
        },
      }}
    >
      {label} {count}
    </Button>
  );
};

export default ArtistTracksTable;