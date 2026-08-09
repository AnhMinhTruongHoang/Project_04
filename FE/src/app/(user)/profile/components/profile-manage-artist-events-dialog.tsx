"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";

import { useCallback, useEffect, useRef, useState } from "react";

import { getMyArtistEventsApi } from "@/utils/api";
import { useToast } from "@/utils/toast";
import TicketCheckInDialog from "./ticket-check-in-dialog";

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatMoney = (value?: number | null, currency = "VND") => {
  return `${new Intl.NumberFormat("en-US").format(
    Number(value || 0)
  )} ${currency}`;
};

const getApprovalStyle = (status: ArtistEventApprovalStatus) => {
  switch (status) {
    case "APPROVED":
      return {
        label: "Approved",
        color: "#6EE7A8",
        bgcolor: "rgba(34,197,94,0.10)",
        borderColor: "rgba(34,197,94,0.30)",
      };

    case "REJECTED":
      return {
        label: "Rejected",
        color: "#FF8B8B",
        bgcolor: "rgba(239,68,68,0.10)",
        borderColor: "rgba(239,68,68,0.30)",
      };

    default:
      return {
        label: "Pending review",
        color: "#F5B85C",
        bgcolor: "rgba(245,158,11,0.10)",
        borderColor: "rgba(245,158,11,0.30)",
      };
  }
};

