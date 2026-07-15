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
import { Box } from "@mui/material";
import { useToast } from "@/utils/toast";
import { PlaylistAdd } from "@mui/icons-material";

interface IProps {
  track: ITrackTop | null;
  buttonHeight?: number;
}

const getTrackId = (track?: any): string => {
  return track?._id || track?.id || "";
};

const getPlaylistId = (playlist?: any): string => {
  return playlist?._id || playlist?.id || "";
};

const getPlaylistTrackId = (track: unknown): string => {
  if (!track) return "";

  if (typeof track === "string") {
    return track;
  }

  if (typeof track === "object") {
    return String((track as any)._id || (track as any).id || "");
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
  const trackId = getTrackId(track);
  const accessToken = (session as any)?.access_token;
  const isLiked = trackLikes?.some((t) => getTrackId(t) === trackId);

  const fetchData = async () => {
    if (!accessToken) return;

    const res = await sendRequest<
      IBackendRes<ITrackLike[] | IModelPaginate<ITrackLike>>
    >({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/liked`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseData = res?.data as any;

    const result: ITrackLike[] = Array.isArray(responseData)
      ? responseData
      : responseData?.result ?? [];

    setTrackLikes(result);
  };

  const fetchPlaylists = async () => {
    if (!accessToken) return;

    setLoadingPlaylists(true);

    try {
      const res = await sendRequest<
        IBackendRes<IPlaylist[] | IModelPaginate<IPlaylist>>
      >({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists/by-user`,
        method: "GET",
        queryParams: {
          current: 1,
          pageSize: 100,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseData = res?.data as any;

      const result: IPlaylist[] = Array.isArray(responseData)
        ? responseData
        : responseData?.result ?? [];

      setPlaylists(result);

      if (result.length) {
        setPlaylistId(getPlaylistId(result[0]));
      }
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const handleLikeTrack = async () => {
    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login to like this track.");
      return;
    }

    const action = isLiked ? "dislike" : "like";

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/${trackId}/${action}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res?.data || res?.statusCode === 200 || res?.statusCode === 201) {
      await fetchData();
      router.refresh();
    } else {
      toast.error(res?.message || "Can not update like.");
    }
  };

  const handleOpenPlaylist = async () => {
    if (!trackId) {
      toast.error("Track not found.");
      return;
    }
    if (!accessToken) {
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
    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (!playlistId) {
      toast.error("Please select a playlist.");
      return;
    }

    const chosenPlaylist = playlists.find(
      (item) => getPlaylistId(item) === playlistId
    );

    if (!chosenPlaylist) {
      toast.error("Playlist not found.");
      return;
    }

    const oldTracks = ((chosenPlaylist.tracks || []) as unknown[])
      .map(getPlaylistTrackId)
      .filter(Boolean);

    const mergedTracks = Array.from(new Set([...oldTracks, trackId]));

    setSubmittingPlaylist(true);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists`,
        method: "PATCH",
        body: {
          id: playlistId,
          title: chosenPlaylist.title,
          isPublic: chosenPlaylist.isPublic,
          tracks: mergedTracks,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data || res?.statusCode === 200) {
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
            textAlign: "center",
          }}
        >
          Add to playlist
        </DialogTitle>

        <DialogContent sx={{ pt: "20px !important", justifyContent: "center" }}>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <PlaylistAdd
              onClick={() => router.push("/playlist")}
              sx={{
                cursor: "pointer",
                color: "#ff5500",
                fontSize: 32,
              }}
            />
          </Box>
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
                const currentPlaylistId = getPlaylistId(playlist);
                const checked = playlistId === currentPlaylistId;

                return (
                  <Box
                    key={currentPlaylistId}
                    onClick={() => setPlaylistId(currentPlaylistId)}
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
