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
  const DEFAULT_IMAGE = "https://res.cloudinary.com/eybmkz9z/image/upload/v1784726300/default_djtlyj.png";
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
    <ClickAwayListener
      onClickAway={() => {
        setOpen(false);
      }}
    >
      {/* SEARCH ROOT */}
      <Box
        sx={{
          position: "relative",

          width: "100%",

          maxWidth: {
            xs: "100%",
            md: 420,
          },

          minWidth: 0,
        }}
      >
        {/* SEARCH INPUT */}
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();

            handleGoSearch();
          }}
          sx={{
            width: "100%",

            height: {
              xs: 32,
              sm: 34,
            },

            display: "flex",
            alignItems: "center",

            backgroundColor: "#202225",

            border: open
              ? "1px solid rgba(255,85,0,0.65)"
              : "1px solid rgba(255,255,255,0.12)",

            borderRadius: {
              xs: "5px",
              md: "4px",
            },

            overflow: "hidden",

            transition: "0.18s ease",

            "&:focus-within": {
              backgroundColor: "#24272a",

              borderColor: "rgba(255,85,0,0.75)",
            },
          }}
        >
          {/* SEARCH TEXT */}
          <InputBase
            value={keyword}
            onFocus={() => {
              setOpen(true);
            }}
            onChange={(event) => {
              setKeyword(event.target.value);

              setOpen(true);
            }}
            placeholder="Search"
            sx={{
              flex: 1,
              minWidth: 0,

              height: "100%",

              px: {
                xs: 1.1,
                sm: 1.5,
                md: 1.8,
              },

              color: "#ffffff",

              fontSize: {
                xs: 12,
                sm: 13,
                md: 14,
              },

              fontWeight: 600,

              "& input": {
                minWidth: 0,

                p: 0,
              },

              "& input::placeholder": {
                color: "#9a9a9a",

                opacity: 1,
              },
            }}
          />

          {/* SEARCH BUTTON */}
          <IconButton
            type="submit"
            aria-label="Search"
            sx={{
              width: {
                xs: 34,
                md: 40,
              },

              height: {
                xs: 32,
                md: 34,
              },

              flexShrink: 0,

              borderRadius: 0,

              color: "#b8b8b8",

              "&:hover": {
                color: "#ffffff",

                backgroundColor: "rgba(255,255,255,0.06)",
              },

              "& .MuiSvgIcon-root": {
                fontSize: {
                  xs: 18,
                  md: 20,
                },
              },
            }}
          >
            <SearchRoundedIcon />
          </IconButton>
        </Box>

        {/* SEARCH DROPDOWN */}
        {open && searchValue && (
          <Box
            sx={{
              // Mobile:
              // bung dropdown rá»™ng theo viewport.
              position: {
                xs: "fixed",
                md: "absolute",
              },

              top: {
                xs: 58,
                md: 38,
              },

              left: {
                xs: 8,
                md: 0,
              },

              right: {
                xs: 8,
                md: 0,
              },

              width: {
                xs: "auto",
                md: "100%",
              },

              maxHeight: {
                xs: "calc(100dvh - 80px)",
                md: 480,
              },

              zIndex: 1600,

              backgroundColor: "#0f1111",

              border: "1px solid rgba(255,255,255,0.18)",

              borderRadius: {
                xs: "8px",
                md: "0 0 6px 6px",
              },

              boxShadow: "0 18px 50px rgba(0,0,0,0.60)",

              overflowX: "hidden",
              overflowY: "auto",

              WebkitOverflowScrolling: "touch",

              "&::-webkit-scrollbar": {
                width: 5,
              },

              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(255,255,255,0.14)",

                borderRadius: "999px",
              },
            }}
          >
            {/* SEARCH FOR KEYWORD */}
            <Box
              onMouseDown={(event) => {
                event.preventDefault();

                handleGoSearch(searchValue);
              }}
              sx={{
                px: {
                  xs: 1.5,
                  md: 1.7,
                },

                py: {
                  xs: 1.3,
                  md: 1.1,
                },

                cursor: "pointer",

                color: "#ffffff",

                fontSize: {
                  xs: 13,
                  md: 13,
                },

                fontWeight: 800,

                "&:hover": {
                  backgroundColor: "#1b1d1e",
                },
              }}
            >
              Search for{" "}
              <Box
                component="span"
                sx={{
                  color: "#ff5500",

                  fontWeight: 900,
                }}
              >
                â€œ{searchValue}â€
              </Box>
            </Box>

            <Divider
              sx={{
                borderColor: "rgba(255,255,255,0.1)",
              }}
            />

            {/* SEARCH LOADING */}
            {loading && (
              <Box
                sx={{
                  px: 1.7,
                  py: 1.8,

                  display: "flex",
                  alignItems: "center",

                  gap: 1,

                  color: "#b8b8b8",
                }}
              >
                <CircularProgress
                  size={16}
                  sx={{
                    color: "#ff5500",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 13,

                    fontWeight: 700,
                  }}
                >
                  Searching...
                </Typography>
              </Box>
            )}

            {/* RELATED TRACKS */}
            {!loading &&
              tracks.slice(0, 3).map((track) => {
                const trackId = getTrackId(track);

                const imageSrc = getTrackImage(track.imgUrl);

                return (
                  <Box
                    key={trackId}
                    onMouseDown={(event) => {
                      event.preventDefault();

                      handleGoTrack(track);
                    }}
                    sx={{
                      px: {
                        xs: 1.4,
                        md: 1.7,
                      },

                      py: {
                        xs: 1.1,
                        md: 1,
                      },

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
                    {/* TRACK IMAGE */}
                    <Box
                      component="img"
                      src={imageSrc}
                      alt={track.title}
                      onError={(event) => {
                        event.currentTarget.src = DEFAULT_IMAGE;
                      }}
                      sx={{
                        width: {
                          xs: 42,
                          md: 34,
                        },

                        height: {
                          xs: 42,
                          md: 34,
                        },

                        objectFit: "cover",

                        borderRadius: "4px",

                        backgroundColor: "#111",

                        flexShrink: 0,
                      }}
                    />

                    {/* TRACK INFO */}
                    <Box
                      sx={{
                        flex: 1,

                        minWidth: 0,
                      }}
                    >
                      <Typography
                        className="track-title"
                        noWrap
                        sx={{
                          color: "#ffffff",

                          fontSize: {
                            xs: 13,
                            md: 13,
                          },

                          fontWeight: 900,

                          lineHeight: 1.3,
                        }}
                      >
                        {track.title}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.25,

                          color: "#9a9a9a",

                          fontSize: {
                            xs: 11,
                            md: 11,
                          },

                          fontWeight: 600,
                        }}
                      >
                        {track.description || "Unknown artist"}
                      </Typography>
                    </Box>

                    {/* TRACK ICON */}
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

            {/* TEXT SUGGESTIONS */}
            {!loading && tracks.length > 0 && (
              <>
                <Divider
                  sx={{
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                />

                <Box
                  sx={{
                    py: 0.5,
                  }}
                >
                  {tracks.slice(0, 5).map((track) => (
                    <Box
                      key={`suggestion-${getTrackId(track)}`}
                      onMouseDown={(event) => {
                        event.preventDefault();

                        handleGoSearch(track.title);
                      }}
                      sx={{
                        px: {
                          xs: 1.5,
                          md: 1.7,
                        },

                        py: {
                          xs: 1,
                          md: 0.75,
                        },

                        cursor: "pointer",

                        color: "#dcdcdc",

                        fontSize: 13,

                        fontWeight: 800,

                        overflow: "hidden",

                        textOverflow: "ellipsis",

                        whiteSpace: "nowrap",

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
              </>
            )}

            {/* EMPTY RESULT */}
            {!loading && tracks.length === 0 && (
              <Box
                sx={{
                  px: 1.7,

                  py: 2,

                  color: "#8f8f8f",

                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,

                    fontWeight: 700,
                  }}
                >
                  No related tracks found
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchDropdown;

