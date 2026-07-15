"use client";

import * as React from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

import { useTrackContext } from "@/lib/track.wrapper";

const BLACKPINK_TITLES = [
  "How You Like That",
  "Shut Down",
  "Pink Venom",
  "JUMP",
  "DDU-DU DDU-DU",
];

const normalizeText = (value?: string) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const getArtistName = (track: any) => {
  return (
    track?.artistName ||
    track?.artist ||
    track?.author ||
    track?.uploader?.name ||
    track?.user?.name ||
    "BLACKPINK"
  );
};

const getTrackId = (track?: any) => {
  return track?._id || track?.id || track?.trackId || "";
};

const getTrackImageUrl = (track?: any) => {
  const image = track?.imgUrl || track?.image || track?.thumbnail || "";

  if (!image) {
    return "/images/media/blackpink-main.jpg";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  return `${backendUrl}/${image.replace(/^\/+/, "")}`;
};

const normalizeTrackForFooter = (track: any) => {
  const trackId = getTrackId(track);

  if (!trackId) {
    return null;
  }

  return {
    ...track,

    _id: track._id || trackId,
    id: track.id || trackId,

    trackUrl: track.trackUrl || track.audioUrl || track.audio || track.fileName,

    imgUrl: track.imgUrl || track.image || track.thumbnail,

    isPlaying: true,
    source: "blackpink-slider",

    currentTime: 0,
    duration: 0,

    seekTime: undefined,
    seekId: Date.now(),
  };
};

export default function BlackpinkTrackSlider() {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const [tracks, setTracks] = React.useState<ITrackTop[]>([]);

  const [loading, setLoading] = React.useState(true);

  const { setCurrentTrack } = useTrackContext() as ITrackContext;

  React.useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top?category=kpop`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`Fetch BLACKPINK tracks failed: ${response.status}`);
        }

        const json = await response.json();

        const data = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.data?.result)
          ? json.data.result
          : Array.isArray(json?.result)
          ? json.result
          : [];

        console.log("BLACKPINK RAW RESPONSE:", json);
        console.log("BLACKPINK DATA:", data);

        setTracks(data.slice(0, 10));
      } catch (error) {
        console.error("Fetch BLACKPINK tracks failed:", error);

        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchTracks();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollBy({
      left: direction === "left" ? -370 : 370,

      behavior: "smooth",
    });
  };

  const handlePlayTrack = (track: ITrackTop) => {
    const nextTrack = normalizeTrackForFooter(track);

    if (!nextTrack) {
      return;
    }

    setCurrentTrack(nextTrack as any);
  };

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        alignItems={{
          xs: "flex-start",
          md: "flex-end",
        }}
        justifyContent="space-between"
        spacing={3}
        sx={{
          mb: 3,
        }}
      >
        <Box>
          <Chip
            label="#PINK_SELECTION"
            sx={{
              mb: 1.5,

              height: 30,

              color: "#111111",
              bgcolor: "#ff7eb6",

              borderRadius: "6px",

              fontSize: 11,
              fontWeight: 950,
              letterSpacing: "0.12em",

              boxShadow: "0 12px 34px rgba(255,126,182,0.24)",
            }}
          />

          <Typography
            sx={{
              maxWidth: 780,

              color: "#ffffff",

              fontSize: {
                xs: 30,
                md: 52,
              },

              lineHeight: {
                xs: "40px",
                md: "62px",
              },

              fontWeight: 950,
              letterSpacing: "-0.06em",

              textShadow: "0 18px 70px rgba(0,0,0,0.75)",
            }}
          >
            The tracks that turned four voices into one global signal
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              maxWidth: 650,

              color: "#a0a0a0",

              fontSize: {
                xs: 14,
                md: 16,
              },

              lineHeight: {
                xs: "24px",
                md: "28px",
              },

              fontWeight: 600,
            }}
          >
            From explosive debuts to polished global anthems, these songs shaped
            the BLACKPINK universe.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            display: {
              xs: "none",
              md: "flex",
            },
          }}
        >
          <IconButton
            aria-label="Previous tracks"
            onClick={() => scroll("left")}
            sx={{
              width: 44,
              height: 44,

              color: "#ffffff",
              bgcolor: "rgba(255,255,255,0.07)",

              borderRadius: "8px",

              border: "1px solid rgba(255,255,255,0.14)",

              "&:hover": {
                color: "#111111",
                bgcolor: "#ff7eb6",
                borderColor: "#ff7eb6",
              },
            }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>

          <IconButton
            aria-label="Next tracks"
            onClick={() => scroll("right")}
            sx={{
              width: 44,
              height: 44,

              color: "#ffffff",
              bgcolor: "rgba(255,255,255,0.07)",

              borderRadius: "8px",

              border: "1px solid rgba(255,255,255,0.14)",

              "&:hover": {
                color: "#111111",
                bgcolor: "#ff7eb6",
                borderColor: "#ff7eb6",
              },
            }}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>

      {loading ? (
        <Box
          sx={{
            minHeight: 250,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            color: "#777777",

            border: "1px solid rgba(255,255,255,0.08)",

            bgcolor: "rgba(15,15,15,0.72)",
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
            }}
          >
            LOADING BLACKPINK TRACKS...
          </Typography>
        </Box>
      ) : tracks.length === 0 ? (
        <Box
          sx={{
            minHeight: 250,
            px: 3,

            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",

            textAlign: "center",

            border: "1px solid rgba(255,126,182,0.16)",

            bgcolor: "rgba(15,15,15,0.78)",
          }}
        >
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 950,
            }}
          >
            No BLACKPINK tracks found
          </Typography>

          <Typography
            sx={{
              mt: 1,

              color: "#858585",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Add BLACKPINK tracks to the database or check their title and artist
            information.
          </Typography>
        </Box>
      ) : (
        <Box
          ref={scrollRef}
          sx={{
            display: "flex",
            gap: 2,

            overflowX: "auto",
            scrollSnapType: "x mandatory",

            pb: 1,
            pr: {
              xs: 2,
              md: 8,
            },

            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {tracks.map((track, index) => (
            <Box
              key={getTrackId(track) || track.title}
              role="button"
              tabIndex={0}
              onClick={() => handlePlayTrack(track)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();

                  handlePlayTrack(track);
                }
              }}
              sx={{
                minWidth: {
                  xs: 260,
                  sm: 310,
                  md: 340,
                },

                maxWidth: {
                  xs: 260,
                  sm: 310,
                  md: 340,
                },

                scrollSnapAlign: "start",

                overflow: "hidden",

                bgcolor: "rgba(17,17,17,0.9)",

                border: "1px solid rgba(255,255,255,0.1)",

                boxShadow: "0 22px 65px rgba(0,0,0,0.48)",

                cursor: "pointer",

                transition:
                  "transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease",

                "&:hover": {
                  transform: "translateY(-6px)",

                  borderColor: "rgba(255,126,182,0.52)",

                  boxShadow: "0 28px 80px rgba(255,71,148,0.12)",
                },

                "&:focus-visible": {
                  outline: "2px solid #ff7eb6",

                  outlineOffset: "3px",
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: 205,
                  overflow: "hidden",
                }}
              >
                <Box
                  component="img"
                  src={getTrackImageUrl(track)}
                  alt={track.title}
                  sx={{
                    width: "100%",
                    height: "100%",

                    display: "block",

                    objectFit: "cover",
                    objectPosition: "center",

                    opacity: 0.88,

                    filter: "saturate(0.92) contrast(1.08)",

                    transition: "transform 500ms ease",
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,

                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.02) 20%, rgba(0,0,0,0.82) 100%)",
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    left: 14,
                    top: 14,

                    px: 1,
                    py: 0.5,

                    color: "#111111",
                    bgcolor: "#ff7eb6",

                    borderRadius: "4px",

                    fontSize: 10,
                    fontWeight: 950,
                    letterSpacing: "0.09em",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </Box>

                <IconButton
                  aria-label={`Play ${track.title}`}
                  onClick={(event) => {
                    event.stopPropagation();

                    handlePlayTrack(track);
                  }}
                  sx={{
                    position: "absolute",
                    right: 14,
                    bottom: 14,

                    width: 46,
                    height: 46,

                    color: "#111111",
                    bgcolor: "#ff7eb6",

                    borderRadius: "8px",

                    boxShadow: "0 12px 30px rgba(255,126,182,0.3)",

                    "&:hover": {
                      color: "#ffffff",
                      bgcolor: "#ff4f9d",
                    },
                  }}
                >
                  <PlayArrowRoundedIcon />
                </IconButton>

                <Typography
                  sx={{
                    position: "absolute",
                    left: 14,
                    bottom: 18,

                    maxWidth: "68%",

                    color: "#ff7eb6",

                    fontSize: 11,
                    fontWeight: 950,
                    letterSpacing: "0.1em",

                    textTransform: "uppercase",

                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  #{track.category?.toUpperCase() || "K-POP"}
                </Typography>
              </Box>

              <Box
                sx={{
                  position: "relative",
                  p: 2.2,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,

                    width: 72,
                    height: 2,

                    bgcolor: "#ff7eb6",
                  }}
                />

                <Typography
                  sx={{
                    mb: 0.8,

                    color: "#ffffff",

                    fontSize: 20,
                    lineHeight: "26px",
                    fontWeight: 950,

                    display: "-webkit-box",

                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",

                    overflow: "hidden",
                  }}
                >
                  {track.title}
                </Typography>

                <Typography
                  sx={{
                    color: "#999999",
                    fontSize: 14,
                    fontWeight: 750,

                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getArtistName(track)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
