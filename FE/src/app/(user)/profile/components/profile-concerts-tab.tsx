"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createTicketPaymentApi, getPublicArtistEventsApi } from "@/utils/api";

import { useToast } from "@/utils/toast";
import ProfileCreateArtistEventDialog from "./profile-create-artist-event-dialog";
import ProfileManageArtistEventsDialog from "./profile-manage-artist-events-dialog";
import TestTicketPaymentDialog from "./test-ticket-payment-dialog";

const PAYMENT_TEST_MODE = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === "true";

/*
 * =========================
 * DATE FORMAT
 * =========================
 */
const formatEventDate = (value?: string | null) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/*
 * =========================
 * MONEY FORMAT
 * =========================
 */
const formatMoney = (value?: number | null, currency?: string | null) => {
  const amount = Number(value || 0);

  return `${new Intl.NumberFormat("en-US").format(amount)} ${
    currency || "VND"
  }`;
};

/*
 * =========================
 * SALE STATUS LABEL
 * =========================
 */
const getSaleStatusLabel = (status: ArtistEventSaleStatus) => {
  switch (status) {
    case "ON_SALE":
      return "On sale";

    case "UPCOMING":
      return "Coming soon";

    case "SOLD_OUT":
      return "Sold out";

    case "SALE_ENDED":
      return "Sale ended";

    case "ENDED":
      return "Ended";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
};

/*
 * =========================
 * SALE STATUS STYLE
 * =========================
 */
const getSaleStatusStyle = (status: ArtistEventSaleStatus) => {
  switch (status) {
    case "ON_SALE":
      return {
        color: "#6EE7A8",
        bgcolor: "rgba(34,197,94,0.11)",
        borderColor: "rgba(34,197,94,0.30)",
      };

    case "UPCOMING":
      return {
        color: "#7EB6FF",
        bgcolor: "rgba(59,130,246,0.11)",
        borderColor: "rgba(59,130,246,0.30)",
      };

    case "SOLD_OUT":
      return {
        color: "#F1A64A",
        bgcolor: "rgba(245,158,11,0.10)",
        borderColor: "rgba(245,158,11,0.28)",
      };

    case "CANCELLED":
      return {
        color: "#FF8B8B",
        bgcolor: "rgba(239,68,68,0.10)",
        borderColor: "rgba(239,68,68,0.28)",
      };

    default:
      return {
        color: "#A7A7A7",
        bgcolor: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.12)",
      };
  }
};

