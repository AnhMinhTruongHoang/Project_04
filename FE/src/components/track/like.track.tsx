"use client";

import FavoriteIcon from "@mui/icons-material/Favorite";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Radio from "@mui/material/Radio";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useState } from "react";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { handleLikeTrackAction } from "@/utils/actions/actions";
import { Box } from "@mui/material";
import { useToast } from "@/utils/toast";

interface IProps {
  track: ITrackTop | null;
  buttonHeight?: number;
}

const getPlaylistTrackId = (track: unknown): string => {
  if (!track) return "";

  if (typeof track === "string") {
    return track;
  }

  if (typeof track === "object" && "_id" in track) {
    return String((track as any)._id);
  }

  return "";
};

const LikeTrack = ({ track, buttonHeight = 36 }: IProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [trackLikes, setTrackLikes] = useState<ITrackLike[] | null>(null);

  const [openPlaylist, setOpenPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [playlistId, setPlaylistId] = useState("");
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [submittingPlaylist, setSubmittingPlaylist] = useState(false);

  const isLiked = trackLikes?.some((t) => t._id === track?._id);

  const fetchData = async () => {
    if (session?.access_token) {
      const res2 = await sendRequest<IBackendRes<IModelPaginate<ITrackLike>>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/likes`,
        method: "GET",
        queryParams: {
          current: 1,
          pageSize: 100,
          sort: "-createdAt",
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (res2?.data?.result) {
        setTrackLikes(res2?.data?.result);
      }
    }
  };

  const fetchPlaylists = async () => {
    if (!session?.access_token) return;

    setLoadingPlaylists(true);

    try {
      const res = await sendRequest<IBackendRes<IModelPaginate<IPlaylist>>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists/by-user`,
        method: "POST",
        queryParams: {
          current: 1,
          pageSize: 100,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const result = res?.data?.result || [];

      setPlaylists(result);

      if (result.length) {
        setPlaylistId(result[0]._id);
      }
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleLikeTrack = async () => {
    if (!track?._id) {
      return;
    }

    const quantity = isLiked ? -1 : 1;

    await handleLikeTrackAction(track._id, quantity);

    fetchData();
    router.refresh();
  };

  const handleOpenPlaylist = async () => {
    if (!track?._id) {
      toast.error("Track not found.");
      return;
    }

    if (!session?.access_token) {
      toast.error("Please login to add this track to playlist.");
      return;
    }

    setOpenPlaylist(true);

    if (!playlists.length) {
      await fetchPlaylists();
    }
  };

  const handleClosePlaylist = () => {
    if (submittingPlaylist) return;

    setOpenPlaylist(false);
    setPlaylistId("");
  };

  const handleAddToPlaylist = async () => {
    if (!track?._id) {
      toast.error("Track not found.");
      return;
    }

    if (!playlistId) {
      toast.error("Please select a playlist.");
      return;
    }

    const chosenPlaylist = playlists.find((item) => item._id === playlistId);

    if (!chosenPlaylist) {
      toast.error("Playlist not found.");
      return;
    }

    const oldTracks = ((chosenPlaylist.tracks || []) as unknown[])
      .map(getPlaylistTrackId)
      .filter(Boolean);

    const mergedTracks = Array.from(new Set([...oldTracks, track._id]));

    setSubmittingPlaylist(true);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists`,
        method: "PATCH",
        body: {
          id: chosenPlaylist._id,
          title: chosenPlaylist.title,
          isPublic: chosenPlaylist.isPublic,
          tracks: mergedTracks,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (res?.data) {
        toast.success("Track added to playlist.");

        await sendRequest<IBackendRes<any>>({
          url: `/api/revalidate`,
          method: "POST",
          queryParams: {
            tag: "playlist-by-user",
            secret: "justArandomString",
          },
        });

        handleClosePlaylist();
        router.refresh();
      } else {
        toast.error(res?.message || "Can not add track to playlist.");
      }
    } finally {
      setSubmittingPlaylist(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          mt: 2.2,
          mx: 0,
          px: 0.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#ffffff",
          width: "100%",
          gap: 2,
        }}
      >
        {/* ACTION BUTTONS */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={handleLikeTrack}
            startIcon={<FavoriteIcon />}
            sx={{
              height: 38,
              px: 2.2,
              borderRadius: "999px",
              color: isLiked ? "#ff5500" : "#ffffff",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 900,
              backgroundColor: isLiked
                ? "rgba(255,85,0,0.14)"
                : "rgba(255,255,255,0.08)",
              border: isLiked
                ? "1px solid rgba(255,85,0,0.45)"
                : "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              boxShadow: isLiked
                ? "0 10px 24px rgba(255,85,0,0.18)"
                : "0 10px 24px rgba(0,0,0,0.22)",

              "&:hover": {
                backgroundColor: isLiked
                  ? "rgba(255,85,0,0.2)"
                  : "rgba(255,255,255,0.13)",
                transform: "translateY(-1px)",
              },

              "& .MuiButton-startIcon": {
                marginLeft: 0,
                marginRight: "7px",
              },

              "& .MuiSvgIcon-root": {
                fontSize: 18,
                color: isLiked ? "#ff5500" : "#ffffff",
              },
            }}
          >
            {isLiked ? "Liked" : "Like"}
          </Button>

          <Button
            onClick={handleOpenPlaylist}
            startIcon={<PlaylistAddRoundedIcon />}
            sx={{
              height: 38,
              px: 2.2,
              borderRadius: "999px",
              color: "#ffffff",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 900,
              background:
                "linear-gradient(135deg, rgba(255,85,0,0.18), rgba(0,188,174,0.14))",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.22)",

              "&:hover": {
                background:
                  "linear-gradient(135deg, rgba(255,85,0,0.26), rgba(0,188,174,0.2))",
                transform: "translateY(-1px)",
              },

              "& .MuiButton-startIcon": {
                marginLeft: 0,
                marginRight: "7px",
              },

              "& .MuiSvgIcon-root": {
                fontSize: 20,
                color: "#ffffff",
              },
            }}
          >
            Add to playlist
          </Button>
        </Box>

        {/* STATS */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Box
            component="span"
            sx={{
              height: 34,
              px: 1.4,
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              borderRadius: "999px",
              color: "#cfd3d6",
              fontSize: 13,
              fontWeight: 800,
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 18, color: "#b8c0c5" }} />
            {track?.countPlay ?? 0}
          </Box>

          <Box
            component="span"
            sx={{
              height: 34,
              px: 1.4,
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              borderRadius: "999px",
              color: "#cfd3d6",
              fontSize: 13,
              fontWeight: 800,
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <FavoriteIcon sx={{ fontSize: 17, color: "#b8c0c5" }} />
            {track?.countLike ?? 0}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openPlaylist}
        onClose={handleClosePlaylist}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            backgroundColor: "#111314",
            color: "#ffffff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: 22,
            fontWeight: 900,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Add to playlist
        </DialogTitle>

        <DialogContent sx={{ pt: "20px !important" }}>
          <Typography
            sx={{
              color: "#bdbdbd",
              fontSize: 13,
              fontWeight: 700,
              mb: 2,
            }}
          >
            Choose a playlist to add this track.
          </Typography>

          {loadingPlaylists ? (
            <Box
              sx={{
                height: 160,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={28} sx={{ color: "#ff5500" }} />
            </Box>
          ) : playlists.length ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {playlists.map((playlist) => {
                const checked = playlistId === playlist._id;

                return (
                  <Box
                    key={playlist._id}
                    onClick={() => setPlaylistId(playlist._id)}
                    sx={{
                      px: 1.2,
                      py: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      borderRadius: 2,
                      border: checked
                        ? "1px solid #ff5500"
                        : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: checked
                        ? "rgba(255,85,0,0.12)"
                        : "rgba(255,255,255,0.04)",

                      "&:hover": {
                        backgroundColor: checked
                          ? "rgba(255,85,0,0.16)"
                          : "rgba(255,255,255,0.08)",
                      },
                    }}
                  >
                    <Radio
                      checked={checked}
                      sx={{
                        color: "#777",
                        p: 0.5,

                        "&.Mui-checked": {
                          color: "#ff5500",
                        },
                      }}
                    />

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        title={playlist.title}
                        sx={{
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: 900,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {playlist.title}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#8f8f8f",
                          fontSize: 12,
                          fontWeight: 700,
                          mt: 0.3,
                        }}
                      >
                        {(playlist.tracks || []).length} tracks
                      </Typography>
                    </Box>

                    {playlist.isPublic ? (
                      <PublicRoundedIcon
                        sx={{
                          color: "#9f9f9f",
                          fontSize: 18,
                        }}
                      />
                    ) : (
                      <LockRoundedIcon
                        sx={{
                          color: "#9f9f9f",
                          fontSize: 18,
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box
              sx={{
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                px: 3,
              }}
            >
              <Typography
                sx={{
                  color: "#8f8f8f",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                You do not have any playlist yet.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Button
            onClick={handleClosePlaylist}
            disabled={submittingPlaylist}
            sx={{
              color: "#cfcfcf",
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleAddToPlaylist}
            disabled={submittingPlaylist || loadingPlaylists || !playlistId}
            sx={{
              px: 2,
              borderRadius: "999px",
              backgroundColor: "#ff5500",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 900,

              "&:hover": {
                backgroundColor: "#ff6a1a",
              },

              "&.Mui-disabled": {
                backgroundColor: "#444",
                color: "#999",
              },
            }}
          >
            {submittingPlaylist ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LikeTrack;
