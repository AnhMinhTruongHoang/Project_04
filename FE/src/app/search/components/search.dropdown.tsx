"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import ClickAwayListener from "@mui/material/ClickAwayListener";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";

import { convertSlugUrl, sendRequest } from "@/utils/api";

type SearchDropdownProps = {
  onEmptySearch?: () => void;
};

const SearchDropdown = ({ onEmptySearch }: SearchDropdownProps) => {
  const DEFAULT_IMAGE = "/audio/SC.png";
  const DEFAULT_AUDIO = "/audio/DemoS.mp3";
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<ITrackTop[]>([]);

  const searchValue = keyword.trim();

  const getTrackId = (track?: any) => {
    return track?._id || track?.id || "";
  };

  const getTrackImage = (imgUrl?: string | null) => {
    if (!imgUrl) return DEFAULT_IMAGE;
    if (imgUrl.startsWith("http")) return imgUrl;

    if (imgUrl.startsWith("/uploads/images")) {
      return `${BACKEND_URL}${imgUrl}`;
    }

    if (imgUrl.startsWith("/")) return imgUrl;

    return `${BACKEND_URL}/uploads/images/${imgUrl}`;
  };

  const getTrackAudio = (trackUrl?: string | null) => {
    if (!trackUrl) return DEFAULT_AUDIO;
    if (trackUrl.startsWith("http")) return trackUrl;

    if (trackUrl.startsWith("/uploads/audio")) {
      return `${BACKEND_URL}${trackUrl}`;
    }

    if (trackUrl.startsWith("/")) return `${BACKEND_URL}${trackUrl}`;

    return `${BACKEND_URL}/uploads/audio/${trackUrl}`;
  };

  const normalizeTracks = (data: any): ITrackTop[] => {
    return Array.isArray(data) ? data : data?.result ?? [];
  };

  const filterTracksByKeyword = (tracks: ITrackTop[], keyword: string) => {
    const lowerKeyword = keyword.trim().toLowerCase();

    if (!lowerKeyword) return [];

    return tracks.filter((track) => {
      return [track.title, track.description, track.category]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(lowerKeyword));
    });
  };

  const handleGoSearch = (value?: string) => {
    const finalKeyword = (value ?? keyword).trim();

    if (!finalKeyword) {
      setOpen(false);

      if (onEmptySearch) {
        onEmptySearch();
      } else {
        router.push("/search");
      }

      return;
    }

    setOpen(false);
    router.replace(`/search?q=${encodeURIComponent(finalKeyword)}`);
  };

  const handleGoTrack = (track: ITrackTop) => {
    const trackId = getTrackId(track);

    const trackSlug =
      (track as any).slug || `${convertSlugUrl(track.title)}-${trackId}`;

    setOpen(false);

    router.push(
      `/track/${trackSlug}.html?audio=${encodeURIComponent(
        getTrackAudio(track.trackUrl)
      )}`
    );
  };

  useEffect(() => {
    let active = true;

    const fetchSearchPreview = async () => {
      if (!searchValue) {
        setTracks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await sendRequest<
          IBackendRes<IModelPaginate<ITrackTop> | ITrackTop[]>
        >({
          url: `${BACKEND_URL}/api/v1/tracks`,
          method: "GET",
          queryParams: {
            current: 1,
            pageSize: 100,
          },
        });

        if (!active) return;

        const result = filterTracksByKeyword(
          normalizeTracks(res?.data),
          searchValue
        ).slice(0, 5);

        setTracks(result);
      } catch (error) {
        console.log("SEARCH PREVIEW ERROR:", error);

        if (!active) return;

        setTracks([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchSearchPreview, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchValue]);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
        }}
      >
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleGoSearch();
          }}
          sx={{
            height: 34,
            display: "flex",
            alignItems: "center",
            backgroundColor: "#202225",
            border: open
              ? "1px solid rgba(255,85,0,0.65)"
              : "1px solid rgba(255,255,255,0.12)",
            borderRadius: "4px",
            overflow: "hidden",
            transition: "0.18s ease",

            "&:focus-within": {
              backgroundColor: "#24272a",
              borderColor: "rgba(255,85,0,0.75)",
            },
          }}
        >
          <InputBase
            value={keyword}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setKeyword(e.target.value);
              setOpen(true);
            }}
            placeholder="Search"
            sx={{
              flex: 1,
              height: "100%",
              px: 1.8,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,

              "& input::placeholder": {
                color: "#9a9a9a",
                opacity: 1,
              },
            }}
          />

          <IconButton
            type="submit"
            sx={{
              width: 40,
              height: 34,
              borderRadius: 0,
              color: "#b8b8b8",

              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.06)",
              },
            }}
          >
            <SearchRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {open && searchValue && (
          <Box
            sx={{
              position: "absolute",
              top: 38,
              left: 0,
              right: 0,
              zIndex: 1500,
              backgroundColor: "#0f1111",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "0 0 6px 6px",
              boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
              overflow: "hidden",
            }}
          >
            <Box
              onMouseDown={(e) => {
                e.preventDefault();
                handleGoSearch(searchValue);
              }}
              sx={{
                px: 1.7,
                py: 1.1,
                cursor: "pointer",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 800,

                "&:hover": {
                  backgroundColor: "#1b1d1e",
                },
              }}
            >
              Search for{" "}
              <Box component="span" sx={{ color: "#ffffff", fontWeight: 900 }}>
                “{searchValue}”
              </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

            {loading && (
              <Box
                sx={{
                  px: 1.7,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#b8b8b8",
                }}
              >
                <CircularProgress size={16} sx={{ color: "#ff5500" }} />

                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                  Searching...
                </Typography>
              </Box>
            )}

            {!loading &&
              tracks.slice(0, 3).map((track) => {
                const trackId = getTrackId(track);
                const imageSrc = getTrackImage(track.imgUrl);

                return (
                  <Box
                    key={trackId}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleGoTrack(track);
                    }}
                    sx={{
                      px: 1.7,
                      py: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      cursor: "pointer",

                      "&:hover": {
                        backgroundColor: "#1b1d1e",
                      },

                      "&:hover .track-title": {
                        color: "#ff5500",
                      },
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
                        width: 34,
                        height: 34,
                        objectFit: "cover",
                        borderRadius: "3px",
                        backgroundColor: "#111",
                        flexShrink: 0,
                      }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        className="track-title"
                        noWrap
                        sx={{
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 900,
                          lineHeight: 1.3,
                        }}
                      >
                        Related tracks: {track.title}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          color: "#9a9a9a",
                          fontSize: 11,
                          fontWeight: 600,
                          mt: 0.2,
                        }}
                      >
                        {track.description || "Unknown artist"}
                      </Typography>
                    </Box>

                    <QueueMusicRoundedIcon
                      sx={{
                        color: "#d8d8d8",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                );
              })}

            {!loading && tracks.length > 0 && (
              <Box sx={{ py: 0.5 }}>
                {tracks.slice(0, 5).map((track) => (
                  <Box
                    key={`suggestion-${getTrackId(track)}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleGoSearch(track.title);
                    }}
                    sx={{
                      px: 1.7,
                      py: 0.75,
                      cursor: "pointer",
                      color: "#dcdcdc",
                      fontSize: 13,
                      fontWeight: 800,

                      "&:hover": {
                        color: "#ffffff",
                        backgroundColor: "#1b1d1e",
                      },
                    }}
                  >
                    {track.title}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchDropdown;
