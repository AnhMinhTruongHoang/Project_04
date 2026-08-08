"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { useCallback, useEffect, useRef, useState } from "react";

import { getMyTicketsApi } from "@/utils/api";
import { useToast } from "@/utils/toast";
import ProfileTicketQrDialog from "./profile-ticket-qr-dialog";

const formatTicketDate = (value?: string | null) => {
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

const formatTicketMoney = (value?: number | null, currency?: string | null) => {
  return `${new Intl.NumberFormat("en-US").format(Number(value || 0))} ${
    currency || "VND"
  }`;
};

const getTicketStatusStyle = (status: UserEventTicketStatus) => {
  switch (status) {
    case "VALID":
      return {
        label: "Valid",
        color: "#63e6a6",
        bgcolor: "rgba(99,230,166,0.10)",
        borderColor: "rgba(99,230,166,0.28)",
      };

    case "USED":
      return {
        label: "Used",
        color: "#7EB6FF",
        bgcolor: "rgba(59,130,246,0.10)",
        borderColor: "rgba(59,130,246,0.28)",
      };

    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "#ff7b7b",
        bgcolor: "rgba(255,123,123,0.10)",
        borderColor: "rgba(255,123,123,0.28)",
      };

    default:
      return {
        label: status,
        color: "#A5A5A5",
        bgcolor: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.12)",
      };
  }
};

