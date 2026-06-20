"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import { useToast } from "@/utils/toast";
import { sendRequest } from "@/utils/api";

const NewPlaylist = () => {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [title, setTitle] = useState<string>("");

  const toast = useToast();
  const router = useRouter();
  const { data: session } = useSession();

  const handleClose = (_event?: any, reason?: string) => {
    if (reason === "backdropClick") return;

    setOpen(false);
    setTitle("");
    setIsPublic(true);
  };

  const handleSubmit = async () => {
    const accessToken = (session as any)?.access_token;

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (!title.trim()) {
      toast.error("Playlist title is required.");
      return;
    }

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists/empty`,
      method: "POST",
      body: {
        title: title.trim(),
        isPublic,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.data) {
      toast.success("Playlist created successfully.");
      handleClose("", "");
      await sendRequest<IBackendRes<any>>({
        url: `/api/revalidate`,
        method: "POST",
        queryParams: {
          tag: "playlist-by-user",
          secret: "justArandomString",
        },
      });

      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{
          height: 38,
          px: 2.2,
          borderRadius: "999px",
          textTransform: "none",
          fontWeight: 900,
          color: "#ffffff",
          borderColor: "rgba(255,85,0,0.65)",
          backgroundColor: "rgba(255,85,0,0.08)",
          "&:hover": {
            borderColor: "#ff5500",
            backgroundColor: "rgba(255,85,0,0.16)",
          },
        }}
      >
        New playlist
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
              <PlaylistAddRoundedIcon sx={{ color: "#ffffff", fontSize: 24 }} />
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
                Create playlist
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: 13,
                  color: "#9a9a9a",
                  fontWeight: 600,
                }}
              >
                Save your favorite tracks into a new collection.
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
            <TextField
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              label="Playlist title"
              placeholder="Enter playlist title"
              variant="standard"
              fullWidth
              autoFocus
              sx={{
                input: {
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 700,
                },

                label: {
                  color: "#8f8f8f",
                  fontWeight: 700,
                },

                "& label.Mui-focused": {
                  color: "#ff5500",
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
              }}
            />

            <Box
              sx={{
                borderRadius: 2,
                backgroundColor: "#111314",
                border: "1px solid rgba(255,255,255,0.08)",
                px: 2,
                py: 1.4,
              }}
            >
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={(event) => setIsPublic(event.target.checked)}
                      inputProps={{ "aria-label": "playlist visibility" }}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#ff5500",
                        },

                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          {
                            backgroundColor: "#ff5500",
                          },

                        "& .MuiSwitch-track": {
                          backgroundColor: "#4a4d50",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        sx={{
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: 900,
                        }}
                      >
                        {isPublic ? "Public playlist" : "Private playlist"}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#9a9a9a",
                          fontSize: 12,
                          mt: 0.3,
                        }}
                      >
                        {isPublic
                          ? "Anyone can view this playlist."
                          : "Only you can view this playlist."}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    m: 0,
                    alignItems: "center",
                  }}
                />
              </FormGroup>
            </Box>
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
            onClick={() => setOpen(false)}
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
    </Box>
  );
};

export default NewPlaylist;
