"use client";

import { useEffect, useMemo, useState } from "react";

import { useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import CopyrightRoundedIcon from "@mui/icons-material/CopyrightRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";

import { sendRequest } from "@/utils/api";

type TrackFilter = "all" | "public" | "private" | "rejected";

type ArtistStudioTrack = {
  id: string;
  title: string;
  fileName: string;

  imgUrl?: string;
  trackUrl?: string;

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

const getImageUrl = (imgUrl?: string | null) => {
  if (!imgUrl) {
    return "/images/logo/Sc.png";
  }

  if (imgUrl.startsWith("http")) {
    return imgUrl;
  }

  if (imgUrl.startsWith("/")) {
    return imgUrl;
  }

  return `${process.env.NEXT_PUBLIC_BACKEND_URL}` + `/uploads/images/${imgUrl}`;
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
  return (
    normalizeStatus(track.approvalStatus) === "APPROVED" &&
    track.isDeleted !== true
  );
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

    fileName: getFileName(track?.trackUrl),

    imgUrl: track?.imgUrl || undefined,

    trackUrl: track?.trackUrl || undefined,

    approvalStatus: normalizeStatus(track?.approvalStatus) || "UNKNOWN",

    processingStatus: normalizeStatus(track?.processingStatus) || "UNKNOWN",

    copyrightStatus: normalizeStatus(track?.copyrightStatus) || "UNKNOWN",

    copyrightMessage: String(track?.copyrightMessage || ""),

    rejectionReason: String(track?.rejectionReason || ""),

    audioHash: String(track?.audioHash || ""),

    createdAt: track?.createdAt,

    countPlay: Number(track?.countPlay || 0),

    countLike: Number(track?.countLike || 0),

    isDeleted: track?.isDeleted === true,
  };
};

const ArtistTracksTable = () => {
  const { data: session, status: sessionStatus } = useSession();

  const [tracks, setTracks] = useState<ArtistStudioTrack[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [searchValue, setSearchValue] = useState("");

  const [filter, setFilter] = useState<TrackFilter>("all");

  const [sortDescending, setSortDescending] = useState(true);

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
        setLoading(false);

        setLoadError("Please login to view your tracks.");

        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const response = await sendRequest<IBackendRes<ITrackTop[]>>({
          url:
            `${process.env.NEXT_PUBLIC_BACKEND_URL}` +
            "/api/v1/tracks/my-tracks",
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          nextOption: {
            cache: "no-store",
          },
        });

        if (cancelled) {
          return;
        }

        const responseData = response?.data as any;

        const rawTracks: any[] = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.result)
          ? responseData.result
          : Array.isArray(responseData?.content)
          ? responseData.content
          : [];

        const mappedTracks = rawTracks
          .map(mapTrack)
          .filter((track): track is ArtistStudioTrack => Boolean(track));

        setTracks(mappedTracks);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Cannot load artist tracks:", error);

        setTracks([]);

        setLoadError("Cannot load your tracks.");
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
  }, [accessToken, sessionStatus]);

  const visibleTracks = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    return [...tracks]
      .filter((track) => {
        if (filter === "public") {
          return isPublicTrack(track);
        }

        if (filter === "private") {
          return !isPublicTrack(track);
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
        const firstTime = new Date(first.createdAt || 0).getTime();

        const secondTime = new Date(second.createdAt || 0).getTime();

        return sortDescending ? secondTime - firstTime : firstTime - secondTime;
      });
  }, [tracks, searchValue, filter, sortDescending]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 280,
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

  return (
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
          mb: 3,
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
            gap: 1.2,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              width: {
                xs: "100%",
                sm: 300,
              },
              height: 34,
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              px: 1.5,
              color: "#8B949E",
            }}
          >
            <SearchRoundedIcon
              sx={{
                fontSize: 18,
                mr: 1,
              }}
            />

            <InputBase
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search tracks, hash or admin note"
              sx={{
                color: "#ffffff",
                fontSize: 13,
                flex: 1,

                "& input::placeholder": {
                  color: "#8B949E",
                  opacity: 1,
                },
              }}
            />
          </Box>

          <FilterButton
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />

          <FilterButton
            label="Public"
            active={filter === "public"}
            onClick={() => setFilter("public")}
          />

          <FilterButton
            label="Private"
            active={filter === "private"}
            onClick={() => setFilter("private")}
          />

          <FilterButton
            label="Rejected"
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
            gap: 2,
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
            onClick={() => setSortDescending((previous) => !previous)}
            startIcon={<SortRoundedIcon />}
            sx={{
              color: "#ffffff",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 950,
            }}
          >
            Date
          </Button>
        </Box>
      </Box>

      {loadError && (
        <Typography
          sx={{
            mb: 2,
            color: "#ff7b7b",
            fontSize: 13,
            fontWeight: 850,
          }}
        >
          {loadError}
        </Typography>
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
        <Box>
          <Checkbox
            size="small"
            sx={{
              color: "#ffffff",
              p: 0,

              "&.Mui-checked": {
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

      {!visibleTracks.length && (
        <Box
          sx={{
            minHeight: 240,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
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
            No tracks found
          </Typography>
        </Box>
      )}

      {visibleTracks.map((track) => {
        const rejected = isRejectedTrack(track);

        const adminNote = getAdminNote(track);

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

              backgroundColor: rejected
                ? "rgba(255,48,64,0.025)"
                : "transparent",

              "&:hover": {
                backgroundColor: rejected
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
              {rejected ? (
                <Tooltip title={adminNote || "Track rejected"} arrow>
                  <WarningRoundedIcon
                    sx={{
                      color: "#ff3040",
                      fontSize: 22,
                    }}
                  />
                </Tooltip>
              ) : (
                <Checkbox
                  size="small"
                  sx={{
                    color: "#ffffff",
                    p: 0,

                    "&.Mui-checked": {
                      color: "#FF5500",
                    },
                  }}
                />
              )}
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
                  alt={track.title}
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
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0,0,0,0.55)",
                    }}
                  >
                    <CopyrightRoundedIcon
                      sx={{
                        color: "#ff5060",
                        fontSize: 25,
                      }}
                    />
                  </Box>
                )}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 950,
                    lineHeight: 1.35,
                  }}
                >
                  {track.title}
                </Typography>

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
                    gap: 0.5,
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

            <Typography
              sx={{
                ...cellSx,
                display: {
                  xs: "none",
                  md: "block",
                },
              }}
            >
              {track.countPlay}
            </Typography>

            <IconButton
              size="small"
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
  );
};

type FilterButtonProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const FilterButton = ({
  label,
  active = false,
  onClick,
}: FilterButtonProps) => {
  return (
    <Button
      onClick={onClick}
      sx={{
        height: 32,
        px: 2.2,
        borderRadius: "999px",

        color: active ? "#ffffff" : "#cfcfcf",

        backgroundColor: active ? "#FF5500" : "transparent",

        border: active
          ? "1px solid #FF5500"
          : "1px solid rgba(255,255,255,0.24)",

        textTransform: "none",
        fontSize: 12,
        fontWeight: 900,

        display: {
          xs: "none",
          sm: "inline-flex",
        },

        "&:hover": {
          backgroundColor: active ? "#ff6a1a" : "rgba(255,255,255,0.06)",

          borderColor: active ? "#ff6a1a" : "#ffffff",
        },
      }}
    >
      {label}
    </Button>
  );
};

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

export default ArtistTracksTable;
