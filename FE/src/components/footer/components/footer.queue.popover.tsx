"use client";

import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

type FooterQueuePopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;

  loading: boolean;
  tracks: ITrackTop[];
  currentTrack?: Partial<ITrackTop> | null;

  autoplayStation: boolean;
  onChangeAutoplayStation: (checked: boolean) => void;

  onClear: () => void;
  onPlayTrack: (track: ITrackTop) => void;
};

const getTrackImage = (track?: Partial<ITrackTop> | null) => {
  const imgUrl = track?.imgUrl;

  if (!imgUrl)
    return "https://res.cloudinary.com/eybmkz9z/image/upload/v1784726300/default_djtlyj.png";
  if (imgUrl.startsWith("http")) return imgUrl;
  if (imgUrl.startsWith("/")) return imgUrl;

  return `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/${imgUrl}`;
};

const getArtistName = (track?: any) => {
  return (
    track?.artistName ||
    track?.artist ||
    track?.author ||
    track?.description ||
    track?.uploader?.name ||
    track?.uploader?.email ||
    "Unknown"
  );
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "";

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = Math.floor(seconds % 60);
  const paddedSeconds = `0${remainSeconds}`.slice(-2);

  return `${minutes}:${paddedSeconds}`;
};

const FooterQueuePopover = ({
  open,
  anchorEl,
  onClose,
  loading,
  tracks,
  currentTrack,
  autoplayStation,
  onChangeAutoplayStation,
  onClear,
  onPlayTrack,
}: FooterQueuePopoverProps) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          width: 430,
          maxWidth: "calc(100vw - 24px)",
          height: 520,
          backgroundColor: "#111314",
          color: "#ffffff",
          borderRadius: "4px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.65)",
          overflow: "hidden",
          mb: 1.5,
        },
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Next up
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              onClick={onClear}
              sx={{
                color: "#cfcfcf",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  color: "#ffffff",
                },
              }}
            >
              Clear
            </Typography>

            <IconButton
              onClick={onClose}
              sx={{
                width: 36,
                height: 36,
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.06)",

                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.12)",
                },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Queue list */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#101212",

            "&::-webkit-scrollbar": {
              width: 8,
            },

            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: 999,
            },

            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
          }}
        >
          {loading ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={28} sx={{ color: "#ff5500" }} />
            </Box>
          ) : tracks.length ? (
            tracks.map((track) => {
              const active = track._id === currentTrack?._id;

              return (
                <Box
                  key={track._id}
                  onClick={() => onPlayTrack(track)}
                  sx={{
                    px: 2,
                    py: 1,
                    minHeight: 56,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    cursor: "pointer",
                    backgroundColor: active
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    transition: "0.16s ease",

                    "&:hover": {
                      backgroundColor: active
                        ? "rgba(255,255,255,0.11)"
                        : "rgba(255,255,255,0.07)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      position: "relative",
                      flexShrink: 0,
                      borderRadius: "2px",
                      overflow: "hidden",
                      backgroundColor: "#222",
                    }}
                  >
                    <Box
                      component="img"
                      src={getTrackImage(track)}
                      alt={track.title}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://res.cloudinary.com/eybmkz9z/image/upload/v1784726300/default_djtlyj.png";
                      }}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    {active && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(0,0,0,0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PlayArrowRoundedIcon
                          sx={{
                            color: "#ffffff",
                            fontSize: 26,
                          }}
                        />
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      title={getArtistName(track)}
                      sx={{
                        color: "#8f8f8f",
                        fontSize: 12,
                        fontWeight: 800,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getArtistName(track)}
                    </Typography>

                    <Typography
                      title={track.title}
                      sx={{
                        color: active ? "#ffffff" : "#d7d7d7",
                        fontSize: 13,
                        fontWeight: 900,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {track.title}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      color: "#8f8f8f",
                      fontSize: 12,
                      fontWeight: 700,
                      minWidth: 34,
                      textAlign: "right",
                    }}
                  >
                    {formatDuration((track as any)?.duration)}
                  </Typography>

                  <FavoriteRoundedIcon
                    sx={{
                      fontSize: 17,
                      color: "#ffffff",
                      opacity: active ? 1 : 0.75,
                    }}
                  />

                  <MoreHorizRoundedIcon
                    sx={{
                      fontSize: 20,
                      color: "#ffffff",
                      opacity: 0.75,
                    }}
                  />
                </Box>
              );
            })
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 3,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#8f8f8f",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                No tracks in your playlist queue.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Autoplay station */}
        <Box
          sx={{
            px: 2,
            py: 1.6,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#111314",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 900,
                }}
              >
                Autoplay station
              </Typography>

              <Typography
                sx={{
                  color: "#b8b8b8",
                  fontSize: 13,
                  mt: 0.4,
                  lineHeight: 1.4,
                }}
              >
                Hear related tracks based on what is playing now.
              </Typography>
            </Box>

            <Switch
              checked={autoplayStation}
              onChange={(e) => onChangeAutoplayStation(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#ff5500",
                },

                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#ff5500",
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Popover>
  );
};

export default FooterQueuePopover;
