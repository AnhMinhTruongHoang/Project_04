"use client";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";

import { useCallback, useEffect, useState } from "react";

import {
  getMyArtistMembershipPlansApi,
  getMyTracksApi,
  replaceArtistMembershipPostImageApi,
  updateArtistMembershipPostApi,
} from "@/utils/api";

import { useToast } from "@/utils/toast";

const darkFieldSx = {
  "& .MuiInputLabel-root": {
    color: "#929292",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#FF6A1A",
  },

  "& .MuiOutlinedInput-root": {
    color: "#FFFFFF",

    bgcolor: "#171717",

    borderRadius: 2,

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.12)",
    },

    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.25)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#FF5500",
    },
  },

  "& .MuiSvgIcon-root": {
    color: "#8F8F8F",
  },

  "& .MuiFormHelperText-root": {
    color: "#777777",
  },
};

const ProfileMembershipEditPostDialog = ({
  open,
  post,
  accessToken,
  onClose,
  onUpdated,
}: IProfileMembershipEditPostDialogProps) => {
  const toast = useToast();

  const [content, setContent] = useState("");

  const [visibility, setVisibility] =
    useState<ArtistMembershipVisibility>("MEMBERS_ONLY");

  const [requiredPlanId, setRequiredPlanId] = useState("");

  const [allowComments, setAllowComments] = useState(true);

  const [plans, setPlans] = useState<IArtistMembershipPlan[]>([]);

  const [loadingPlans, setLoadingPlans] = useState(false);

  const [saving, setSaving] = useState(false);

  const [replacementImage, setReplacementImage] = useState<File | null>(null);

  const [replacementImagePreviewUrl, setReplacementImagePreviewUrl] = useState<
    string | null
  >(null);

  const [replacingImage, setReplacingImage] = useState(false);

  const resolveTrackId = (track?: ITrackTop | null) => {
    return track?._id || track?.id || "";
  };

  /*
   * =========================
   * TRACK PREVIEW EDIT STATE
   * =========================
   */
  const [tracks, setTracks] = useState<ITrackTop[]>([]);

  const [loadingTracks, setLoadingTracks] = useState(false);

  const [selectedTrackId, setSelectedTrackId] = useState("");

  const [previewStartSeconds, setPreviewStartSeconds] = useState("0");

  const [previewDurationSeconds, setPreviewDurationSeconds] = useState("60");

  /*
   * =========================
   * RESET EDIT FORM
   * =========================
   */
  useEffect(() => {
    if (!open || !post) {
      return;
    }
    if (post.type === "TRACK_PREVIEW") {
      setSelectedTrackId(post.track?.id || "");

      setPreviewStartSeconds(String(post.track?.previewStartSeconds ?? 0));

      setPreviewDurationSeconds(
        String(post.track?.previewDurationSeconds ?? 60)
      );
    } else {
      setSelectedTrackId("");
      setPreviewStartSeconds("0");
      setPreviewDurationSeconds("60");
    }

    setContent(post.content || "");

    setVisibility(post.visibility || "MEMBERS_ONLY");

    setRequiredPlanId(post.requiredPlanId || "");

    setAllowComments(post.allowComments !== false);

    setReplacementImage(null);

    setReplacementImagePreviewUrl(null);
  }, [open, post]);

  /*
   * =========================
   * CLEANUP IMAGE PREVIEW
   * =========================
   */
  useEffect(() => {
    return () => {
      if (replacementImagePreviewUrl) {
        URL.revokeObjectURL(replacementImagePreviewUrl);
      }
    };
  }, [replacementImagePreviewUrl]);

  /*
   * =========================
   * LOAD MEMBERSHIP PLANS
   * =========================
   */
  const loadPlans = useCallback(async () => {
    if (!open || !accessToken) {
      return;
    }

    setLoadingPlans(true);

    try {
      const response = await getMyArtistMembershipPlansApi(accessToken);

      setPlans(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      console.error("Cannot load membership plans:", requestError);

      toast.error("Unable to load membership plans.");
    } finally {
      setLoadingPlans(false);
    }
  }, [accessToken, open, toast]);

  /*
   * =========================
   * LOAD ARTIST TRACKS
   * =========================
   */
  const loadTracks = useCallback(async () => {
    if (!open || !accessToken || post?.type !== "TRACK_PREVIEW") {
      return;
    }

    setLoadingTracks(true);

    try {
      const response = await getMyTracksApi(accessToken);

      setTracks(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      console.error("Cannot load artist tracks:", requestError);
    } finally {
      setLoadingTracks(false);
    }
  }, [accessToken, open, post?.type]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  /*
   * =========================
   * CONTENT LABEL
   * =========================
   */
  const getContentLabel = () => {
    switch (post?.type) {
      case "POLL":
        return "Poll question";

      case "IMAGE":
        return "Caption";

      case "TRACK_PREVIEW":
        return "Caption";

      default:
        return "Post content";
    }
  };

  /*
   * =========================
   * CONTENT HELPER
   * =========================
   */
  const getContentHelper = () => {
    switch (post?.type) {
      case "POLL":
        return "Maximum 1,000 characters.";

      case "IMAGE":
      case "TRACK_PREVIEW":
        return "Maximum 5,000 characters.";

      default:
        return "Maximum 10,000 characters.";
    }
  };

  /*
   * =========================
   * VALIDATE CONTENT
   * =========================
   */
  const validateContent = () => {
    const normalized = content.trim();

    if (post?.type === "TEXT" && !normalized) {
      toast.error("Post content is required.");

      return false;
    }

    if (post?.type === "POLL" && !normalized) {
      toast.error("Poll question is required.");

      return false;
    }

    if (post?.type === "TEXT" && normalized.length > 10000) {
      toast.error("Post content cannot exceed 10,000 characters.");

      return false;
    }

    if (post?.type === "POLL" && normalized.length > 1000) {
      toast.error("Poll question cannot exceed 1,000 characters.");

      return false;
    }

    if (
      (post?.type === "IMAGE" || post?.type === "TRACK_PREVIEW") &&
      normalized.length > 5000
    ) {
      toast.error("Caption cannot exceed 5,000 characters.");

      return false;
    }

    return true;
  };

  /*
   * =========================
   * SELECT REPLACEMENT IMAGE
   * =========================
   */
  const handleSelectReplacementImage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");

      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setReplacementImage(file);

    setReplacementImagePreviewUrl(previewUrl);
  };

  /*
   * =========================
   * SAVE POST
   * =========================
   */

  /*
   * =========================
   * REPLACE POST IMAGE
   * =========================
   */
  const handleReplaceImage = async () => {
    if (
      !post ||
      post.type !== "IMAGE" ||
      !accessToken ||
      !replacementImage ||
      replacingImage
    ) {
      return;
    }

    setReplacingImage(true);

    try {
      const response = await replaceArtistMembershipPostImageApi(
        post.id,
        replacementImage,
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to replace the image.");
      }

      toast.success("Image replaced successfully.");

      setReplacementImage(null);

      setReplacementImagePreviewUrl(null);

      onUpdated?.();
    } catch (requestError) {
      console.error("Cannot replace membership post image:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to replace the image."
      );
    } finally {
      setReplacingImage(false);
    }
  };

  const handleSave = async () => {
    if (!post || !accessToken || saving) {
      return;
    }

    if (!validateContent()) {
      return;
    }

    if (visibility === "TIER_ONLY" && !requiredPlanId) {
      toast.error("Please select a membership plan.");
      return;
    }

    /*
     * =========================
     * BUILD UPDATE PAYLOAD
     * =========================
     */
    const payload: IUpdateArtistMembershipPostPayload = {
      visibility,

      requiredPlanId: visibility === "TIER_ONLY" ? requiredPlanId : undefined,

      content: content.trim(),

      allowComments,
    };

    /*
     * =========================
     * TRACK PREVIEW VALIDATION
     * =========================
     */
    if (post.type === "TRACK_PREVIEW") {
      if (!selectedTrackId) {
        toast.error("Please select a track.");
        return;
      }

      const startSeconds = Number(previewStartSeconds);

      const durationSeconds = Number(previewDurationSeconds);

      if (!Number.isInteger(startSeconds) || startSeconds < 0) {
        toast.error("Preview start time must be a valid whole number.");

        return;
      }

      if (
        !Number.isInteger(durationSeconds) ||
        durationSeconds < 10 ||
        durationSeconds > 600
      ) {
        toast.error("Preview duration must be between 10 and 600 seconds.");

        return;
      }

      const selectedTrack =
        tracks.find((track) => resolveTrackId(track) === selectedTrackId) ||
        null;

      const trackDuration = Number(
        selectedTrack?.durationSeconds || post.track?.durationSeconds || 0
      );

      if (trackDuration > 0 && startSeconds >= trackDuration) {
        toast.error("Preview start time must be before the end of the track.");

        return;
      }

      if (trackDuration > 0 && startSeconds + durationSeconds > trackDuration) {
        toast.error("Preview duration exceeds the track duration.");

        return;
      }

      payload.trackId = selectedTrackId;
      payload.previewStartSeconds = startSeconds;
      payload.previewDurationSeconds = durationSeconds;
    }

    /*
     * =========================
     * SAVE POST
     * =========================
     */
    setSaving(true);

    try {
      const response = await updateArtistMembershipPostApi(
        post.id,
        payload,
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to update the post.");
      }

      toast.success("Post updated successfully.");

      onUpdated?.();
    } catch (requestError) {
      console.error("Cannot update membership post:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update the post."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving && !replacingImage) {
          onClose();
        }
      }}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          bgcolor: "#101010",

          backgroundImage:
            "linear-gradient(180deg, rgba(255,85,0,0.045), transparent 180px)",

          color: "#FFFFFF",

          border: "1px solid rgba(255,255,255,0.10)",

          borderRadius: {
            xs: 2,
            sm: 3,
          },

          boxShadow: "0 30px 100px rgba(0,0,0,0.78)",
        },
      }}
    >
      {/* EDIT POST HEADER */}
      <DialogTitle
        sx={{
          p: 0,

          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{
            minHeight: 72,

            px: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 40,
                height: 40,

                display: "grid",
                placeItems: "center",

                flexShrink: 0,

                color: "#FF6A1A",

                bgcolor: "rgba(255,85,0,0.10)",

                border: "1px solid rgba(255,85,0,0.22)",

                borderRadius: 2,
              }}
            >
              <EditRoundedIcon />
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: 19,
                  fontWeight: 900,
                }}
              >
                Edit membership post
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,

                  color: "#777777",

                  fontSize: 12,
                }}
              >
                {post?.type === "TRACK_PREVIEW"
                  ? "Track preview"
                  : post?.type === "IMAGE"
                  ? "Image post"
                  : post?.type === "POLL"
                  ? "Poll"
                  : "Text post"}
              </Typography>
            </Box>
          </Stack>

          <IconButton
            aria-label="Close edit post"
            disabled={saving || replacingImage}
            onClick={onClose}
            sx={{
              color: "#999999",

              "&:hover": {
                color: "#FFFFFF",
                bgcolor: "#242424",
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
        }}
      >
        <Stack spacing={2}>
          {/* POST CONTENT */}
          <TextField
            label={getContentLabel()}
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
            }}
            helperText={getContentHelper()}
            multiline
            minRows={4}
            fullWidth
            sx={darkFieldSx}
          />

          {/* POLL OPTIONS NOTICE */}
          {post?.type === "POLL" && (
            <Box
              sx={{
                p: 1.5,

                bgcolor: "rgba(255,170,70,0.06)",

                border: "1px solid rgba(255,170,70,0.16)",

                borderRadius: 2,
              }}
            >
              <Typography
                sx={{
                  color: "#D9A45F",

                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
              >
                Poll options cannot be edited after creation.
              </Typography>
            </Box>
          )}

          {/* IMAGE REPLACEMENT */}
          {post?.type === "IMAGE" && (
            <Box
              sx={{
                p: 2,

                bgcolor: "#151515",

                border: "1px solid rgba(255,255,255,0.08)",

                borderRadius: 2.5,
              }}
            >
              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: 850,
                    }}
                  >
                    Replace image
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.3,

                      color: "#777777",
                      fontSize: 12,
                    }}
                  >
                    Select a new image for this post.
                  </Typography>
                </Box>

                {/* NEW IMAGE PREVIEW */}
                {replacementImagePreviewUrl && (
                  <Box
                    component="img"
                    src={replacementImagePreviewUrl}
                    alt="New post image preview"
                    sx={{
                      width: "100%",
                      maxHeight: 320,

                      display: "block",

                      objectFit: "cover",

                      borderRadius: 2,

                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                )}

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={1}
                >
                  <Button
                    component="label"
                    disabled={replacingImage}
                    startIcon={<UploadRoundedIcon />}
                    sx={{
                      minHeight: 40,

                      color: "#D7D7D7",
                      bgcolor: "#222222",

                      border: "1px solid rgba(255,255,255,0.10)",

                      borderRadius: 2,

                      fontWeight: 800,
                      textTransform: "none",

                      "&:hover": {
                        color: "#FFFFFF",
                        bgcolor: "#2B2B2B",
                      },
                    }}
                  >
                    {replacementImage ? "Change image" : "Choose image"}

                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={handleSelectReplacementImage}
                    />
                  </Button>

                  {replacementImage && (
                    <Button
                      variant="contained"
                      disabled={replacingImage}
                      onClick={() => {
                        void handleReplaceImage();
                      }}
                      startIcon={
                        replacingImage ? (
                          <CircularProgress
                            size={15}
                            thickness={5}
                            sx={{
                              color: "inherit",
                            }}
                          />
                        ) : (
                          <UploadRoundedIcon />
                        )
                      }
                      sx={{
                        minHeight: 40,

                        color: "#FFFFFF",
                        bgcolor: "#FF5500",

                        borderRadius: 2,

                        fontWeight: 850,
                        textTransform: "none",

                        boxShadow: "none",

                        "&:hover": {
                          bgcolor: "#FF6A1A",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {replacingImage ? "Replacing..." : "Replace image"}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          )}

          {/* TRACK PREVIEW EDITOR */}
          {post?.type === "TRACK_PREVIEW" && (
            <Box
              sx={{
                p: 2,

                bgcolor: "#151515",

                border: "1px solid rgba(255,255,255,0.08)",

                borderRadius: 2.5,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: 850,
                    }}
                  >
                    Track preview
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.3,

                      color: "#777777",
                      fontSize: 12,
                    }}
                  >
                    Choose the track and update the preview timing.
                  </Typography>
                </Box>

                {/* TRACK SELECT */}
                <TextField
                  select
                  label="Track"
                  value={selectedTrackId}
                  disabled={loadingTracks}
                  onChange={(event) => {
                    const nextTrackId = event.target.value;

                    setSelectedTrackId(nextTrackId);

                    const selectedTrack =
                      tracks.find(
                        (track) => resolveTrackId(track) === nextTrackId
                      ) || null;

                    const trackDuration = Math.floor(
                      Number(selectedTrack?.durationSeconds || 0)
                    );

                    setPreviewStartSeconds("0");

                    setPreviewDurationSeconds(
                      trackDuration >= 10
                        ? String(Math.min(60, trackDuration))
                        : "10"
                    );
                  }}
                  fullWidth
                  sx={darkFieldSx}
                >
                  {tracks.map((track) => {
                    const trackId = resolveTrackId(track);

                    if (!trackId) {
                      return null;
                    }

                    return (
                      <MenuItem key={trackId} value={trackId}>
                        {track.title}
                        {track.durationSeconds
                          ? ` · ${Math.floor(Number(track.durationSeconds))}s`
                          : ""}
                      </MenuItem>
                    );
                  })}
                </TextField>

                {loadingTracks && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress
                      size={15}
                      thickness={5}
                      sx={{
                        color: "#FF5500",
                      }}
                    />

                    <Typography
                      sx={{
                        color: "#8F8F8F",
                        fontSize: 12,
                      }}
                    >
                      Loading tracks...
                    </Typography>
                  </Stack>
                )}

                {/* PREVIEW TIMING */}
                <Box
                  sx={{
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },

                    gap: 1.5,
                  }}
                >
                  <TextField
                    label="Preview start (seconds)"
                    type="number"
                    value={previewStartSeconds}
                    onChange={(event) => {
                      setPreviewStartSeconds(event.target.value);
                    }}
                    inputProps={{
                      min: 0,
                      step: 1,
                    }}
                    fullWidth
                    sx={darkFieldSx}
                  />

                  <TextField
                    label="Preview duration (seconds)"
                    type="number"
                    value={previewDurationSeconds}
                    onChange={(event) => {
                      setPreviewDurationSeconds(event.target.value);
                    }}
                    helperText="10–600 seconds"
                    inputProps={{
                      min: 10,
                      max: 600,
                      step: 1,
                    }}
                    fullWidth
                    sx={darkFieldSx}
                  />
                </Box>
              </Stack>
            </Box>
          )}

          {/* VISIBILITY */}
          <TextField
            select
            label="Visibility"
            value={visibility}
            onChange={(event) => {
              const nextVisibility = event.target
                .value as ArtistMembershipVisibility;

              setVisibility(nextVisibility);

              if (nextVisibility !== "TIER_ONLY") {
                setRequiredPlanId("");
              }
            }}
            fullWidth
            sx={darkFieldSx}
          >
            <MenuItem value="PUBLIC">Public</MenuItem>

            <MenuItem value="MEMBERS_ONLY">Members only</MenuItem>

            <MenuItem value="TIER_ONLY">Specific plan</MenuItem>
          </TextField>

          {/* REQUIRED PLAN */}
          {visibility === "TIER_ONLY" && (
            <TextField
              select
              label="Required plan"
              value={requiredPlanId}
              disabled={loadingPlans}
              onChange={(event) => {
                setRequiredPlanId(event.target.value);
              }}
              fullWidth
              sx={darkFieldSx}
            >
              {plans.map((plan) => (
                <MenuItem
                  key={plan.id}
                  value={plan.id}
                  disabled={!plan.active && plan.id !== requiredPlanId}
                >
                  {plan.name}
                  {!plan.active ? " — Paused" : ""}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* COMMENT SETTING */}
          <FormControlLabel
            control={
              <Checkbox
                checked={allowComments}
                onChange={(event) => {
                  setAllowComments(event.target.checked);
                }}
                sx={{
                  color: "#777777",

                  "&.Mui-checked": {
                    color: "#FF5500",
                  },
                }}
              />
            }
            label="Allow comments"
            sx={{
              color: "#B8B8B8",

              "& .MuiFormControlLabel-label": {
                fontSize: 14,
                fontWeight: 700,
              },
            }}
          />
        </Stack>
      </DialogContent>

      {/* EDIT POST ACTIONS */}
      <DialogActions
        sx={{
          px: {
            xs: 2,
            sm: 3,
          },

          pb: 2.5,

          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Button
          disabled={saving || replacingImage}
          onClick={onClose}
          sx={{
            color: "#A5A5A5",

            fontWeight: 800,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={
            saving ||
            replacingImage ||
            (post?.type === "TRACK_PREVIEW" &&
              (loadingTracks || !selectedTrackId))
          }
          onClick={() => {
            void handleSave();
          }}
          startIcon={
            saving ? (
              <CircularProgress
                size={16}
                thickness={5}
                sx={{
                  color: "inherit",
                }}
              />
            ) : (
              <EditRoundedIcon />
            )
          }
          sx={{
            minHeight: 42,

            px: 2.5,

            color: "#FFFFFF",
            bgcolor: "#FF5500",

            borderRadius: 2,

            fontWeight: 850,
            textTransform: "none",

            boxShadow: "none",

            "&:hover": {
              bgcolor: "#FF6A1A",
              boxShadow: "none",
            },

            "&.Mui-disabled": {
              color: "#777777",
              bgcolor: "#292929",
            },
          }}
        >
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileMembershipEditPostDialog;
