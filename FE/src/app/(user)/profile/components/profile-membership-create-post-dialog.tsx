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
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import PollRoundedIcon from "@mui/icons-material/PollRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useToast } from "@/utils/toast";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createArtistMembershipImagePostApi,
  createArtistMembershipPollApi,
  createArtistMembershipPostApi,
  getMyArtistMembershipPlansApi,
  getMyTracksApi,
  getTrackId,
} from "@/utils/api";

const ProfileMembershipCreatePostDialog = ({
  open,
  accessToken,
  onClose,
  onCreated,
}: IProfileMembershipCreatePostDialogProps) => {
  const toast = useToast();

  /* =========================
   STABLE TOAST REFERENCE
========================= */
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [postType, setPostType] = useState<ArtistMembershipPostType>("TEXT");

  const [content, setContent] = useState("");

  const [visibility, setVisibility] =
    useState<ArtistMembershipVisibility>("MEMBERS_ONLY");

  const [requiredPlanId, setRequiredPlanId] = useState("");

  const [allowComments, setAllowComments] = useState(true);

  const [plans, setPlans] = useState<IArtistMembershipPlan[]>([]);

  const [loadingPlans, setLoadingPlans] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [pollQuestion, setPollQuestion] = useState("");

  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [tracks, setTracks] = useState<ITrackTop[]>([]);

  const [loadingTracks, setLoadingTracks] = useState(false);

  const [selectedTrackId, setSelectedTrackId] = useState("");

  const [previewStartSeconds, setPreviewStartSeconds] = useState("0");

  const [previewDurationSeconds, setPreviewDurationSeconds] = useState("60");

  /*
   * =========================
   * LOAD ARTIST PLANS
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
    } finally {
      setLoadingPlans(false);
    }
  }, [accessToken, open]);

  /*
   * =========================
   * LOAD ARTIST TRACKS
   * =========================
   */
  const loadTracks = useCallback(async () => {
    if (!open || !accessToken) {
      return;
    }

    setLoadingTracks(true);

    try {
      const response = await getMyTracksApi(accessToken);

      const items = response?.data;

      setTracks(Array.isArray(items) ? items : []);
    } catch (requestError) {
      console.error("Cannot load artist tracks:", requestError);

      setTracks([]);

      toastRef.current.error("Unable to load your tracks.");
    } finally {
      setLoadingTracks(false);
    }
  }, [accessToken, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPostType("TEXT");

    setContent("");

    setVisibility("MEMBERS_ONLY");

    setRequiredPlanId("");

    setAllowComments(true);

    setSelectedImage(null);
    setImagePreviewUrl(null);

    setPollQuestion("");
    setPollOptions(["", ""]);

    /* TRACK PREVIEW */
    setSelectedTrackId("");
    setPreviewStartSeconds("0");
    setPreviewDurationSeconds("60");
  }, [open]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  /*
   * =========================
   * CLEAN UP IMAGE PREVIEW
   * =========================
   */
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const postTypes = [
    {
      type: "TEXT" as const,
      label: "Text",
      description: "Share an update with your members.",
      icon: <ArticleRoundedIcon />,
    },
    {
      type: "IMAGE" as const,
      label: "Image",
      description: "Share an image with a message.",
      icon: <ImageRoundedIcon />,
    },
    {
      type: "POLL" as const,
      label: "Poll",
      description: "Ask members to vote on an idea.",
      icon: <PollRoundedIcon />,
    },
    {
      type: "TRACK_PREVIEW" as const,
      label: "Track preview",
      description: "Share an early track preview.",
      icon: <GraphicEqRoundedIcon />,
    },
  ];

  /*
   * =========================
   * SELECT IMAGE
   * =========================
   */
  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedImage(file);

    setImagePreviewUrl(previewUrl);
  };

  /*
   * =========================
   * REMOVE IMAGE
   * =========================
   */
  const handleRemoveImage = () => {
    setSelectedImage(null);

    setImagePreviewUrl(null);
  };

  /*
   * =========================
   * PUBLISH TEXT POST
   * =========================
   */
  const handlePublishTextPost = async () => {
    if (!accessToken || publishing) {
      return;
    }

    const normalizedContent = content.trim();

    if (!normalizedContent) {
      toast.error("Post content is required.");
      return;
    }

    if (visibility === "TIER_ONLY" && !requiredPlanId) {
      toast.error("Please select a membership plan.");
      return;
    }

    setPublishing(true);

    try {
      const response = await createArtistMembershipPostApi(
        {
          type: "TEXT",

          visibility,

          requiredPlanId:
            visibility === "TIER_ONLY" ? requiredPlanId : undefined,

          content: normalizedContent,

          allowComments,
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to publish the post.");
      }

      onCreated?.();

      onClose();
    } catch (requestError) {
      console.error("Cannot publish membership post:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to publish the post."
      );
    }
  };
  /*
   * =========================
   * PUBLISH IMAGE POST
   * =========================
   */
  const handlePublishImagePost = async () => {
    if (!accessToken || publishing) {
      return;
    }

    if (!selectedImage) {
      toast.error("Please select an image.");
      return;
    }

    if (visibility === "TIER_ONLY" && !requiredPlanId) {
      toast.error("Please select a membership plan.");
      return;
    }

    try {
      const response = await createArtistMembershipImagePostApi(
        {
          image: selectedImage,

          visibility,

          requiredPlanId:
            visibility === "TIER_ONLY" ? requiredPlanId : undefined,

          content: content.trim() || undefined,

          allowComments,

          status: "PUBLISHED",
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(
          response?.message || "Unable to publish the image post."
        );
      }

      onCreated?.();

      onClose();
    } catch (requestError) {
      console.error("Cannot publish membership image post:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to publish the image post."
      );
    }
  };

  /*
   * =========================
   * ADD POLL OPTION
   * =========================
   */
  const handleAddPollOption = () => {
    if (pollOptions.length >= 6) {
      toast.error("A poll can contain up to 6 options.");

      return;
    }

    setPollOptions((previous) => [...previous, ""]);
  };

  /*
   * =========================
   * REMOVE POLL OPTION
   * =========================
   */
  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) {
      toast.error("A poll must contain at least 2 options.");

      return;
    }

    setPollOptions((previous) =>
      previous.filter((_, optionIndex) => optionIndex !== index)
    );
  };

  /*
   * =========================
   * UPDATE POLL OPTION
   * =========================
   */
  const handlePollOptionChange = (index: number, value: string) => {
    setPollOptions((previous) =>
      previous.map((option, optionIndex) =>
        optionIndex === index ? value : option
      )
    );
  };

  /*
   * =========================
   * PUBLISH POLL
   * =========================
   */
  const handlePublishPoll = async () => {
    if (!accessToken || publishing) {
      return;
    }

    const question = pollQuestion.trim();

    if (!question) {
      toast.error("Poll question is required.");

      return;
    }

    if (question.length > 1000) {
      toast.error("Poll question cannot exceed 1,000 characters.");

      return;
    }

    const normalizedOptions = pollOptions.map((option) => option.trim());

    if (normalizedOptions.length < 2 || normalizedOptions.length > 6) {
      toast.error("A poll must contain between 2 and 6 options.");

      return;
    }

    if (normalizedOptions.some((option) => !option)) {
      toast.error("All poll options are required.");

      return;
    }

    if (normalizedOptions.some((option) => option.length > 500)) {
      toast.error("Each poll option cannot exceed 500 characters.");

      return;
    }

    const uniqueOptions = new Set(
      normalizedOptions.map((option) => option.toLowerCase())
    );

    if (uniqueOptions.size !== normalizedOptions.length) {
      toast.error("Poll options must be unique.");

      return;
    }

    if (visibility === "TIER_ONLY" && !requiredPlanId) {
      toast.error("Please select a membership plan.");

      return;
    }

    setPublishing(true);

    try {
      const response = await createArtistMembershipPollApi(
        {
          question,

          options: normalizedOptions,

          visibility,

          requiredPlanId:
            visibility === "TIER_ONLY" ? requiredPlanId : undefined,

          allowComments,

          status: "PUBLISHED",
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to publish the poll.");
      }

      toast.success("Poll published successfully.");

      onCreated?.();

      onClose();
    } catch (requestError) {
      console.error("Cannot publish membership poll:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to publish the poll."
      );
    } finally {
      setPublishing(false);
    }
  };

  /*
   * =========================
   * PUBLISH TRACK PREVIEW
   * =========================
   */
  const handlePublishTrackPreview = async () => {
    if (!accessToken || publishing) {
      return;
    }

    if (!selectedTrackId) {
      toast.error("Please select a track.");

      return;
    }

    const selectedTrack =
      tracks.find((track) => getTrackId(track) === selectedTrackId) || null;

    if (!selectedTrack) {
      toast.error("The selected track could not be found.");

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

    const trackDuration = Number(selectedTrack.durationSeconds || 0);

    if (trackDuration > 0 && startSeconds >= trackDuration) {
      toast.error("Preview start time must be before the end of the track.");

      return;
    }

    if (trackDuration > 0 && startSeconds + durationSeconds > trackDuration) {
      toast.error("Preview duration exceeds the track duration.");

      return;
    }

    if (visibility === "TIER_ONLY" && !requiredPlanId) {
      toast.error("Please select a membership plan.");

      return;
    }

    if (content.trim().length > 5000) {
      toast.error("Caption cannot exceed 5,000 characters.");

      return;
    }

    setPublishing(true);

    try {
      const response = await createArtistMembershipPostApi(
        {
          type: "TRACK_PREVIEW",

          visibility,

          requiredPlanId:
            visibility === "TIER_ONLY" ? requiredPlanId : undefined,

          content: content.trim() || undefined,

          trackId: selectedTrackId,

          previewStartSeconds: startSeconds,

          previewDurationSeconds: durationSeconds,

          allowComments,

          status: "PUBLISHED",
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(
          response?.message || "Unable to publish the track preview."
        );
      }

      toast.success("Track preview published successfully.");

      onCreated?.();

      onClose();
    } catch (requestError) {
      console.error("Cannot publish track preview:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to publish the track preview."
      );
    } finally {
      setPublishing(false);
    }
  };

  const darkFieldSx = {
    "& .MuiInputLabel-root": {
      color: "#8F8F8F",
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: "#101010",
          backgroundImage: "none",

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
      {/* CREATE POST HEADER */}
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
          <Box>
            <Typography
              sx={{
                color: "#FFFFFF",

                fontSize: {
                  xs: 18,
                  sm: 20,
                },

                fontWeight: 900,
              }}
            >
              Create membership post
            </Typography>

            <Typography
              sx={{
                mt: 0.25,

                color: "#858585",
                fontSize: 12,
              }}
            >
              Share exclusive content with your community
            </Typography>
          </Box>

          <IconButton
            aria-label="Close create post"
            onClick={onClose}
            sx={{
              color: "#A0A0A0",

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
        {/* POST TYPE */}
        <Typography
          sx={{
            mb: 1.25,

            color: "#A0A0A0",

            fontSize: 12,
            fontWeight: 800,

            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Post type
        </Typography>

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },

            gap: 1.25,
          }}
        >
          {postTypes.map((item) => {
            const selected = postType === item.type;

            return (
              <Button
                key={item.type}
                onClick={() => {
                  setPostType(item.type);
                }}
                sx={{
                  minHeight: 92,

                  p: 1.5,

                  justifyContent: "flex-start",
                  alignItems: "flex-start",

                  textAlign: "left",

                  color: selected ? "#FFFFFF" : "#B0B0B0",

                  bgcolor: selected ? "rgba(255,85,0,0.10)" : "#171717",

                  border: selected
                    ? "1px solid rgba(255,85,0,0.55)"
                    : "1px solid rgba(255,255,255,0.08)",

                  borderRadius: 2,

                  textTransform: "none",

                  "&:hover": {
                    bgcolor: selected ? "rgba(255,85,0,0.14)" : "#202020",

                    borderColor: selected
                      ? "#FF5500"
                      : "rgba(255,255,255,0.16)",
                  },
                }}
              >
                <Stack direction="row" spacing={1.3} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,

                      flexShrink: 0,

                      display: "grid",
                      placeItems: "center",

                      color: selected ? "#FF6A1A" : "#888888",

                      bgcolor: selected ? "rgba(255,85,0,0.12)" : "#222222",

                      borderRadius: 2,
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: 850,
                      }}
                    >
                      {item.label}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,

                        color: "#777777",

                        fontSize: 12,
                        lineHeight: 1.45,
                      }}
                    >
                      {item.description}
                    </Typography>
                  </Box>
                </Stack>
              </Button>
            );
          })}
        </Box>

        {/* POST EDITOR */}
        <Box
          sx={{
            mt: 3,

            p: {
              xs: 2,
              sm: 2.5,
            },

            bgcolor: "#151515",

            border: "1px solid rgba(255,255,255,0.08)",

            borderRadius: 2.5,
          }}
        >
          {/* TEXT POST EDITOR */}
          {postType === "TEXT" && (
            <Stack spacing={2}>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: 16,
                  fontWeight: 850,
                }}
              >
                Text post
              </Typography>

              {/* CONTENT */}
              <TextField
                label="Post content"
                placeholder="Share something with your members..."
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                }}
                multiline
                minRows={5}
                fullWidth
                sx={darkFieldSx}
              />

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

              {/* REQUIRED MEMBERSHIP PLAN */}
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
                  {plans
                    .filter((plan) => plan.active)
                    .map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}

              {/* COMMENTS */}
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
          )}

          {/* IMAGE POST EDITOR */}
          {postType === "IMAGE" && (
            <Stack spacing={2}>
              <Box>
                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: 16,
                    fontWeight: 850,
                  }}
                >
                  Image post
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,

                    color: "#777777",

                    fontSize: 12.5,
                  }}
                >
                  Share an image with your community.
                </Typography>
              </Box>

              {/* IMAGE SELECTOR */}
              {!imagePreviewUrl ? (
                <Button
                  component="label"
                  startIcon={<UploadRoundedIcon />}
                  sx={{
                    minHeight: 170,

                    display: "flex",
                    flexDirection: "column",

                    gap: 1,

                    color: "#A5A5A5",

                    bgcolor: "#111111",

                    border: "1px dashed rgba(255,255,255,0.18)",

                    borderRadius: 2.5,

                    textTransform: "none",

                    "&:hover": {
                      color: "#FFFFFF",

                      bgcolor: "#181818",

                      borderColor: "rgba(255,85,0,0.55)",
                    },

                    "& .MuiButton-startIcon": {
                      m: 0,

                      color: "#FF6A1A",

                      "& svg": {
                        fontSize: 34,
                      },
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 850,
                    }}
                  >
                    Select image
                  </Typography>

                  <Typography
                    sx={{
                      color: "#6F6F6F",

                      fontSize: 12,
                    }}
                  >
                    Choose an image from your device
                  </Typography>

                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleSelectImage}
                  />
                </Button>
              ) : (
                /* IMAGE PREVIEW */
                <Box
                  sx={{
                    overflow: "hidden",

                    bgcolor: "#0D0D0D",

                    border: "1px solid rgba(255,255,255,0.10)",

                    borderRadius: 2.5,
                  }}
                >
                  <Box
                    component="img"
                    src={imagePreviewUrl}
                    alt="Membership post preview"
                    sx={{
                      display: "block",

                      width: "100%",

                      maxHeight: {
                        xs: 320,
                        sm: 430,
                      },

                      objectFit: "contain",

                      bgcolor: "#090909",
                    }}
                  />

                  {/* IMAGE ACTIONS */}
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={1}
                    sx={{
                      p: 1.25,
                    }}
                  >
                    <Button
                      component="label"
                      startIcon={<UploadRoundedIcon />}
                      sx={{
                        minHeight: 38,

                        color: "#FFFFFF",

                        bgcolor: "#252525",

                        borderRadius: 2,

                        fontWeight: 800,

                        textTransform: "none",

                        "&:hover": {
                          bgcolor: "#303030",
                        },
                      }}
                    >
                      Change image
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={handleSelectImage}
                      />
                    </Button>

                    <Button
                      startIcon={<DeleteOutlineRoundedIcon />}
                      onClick={handleRemoveImage}
                      sx={{
                        minHeight: 38,

                        color: "#E29A9A",

                        bgcolor: "rgba(255,80,80,0.06)",

                        border: "1px solid rgba(255,100,100,0.15)",

                        borderRadius: 2,

                        fontWeight: 800,

                        textTransform: "none",

                        "&:hover": {
                          color: "#FFB0B0",

                          bgcolor: "rgba(255,80,80,0.11)",
                        },
                      }}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* IMAGE CAPTION */}
              <TextField
                label="Caption"
                placeholder="Write something about this image..."
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                }}
                multiline
                minRows={3}
                fullWidth
                sx={darkFieldSx}
              />

              {/* IMAGE VISIBILITY */}
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

              {/* REQUIRED MEMBERSHIP PLAN */}
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
                  {plans
                    .filter((plan) => plan.active)
                    .map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}

              {/* IMAGE COMMENTS */}
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
          )}

          {/* POLL POST EDITOR */}
          {postType === "POLL" && (
            <Stack spacing={2}>
              <Box>
                <Typography
                  sx={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: 850,
                  }}
                >
                  Poll
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: "#777777",
                    fontSize: 12.5,
                  }}
                >
                  Ask your community a question.
                </Typography>
              </Box>

              {/* POLL QUESTION */}
              <TextField
                label="Poll question"
                placeholder="What would you like to ask?"
                value={pollQuestion}
                onChange={(event) => {
                  setPollQuestion(event.target.value);
                }}
                inputProps={{
                  maxLength: 1000,
                }}
                multiline
                minRows={3}
                fullWidth
                sx={darkFieldSx}
              />

              {/* POLL OPTIONS */}
              <Stack spacing={1.25}>
                {pollOptions.map((option, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <TextField
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(event) => {
                        handlePollOptionChange(index, event.target.value);
                      }}
                      inputProps={{
                        maxLength: 500,
                      }}
                      fullWidth
                      sx={darkFieldSx}
                    />

                    <IconButton
                      aria-label={`Remove option ${index + 1}`}
                      disabled={pollOptions.length <= 2}
                      onClick={() => {
                        handleRemovePollOption(index);
                      }}
                      sx={{
                        flexShrink: 0,

                        color: "#D98D8D",
                        bgcolor: "#1C1C1C",

                        border: "1px solid rgba(255,255,255,0.08)",

                        "&:hover": {
                          color: "#FFAAAA",

                          bgcolor: "rgba(255,80,80,0.10)",
                        },

                        "&.Mui-disabled": {
                          color: "#444444",
                        },
                      }}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                ))}

                {/* ADD POLL OPTION */}
                <Button
                  disabled={pollOptions.length >= 6}
                  startIcon={<AddRoundedIcon />}
                  onClick={handleAddPollOption}
                  sx={{
                    alignSelf: "flex-start",

                    color: "#FF6A1A",

                    fontWeight: 800,
                    textTransform: "none",

                    "&:hover": {
                      bgcolor: "rgba(255,85,0,0.08)",
                    },
                  }}
                >
                  Add option
                </Button>

                <Typography
                  sx={{
                    color: "#666666",
                    fontSize: 11.5,
                  }}
                >
                  {pollOptions.length} of 6 options
                </Typography>
              </Stack>

              {/* POLL VISIBILITY */}
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
                  {plans
                    .filter((plan) => plan.active)
                    .map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}

              {/* POLL COMMENTS */}
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
          )}

          {/* TRACK PREVIEW EDITOR */}
          {postType === "TRACK_PREVIEW" && (
            <Stack spacing={2}>
              <Box>
                <Typography
                  sx={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: 850,
                  }}
                >
                  Track preview
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: "#777777",
                    fontSize: 12.5,
                  }}
                >
                  Give members an exclusive preview of one of your tracks.
                </Typography>
              </Box>

              {/* SELECT TRACK */}
              <TextField
                select
                label="Track"
                value={selectedTrackId}
                disabled={loadingTracks}
                onChange={(event) => {
                  const nextTrackId = event.target.value;

                  setSelectedTrackId(nextTrackId);

                  setPreviewStartSeconds("0");

                  const track = tracks.find(
                    (item) => getTrackId(item) === nextTrackId
                  );

                  const duration = Number(track?.durationSeconds || 0);

                  setPreviewDurationSeconds(
                    duration > 0
                      ? String(Math.min(60, Math.floor(duration)))
                      : "60"
                  );
                }}
                helperText={
                  loadingTracks
                    ? "Loading your tracks..."
                    : tracks.length === 0
                    ? "No tracks are available."
                    : "Select one of your tracks."
                }
                fullWidth
                sx={darkFieldSx}
              >
                {tracks.map((track) => {
                  const trackId = getTrackId(track);

                  if (!trackId) {
                    return null;
                  }

                  return (
                    <MenuItem key={trackId} value={trackId}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                        sx={{
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          noWrap
                          sx={{
                            color: "inherit",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {track.title}
                        </Typography>

                        <Typography
                          sx={{
                            flexShrink: 0,
                            color: "#777777",
                            fontSize: 11.5,
                          }}
                        >
                          {track.durationSeconds
                            ? `${Math.floor(
                                track.durationSeconds / 60
                              )}:${String(
                                Math.floor(track.durationSeconds % 60)
                              ).padStart(2, "0")}`
                            : "Unknown"}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </TextField>

              {/* SELECTED TRACK INFO */}
              {selectedTrackId &&
                (() => {
                  const track = tracks.find(
                    (item) => getTrackId(item) === selectedTrackId
                  );

                  if (!track) {
                    return null;
                  }

                  return (
                    <Box
                      sx={{
                        p: 1.5,

                        bgcolor: "#101010",

                        border: "1px solid rgba(255,255,255,0.08)",

                        borderRadius: 2,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box minWidth={0}>
                          <Typography
                            noWrap
                            sx={{
                              color: "#FFFFFF",
                              fontSize: 14,
                              fontWeight: 850,
                            }}
                          >
                            {track.title}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.3,
                              color: "#777777",
                              fontSize: 12,
                            }}
                          >
                            Track duration:{" "}
                            {track.durationSeconds
                              ? `${track.durationSeconds} seconds`
                              : "Unknown"}
                          </Typography>
                        </Box>

                        {track.approvalStatus && (
                          <Typography
                            sx={{
                              flexShrink: 0,

                              color:
                                track.approvalStatus === "APPROVED"
                                  ? "#67D67F"
                                  : "#D7A85C",

                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            {track.approvalStatus}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  );
                })()}

              {/* PREVIEW TIME */}
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1.5}
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
                  helperText="Where the preview starts"
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
                  inputProps={{
                    min: 10,
                    max: 600,
                    step: 1,
                  }}
                  helperText="10–600 seconds"
                  fullWidth
                  sx={darkFieldSx}
                />
              </Stack>

              {/* CAPTION */}
              <TextField
                label="Caption"
                placeholder="Tell members something about this preview..."
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                }}
                inputProps={{
                  maxLength: 5000,
                }}
                multiline
                minRows={3}
                fullWidth
                sx={darkFieldSx}
              />

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
                  {plans
                    .filter((plan) => plan.active)
                    .map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}

              {/* TRACK PREVIEW COMMENTS */}
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
          )}
        </Box>

        {/* CREATE POST ERROR */}
      </DialogContent>
      {/* CREATE POST ACTIONS */}
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
          disabled={publishing}
          onClick={onClose}
          sx={{
            color: "#A5A5A5",

            fontWeight: 800,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>

        {postType === "TEXT" && (
          <Button
            variant="contained"
            disabled={
              publishing ||
              !content.trim() ||
              (visibility === "TIER_ONLY" && !requiredPlanId)
            }
            onClick={() => {
              void handlePublishTextPost();
            }}
            startIcon={
              publishing ? (
                <CircularProgress
                  size={16}
                  thickness={5}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : undefined
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
            {publishing ? "Publishing..." : "Publish post"}
          </Button>
        )}

        {/* PUBLISH IMAGE POST */}
        {postType === "IMAGE" && (
          <Button
            variant="contained"
            disabled={
              publishing ||
              !selectedImage ||
              (visibility === "TIER_ONLY" && !requiredPlanId)
            }
            onClick={() => {
              void handlePublishImagePost();
            }}
            startIcon={
              publishing ? (
                <CircularProgress
                  size={16}
                  thickness={5}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : (
                <ImageRoundedIcon />
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
            {publishing ? "Publishing..." : "Publish image"}
          </Button>
        )}
      </DialogActions>

      {/* PUBLISH POLL */}
      {postType === "POLL" && (
        <Button
          variant="contained"
          disabled={
            publishing ||
            !pollQuestion.trim() ||
            pollOptions.some((option) => !option.trim()) ||
            (visibility === "TIER_ONLY" && !requiredPlanId)
          }
          onClick={() => {
            void handlePublishPoll();
          }}
          startIcon={
            publishing ? (
              <CircularProgress
                size={16}
                thickness={5}
                sx={{
                  color: "inherit",
                }}
              />
            ) : (
              <PollRoundedIcon />
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
          {publishing ? "Publishing..." : "Publish poll"}
        </Button>
      )}

      {/* PUBLISH TRACK PREVIEW */}
      {postType === "TRACK_PREVIEW" && (
        <Button
          variant="contained"
          disabled={
            publishing ||
            loadingTracks ||
            !selectedTrackId ||
            !previewDurationSeconds ||
            (visibility === "TIER_ONLY" && !requiredPlanId)
          }
          onClick={() => {
            void handlePublishTrackPreview();
          }}
          startIcon={
            publishing ? (
              <CircularProgress
                size={16}
                thickness={5}
                sx={{
                  color: "inherit",
                }}
              />
            ) : (
              <GraphicEqRoundedIcon />
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
          {publishing ? "Publishing..." : "Publish preview"}
        </Button>
      )}
    </Dialog>
  );
};

export default ProfileMembershipCreatePostDialog;
