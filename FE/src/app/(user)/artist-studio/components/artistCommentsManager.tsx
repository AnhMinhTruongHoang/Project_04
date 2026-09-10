"use client";

import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteArtistStudioCommentApi,
  getArtistStudioCommentsApi,
  getMyTracksApi,
  getTrackId,
} from "@/utils/api";

import { useToast } from "@/utils/toast";

type Props = {
  accessToken?: string;

  onDeleted?: () => void;
};

const getCommentId = (comment?: ITrackComment | null) => {
  return comment?._id || comment?.id || "";
};

const getTrackObject = (comment?: ITrackComment | null): ITrackTop | null => {
  if (comment?.track && typeof comment.track === "object") {
    return comment.track;
  }

  return null;
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",

    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatMoment = (value?: number | null) => {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return null;
  }

  const minutes = Math.floor(seconds / 60);

  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const ArtistCommentsManager = ({ accessToken, onDeleted }: Props) => {
  const toast = useToast();

  const [comments, setComments] = useState<ITrackComment[]>([]);

  const [tracks, setTracks] = useState<ITrackTop[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadingTracks, setLoadingTracks] = useState(true);

  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");

  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const [selectedTrackId, setSelectedTrackId] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);

  const [total, setTotal] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<ITrackComment | null>(null);

  const [deletingId, setDeletingId] = useState("");

  /*
   * =========================================
   * SEARCH DEBOUNCE
   * =========================================
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());

      setCurrentPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [keyword]);

  /*
   * =========================================
   * LOAD MY TRACKS
   * =========================================
   */
  const loadTracks = useCallback(async () => {
    if (!accessToken) {
      setTracks([]);
      setLoadingTracks(false);

      return;
    }

    try {
      setLoadingTracks(true);

      const response = await getMyTracksApi(accessToken);

      setTracks(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      console.error("Cannot load Artist Studio tracks:", requestError);

      setTracks([]);
    } finally {
      setLoadingTracks(false);
    }
  }, [accessToken]);

  /*
   * =========================================
   * LOAD COMMENTS
   * =========================================
   */
  const loadComments = useCallback(async () => {
    if (!accessToken) {
      setComments([]);
      setTotal(0);
      setTotalPages(0);

      setLoading(false);

      setError("Please login to manage comments.");

      return;
    }

    try {
      setLoading(true);

      setError("");

      const response = await getArtistStudioCommentsApi(accessToken, {
        current: currentPage,

        pageSize: 20,

        keyword: debouncedKeyword,

        trackId: selectedTrackId,
      });

      if (
        response?.error ||
        Number(response?.statusCode) >= 400 ||
        !response?.data
      ) {
        throw new Error(response?.message || "Unable to load comments.");
      }

      const data = response.data;

      setComments(Array.isArray(data.result) ? data.result : []);

      setTotal(Number(data.total || 0));

      setTotalPages(Number(data.totalPages || 0));
    } catch (requestError) {
      console.error("Cannot load Artist Studio comments:", requestError);

      setComments([]);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load comments."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, debouncedKeyword, selectedTrackId]);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  /*
   * =========================================
   * SELECT TRACK FILTER
   * =========================================
   */
  const handleTrackChange = (trackId: string) => {
    setSelectedTrackId(trackId);

    setCurrentPage(1);
  };

  /*
   * =========================================
   * DELETE COMMENT
   * =========================================
   */
  const handleDeleteComment = async () => {
    const commentId = getCommentId(deleteTarget);

    if (!commentId || !accessToken || deletingId) {
      return;
    }

    try {
      setDeletingId(commentId);

      const response = await deleteArtistStudioCommentApi(
        commentId,
        accessToken
      );

      if (
        response?.error ||
        Number(response?.statusCode) >= 400 ||
        !response?.data
      ) {
        throw new Error(response?.message || "Unable to delete comment.");
      }

      setComments((current) =>
        current.filter((comment) => getCommentId(comment) !== commentId)
      );

      setTotal((current) => Math.max(current - 1, 0));

      toast.success("Comment deleted.");

      setDeleteTarget(null);

      onDeleted?.();
    } catch (requestError) {
      console.error("Cannot delete Artist Studio comment:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete comment."
      );
    } finally {
      setDeletingId("");
    }
  };

  /*
   * =========================================
   * FILTER LABEL
   * =========================================
   */
  const selectedTrack = useMemo(() => {
    return (
      tracks.find((track) => getTrackId(track) === selectedTrackId) || null
    );
  }, [tracks, selectedTrackId]);

  return (
    <>
      <Box
        sx={{
          overflow: "hidden",

          border: "1px solid rgba(255,255,255,0.08)",

          borderRadius: "18px",

          background:
            "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: {
              xs: 2,
              md: 2.5,
            },

            py: 2.25,

            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <ChatBubbleOutlineRoundedIcon
                  sx={{
                    color: "#FF5500",
                  }}
                />

                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: 18,
                    fontWeight: 950,
                  }}
                >
                  Track comments
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 0.5,

                  color: "#7F8790",

                  fontSize: 12.5,
                }}
              >
                Manage comments posted on your SoundClone tracks.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  px: 1.25,
                  py: 0.65,

                  bgcolor: "rgba(255,85,0,0.08)",

                  border: "1px solid rgba(255,85,0,0.18)",

                  borderRadius: 99,
                }}
              >
                <Typography
                  sx={{
                    color: "#FF7A35",

                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {total} comments
                </Typography>
              </Box>

              <Button
                onClick={() => {
                  void loadComments();
                }}
                disabled={loading}
                startIcon={<RefreshRoundedIcon />}
                sx={{
                  color: "#FFFFFF",

                  bgcolor: "#242729",

                  borderRadius: 2,

                  fontSize: 12,
                  fontWeight: 850,

                  textTransform: "none",

                  "&:hover": {
                    bgcolor: "#303335",
                  },
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {/* FILTERS */}
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1fr) 260px",
              },

              gap: 1.5,

              mt: 2,
            }}
          >
            <TextField
              size="small"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
              }}
              placeholder="Search comments, users, or tracks..."
              InputProps={{
                startAdornment: (
                  <SearchRoundedIcon
                    sx={{
                      mr: 1,

                      color: "#6F7780",

                      fontSize: 20,
                    }}
                  />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#FFFFFF",

                  bgcolor: "#101213",

                  borderRadius: 2,

                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.10)",
                  },

                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.20)",
                  },

                  "&.Mui-focused fieldset": {
                    borderColor: "#FF5500",
                  },
                },
              }}
            />

            <TextField
              select
              size="small"
              value={selectedTrackId}
              disabled={loadingTracks}
              onChange={(event) => {
                handleTrackChange(event.target.value);
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#FFFFFF",

                  bgcolor: "#101213",

                  borderRadius: 2,

                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.10)",
                  },
                },

                "& .MuiSvgIcon-root": {
                  color: "#8B949E",
                },
              }}
            >
              <MenuItem value="">All tracks</MenuItem>

              {tracks.map((track) => {
                const trackId = getTrackId(track);

                if (!trackId) {
                  return null;
                }

                return (
                  <MenuItem key={trackId} value={trackId}>
                    {track.title}
                  </MenuItem>
                );
              })}
            </TextField>
          </Box>

          {selectedTrack && (
            <Typography
              sx={{
                mt: 1,

                color: "#6F7780",

                fontSize: 11.5,
              }}
            >
              Showing comments for{" "}
              <Box
                component="span"
                sx={{
                  color: "#C7CDD4",
                  fontWeight: 800,
                }}
              >
                {selectedTrack.title}
              </Box>
            </Typography>
          )}
        </Box>

        {/* LOADING */}
        {loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1.5}
            sx={{
              minHeight: 300,
            }}
          >
            <CircularProgress
              size={34}
              sx={{
                color: "#FF5500",
              }}
            />

            <Typography
              sx={{
                color: "#7F8790",
                fontSize: 13,
              }}
            >
              Loading comments...
            </Typography>
          </Stack>
        ) : error ? (
          /* ERROR */
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1.5}
            sx={{
              minHeight: 300,

              px: 3,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#FF9C9C",

                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {error}
            </Typography>

            <Button
              onClick={() => {
                void loadComments();
              }}
              sx={{
                color: "#FFFFFF",

                bgcolor: "#242729",

                textTransform: "none",
              }}
            >
              Try again
            </Button>
          </Stack>
        ) : comments.length === 0 ? (
          /* EMPTY */
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{
              minHeight: 300,

              px: 3,
              textAlign: "center",
            }}
          >
            <ChatBubbleOutlineRoundedIcon
              sx={{
                color: "#4D5358",
                fontSize: 44,
              }}
            />

            <Typography
              sx={{
                color: "#FFFFFF",

                fontSize: 16,
                fontWeight: 900,
              }}
            >
              No comments found
            </Typography>

            <Typography
              sx={{
                color: "#737B84",

                fontSize: 13,
              }}
            >
              Comments on your tracks will appear here.
            </Typography>
          </Stack>
        ) : (
          /* COMMENTS */
          <Stack>
            {comments.map((comment) => {
              const commentId = getCommentId(comment);

              const user = comment.user;

              const track = getTrackObject(comment);

              const moment = formatMoment(comment.moment);

              return (
                <Box
                  key={commentId}
                  sx={{
                    px: {
                      xs: 2,
                      md: 2.5,
                    },

                    py: 2,

                    borderBottom: "1px solid rgba(255,255,255,0.065)",

                    "&:last-of-type": {
                      borderBottom: "none",
                    },

                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.018)",
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                      src={user?.avatarUrl || user?.avatar || undefined}
                      alt={user?.name || "SoundClone user"}
                      sx={{
                        width: 42,
                        height: 42,

                        bgcolor: "#292C2F",
                      }}
                    />

                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                            flexWrap="wrap"
                          >
                            <Typography
                              sx={{
                                color: "#FFFFFF",

                                fontSize: 13,
                                fontWeight: 900,
                              }}
                            >
                              {user?.name ||
                                user?.username ||
                                user?.email ||
                                "SoundClone user"}
                            </Typography>

                            <Typography
                              sx={{
                                color: "#606970",

                                fontSize: 11,
                              }}
                            >
                              {formatDateTime(comment.createdAt)}
                            </Typography>
                          </Stack>

                          <Typography
                            sx={{
                              mt: 0.7,

                              color: "#D7DCE1",

                              fontSize: 13.5,
                              lineHeight: 1.55,

                              wordBreak: "break-word",
                            }}
                          >
                            {comment.content}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                            flexWrap="wrap"
                            sx={{
                              mt: 1,
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.45}
                              alignItems="center"
                            >
                              <MusicNoteRoundedIcon
                                sx={{
                                  color: "#FF6A1A",

                                  fontSize: 15,
                                }}
                              />

                              <Typography
                                sx={{
                                  color: "#8B949E",

                                  fontSize: 11.5,

                                  fontWeight: 750,
                                }}
                              >
                                {track?.title || "Unknown track"}
                              </Typography>
                            </Stack>

                            {moment && (
                              <Typography
                                sx={{
                                  color: "#687078",

                                  fontSize: 11,
                                }}
                              >
                                at {moment}
                              </Typography>
                            )}
                          </Stack>
                        </Box>

                        <Button
                          disabled={deletingId === commentId}
                          onClick={() => {
                            setDeleteTarget(comment);
                          }}
                          startIcon={
                            deletingId === commentId ? (
                              <CircularProgress
                                size={14}
                                sx={{
                                  color: "inherit",
                                }}
                              />
                            ) : (
                              <DeleteOutlineRoundedIcon />
                            )
                          }
                          sx={{
                            alignSelf: {
                              xs: "flex-start",
                              sm: "center",
                            },

                            flexShrink: 0,

                            color: "#C98484",

                            fontSize: 12,
                            fontWeight: 850,

                            textTransform: "none",

                            "&:hover": {
                              color: "#FFAAAA",

                              bgcolor: "rgba(255,80,80,0.08)",
                            },
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}

        {/* PAGINATION */}
        {!loading && !error && totalPages > 1 && (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1.5}
            sx={{
              px: 2,
              py: 2,

              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Button
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage((current) => Math.max(1, current - 1));
              }}
              sx={{
                color: "#FFFFFF",

                textTransform: "none",
              }}
            >
              Previous
            </Button>

            <Typography
              sx={{
                color: "#8B949E",

                fontSize: 12,
              }}
            >
              Page {currentPage} of {totalPages}
            </Typography>

            <Button
              disabled={currentPage >= totalPages}
              onClick={() => {
                setCurrentPage((current) => current + 1);
              }}
              sx={{
                color: "#FFFFFF",

                textTransform: "none",
              }}
            >
              Next
            </Button>
          </Stack>
        )}
      </Box>

      {/* DELETE CONFIRM */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (deletingId) {
            return;
          }

          setDeleteTarget(null);
        }}
        PaperProps={{
          sx: {
            bgcolor: "#151718",
            color: "#FFFFFF",

            border: "1px solid rgba(255,255,255,0.10)",

            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
          }}
        >
          Delete comment?
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#969DA5",

              fontSize: 13.5,
              lineHeight: 1.55,
            }}
          >
            This comment will be removed from your track. This action cannot be
            undone from Artist Studio.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            disabled={Boolean(deletingId)}
            onClick={() => {
              setDeleteTarget(null);
            }}
            sx={{
              color: "#A0A6AC",

              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={Boolean(deletingId)}
            onClick={() => {
              void handleDeleteComment();
            }}
            startIcon={
              deletingId ? (
                <CircularProgress
                  size={15}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : (
                <DeleteOutlineRoundedIcon />
              )
            }
            sx={{
              color: "#FFFFFF",

              bgcolor: "#B33A3A",

              borderRadius: 2,

              fontWeight: 850,

              textTransform: "none",

              boxShadow: "none",

              "&:hover": {
                bgcolor: "#C64545",

                boxShadow: "none",
              },
            }}
          >
            {deletingId ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ArtistCommentsManager;