const ProfileManageArtistEventsDialog = ({
  open,
  accessToken,
  onClose,
}: IProfileManageArtistEventsDialogProps) => {
  const toast = useToast();

  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [events, setEvents] = useState<IArtistManagedEvent[]>([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [checkInOpen, setCheckInOpen] = useState(false);

  /*
   * =========================
   * LOAD ARTIST EVENTS
   * =========================
   */
  const loadEvents = useCallback(
    async (refresh = false) => {
      if (!accessToken) {
        setEvents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await getMyArtistEventsApi(accessToken, 1, 50);

        const items = response?.data?.items;

        setEvents(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Cannot load artist events:", error);

        setEvents([]);

        toastRef.current.error("Unable to load your events.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadEvents(false);
  }, [open, loadEvents]);

  return (
    <>
      {/* MANAGE EVENTS DIALOG */}
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
        {/* MANAGE EVENTS HEADER */}
        <DialogTitle
          sx={{
            p: 0,

            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{
              minHeight: 72,

              px: {
                xs: 2,
                sm: 3,
              },
            }}
          >
            {/* HEADER TITLE */}
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
                  Manage events
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,

                    color: "#858585",

                    fontSize: 12,
                  }}
                >
                  Review your ticketed event submissions
                </Typography>
              </Box>
            </Stack>

            {/* HEADER ACTIONS */}
            <Stack direction="row" spacing={0.5}>
              {/* DESKTOP TICKET CHECK-IN */}
              <Button
                variant="outlined"
                startIcon={<QrCodeScannerRoundedIcon />}
                onClick={() => {
                  setCheckInOpen(true);
                }}
                sx={{
                  display: {
                    xs: "none",
                    sm: "flex",
                  },

                  minHeight: 38,
                  px: 1.5,

                  color: "#FFFFFF",

                  borderColor: "#484848",

                  borderRadius: 2,

                  textTransform: "none",
                  fontWeight: 850,

                  "&:hover": {
                    bgcolor: "#1D1D1D",
                    borderColor: "#FF5500",
                  },
                }}
              >
                Check in
              </Button>

              {/* REFRESH EVENTS */}
              <IconButton
                disabled={refreshing}
                onClick={() => {
                  void loadEvents(true);
                }}
                sx={{
                  color: "#A0A0A0",

                  "&:hover": {
                    color: "#FFFFFF",
                    bgcolor: "#242424",
                  },

                  "&.Mui-disabled": {
                    color: "#555555",
                  },
                }}
              >
                {refreshing ? (
                  <CircularProgress
                    size={20}
                    thickness={5}
                    sx={{
                      color: "#FF5500",
                    }}
                  />
                ) : (
                  <RefreshRoundedIcon />
                )}
              </IconButton>

              {/* MOBILE TICKET CHECK-IN */}
              <IconButton
                onClick={() => {
                  setCheckInOpen(true);
                }}
                sx={{
                  display: {
                    xs: "inline-flex",
                    sm: "none",
                  },

                  color: "#FF6A1A",

                  "&:hover": {
                    bgcolor: "rgba(255,85,0,0.12)",
                  },
                }}
              >
                <QrCodeScannerRoundedIcon />
              </IconButton>

              {/* CLOSE DIALOG */}
              <IconButton
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
          </Stack>
        </DialogTitle>

        {/* MANAGE EVENTS CONTENT */}
        <DialogContent
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          {/* LOADING */}
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1.5}
              sx={{
                minHeight: 260,
              }}
            >
              <CircularProgress
                size={30}
                thickness={5}
                sx={{
                  color: "#FF5500",
                }}
              />

              <Typography
                sx={{
                  color: "#777777",
                  fontSize: 13,
                }}
              >
                Loading events...
              </Typography>
            </Stack>
          ) : events.length === 0 ? (
            /* EMPTY STATE */
            <Paper
              elevation={0}
              sx={{
                minHeight: 240,

                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                px: 2,
                py: 4,

                textAlign: "center",

                bgcolor: "#151515",

                border: "1px dashed #383838",

                borderRadius: 2.5,
              }}
            >
              <Box>
                <EventAvailableRoundedIcon
                  sx={{
                    color: "#555555",
                    fontSize: 42,
                  }}
                />

                <Typography
                  sx={{
                    mt: 1,

                    color: "#FFFFFF",

                    fontSize: 17,
                    fontWeight: 900,
                  }}
                >
                  No event submissions
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,

                    color: "#777777",

                    fontSize: 12,
                  }}
                >
                  Events you submit will appear here.
                </Typography>
              </Box>
            </Paper>
          ) : (
            /* EVENT MANAGEMENT LIST */
            <Stack spacing={1.5}>
              {events.map((event) => {
                const approval = getApprovalStyle(event.approvalStatus);

                const reservedQuantity = Number(event.reservedQuantity || 0);

                const remainingQuantity = Math.max(
                  Number(event.totalQuantity || 0) -
                    Number(event.soldQuantity || 0) -
                    reservedQuantity,
                  0
                );

                return (
                  <Paper
                    key={event.id}
                    elevation={0}
                    sx={{
                      p: {
                        xs: 1.75,
                        sm: 2,
                      },

                      bgcolor: "#151515",

                      border: "1px solid #2D2D2D",

                      borderRadius: 2.5,
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={2}
                    >
                      {/* EVENT ARTWORK */}
                      <Box
                        component="img"
                        src={event.ticketImageUrl}
                        alt={`${event.eventName} artwork`}
                        sx={{
                          width: {
                            xs: "100%",
                            sm: 145,
                          },

                          height: {
                            xs: 180,
                            sm: 145,
                          },

                          flexShrink: 0,

                          objectFit: "cover",

                          bgcolor: "#090909",

                          borderRadius: 2,
                        }}
                      />

                      {/* EVENT DETAILS */}
                      <Stack
                        spacing={1.25}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {/* EVENT TITLE + APPROVAL STATUS */}
                        <Stack
                          direction={{
                            xs: "column",
                            sm: "row",
                          }}
                          justifyContent="space-between"
                          alignItems={{
                            xs: "flex-start",
                            sm: "center",
                          }}
                          spacing={1}
                        >
                          <Box minWidth={0}>
                            <Typography
                              sx={{
                                color: "#777777",

                                fontSize: 10,

                                fontWeight: 900,

                                textTransform: "uppercase",

                                letterSpacing: 0.7,
                              }}
                            >
                              {event.eventType.replaceAll("_", " ")}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.2,

                                color: "#FFFFFF",

                                fontSize: 17,

                                fontWeight: 900,

                                lineHeight: 1.3,
                              }}
                            >
                              {event.eventName}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={approval.label}
                            sx={{
                              color: approval.color,

                              bgcolor: approval.bgcolor,

                              border: `1px solid ${approval.borderColor}`,

                              fontWeight: 900,
                            }}
                          />
                        </Stack>

                        {/* EVENT DATE */}
                        <Typography
                          sx={{
                            color: "#A0A0A0",
                            fontSize: 12,
                          }}
                        >
                          {formatDate(event.eventStartAt)}
                        </Typography>

                        {/* EVENT VENUE */}
                        <Typography
                          sx={{
                            color: "#808080",
                            fontSize: 12,
                          }}
                        >
                          {event.venueName}
                        </Typography>

                        <Divider
                          sx={{
                            borderColor: "#292929",
                          }}
                        />

                        {/* EVENT SALES STATS */}
                        <Box
                          sx={{
                            display: "grid",

                            gridTemplateColumns: {
                              xs: "repeat(2, minmax(0, 1fr))",
                              sm: "repeat(4, minmax(0, 1fr))",
                            },

                            gap: 1.5,
                          }}
                        >
                          {/* TICKET PRICE */}
                          <Box>
                            <Typography
                              sx={{
                                color: "#666666",
                                fontSize: 10,
                              }}
                            >
                              Ticket price
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.25,

                                color: "#FFFFFF",

                                fontSize: 13,
                                fontWeight: 800,
                              }}
                            >
                              {formatMoney(event.ticketPrice, event.currency)}
                            </Typography>
                          </Box>

                          {/* SOLD QUANTITY */}
                          <Box>
                            <Typography
                              sx={{
                                color: "#666666",
                                fontSize: 10,
                              }}
                            >
                              Sold
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.25,

                                color: "#FFFFFF",

                                fontSize: 13,
                                fontWeight: 800,
                              }}
                            >
                              {event.soldQuantity}
                            </Typography>
                          </Box>

                          {/* RESERVED QUANTITY */}
                          <Box>
                            <Typography
                              sx={{
                                color: "#666666",
                                fontSize: 10,
                              }}
                            >
                              Reserved
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.25,

                                color: "#FFFFFF",

                                fontSize: 13,
                                fontWeight: 800,
                              }}
                            >
                              {reservedQuantity}
                            </Typography>
                          </Box>

                          {/* REMAINING QUANTITY */}
                          <Box>
                            <Typography
                              sx={{
                                color: "#666666",
                                fontSize: 10,
                              }}
                            >
                              Remaining
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.25,

                                color: "#FFFFFF",

                                fontSize: 13,
                                fontWeight: 800,
                              }}
                            >
                              {remainingQuantity}
                            </Typography>
                          </Box>
                        </Box>

                        {/* REJECTION REASON */}
                        {event.approvalStatus === "REJECTED" &&
                          event.rejectionReason?.trim() && (
                            <Box
                              sx={{
                                mt: 0.5,

                                p: 1.25,

                                bgcolor: "rgba(239,68,68,0.08)",

                                border: "1px solid rgba(239,68,68,0.20)",

                                borderRadius: 2,
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "#FF8B8B",

                                  fontSize: 11,
                                  fontWeight: 900,
                                }}
                              >
                                Rejection reason
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.35,

                                  color: "#C5C5C5",

                                  fontSize: 12,

                                  lineHeight: 1.55,
                                }}
                              >
                                {event.rejectionReason}
                              </Typography>
                            </Box>
                          )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* TICKET CHECK-IN DIALOG */}
      <TicketCheckInDialog
        open={checkInOpen}
        accessToken={accessToken}
        onClose={() => {
          setCheckInOpen(false);
        }}
      />
    </>
  );
};

export default ProfileManageArtistEventsDialog;
