"use client";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import * as React from "react";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import axios from "axios";
import { useSession } from "next-auth/react";
import { getCategories, sendRequest } from "@/utils/api";
import { useToast } from "@/utils/toast";
import LinearProgress, {
  LinearProgressProps,
} from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

interface IProps {
  trackUpload: TrackUploadState;
  setTrackUpload: React.Dispatch<React.SetStateAction<TrackUploadState>>;
  setValue: React.Dispatch<React.SetStateAction<number>>;
}

/* Component: Linear progress with label (keeps original logic) */
function LinearProgressWithLabel(
  props: LinearProgressProps & { value: number }
) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ width: "100%", mr: 0.5, color: "white" }}>
        <LinearProgress
          variant="determinate"
          {...props}
          sx={{ height: 8, borderRadius: 2 }}
        />
      </Box>
      <Box sx={{ minWidth: 48 }}>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontWeight: 700 }}
        >
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

function LinearWithValueLabel({
  trackUpload,
}: {
  trackUpload: TrackUploadState;
}) {
  return (
    <Box sx={{ width: "100%", color: "white" }}>
      <LinearProgressWithLabel value={trackUpload.percent} />
    </Box>
  );
}

/* Visually hidden input for file upload */
const VisuallyHiddenInput = (
  props: React.InputHTMLAttributes<HTMLInputElement>
) => (
  <input
    {...props}
    style={{
      position: "absolute",
      left: -9999,
      width: 1,
      height: 1,
      opacity: 0,
    }}
  />
);

