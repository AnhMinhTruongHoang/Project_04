"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Theme, useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import { useToast } from "@/utils/toast";
import { sendRequest } from "@/utils/api";

interface IProps {
  playlists: IPlaylist[];
  tracks: ITrackTop[];
  buttonText?: string;
}

const AddPlaylistTrack = (props: IProps) => {
  const { playlists, tracks } = props;

  const [open, setOpen] = useState(false);
  const [playlistId, setPlaylistId] = useState("");
  const [tracksId, setTracksId] = useState<string[]>([]);

  const toast = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const theme = useTheme();

  const handleClose = (_event?: any, reason?: string) => {
    if (reason === "backdropClick") return;

    setOpen(false);
    setPlaylistId("");
    setTracksId([]);
  };

  const getStyles = (
    name: string,
    tracksId: readonly string[],
    theme: Theme
  ) => {
    return {
      fontWeight:
        tracksId.indexOf(name) === -1
          ? theme.typography.fontWeightRegular
          : theme.typography.fontWeightMedium,
    };
  };

  const getItemId = (item?: any): string => {
    return item?._id || item?.id || "";
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
  const handleSubmit = async () => {
    const accessToken = (session as any)?.access_token;

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (!playlistId) {
      toast.error("Please select a playlist.");
      return;
    }

    if (!tracksId.length) {
      toast.error("Please select at least one track.");
      return;
    }

    const chosenPlaylist = playlists.find(
      (item) => getItemId(item) === playlistId
    );

    if (!chosenPlaylist) {
      toast.error("Playlist not found.");
      return;
    }

    const selectedTracks = tracksId
      .map((item) => item?.split("###")?.[1])
      .filter(Boolean);

    const oldTracks = ((chosenPlaylist.tracks || []) as unknown[])
      .map(getPlaylistTrackId)
      .filter(Boolean);

    const mergedTracks = Array.from(new Set([...oldTracks, ...selectedTracks]));

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists/${playlistId}`,
      method: "PATCH",
      body: {
        title: chosenPlaylist.title,
        isPublic: chosenPlaylist.isPublic,
        tracks: mergedTracks,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.data) {
      toast.success("Tracks added to playlist successfully.");

      await sendRequest<IBackendRes<any>>({
        url: `/api/revalidate`,
        method: "POST",
        queryParams: {
          tag: "playlist-by-user",
          secret: "justArandomString",
        },
      });

      handleClose("", "");
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <>
      <Button
        startIcon={<AddIcon />}
        variant="outlined"
        onClick={() => setOpen(true)}
        sx={{
          height: 38,
          px: 2.2,
          borderRadius: "999px",
          textTransform: "none",
          fontWeight: 900,
          color: "#ffffff",
          borderColor: "rgba(255,255,255,0.18)",
          backgroundColor: "rgba(255,255,255,0.04)",
          "&:hover": {
            borderColor: "#ff5500",
            backgroundColor: "rgba(255,85,0,0.14)",
          },
        }}
      >
        Add tracks
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: "#181A1B",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "#ff5500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 26px rgba(255,85,0,0.28)",
              }}
            >
              <PlaylistAddCheckRoundedIcon
                sx={{
                  color: "#ffffff",
                  fontSize: 24,
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 21,
                  fontWeight: 900,
                  color: "#ffffff",
                  lineHeight: 1.2,
                }}
              >
                Add tracks to playlist
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: 13,
                  color: "#9a9a9a",
                  fontWeight: 600,
                }}
              >
                Select a playlist and choose tracks to add.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            py: 3,
            backgroundColor: "#181A1B",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 3,
              flexDirection: "column",
              width: "100%",
            }}
          >
            {/* Playlist select */}
            <FormControl
              fullWidth
              variant="standard"
              sx={{
                mt: 1,

                "& .MuiInputLabel-root": {
                  color: "#8f8f8f",
                  fontWeight: 700,
                },

                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#ff5500",
                },

                "& .MuiInputBase-root": {
                  color: "#ffffff",
                  fontWeight: 700,
                },

                "& .MuiInput-underline:before": {
                  borderBottomColor: "rgba(255,255,255,0.16)",
                },

                "& .MuiInput-underline:hover:before": {
                  borderBottomColor: "rgba(255,255,255,0.35)",
                },

                "& .MuiInput-underline:after": {
                  borderBottomColor: "#ff5500",
                },

                "& .MuiSvgIcon-root": {
                  color: "#ffffff",
                },
              }}
            >
              <InputLabel>Select playlist</InputLabel>

              <Select
                value={playlistId}
                label="Playlist"
                onChange={(e) => setPlaylistId(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "#111314",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.1)",
                      mt: 1,

                      "& .MuiMenuItem-root": {
                        fontSize: 14,
                        fontWeight: 700,
                      },

                      "& .MuiMenuItem-root:hover": {
                        backgroundColor: "rgba(255,85,0,0.14)",
                      },

                      "& .Mui-selected": {
                        backgroundColor: "rgba(255,85,0,0.2) !important",
                      },
                    },
                  },
                }}
              >
                {playlists.map((item) => {
                  const itemId = getItemId(item);

                  return (
                    <MenuItem key={itemId} value={itemId}>
                      {item.title}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* Track multi select */}
            <FormControl
              fullWidth
              sx={{
                mt: 1,

                "& .MuiInputLabel-root": {
                  color: "#8f8f8f",
                  fontWeight: 700,
                },

                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#ff5500",
                },

                "& .MuiOutlinedInput-root": {
                  color: "#ffffff",
                  backgroundColor: "#111314",
                  borderRadius: 2,

                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.14)",
                  },

                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.32)",
                  },

                  "&.Mui-focused fieldset": {
                    borderColor: "#ff5500",
                  },
                },

                "& .MuiSvgIcon-root": {
                  color: "#ffffff",
                },
              }}
            >
              <InputLabel id="track-multiple-chip-label">Tracks</InputLabel>

              <Select
                labelId="track-multiple-chip-label"
                multiple
                value={tracksId}
                onChange={(e) => {
                  setTracksId(e.target.value as string[]);
                }}
                input={
                  <OutlinedInput id="select-multiple-chip" label="Tracks" />
                }
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.7,
                    }}
                  >
                    {selected.map((value) => {
                      return (
                        <Chip
                          key={value}
                          label={value?.split("###")?.[0]}
                          size="small"
                          sx={{
                            color: "#ffffff",
                            backgroundColor: "rgba(255,85,0,0.18)",
                            border: "1px solid rgba(255,85,0,0.35)",
                            fontWeight: 800,

                            "& .MuiChip-deleteIcon": {
                              color: "#ffffff",
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 330,
                      backgroundColor: "#111314",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.1)",
                      mt: 1,

                      "& .MuiMenuItem-root": {
                        fontSize: 14,
                        fontWeight: 700,
                        gap: 1,
                      },

                      "& .MuiMenuItem-root:hover": {
                        backgroundColor: "rgba(255,85,0,0.14)",
                      },

                      "& .Mui-selected": {
                        backgroundColor: "rgba(255,85,0,0.2) !important",
                      },
                    },
                  },
                }}
              >
                {tracks.map((track) => {
                  const trackId = getItemId(track);
                  const value = `${track.title}###${trackId}`;

                  return (
                    <MenuItem
                      key={trackId}
                      value={value}
                      style={getStyles(value, tracksId, theme)}
                    >
                      <QueueMusicRoundedIcon
                        sx={{
                          fontSize: 18,
                          color: "#ff5500",
                        }}
                      />
                      {track.title}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#181A1B",
            gap: 1,
          }}
        >
          <Button
            onClick={() => handleClose("", "")}
            sx={{
              borderRadius: "999px",
              px: 2.4,
              textTransform: "none",
              fontWeight: 800,
              color: "#b8b8b8",
              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              borderRadius: "999px",
              px: 2.6,
              textTransform: "none",
              fontWeight: 900,
              color: "#ffffff",
              backgroundColor: "#ff5500",
              boxShadow: "0 10px 24px rgba(255,85,0,0.25)",
              "&:hover": {
                backgroundColor: "#ff6a00",
                boxShadow: "0 14px 30px rgba(255,85,0,0.32)",
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddPlaylistTrack;