const ProfileConcertsTab = ({
  artistId,
  artistName,
  accessToken,
  isOwner = false,
  onRequireLogin,
}: IProfileConcertsTabProps) => {
  const toast = useToast();

  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [events, setEvents] = useState<IArtistEvent[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<IArtistEvent | null>(null);

  const [quantity, setQuantity] = useState(1);

  const [paymentLoading, setPaymentLoading] = useState(false);

  const [createEventOpen, setCreateEventOpen] = useState(false);

  const [manageEventsOpen, setManageEventsOpen] = useState(false);

  /* TEST PAYMENT */
  const [testPaymentOrderCode, setTestPaymentOrderCode] = useState("");

  /*
   * =========================
   * LOAD PUBLIC EVENTS
   * =========================
   */
  const loadEvents = useCallback(
    async (fullLoading = true) => {
      if (!artistId?.trim()) {
        setEvents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (fullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await getPublicArtistEventsApi(
          artistId,
          1,
          50,
          accessToken
        );

        const items = response?.data?.items;

        setEvents(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Cannot load artist events:", error);

        setEvents([]);

        toastRef.current.error("Unable to load concerts and tours.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, artistId]
  );
  /*
   * =========================
   * RESET ON ARTIST CHANGE
   * =========================
   */
  useEffect(() => {
    setEvents([]);
    setSelectedEvent(null);
    setQuantity(1);
  }, [artistId]);

  useEffect(() => {
    void loadEvents(true);
  }, [loadEvents]);

  /*
   * =========================
   * AVAILABLE QUANTITY
   * =========================
   */
  const maximumQuantity = useMemo(() => {
    if (!selectedEvent) {
      return 1;
    }

    return Math.max(Number(selectedEvent.remainingQuantity || 0), 1);
  }, [selectedEvent]);

  /*
   * =========================
   * OPEN BUY DIALOG
   * =========================
   */
  const handleOpenBuy = (event: IArtistEvent) => {
    if (isOwner) {
      toast.error("You cannot purchase tickets for your own event.");

      return;
    }

    if (!accessToken) {
      toast.error("Please sign in to buy tickets.");

      onRequireLogin?.();

      return;
    }

    if (!event.canPurchase) {
      toast.error("Tickets are not available for purchase.");

      return;
    }

    if (Number(event.remainingQuantity || 0) <= 0) {
      toast.error("This event is sold out.");

      return;
    }

    setSelectedEvent(event);
    setQuantity(1);
  };

  /*
   * =========================
   * QUANTITY CHANGE
   * =========================
   */
  const updateQuantity = (nextQuantity: number) => {
    const normalized = Math.min(
      Math.max(Math.floor(nextQuantity || 1), 1),
      maximumQuantity
    );

    setQuantity(normalized);
  };

  /*
   * =========================
   * CREATE VNPAY PAYMENT
   * =========================
   */
  const handleBuyTicket = async () => {
    if (!selectedEvent || paymentLoading) {
      return;
    }

    if (!accessToken) {
      toast.error("Please sign in to buy tickets.");

      onRequireLogin?.();

      return;
    }

    try {
      setPaymentLoading(true);

      const response = await createTicketPaymentApi(
        {
          eventId: selectedEvent.id,
          quantity,
          locale: "en",
        },
        accessToken
      );

      const payment = response?.data;

      if (!payment?.paymentUrl?.trim()) {
        throw new Error(
          response?.message || "Unable to get the VNPay payment URL."
        );
      }

      /*
       * =========================
       * REDIRECT TO VNPAY
       * =========================
       */
      window.location.assign(payment.paymentUrl);
    } catch (error) {
      console.error("Cannot create ticket payment:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create the ticket payment."
      );

      setPaymentLoading(false);
    }
  };

  /*
   * =========================
   * LOADING
   * =========================
   */
  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton
          variant="rounded"
          height={120}
          sx={{
            bgcolor: "#1B1B1B",
            borderRadius: 3,
          }}
        />

        {Array.from({
          length: 2,
        }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            height={260}
            sx={{
              bgcolor: "#1B1B1B",
              borderRadius: 3,
            }}
          />
        ))}
      </Stack>
    );
  }

  /*
   * =========================
   * TEST TICKET PAYMENT
   * =========================
   */
  const handleTestPayment = async () => {
    if (!PAYMENT_TEST_MODE) {
      toast.error("Test payment is disabled.");
      return;
    }

    if (!accessToken) {
      if (onRequireLogin) {
        onRequireLogin();
      } else {
        toast.error("Please login first.");
      }

      return;
    }

    if (!selectedEvent) {
      toast.error("Please select an event.");
      return;
    }

    if (!selectedEvent.canPurchase) {
      toast.error("Tickets are not available for this event.");
      return;
    }

    if (quantity < 1 || quantity > maximumQuantity) {
      toast.error("Invalid ticket quantity.");
      return;
    }

    if (paymentLoading) {
      return;
    }

    try {
      setPaymentLoading(true);

      /*
       * CREATE REAL TICKET ORDER
       *
       * This still creates:
       * SCT order
       * reservation
       * amount snapshot
       * ticket quantity snapshot
       */
      const response = await createTicketPaymentApi(
        {
          eventId: selectedEvent.id,
          quantity,
        },
        accessToken
      );

      const payment = response?.data;

      if (!payment?.orderCode) {
        throw new Error(
          response?.message || "Unable to create ticket payment."
        );
      }

      /*
       * DO NOT REDIRECT TO VNPAY.
       * OPEN INTERNAL TEST PAYMENT INSTEAD.
       */
      setTestPaymentOrderCode(payment.orderCode);

      setSelectedEvent(null);
    } catch (error) {
      console.error("CREATE TEST TICKET PAYMENT ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create test payment."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <Stack
        spacing={{
          xs: 2,
          sm: 2.5,
        }}
        sx={{
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* CONCERTS HERO */}
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",

            px: {
              xs: 2,
              sm: 3,
            },

            py: {
              xs: 2.25,
              sm: 2.75,
            },

            bgcolor: "#111111",

            backgroundImage:
              "linear-gradient(135deg, rgba(255,85,0,0.14), rgba(255,85,0,0.025) 55%, rgba(59,130,246,0.06))",

            border: "1px solid #303030",

            borderRadius: 3,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            spacing={2}
          >
            {/* CONCERTS TITLE */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  width: {
                    xs: 48,
                    sm: 54,
                  },

                  height: {
                    xs: 48,
                    sm: 54,
                  },

                  flexShrink: 0,

                  display: "grid",
                  placeItems: "center",

                  color: "#FF6A1A",

                  bgcolor: "rgba(255,85,0,0.12)",

                  border: "1px solid rgba(255,85,0,0.28)",

                  borderRadius: 2.5,
                }}
              >
                <EventAvailableRoundedIcon />
              </Box>

              <Box minWidth={0}>
                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: {
                      xs: 21,
                      sm: 25,
                    },

                    fontWeight: 950,
                  }}
                >
                  Concerts / Tour
                </Typography>

                <Typography
                  sx={{
                    mt: 0.55,

                    color: "#A5A5A5",

                    fontSize: {
                      xs: 13,
                      sm: 14,
                    },

                    lineHeight: 1.6,
                  }}
                >
                  Upcoming live events
                  {artistName?.trim() ? ` from ${artistName}.` : "."}
                </Typography>
              </Box>
            </Stack>

            {/* EVENT ACTIONS */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              sx={{
                width: {
                  xs: "100%",
                  sm: "auto",
                },
              }}
            >
              {/* OWNER MANAGE EVENTS */}
              {isOwner && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (!accessToken) {
                      toast.error("Please sign in again.");
                      return;
                    }

                    setManageEventsOpen(true);
                  }}
                  sx={{
                    minHeight: 40,
                    px: 2,

                    color: "#FFFFFF",

                    borderColor: "#484848",

                    borderRadius: 2,

                    textTransform: "none",
                    fontWeight: 850,

                    "&:hover": {
                      bgcolor: "#1D1D1D",
                      borderColor: "#626262",
                    },
                  }}
                >
                  Manage events
                </Button>
              )}

              {/* OWNER CREATE EVENT */}
              {isOwner && (
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => {
                    if (!accessToken) {
                      toast.error("Please sign in again.");
                      return;
                    }

                    setCreateEventOpen(true);
                  }}
                  sx={{
                    minHeight: 40,
                    px: 2,

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
                  }}
                >
                  Create event
                </Button>
              )}

              {/* REFRESH EVENTS */}
              <Button
                variant="outlined"
                disabled={refreshing}
                onClick={() => {
                  void loadEvents(false);
                }}
                startIcon={
                  refreshing ? (
                    <CircularProgress
                      size={15}
                      thickness={5}
                      sx={{
                        color: "inherit",
                      }}
                    />
                  ) : (
                    <RefreshRoundedIcon />
                  )
                }
                sx={{
                  minHeight: 40,

                  color: "#CFCFCF",

                  borderColor: "#484848",

                  borderRadius: 2,

                  textTransform: "none",
                  fontWeight: 800,

                  "&:hover": {
                    color: "#FFFFFF",

                    bgcolor: "#1D1D1D",

                    borderColor: "#626262",
                  },

                  "&.Mui-disabled": {
                    color: "#666666",

                    borderColor: "#333333",
                  },
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* EVENT EMPTY STATE */}
        {events.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              minHeight: 260,

              px: 2,
              py: 5,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              textAlign: "center",

              bgcolor: "#111111",

              border: "1px dashed #383838",

              borderRadius: 3,
            }}
          >
            <Box>
              <EventAvailableRoundedIcon
                sx={{
                  color: "#666666",
                  fontSize: 42,
                }}
              />

              <Typography
                sx={{
                  mt: 1,

                  color: "#FFFFFF",

                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                No upcoming events
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  maxWidth: 430,

                  color: "#7F7F7F",

                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                Upcoming concerts and tours will appear here after they are
                approved.
              </Typography>
            </Box>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {/* EVENT CARDS */}
            {events.map((event) => {
              const statusStyle = getSaleStatusStyle(event.saleStatus);

              return (
                <Paper
                  key={event.id}
                  elevation={0}
                  sx={{
                    overflow: "hidden",

                    bgcolor: "#111111",

                    border: "1px solid #2D2D2D",

                    borderRadius: 3,

                    transition: "border-color 150ms ease",

                    "&:hover": {
                      borderColor: "#444444",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(220px, 300px) minmax(0, 1fr)",
                      },
                    }}
                  >
                    {/* TICKET ARTWORK */}
                    <Box
                      sx={{
                        position: "relative",

                        minHeight: {
                          xs: 200,
                          sm: 250,
                          md: "100%",
                        },

                        bgcolor: "#080808",

                        overflow: "hidden",
                      }}
                    >
                      <Box
                        component="img"
                        src={event.ticketImageUrl}
                        alt={`${event.eventName} ticket artwork`}
                        sx={{
                          width: "100%",
                          height: "100%",

                          position: {
                            md: "absolute",
                          },

                          inset: 0,

                          objectFit: "cover",

                          display: "block",
                        }}
                      />

                      <Chip
                        size="small"
                        label={getSaleStatusLabel(event.saleStatus)}
                        sx={{
                          position: "absolute",

                          top: 12,
                          left: 12,

                          color: statusStyle.color,

                          bgcolor: statusStyle.bgcolor,

                          border: `1px solid ${statusStyle.borderColor}`,

                          fontWeight: 900,

                          backdropFilter: "blur(12px)",
                        }}
                      />
                    </Box>

                    {/* EVENT INFORMATION */}
                    <Stack
                      spacing={1.75}
                      sx={{
                        minWidth: 0,

                        p: {
                          xs: 2,
                          sm: 2.5,
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: "#777777",

                            fontSize: 11,

                            fontWeight: 900,

                            letterSpacing: 0.8,

                            textTransform: "uppercase",
                          }}
                        >
                          {event.eventType.replaceAll("_", " ")}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.4,

                            color: "#FFFFFF",

                            fontSize: {
                              xs: 20,
                              sm: 23,
                            },

                            fontWeight: 950,

                            lineHeight: 1.25,
                          }}
                        >
                          {event.eventName}
                        </Typography>
                      </Box>

                      {/* EVENT DATE */}
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <EventAvailableRoundedIcon
                          sx={{
                            mt: "2px",

                            color: "#8D8D8D",

                            fontSize: 19,
                          }}
                        />

                        <Typography
                          sx={{
                            color: "#C8C8C8",

                            fontSize: 13,

                            lineHeight: 1.55,
                          }}
                        >
                          {formatEventDate(event.eventStartAt)}
                        </Typography>
                      </Stack>

                      {/* VENUE */}
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <LocationOnRoundedIcon
                          sx={{
                            mt: "2px",

                            color: "#8D8D8D",

                            fontSize: 19,
                          }}
                        />

                        <Box>
                          <Typography
                            sx={{
                              color: "#FFFFFF",

                              fontSize: 13,

                              fontWeight: 800,
                            }}
                          >
                            {event.venueName}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.25,

                              color: "#7F7F7F",

                              fontSize: 12,

                              lineHeight: 1.5,
                            }}
                          >
                            {event.venueAddress}
                          </Typography>
                        </Box>
                      </Stack>

                      {event.description?.trim() && (
                        <Typography
                          sx={{
                            color: "#929292",

                            fontSize: 13,

                            lineHeight: 1.65,

                            display: "-webkit-box",

                            WebkitLineClamp: 3,

                            WebkitBoxOrient: "vertical",

                            overflow: "hidden",
                          }}
                        >
                          {event.description}
                        </Typography>
                      )}

                      <Divider
                        sx={{
                          borderColor: "#292929",
                        }}
                      />

                      {/* PRICE AND INVENTORY */}
                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        justifyContent="space-between"
                        alignItems={{
                          xs: "stretch",
                          sm: "center",
                        }}
                        spacing={1.5}
                      >
                        <Box>
                          <Typography
                            sx={{
                              color: "#FFFFFF",

                              fontSize: 19,

                              fontWeight: 950,
                            }}
                          >
                            {formatMoney(event.ticketPrice, event.currency)}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.25,

                              color: "#777777",

                              fontSize: 12,
                            }}
                          >
                            {event.remainingQuantity > 0
                              ? `${event.remainingQuantity} tickets remaining`
                              : "No tickets remaining"}
                          </Typography>
                        </Box>

                        <Button
                          variant="contained"
                          disabled={isOwner || !event.canPurchase}
                          onClick={() => handleOpenBuy(event)}
                          startIcon={<ConfirmationNumberRoundedIcon />}
                          sx={{
                            minHeight: 44,

                            px: 2.5,

                            flexShrink: 0,

                            color: "#FFFFFF",

                            bgcolor: "#FF5500",

                            borderRadius: 2,

                            boxShadow: "none",

                            textTransform: "none",

                            fontWeight: 900,

                            "&:hover": {
                              bgcolor: "#FF6A1A",

                              boxShadow: "none",
                            },

                            "&.Mui-disabled": {
                              color: "#666666",

                              bgcolor: "#242424",
                            },
                          }}
                        >
                          {isOwner
                            ? "Your event"
                            : event.saleStatus === "UPCOMING"
                            ? "Coming soon"
                            : event.saleStatus === "SOLD_OUT"
                            ? "Sold out"
                            : event.canPurchase
                            ? "Buy ticket"
                            : "Unavailable"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      {/* BUY TICKET DIALOG */}
      <Dialog
        open={Boolean(selectedEvent)}
        onClose={() => {
          if (!paymentLoading) {
            setSelectedEvent(null);
          }
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#121212",
            backgroundImage: "none",
            color: "#FFFFFF",

            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 3,

            boxShadow: "0 24px 70px rgba(0,0,0,0.65)",

            overflow: "hidden",
          },
        }}
      >
        {/* BUY TICKET HEADER */}
        <DialogTitle
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },

            pt: 2.5,
            pb: 2,
          }}
        >
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 46,
                height: 46,

                display: "grid",
                placeItems: "center",

                color: "#FF6A1A",
                bgcolor: "rgba(255,85,0,0.12)",

                border: "1px solid rgba(255,85,0,0.22)",
                borderRadius: 2,
              }}
            >
              <ConfirmationNumberRoundedIcon />
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: {
                    xs: 19,
                    sm: 21,
                  },

                  fontWeight: 950,
                }}
              >
                Buy tickets
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,

                  color: "#888888",

                  fontSize: 12,
                }}
              >
                {selectedEvent?.eventName || ""}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },

            pb: 2,
          }}
        >
          {selectedEvent && (
            <Stack
              spacing={2.5}
              alignItems="center"
              sx={{
                width: "100%",
              }}
            >
              {/* EVENT SUMMARY */}
              <Paper
                elevation={0}
                sx={{
                  width: "100%",

                  overflow: "hidden",

                  bgcolor: "#181818",

                  border: "1px solid #303030",
                  borderRadius: 2.5,
                }}
              >
                {/* EVENT ARTWORK */}
                <Box
                  sx={{
                    width: "100%",

                    display: "flex",
                    justifyContent: "center",

                    bgcolor: "#0B0B0B",

                    p: {
                      xs: 1,
                      sm: 1.5,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={selectedEvent.ticketImageUrl}
                    alt={`${selectedEvent.eventName} ticket`}
                    sx={{
                      width: "100%",
                      maxWidth: 470,

                      height: {
                        xs: 155,
                        sm: 190,
                      },

                      display: "block",

                      objectFit: "contain",

                      borderRadius: 2,
                    }}
                  />
                </Box>

                {/* EVENT DETAILS */}
                <Stack
                  spacing={0.5}
                  alignItems="center"
                  textAlign="center"
                  sx={{
                    px: 2,
                    py: 1.75,
                  }}
                >
                  <Typography
                    sx={{
                      color: "#FFFFFF",

                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    {selectedEvent.eventName}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#898989",
                      fontSize: 12,
                    }}
                  >
                    {formatEventDate(selectedEvent.eventStartAt)}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#898989",
                      fontSize: 12,
                    }}
                  >
                    {selectedEvent.venueName}
                  </Typography>
                </Stack>
              </Paper>

              {/* QUANTITY */}
              <Stack
                spacing={1.2}
                alignItems="center"
                sx={{
                  width: "100%",
                }}
              >
                <Typography
                  sx={{
                    color: "#B7B7B7",

                    fontSize: 12,
                    fontWeight: 900,

                    textAlign: "center",
                  }}
                >
                  Quantity
                </Typography>

                {/* QUANTITY CONTROLS */}
                <Stack
                  direction="row"
                  spacing={1.2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <IconButton
                    disabled={paymentLoading || quantity <= 1}
                    onClick={() => updateQuantity(quantity - 1)}
                    sx={{
                      width: 44,
                      height: 44,

                      color: "#FFFFFF",

                      bgcolor: "#242424",

                      border: "1px solid #383838",

                      "&:hover": {
                        bgcolor: "#303030",
                        borderColor: "#555555",
                      },

                      "&.Mui-disabled": {
                        color: "#555555",
                        bgcolor: "#1A1A1A",
                        borderColor: "#292929",
                      },
                    }}
                  >
                    <RemoveRoundedIcon />
                  </IconButton>

                  <TextField
                    value={quantity}
                    type="number"
                    disabled={paymentLoading}
                    onChange={(event) =>
                      updateQuantity(Number(event.target.value))
                    }
                    inputProps={{
                      min: 1,
                      max: maximumQuantity,

                      style: {
                        textAlign: "center",
                        fontWeight: 900,
                        fontSize: 16,
                      },
                    }}
                    sx={{
                      width: 90,

                      "& .MuiOutlinedInput-root": {
                        height: 48,

                        color: "#FFFFFF",
                        bgcolor: "#181818",

                        borderRadius: 2,

                        "& fieldset": {
                          borderColor: "#3A3A3A",
                        },

                        "&:hover fieldset": {
                          borderColor: "#555555",
                        },

                        "&.Mui-focused fieldset": {
                          borderColor: "#FF5500",
                        },
                      },
                    }}
                  />

                  <IconButton
                    disabled={paymentLoading || quantity >= maximumQuantity}
                    onClick={() => updateQuantity(quantity + 1)}
                    sx={{
                      width: 44,
                      height: 44,

                      color: "#FFFFFF",

                      bgcolor: "#242424",

                      border: "1px solid #383838",

                      "&:hover": {
                        bgcolor: "#303030",
                        borderColor: "#555555",
                      },

                      "&.Mui-disabled": {
                        color: "#555555",
                        bgcolor: "#1A1A1A",
                        borderColor: "#292929",
                      },
                    }}
                  >
                    <AddRoundedIcon />
                  </IconButton>
                </Stack>

                {/* AVAILABLE TICKETS */}
                <Typography
                  sx={{
                    color: "#777777",

                    fontSize: 11,

                    textAlign: "center",
                  }}
                >
                  {selectedEvent.remainingQuantity} tickets available
                </Typography>
              </Stack>

              <Divider
                sx={{
                  width: "100%",
                  borderColor: "#292929",
                }}
              />

              {/* ORDER TOTAL */}
              <Stack
                spacing={0.5}
                alignItems="center"
                sx={{
                  width: "100%",
                }}
              >
                <Typography
                  sx={{
                    color: "#888888",

                    fontSize: 12,
                    fontWeight: 800,

                    textAlign: "center",
                  }}
                >
                  Total
                </Typography>

                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: {
                      xs: 24,
                      sm: 27,
                    },

                    fontWeight: 950,

                    textAlign: "center",
                  }}
                >
                  {formatMoney(
                    selectedEvent.ticketPrice * quantity,
                    selectedEvent.currency
                  )}
                </Typography>
              </Stack>

              {/* VNPAY NOTICE */}
              <Typography
                sx={{
                  maxWidth: 420,

                  color: "#6F6F6F",

                  fontSize: 11,
                  lineHeight: 1.6,

                  textAlign: "center",
                }}
              >
                You will be redirected to VNPay to complete your payment
                securely.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        {/* PAYMENT ACTIONS */}
        <DialogActions
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },

            pt: 1,
            pb: 2.5,

            display: "flex",

            alignItems: "center",
            justifyContent: "center",

            gap: 1,

            flexDirection: {
              xs: "column",
              sm: "row",
            },

            "& > :not(style) ~ :not(style)": {
              ml: 0,
            },
          }}
        >
          {/* CANCEL PAYMENT */}
          <Button
            disabled={paymentLoading}
            onClick={() => {
              setSelectedEvent(null);
            }}
            sx={{
              minHeight: 44,

              width: {
                xs: "100%",
                sm: "auto",
              },

              minWidth: {
                sm: 100,
              },

              px: 2,

              color: "#FFFFFF",
              bgcolor: "#252525",

              borderRadius: 2,

              textTransform: "none",
              fontWeight: 850,

              "&:hover": {
                bgcolor: "#303030",
              },
            }}
          >
            Cancel
          </Button>

          {/* TEST PAYMENT - DEVELOPMENT ONLY */}
          {PAYMENT_TEST_MODE && (
            <Button
              variant="outlined"
              disabled={paymentLoading || !selectedEvent}
              onClick={() => {
                void handleTestPayment();
              }}
              startIcon={
                paymentLoading ? (
                  <CircularProgress
                    size={15}
                    thickness={5}
                    sx={{
                      color: "inherit",
                    }}
                  />
                ) : (
                  <ScienceRoundedIcon />
                )
              }
              sx={{
                minHeight: 44,

                width: {
                  xs: "100%",
                  sm: "auto",
                },

                minWidth: {
                  sm: 145,
                },

                px: 2,

                color: "#FF8A4C",

                borderColor: "rgba(255,85,0,0.45)",

                bgcolor: "rgba(255,85,0,0.05)",

                borderRadius: 2,

                textTransform: "none",
                fontWeight: 900,

                "&:hover": {
                  color: "#FFFFFF",

                  borderColor: "#FF5500",

                  bgcolor: "rgba(255,85,0,0.12)",
                },

                "&.Mui-disabled": {
                  color: "#666666",
                  borderColor: "#333333",
                },
              }}
            >
              Test Payment
            </Button>
          )}

          {/* CONTINUE TO VNPAY */}
          <Button
            variant="contained"
            disabled={paymentLoading || !selectedEvent}
            onClick={() => {
              void handleBuyTicket();
            }}
            startIcon={
              paymentLoading ? (
                <CircularProgress
                  size={16}
                  thickness={5}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : (
                <ConfirmationNumberRoundedIcon />
              )
            }
            sx={{
              minHeight: 44,

              width: {
                xs: "100%",
                sm: "auto",
              },

              minWidth: {
                sm: 190,
              },

              px: 2.5,

              color: "#FFFFFF",
              bgcolor: "#FF5500",

              borderRadius: 2,

              boxShadow: "none",

              textTransform: "none",
              fontWeight: 900,

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
            {paymentLoading ? "Redirecting..." : "Continue to VNPay"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE ARTIST EVENT DIALOG */}
      {isOwner && (
        <ProfileCreateArtistEventDialog
          open={createEventOpen}
          accessToken={accessToken}
          onClose={() => {
            setCreateEventOpen(false);
          }}
        />
      )}

      {/* MANAGE ARTIST EVENTS DIALOG */}
      {isOwner && (
        <ProfileManageArtistEventsDialog
          open={manageEventsOpen}
          accessToken={accessToken}
          onClose={() => {
            setManageEventsOpen(false);
          }}
        />
      )}

      {/* TEST TICKET PAYMENT DIALOG */}
      {PAYMENT_TEST_MODE && (
        <TestTicketPaymentDialog
          open={Boolean(testPaymentOrderCode)}
          orderCode={testPaymentOrderCode}
          accessToken={accessToken || ""}
          onClose={() => {
            setTestPaymentOrderCode("");
          }}
        />
      )}
    </>
  );
};

export default ProfileConcertsTab;