const Step2 = (props: IProps) => {
  const toast = useToast();
  const { data: session } = useSession();
  const { trackUpload, setValue } = props;
  const [isUploading, setIsUploading] = React.useState(false);
  const [categories, setCategories] = React.useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);

  const [info, setInfo] = React.useState<INewTrack>({
    title: trackUpload.uploadedTrackName || "",
    description: "",
    category: "",
    imageFile: null,
    imagePreview: "",
  });

  // Keep object URLs to revoke on cleanup
  const imageUrlRef = React.useRef<string | null>(null);

  /// load categories from backend
  React.useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setLoadingCategories(true);

        const response = await getCategories(
          1,
          100,
          (session as any)?.access_token
        );

        if (cancelled) return;

        const responseData = response?.data as any;

        const result: ICategory[] = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.result)
          ? responseData.result
          : Array.isArray(responseData?.content)
          ? responseData.content
          : [];

        setCategories(result);
      } catch (error) {
        console.error("Cannot load categories:", error);
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [(session as any)?.access_token]);

  React.useEffect(() => {
    if (!trackUpload.uploadedTrackName) return;

    setInfo((previous) => ({
      ...previous,
      title: previous.title || trackUpload.uploadedTrackName,
    }));
  }, [trackUpload.uploadedTrackName]);

  React.useEffect(() => {
    return () => {
      // revoke temporary image object url if any
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
    };
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];

    if (!image) return;

    // revoke previous preview
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }

    const previewUrl = URL.createObjectURL(image);
    imageUrlRef.current = previewUrl;

    setInfo((previous) => ({
      ...previous,
      imageFile: image,
      imagePreview: previewUrl,
    }));
  };

  const handleRemoveImage = () => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }

    setInfo((previous) => ({
      ...previous,
      imageFile: null,
      imagePreview: "",
    }));
  };

  const handleSubmitForm = async () => {
    const accessToken = (session as any)?.access_token;

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (!trackUpload.audioFile) {
      toast.error("Please select an audio file.");
      return;
    }

    if (!info.imageFile) {
      toast.error("Please select a cover image.");
      return;
    }

    if (!info.title.trim()) {
      toast.error("Please enter track title.");
      return;
    }

    if (!info.category) {
      toast.error("Please select category.");
      return;
    }

    const formData = new FormData();
    formData.append("title", info.title.trim());
    formData.append("description", info.description.trim());
    formData.append("category", info.category);
    formData.append("image", info.imageFile);
    formData.append("audio", trackUpload.audioFile);

    setIsUploading(true);

    props.setTrackUpload((previous) => ({
      ...previous,
      percent: 0,
    }));

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 1;
            const percent = Math.round((progressEvent.loaded * 100) / total);
            props.setTrackUpload((previous) => ({
              ...previous,
              percent,
            }));
          },
          timeout: 5 * 60 * 1000, // 5 minutes
        }
      );

      if (!response?.data?.data) {
        throw new Error(response?.data?.message || "Upload failed.");
      }

      // success: reset states and go back to first step
      props.setTrackUpload({
        fileName: "",
        uploadedTrackName: "",
        audioFile: null,
        percent: 0,
      });

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }

      setInfo({
        title: "",
        description: "",
        category: "",
        imageFile: null,
        imagePreview: "",
      });

      setValue(0);

      toast.success("Track uploaded and waiting for processing.");

      await sendRequest<IBackendRes<any>>({
        url: "/api/revalidate",
        method: "POST",
        queryParams: {
          tag: "track-by-profile",
          secret: "justArandomString",
        },
      });
    } catch (error: unknown) {
      let message = "Upload failed.";

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;

        if (error.response?.status === 409) {
          message = "Audio file already exists.";
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast.error(message);

      props.setTrackUpload((previous) => ({
        ...previous,
        percent: 0,
      }));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      {/* Header: file name + progress */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ mb: 1, fontWeight: 900 }}>Upload progress</Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ minWidth: 220, maxWidth: "60%" }}>
            <LinearWithValueLabel trackUpload={trackUpload} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: "#bdbdbd", fontWeight: 700 }}
            >
              {trackUpload.fileName ||
                trackUpload.uploadedTrackName ||
                "No audio selected"}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "#9e9e9e" }}>
              {trackUpload.percent}% • {isUploading ? "Uploading..." : "Ready"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Responsive form */}
      <Grid container spacing={3}>
        {/* Left: cover preview & select */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", sm: 320 },
              height: { xs: 180, sm: 320 },
              borderRadius: 2,
              overflow: "hidden",
              background: "linear-gradient(180deg, #111, #0b0b0b)",
              border: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
            aria-label="Cover preview"
          >
            {info.imagePreview ? (
              <Box
                component="img"
                src={info.imagePreview}
                alt="Track cover preview"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  color: "#7a7a7a",
                  px: 2,
                }}
              >
                <ImageSearchIcon sx={{ fontSize: 36, mb: 1 }} />
                <Typography sx={{ fontSize: 14 }}>No cover selected</Typography>
                <Typography sx={{ fontSize: 12, color: "#9a9a9a", mt: 1 }}>
                  Recommended: 1400 x 1400 (JPG/PNG/WebP)
                </Typography>
              </Box>
            )}

            {/* overlay action buttons */}
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                left: 10,
                display: "flex",
                gap: 1,
              }}
            >
              <Button
                component="label"
                variant="contained"
                startIcon={<PhotoCamera />}
                sx={{
                  background: "linear-gradient(90deg,#ff7a00,#ff4d4f)",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 900,
                  px: 2,
                  height: 38,
                  "&:hover": { opacity: 0.95 },
                }}
                disabled={isUploading}
              >
                Select cover
                <VisuallyHiddenInput
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                />
              </Button>

              <IconButton
                aria-label="remove cover"
                onClick={handleRemoveImage}
                sx={{
                  bgcolor: "rgba(255,255,255,0.04)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
                disabled={!info.imagePreview || isUploading}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          {/* small caption / accessibility */}
          <Typography
            sx={{
              color: "#9e9e9e",
              fontSize: 13,
              textAlign: "center",
              pt: 0.5,
            }}
          >
            Cover will be used as the track artwork and shown in player views.
          </Typography>
        </Grid>

        {/* Right: metadata inputs */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              value={info?.title}
              onChange={(e) => setInfo({ ...info, title: e.target.value })}
              label="Title"
              variant="filled"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                backgroundColor: "#121212",
                "& .MuiFilledInput-root": {
                  backgroundColor: "#121212",
                  color: "#fff",
                },
                "& .MuiInputLabel-root": { color: "#bdbdbd" },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: "transparent",
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: "#FF7A00",
                },
                fontWeight: 700,
              }}
            />

            <TextField
              value={info?.description}
              onChange={(e) =>
                setInfo({ ...info, description: e.target.value })
              }
              label="Description"
              variant="filled"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              multiline
              rows={3}
              sx={{
                backgroundColor: "#121212",
                "& .MuiFilledInput-root": {
                  backgroundColor: "#121212",
                  color: "#fff",
                },
                "& .MuiInputLabel-root": { color: "#bdbdbd" },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: "transparent",
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: "#FF7A00",
                },
              }}
            />

            <TextField
              id="outlined-select-category"
              select
              label="Category"
              fullWidth
              value={info?.category}
              onChange={(e) => setInfo({ ...info, category: e.target.value })}
              variant="filled"
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                backgroundColor: "#121212",
                "& .MuiFilledInput-root": {
                  backgroundColor: "#121212",
                  color: "#fff",
                },
                "& .MuiInputLabel-root": { color: "#bdbdbd" },
                "& .MuiFilledInput-underline:before": {
                  borderBottomColor: "transparent",
                },
                "& .MuiFilledInput-underline:after": {
                  borderBottomColor: "#FF7A00",
                },
              }}
            >
              {loadingCategories ? (
                <MenuItem disabled>Loading categories...</MenuItem>
              ) : categories.length ? (
                categories.map((option) => {
                  const categoryId =
                    option?._id || option?.id || option?.slug || option?.name;
                  const categoryValue = option?.slug || option?.name || "";
                  return (
                    <MenuItem
                      key={categoryId}
                      value={categoryValue}
                      sx={{
                        color: "#fff",
                        backgroundColor: "#111",
                        "&.Mui-selected": {
                          backgroundColor: "#222",
                          color: "#FF7A00",
                        },
                        "&.Mui-selected:hover": {
                          backgroundColor: "#2b2b2b",
                        },
                        "&:hover": { backgroundColor: "#222" },
                      }}
                    >
                      {option?.name || option?.slug || "Unknown category"}
                    </MenuItem>
                  );
                })
              ) : (
                <MenuItem disabled>No categories available</MenuItem>
              )}
            </TextField>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
                mt: 1,
              }}
            >
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleSubmitForm}
                disabled={isUploading}
                sx={{
                  background: "linear-gradient(90deg,#ff7a00,#ff4d4f)",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 900,
                  px: 3,
                  py: 1,
                  "&:hover": { opacity: 0.98 },
                }}
              >
                {isUploading ? `Uploading ${trackUpload.percent}%` : "Save"}
              </Button>

              <Button
                variant="outlined"
                onClick={() => {
                  // go back to step 1 or clear audio selection if needed
                  props.setTrackUpload((prev) => ({
                    ...prev,
                    audioFile: null,
                    fileName: "",
                    uploadedTrackName: "",
                  }));
                  setValue(0);
                }}
                disabled={isUploading}
                sx={{
                  borderColor: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 800,
                }}
              >
                Cancel
              </Button>

              {/* small helper / hint */}
              <Typography sx={{ color: "#9e9e9e", fontSize: 13, ml: "auto" }}>
                Max file size: 200MB
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Step2;
