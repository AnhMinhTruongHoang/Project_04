"use client";

import { convertSlugUrl, sendRequest } from "@/utils/api";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";

type Props = {
  query?: string;
};

const DEFAULT_IMAGE = "/audio/SC.png";
const DEFAULT_AUDIO = "/audio/DemoS.mp3";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getTrackImage = (imgUrl?: string) => {
  if (!imgUrl) return DEFAULT_IMAGE;
  if (imgUrl.startsWith("http")) return imgUrl;
  if (imgUrl.startsWith("/")) return imgUrl;

  return `${BACKEND_URL}/images/${imgUrl}`;
};

const ClientSearch = ({ query = "" }: Props) => {
  const [tracks, setTracks] = useState<ITrackTop[]>([]);
  const [loading, setLoading] = useState(false);

  const keyword = query.trim();

  useEffect(() => {
    document.title = keyword
      ? `Search results for "${keyword}" - Sound Clone`
      : "Search - Sound Clone";

    let active = true;

    const fetchData = async () => {
      if (!keyword) {
        setTracks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
          url: `${BACKEND_URL}/api/v1/tracks/search`,
          method: "POST",
          body: {
            current: 1,
            pageSize: 20,
            title: keyword,
          },
        });

        if (!active) return;

        setTracks(res?.data?.result ?? []);
      } catch (error) {
        console.log("SEARCH TRACK ERROR:", error);

        if (!active) return;

        setTracks([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [keyword]);

  if (!keyword) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 80px)",
          backgroundColor: "#181A1B",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          textAlign: "center",
        }}
      >
        <Box>
          <SearchRoundedIcon
            sx={{
              fontSize: 64,
              color: "#ff5500",
              mb: 1.5,
            }}
          />

          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 900,
              mb: 1,
            }}
          >
            Search tracks
          </Typography>

          <Typography
            sx={{
              color: "#9a9a9a",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Enter a keyword to find tracks on Sound Clone.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 80px)",
          backgroundColor: "#181A1B",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        <CircularProgress size={24} sx={{ color: "#ff5500" }} />

        <Typography
          sx={{
            color: "#cfcfcf",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Searching...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 80px)",
        backgroundColor: "#181A1B",
        color: "#ffffff",
        px: { xs: 2, md: 4 },
        py: 4,
        pb: 10,
      }}
    >
      <Box
        sx={{
          maxWidth: 1040,
          mx: "auto",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 26, md: 34 },
              fontWeight: 900,
              color: "#ffffff",
              mb: 0.8,
            }}
          >
            Search results
          </Typography>

          <Typography
            sx={{
              color: "#9a9a9a",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Showing results for{" "}
            <Box component="span" sx={{ color: "#ff5500", fontWeight: 900 }}>
              {keyword}
            </Box>
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 3 }} />

        {/* Empty */}
        {!tracks.length && (
          <Box
            sx={{
              minHeight: 260,
              border: "1px dashed rgba(255,255,255,0.14)",
              borderRadius: 3,
              backgroundColor: "#111314",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <MusicOffRoundedIcon
              sx={{
                fontSize: 58,
                color: "#ff5500",
                mb: 1.5,
              }}
            />

            <Typography
              sx={{
                fontSize: 21,
                fontWeight: 900,
                color: "#ffffff",
                mb: 0.8,
              }}
            >
              No results found
            </Typography>

            <Typography
              sx={{
                color: "#9a9a9a",
                fontSize: 14,
              }}
            >
              Try another keyword or check your spelling.
            </Typography>
          </Box>
        )}

        {/* Results */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.2,
          }}
        >
          {tracks.map((track) => {
            const imageSrc = getTrackImage(track?.imgUrl);

            const href = `/track/${convertSlugUrl(track.title)}-${
              track._id
            }.html?audio=${encodeURIComponent(
              track.trackUrl || DEFAULT_AUDIO
            )}`;

            return (
              <Box
                key={track._id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.8,
                  p: 1.4,
                  borderRadius: 2,
                  backgroundColor: "#111314",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "0.18s ease",

                  "&:hover": {
                    backgroundColor: "#16191a",
                    borderColor: "rgba(255,85,0,0.32)",
                  },

                  "&:hover .play-icon": {
                    opacity: 1,
                    transform: "translate(-50%, -50%) scale(1)",
                  },

                  "&:hover .track-title": {
                    color: "#ff5500",
                  },
                }}
              >
                <Box
                  component={Link}
                  href={href}
                  sx={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    borderRadius: "4px",
                    overflow: "hidden",
                    backgroundColor: "#0b0c0d",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Box
                    component="img"
                    src={imageSrc}
                    alt={track.title}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMAGE;
                    }}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <Box
                    className="play-icon"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      backgroundColor: "#ff5500",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transform: "translate(-50%, -50%) scale(0.92)",
                      transition: "0.18s ease",
                      boxShadow: "0 10px 24px rgba(255,85,0,0.35)",
                    }}
                  >
                    <PlayArrowRoundedIcon
                      sx={{
                        color: "#ffffff",
                        fontSize: 27,
                        ml: "2px",
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    component={Link}
                    href={href}
                    className="track-title"
                    title={track.title}
                    sx={{
                      display: "block",
                      width: "fit-content",
                      maxWidth: "100%",
                      color: "#ffffff",
                      fontSize: 15,
                      fontWeight: 900,
                      lineHeight: 1.35,
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      transition: "0.18s ease",

                      "&:hover": {
                        color: "#ff5500",
                      },
                    }}
                  >
                    {track.title}
                  </Typography>

                  <Typography
                    title={track.description}
                    sx={{
                      mt: 0.4,
                      color: "#9a9a9a",
                      fontSize: 13,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {track.description || "Unknown artist"}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.4,
                      mt: 0.8,
                      color: "#8f8f8f",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.3 }}
                    >
                      <PlayArrowRoundedIcon sx={{ fontSize: 16 }} />
                      {track.countPlay ?? 0}
                    </Box>

                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.3 }}
                    >
                      <FavoriteRoundedIcon sx={{ fontSize: 14 }} />
                      {track.countLike ?? 0}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default ClientSearch;
