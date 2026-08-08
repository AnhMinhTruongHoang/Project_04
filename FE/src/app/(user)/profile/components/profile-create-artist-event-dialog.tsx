"use client";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { createArtistEventApi } from "@/utils/api";
import { useToast } from "@/utils/toast";

const ProfileCreateArtistEventDialog = ({
  open,
  accessToken,
  onClose,
  onCreated,
}: IProfileCreateArtistEventDialogProps) => {
  const toast = useToast();

  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<ArtistEventType>("CONCERT");

  const [description, setDescription] = useState("");

  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");

  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");

  const [saleStartAt, setSaleStartAt] = useState("");
  const [saleEndAt, setSaleEndAt] = useState("");

  const [ticketPrice, setTicketPrice] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("");

  const [ticketImage, setTicketImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  /*
   * =========================
   * RESET FORM
   * =========================
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setEventName("");
    setEventType("CONCERT");
    setDescription("");

    setVenueName("");
    setVenueAddress("");

    setEventStartAt("");
    setEventEndAt("");

    setSaleStartAt("");
    setSaleEndAt("");

    setTicketPrice("");
    setTotalQuantity("");

    setTicketImage(null);
    setImagePreviewUrl(null);

    setSubmitting(false);
  }, [open]);

  /*
   * =========================
   * CLEAN IMAGE PREVIEW
   * =========================
   */
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  /*
   * =========================
   * DARK FIELD STYLE
   * =========================
   */
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

    "& input[type='datetime-local']": {
      colorScheme: "dark",
    },
  };

  /*
   * =========================
   * FORM VALID
   * =========================
   */
  const formValid = useMemo(() => {
    return Boolean(
      eventName.trim() &&
        venueName.trim() &&
        venueAddress.trim() &&
        eventStartAt &&
        saleStartAt &&
        saleEndAt &&
        Number(ticketPrice) > 0 &&
        Number(totalQuantity) > 0 &&
        ticketImage
    );
  }, [
    eventName,
    venueName,
    venueAddress,
    eventStartAt,
    saleStartAt,
    saleEndAt,
    ticketPrice,
    totalQuantity,
    ticketImage,
  ]);

  /*
   * =========================
   * SELECT TICKET ARTWORK
   * =========================
   */
  const handleSelectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ticket artwork must be 10 MB or smaller.");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);

    setTicketImage(file);
    setImagePreviewUrl(previewUrl);
  };

  /*
   * =========================
   * VALIDATE DATES
   * =========================
   */
  const validateDates = () => {
    const eventStart = new Date(eventStartAt);
    const saleStart = new Date(saleStartAt);
    const saleEnd = new Date(saleEndAt);

    if (
      Number.isNaN(eventStart.getTime()) ||
      Number.isNaN(saleStart.getTime()) ||
      Number.isNaN(saleEnd.getTime())
    ) {
      toast.error("Please enter valid event and sale dates.");
      return false;
    }

    if (saleEnd <= saleStart) {
      toast.error("Sale end time must be after the sale start time.");
      return false;
    }

    if (saleEnd > eventStart) {
      toast.error("Ticket sales must end before the event starts.");
      return false;
    }

    if (eventEndAt) {
      const eventEnd = new Date(eventEndAt);

      if (Number.isNaN(eventEnd.getTime()) || eventEnd <= eventStart) {
        toast.error("Event end time must be after the event start time.");
        return false;
      }
    }

    return true;
  };

  /*
   * =========================
   * CREATE EVENT
   * =========================
   */
  const handleCreateEvent = async () => {
    if (!accessToken) {
      toast.error("Please sign in again.");
      return;
    }

    if (!ticketImage) {
      toast.error("Ticket artwork is required.");
      return;
    }

    if (!formValid || submitting) {
      return;
    }

    if (!validateDates()) {
      return;
    }

    const normalizedTicketPrice = Number(ticketPrice);
    const normalizedQuantity = Number(totalQuantity);

    if (
      !Number.isInteger(normalizedTicketPrice) ||
      normalizedTicketPrice <= 0
    ) {
      toast.error("Ticket price must be a positive whole number.");
      return;
    }

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
      toast.error("Ticket quantity must be a positive whole number.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createArtistEventApi(
        {
          eventName: eventName.trim(),
          eventType,

          description: description.trim() || undefined,

          venueName: venueName.trim(),
          venueAddress: venueAddress.trim(),

          eventStartAt,
          eventEndAt: eventEndAt || undefined,

          saleStartAt,
          saleEndAt,

          ticketPrice: normalizedTicketPrice,
          totalQuantity: normalizedQuantity,

          ticketImage,
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to create the event.");
      }

      toast.success("Event submitted for admin review.");

      onCreated?.();
      onClose();
    } catch (error) {
      console.error("Cannot create artist event:", error);

      toast.error(
        error instanceof Error ? error.message : "Unable to create the event."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
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
      {/* CREATE EVENT HEADER */}
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
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,

                display: "grid",
                placeItems: "center",

                color: "#FF6A1A",
                bgcolor: "rgba(255,85,0,0.12)",

                borderRadius: 2,
              }}
            >
              <EventAvailableRoundedIcon />
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                Create event
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  color: "#858585",
                  fontSize: 12,
                }}
              >
                Submit a ticketed event for admin review
              </Typography>
            </Box>
          </Stack>

          <IconButton
            disabled={submitting}
            onClick={onClose}
            aria-label="Close create event"
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
        <Stack spacing={2.5}>
          {/* EVENT INFORMATION */}
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },

              gap: 2,
            }}
          >
            <TextField
              label="Event name"
              value={eventName}
              onChange={(event) => {
                setEventName(event.target.value);
              }}
              fullWidth
              sx={darkFieldSx}
            />

            <TextField
              select
              label="Event type"
              value={eventType}
              onChange={(event) => {
                setEventType(event.target.value as ArtistEventType);
              }}
              fullWidth
              sx={darkFieldSx}
            >
              <MenuItem value="CONCERT">Concert</MenuItem>
              <MenuItem value="TOUR">Tour</MenuItem>
              <MenuItem value="FAN_MEETING">Fan meeting</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
          </Box>

          <TextField
            label="Description"
            placeholder="Tell fans about this event..."
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            multiline
            minRows={4}
            fullWidth
            sx={darkFieldSx}
          />

          {/* VENUE */}
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },

              gap: 2,
            }}
          >
            <TextField
              label="Venue name"
              value={venueName}
              onChange={(event) => {
                setVenueName(event.target.value);
              }}
              fullWidth
              sx={darkFieldSx}
            />

            <TextField
              label="Venue address"
              value={venueAddress}
              onChange={(event) => {
                setVenueAddress(event.target.value);
              }}
              fullWidth
              sx={darkFieldSx}
            />
          </Box>

          {/* EVENT DATES */}
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },

              gap: 2,
            }}
          >
            <TextField
              type="datetime-local"
              label="Event starts"
              value={eventStartAt}
              onChange={(event) => {
                setEventStartAt(event.target.value);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              sx={darkFieldSx}
            />

            <TextField
              type="datetime-local"
              label="Event ends"
              value={eventEndAt}
              onChange={(event) => {
                setEventEndAt(event.target.value);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              sx={darkFieldSx}
            />
          </Box>

          {/* SALE DATES */}
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },

              gap: 2,
            }}
          >
            <TextField
              type="datetime-local"
              label="Ticket sale starts"
              value={saleStartAt}
              onChange={(event) => {
                setSaleStartAt(event.target.value);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              sx={darkFieldSx}
            />

            <TextField
              type="datetime-local"
              label="Ticket sale ends"
              value={saleEndAt}
              onChange={(event) => {
                setSaleEndAt(event.target.value);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              sx={darkFieldSx}
            />
          </Box>

          {/* PRICE AND INVENTORY */}
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },

              gap: 2,
            }}
          >
            <TextField
              type="number"
              label="Ticket price (VND)"
              value={ticketPrice}
              onChange={(event) => {
                setTicketPrice(event.target.value);
              }}
              inputProps={{
                min: 1,
                step: 1000,
              }}
              fullWidth
              sx={darkFieldSx}
            />

            <TextField
              type="number"
              label="Total tickets"
              value={totalQuantity}
              onChange={(event) => {
                setTotalQuantity(event.target.value);
              }}
              inputProps={{
                min: 1,
                step: 1,
              }}
              fullWidth
              sx={darkFieldSx}
            />
          </Box>

          {/* TICKET ARTWORK */}
          <Box>
            <Typography
              sx={{
                mb: 1,

                color: "#A5A5A5",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Ticket artwork
            </Typography>

            {imagePreviewUrl ? (
              <Box
                sx={{
                  position: "relative",

                  overflow: "hidden",

                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 2.5,
                }}
              >
                <Box
                  component="img"
                  src={imagePreviewUrl}
                  alt="Ticket artwork preview"
                  sx={{
                    width: "100%",
                    maxHeight: 360,

                    display: "block",
                    objectFit: "cover",
                  }}
                />

                <Button
                  component="label"
                  disabled={submitting}
                  sx={{
                    position: "absolute",

                    right: 12,
                    bottom: 12,

                    color: "#FFFFFF",
                    bgcolor: "rgba(0,0,0,0.75)",

                    textTransform: "none",
                    fontWeight: 800,

                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.9)",
                    },
                  }}
                >
                  Replace artwork
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleSelectImage}
                  />
                </Button>
              </Box>
            ) : (
              <Button
                component="label"
                startIcon={<CloudUploadRoundedIcon />}
                sx={{
                  width: "100%",
                  minHeight: 150,

                  color: "#BDBDBD",
                  bgcolor: "#171717",

                  border: "1px dashed #484848",
                  borderRadius: 2.5,

                  textTransform: "none",
                  fontWeight: 850,

                  "&:hover": {
                    color: "#FFFFFF",

                    bgcolor: "#1D1D1D",
                    borderColor: "#FF5500",
                  },
                }}
              >
                Upload ticket artwork
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleSelectImage}
                />
              </Button>
            )}

            <Typography
              sx={{
                mt: 0.75,

                color: "#666666",
                fontSize: 11,
              }}
            >
              Image files only. Maximum size 10 MB.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      {/* CREATE EVENT ACTIONS */}
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
          disabled={submitting}
          onClick={onClose}
          sx={{
            color: "#A5A5A5",
            textTransform: "none",
            fontWeight: 800,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={!formValid || submitting}
          onClick={() => {
            void handleCreateEvent();
          }}
          startIcon={
            submitting ? (
              <CircularProgress
                size={16}
                thickness={5}
                sx={{
                  color: "inherit",
                }}
              />
            ) : (
              <EventAvailableRoundedIcon />
            )
          }
          sx={{
            minHeight: 42,

            px: 2.5,

            color: "#FFFFFF",
            bgcolor: "#FF5500",

            borderRadius: 2,

            textTransform: "none",
            fontWeight: 900,

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
          {submitting ? "Submitting..." : "Submit for review"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileCreateArtistEventDialog;