const ProfileTicketsTab = ({ accessToken }: IProfileTicketsTabProps) => {
  const toast = useToast();

  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [tickets, setTickets] = useState<IUserEventTicket[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<IUserEventTicket | null>(
    null
  );

  /*
   * =========================
   * LOAD TICKET COLLECTION
   * =========================
   */
  const loadTickets = useCallback(
    async (refresh = false) => {
      if (!accessToken) {
        setTickets([]);
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
        const response = await getMyTicketsApi(accessToken, 1, 50);

        const items = response?.data?.items;

        setTickets(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Cannot load ticket collection:", error);

        setTickets([]);

        toastRef.current.error("Unable to load your tickets.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    void loadTickets(false);
  }, [loadTickets]);

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={1.5}
        sx={{
          minHeight: 300,
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
          Loading tickets...
        </Typography>
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={2.5}>
        {/* TICKET COLLECTION HEADER */}
        <Paper
          elevation={0}
          sx={{
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
            <Stack direction="row" spacing={1.5} alignItems="center">
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

                  display: "grid",
                  placeItems: "center",

                  flexShrink: 0,

                  color: "#FF6A1A",

                  bgcolor: "rgba(255,85,0,0.12)",

                  border: "1px solid rgba(255,85,0,0.28)",

                  borderRadius: 2.5,
                }}
              >
                <ConfirmationNumberRoundedIcon />
              </Box>

              <Box>
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
                  Ticket Collection
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    color: "#A5A5A5",

                    fontSize: {
                      xs: 12,
                      sm: 13,
                    },
                  }}
                >
                  Your purchased event tickets and collectibles.
                </Typography>
              </Box>
            </Stack>

            {/* REFRESH TICKETS */}
            <Button
              variant="outlined"
              disabled={refreshing}
              onClick={() => {
                void loadTickets(true);
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
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Paper>

        {/* EMPTY TICKET COLLECTION */}
        {tickets.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              minHeight: 280,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              px: 2,
              py: 5,

              textAlign: "center",

              bgcolor: "#111111",

              border: "1px dashed #383838",

              borderRadius: 3,
            }}
          >
            <Box>
              <ConfirmationNumberRoundedIcon
                sx={{
                  color: "#555555",
                  fontSize: 46,
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
                No tickets yet
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  maxWidth: 420,

                  color: "#777777",

                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                Tickets you purchase from artist events will appear here.
              </Typography>
            </Box>
          </Paper>
        ) : (
          /* TICKET CARDS */
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },

              gap: 2,
            }}
          >
            {tickets.map((ticket) => {
              const status = getTicketStatusStyle(ticket.status);

              return (
                <Paper
                  key={ticket.id}
                  elevation={0}
                  sx={{
                    overflow: "hidden",

                    bgcolor: "#111111",

                    border: "1px solid #2D2D2D",

                    borderRadius: 3,

                    transition: "border-color 160ms ease, transform 160ms ease",

                    "&:hover": {
                      borderColor: "#454545",

                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {/* TICKET ARTWORK */}
                  <Box
                    sx={{
                      position: "relative",

                      height: {
                        xs: 190,
                        sm: 220,
                      },

                      bgcolor: "#080808",
                    }}
                  >
                    <Box
                      component="img"
                      src={ticket.ticketImageUrl}
                      alt={`${ticket.eventName} ticket`}
                      sx={{
                        width: "100%",
                        height: "100%",

                        display: "block",

                        objectFit: "cover",
                      }}
                    />

                    <Chip
                      size="small"
                      label={status.label}
                      sx={{
                        position: "absolute",

                        top: 12,
                        left: 12,

                        color: status.color,

                        bgcolor: status.bgcolor,

                        border: `1px solid ${status.borderColor}`,

                        fontWeight: 900,

                        backdropFilter: "blur(12px)",
                      }}
                    />
                  </Box>

                  {/* TICKET INFORMATION */}
                  <Stack
                    spacing={1.4}
                    sx={{
                      p: {
                        xs: 1.75,
                        sm: 2,
                      },
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: "#FFFFFF",

                          fontSize: 18,
                          fontWeight: 950,

                          lineHeight: 1.3,
                        }}
                      >
                        {ticket.eventName}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,

                          color: "#777777",

                          fontSize: 11,

                          fontFamily: "monospace",
                        }}
                      >
                        {ticket.ticketCode}
                      </Typography>
                    </Box>

                    {/* EVENT DATE */}
                    <Stack
                      direction="row"
                      spacing={0.8}
                      alignItems="flex-start"
                    >
                      <EventAvailableRoundedIcon
                        sx={{
                          mt: "1px",

                          color: "#8D8D8D",

                          fontSize: 18,
                        }}
                      />

                      <Typography
                        sx={{
                          color: "#BEBEBE",

                          fontSize: 12,

                          lineHeight: 1.5,
                        }}
                      >
                        {formatTicketDate(ticket.eventStartAt)}
                      </Typography>
                    </Stack>

                    {/* EVENT VENUE */}
                    <Stack
                      direction="row"
                      spacing={0.8}
                      alignItems="flex-start"
                    >
                      <LocationOnRoundedIcon
                        sx={{
                          mt: "1px",

                          color: "#8D8D8D",

                          fontSize: 18,
                        }}
                      />

                      <Box>
                        <Typography
                          sx={{
                            color: "#D0D0D0",

                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {ticket.venueName}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.2,

                            color: "#777777",

                            fontSize: 11,
                          }}
                        >
                          {ticket.venueAddress}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                    >
                      <Box>
                        <Typography
                          sx={{
                            color: "#666666",
                            fontSize: 10,
                          }}
                        >
                          Purchase price
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.2,

                            color: "#FFFFFF",

                            fontSize: 14,
                            fontWeight: 900,
                          }}
                        >
                          {formatTicketMoney(
                            ticket.purchasePrice,
                            ticket.currency
                          )}
                        </Typography>
                      </Box>

                      {/* SHOW QR */}
                      <Button
                        variant="contained"
                        disabled={ticket.status === "CANCELLED"}
                        onClick={() => {
                          setSelectedTicket(ticket);
                        }}
                        startIcon={<QrCode2RoundedIcon />}
                        sx={{
                          minHeight: 40,

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
                        {ticket.status === "USED" ? "View ticket" : "Show QR"}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        )}
      </Stack>

      {/* TICKET QR DIALOG */}
      <ProfileTicketQrDialog
        open={Boolean(selectedTicket)}
        ticket={selectedTicket}
        accessToken={accessToken}
        onClose={() => {
          setSelectedTicket(null);
        }}
      />
    </>
  );
};

export default ProfileTicketsTab;
