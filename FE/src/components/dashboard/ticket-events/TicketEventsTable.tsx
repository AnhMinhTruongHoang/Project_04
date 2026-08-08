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
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import {
  approveArtistTicketEventApi,
  getAdminTicketEventsApi,
  rejectArtistTicketEventApi,
} from "@/utils/api";

import DashboardTableToolbar from "@/components/dashboard/components/DashboardTableToolbar";
import { useToast } from "@/utils/toast";

interface TicketEventsTableProps {
  accessToken?: string;
}

/*
 * =========================
 * DATE FORMAT
 * =========================
 */
const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
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
  return `${new Intl.NumberFormat("en-US").format(Number(value || 0))} ${
    currency || "VND"
  }`;
};

/*
 * =========================
 * APPROVAL STATUS STYLE
 * =========================
 */
const getStatusStyle = (value?: string | null) => {
  const status = String(value || "PENDING_REVIEW").toUpperCase();

  if (status === "APPROVED") {
    return {
      color: "#63e6a6",
      backgroundColor: "rgba(99,230,166,0.1)",
      border: "1px solid rgba(99,230,166,0.25)",
    };
  }

  if (status === "REJECTED") {
    return {
      color: "#ff7b7b",
      backgroundColor: "rgba(255,123,123,0.12)",
      border: "1px solid rgba(255,123,123,0.32)",
    };
  }

  return {
    color: "#ffbd69",
    backgroundColor: "rgba(255,189,105,0.12)",
    border: "1px solid rgba(255,189,105,0.32)",
  };
};

const StatusChip = ({ value }: { value?: string | null }) => {
  const label = String(value || "PENDING_REVIEW").replaceAll("_", " ");

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        ...getStatusStyle(value),

        height: 24,

        fontSize: 10,
        fontWeight: 900,

        "& .MuiChip-label": {
          color: "inherit",
          px: 1,
        },
      }}
    />
  );
};

const TicketEventsTable = ({ accessToken }: TicketEventsTableProps) => {
  const toast = useToast();

  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [rows, setRows] = useState<IAdminArtistEvent[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [searchValue, setSearchValue] = useState("");

  const [moderatingId, setModeratingId] = useState("");

  const [viewEvent, setViewEvent] = useState<IAdminArtistEvent | null>(null);

  const [rejectingEvent, setRejectingEvent] =
    useState<IAdminArtistEvent | null>(null);

  const [rejectReason, setRejectReason] = useState("");

  /*
   * =========================
   * LOAD EVENTS
   * =========================
   */
  const loadEvents = useCallback(
    async (refresh = false) => {
      if (!accessToken) {
        setRows([]);
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
        const response = await getAdminTicketEventsApi(accessToken, 1, 100);

        const items = response?.data?.items;

        setRows(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Cannot load ticket events:", error);

        setRows([]);

        toastRef.current.error("Unable to load ticket events.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    void loadEvents(false);
  }, [loadEvents]);

  /*
   * =========================
   * FILTER ROWS
   * =========================
   */
  const filteredRows = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter((event) => {
      return [
        event.eventName,
        event.artistName,
        event.artistUsername,
        event.artistEmail,
        event.venueName,
        event.venueAddress,
        event.eventType,
        event.approvalStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [rows, searchValue]);

  /*
   * =========================
   * APPROVE EVENT
   * =========================
   */
  const handleApprove = async (event: IAdminArtistEvent) => {
    if (!accessToken || moderatingId) {
      return;
    }

    try {
      setModeratingId(event.id);

      const response = await approveArtistTicketEventApi(event.id, accessToken);

      if (!response?.data) {
        throw new Error(response?.message || "Unable to approve the event.");
      }

      setRows((current) =>
        current.map((item) => (item.id === event.id ? response.data! : item))
      );

      toast.success("Ticket event approved successfully.");
    } catch (error) {
      console.error("Cannot approve ticket event:", error);

      toast.error(
        error instanceof Error ? error.message : "Unable to approve the event."
      );
    } finally {
      setModeratingId("");
    }
  };

  /*
   * =========================
   * REJECT EVENT
   * =========================
   */
  const handleReject = async () => {
    if (!accessToken || !rejectingEvent || moderatingId) {
      return;
    }

    const reason = rejectReason.trim();

    if (!reason) {
      toast.error("Rejection reason is required.");
      return;
    }

    try {
      setModeratingId(rejectingEvent.id);

      const response = await rejectArtistTicketEventApi(
        rejectingEvent.id,
        {
          reason,
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to reject the event.");
      }

      setRows((current) =>
        current.map((item) =>
          item.id === rejectingEvent.id ? response.data! : item
        )
      );

      toast.success("Ticket event rejected successfully.");

      setRejectingEvent(null);
      setRejectReason("");
    } catch (error) {
      console.error("Cannot reject ticket event:", error);

      toast.error(
        error instanceof Error ? error.message : "Unable to reject the event."
      );
    } finally {
      setModeratingId("");
    }
  };

  /*
   * =========================
   * DATA GRID COLUMNS
   * =========================
   */
  const columns = useMemo<GridColDef<IAdminArtistEvent>[]>(
    () => [
      {
        field: "event",
        headerName: "Event",
        minWidth: 260,
        flex: 1.5,

        sortable: false,

        renderCell: ({ row }) => (
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            sx={{
              width: "100%",
              minWidth: 0,
            }}
          >
            {/* EVENT ARTWORK */}
            <Box
              component="img"
              src={row.ticketImageUrl}
              alt={row.eventName}
              sx={{
                width: 48,
                height: 48,

                flexShrink: 0,

                objectFit: "cover",

                bgcolor: "#101010",

                borderRadius: "7px",

                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            <Box minWidth={0}>
              <Typography
                noWrap
                sx={{
                  color: "#ffffff",

                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {row.eventName}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.2,

                  color: "#777777",

                  fontSize: 11,
                }}
              >
                {String(row.eventType || "").replaceAll("_", " ")}
              </Typography>
            </Box>
          </Stack>
        ),
      },

      {
        field: "artist",
        headerName: "Artist",
        minWidth: 190,
        flex: 1,

        sortable: false,

        renderCell: ({ row }) => (
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              noWrap
              sx={{
                color: "#ffffff",

                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {row.artistName || row.artistUsername || "Unknown artist"}
            </Typography>

            <Typography
              noWrap
              sx={{
                mt: 0.2,

                color: "#777777",

                fontSize: 10,
              }}
            >
              {row.artistEmail || row.artistId}
            </Typography>
          </Box>
        ),
      },

      {
        field: "eventStartAt",
        headerName: "Event date",
        minWidth: 175,

        renderCell: ({ row }) => (
          <Typography
            sx={{
              color: "#c8c8c8",

              fontSize: 11,
            }}
          >
            {formatDate(row.eventStartAt)}
          </Typography>
        ),
      },

      {
        field: "ticketPrice",
        headerName: "Price",
        minWidth: 125,

        renderCell: ({ row }) => (
          <Typography
            sx={{
              color: "#ffffff",

              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {formatMoney(row.ticketPrice, row.currency)}
          </Typography>
        ),
      },

      {
        field: "inventory",
        headerName: "Inventory",
        minWidth: 145,

        sortable: false,

        renderCell: ({ row }) => {
          const total = Number(row.totalQuantity || 0);

          const sold = Number(row.soldQuantity || 0);

          const reserved = Number(row.reservedQuantity || 0);

          const remaining = Math.max(total - sold - reserved, 0);

          return (
            <Box>
              <Typography
                sx={{
                  color: "#ffffff",

                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {remaining} / {total}
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,

                  color: "#777777",

                  fontSize: 10,
                }}
              >
                {sold} sold
                {reserved > 0 ? ` • ${reserved} reserved` : ""}
              </Typography>
            </Box>
          );
        },
      },

      {
        field: "approvalStatus",

        headerName: "Approval",

        minWidth: 145,

        renderCell: ({ row }) => <StatusChip value={row.approvalStatus} />,
      },

      {
        field: "actions",
        headerName: "Actions",
        minWidth: 210,
        sortable: false,
        filterable: false,

        renderCell: ({ row }) => {
          const pending = row.approvalStatus === "PENDING_REVIEW";

          const busy = moderatingId === row.id;

          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* VIEW EVENT */}
              <Tooltip title="View event" arrow>
                <IconButton
                  size="small"
                  onClick={() => {
                    setViewEvent(row);
                  }}
                  sx={{
                    color: "#bdbdbd",

                    "&:hover": {
                      color: "#ffffff",

                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  <VisibilityRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* OPEN ARTWORK */}
              {row.ticketImageUrl && (
                <Tooltip title="Open artwork" arrow>
                  <IconButton
                    component="a"
                    href={row.ticketImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      color: "#bdbdbd",

                      "&:hover": {
                        color: "#ffffff",

                        bgcolor: "rgba(255,255,255,0.08)",
                      },
                    }}
                  >
                    <OpenInNewRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* APPROVE EVENT */}
              {pending && (
                <Tooltip title="Approve" arrow>
                  <span>
                    <IconButton
                      size="small"
                      disabled={busy}
                      onClick={() => {
                        void handleApprove(row);
                      }}
                      sx={{
                        color: "#63e6a6",

                        "&:hover": {
                          bgcolor: "rgba(99,230,166,0.12)",
                        },

                        "&.Mui-disabled": {
                          color: "#555555",
                        },
                      }}
                    >
                      {busy ? (
                        <CircularProgress
                          size={17}
                          thickness={5}
                          sx={{
                            color: "#ff5500",
                          }}
                        />
                      ) : (
                        <CheckCircleRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              {/* REJECT EVENT */}
              {pending && (
                <Tooltip title="Reject" arrow>
                  <span>
                    <IconButton
                      size="small"
                      disabled={busy}
                      onClick={() => {
                        setRejectingEvent(row);

                        setRejectReason("");
                      }}
                      sx={{
                        color: "#ff7b7b",

                        "&:hover": {
                          bgcolor: "rgba(255,123,123,0.12)",
                        },

                        "&.Mui-disabled": {
                          color: "#555555",
                        },
                      }}
                    >
                      <CancelRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          );
        },
      },
    ],
    [moderatingId]
  );

  return (
    <>
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* PAGE HEADER */}
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
          sx={{
            mb: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#ffffff",

                fontSize: {
                  xs: 22,
                  sm: 26,
                },

                fontWeight: 950,
              }}
            >
              Ticket Events
            </Typography>

            <Typography
              sx={{
                mt: 0.4,

                color: "#858585",

                fontSize: 12,
              }}
            >
              Review and moderate artist ticketed events.
            </Typography>
          </Box>

          {/* REFRESH BUTTON */}
          <Button
            variant="outlined"
            disabled={refreshing}
            onClick={() => {
              void loadEvents(true);
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
              minHeight: 38,

              color: "#ffffff",

              borderColor: "#3d3d3d",

              borderRadius: "8px",

              textTransform: "none",

              fontWeight: 900,

              "&:hover": {
                bgcolor: "#202020",

                borderColor: "#ff5500",
              },
            }}
          >
            Refresh
          </Button>
        </Stack>

        {/* TABLE TOOLBAR */}
        <DashboardTableToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        {/* DATA GRID */}
        <Box
          sx={{
            mt: 1.5,

            width: "100%",

            bgcolor: "#111111",

            border: "1px solid #292929",

            borderRadius: "10px",

            overflow: "hidden",
          }}
        >
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            autoHeight
            rowHeight={70}
            columnHeaderHeight={48}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                  page: 0,
                },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            sx={{
              border: "none",

              color: "#d7d7d7",

              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#171717",

                color: "#a9a9a9",

                borderBottom: "1px solid #303030",
              },

              "& .MuiDataGrid-columnHeaderTitle": {
                fontSize: 11,

                fontWeight: 900,

                textTransform: "uppercase",

                letterSpacing: 0.5,
              },

              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #242424",

                display: "flex",

                alignItems: "center",
              },

              "& .MuiDataGrid-row": {
                bgcolor: "#111111",

                "&:hover": {
                  bgcolor: "#171717",
                },
              },

              "& .MuiTablePagination-root": {
                color: "#a9a9a9",
              },

              "& .MuiDataGrid-footerContainer": {
                bgcolor: "#151515",

                borderTop: "1px solid #292929",
              },

              "& .MuiDataGrid-overlay": {
                bgcolor: "#111111",

                color: "#777777",
              },

              "& .MuiDataGrid-menuIconButton": {
                color: "#8b8b8b",
              },

              "& .MuiDataGrid-sortIcon": {
                color: "#8b8b8b",
              },

              "& .MuiDataGrid-iconSeparator": {
                color: "#333333",
              },
            }}
          />
        </Box>
      </Box>

      {/* EVENT DETAIL DIALOG */}
      <Dialog
        open={Boolean(viewEvent)}
        onClose={() => {
          setViewEvent(null);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#111111",

            backgroundImage: "none",

            color: "#ffffff",

            border: "1px solid #303030",

            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography
              sx={{
                fontSize: 19,
                fontWeight: 900,
              }}
            >
              Event details
            </Typography>

            <IconButton
              onClick={() => {
                setViewEvent(null);
              }}
              sx={{
                color: "#aaaaaa",
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {viewEvent && (
            <Stack spacing={2}>
              {/* EVENT ARTWORK */}
              <Box
                component="img"
                src={viewEvent.ticketImageUrl}
                alt={viewEvent.eventName}
                sx={{
                  width: "100%",

                  maxHeight: 320,

                  objectFit: "cover",

                  bgcolor: "#090909",

                  borderRadius: "10px",
                }}
              />

              <Stack spacing={0.8}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Typography
                    sx={{
                      color: "#ffffff",

                      fontSize: 20,

                      fontWeight: 950,
                    }}
                  >
                    {viewEvent.eventName}
                  </Typography>

                  <StatusChip value={viewEvent.approvalStatus} />
                </Stack>

                <Typography
                  sx={{
                    color: "#888888",

                    fontSize: 12,
                  }}
                >
                  {viewEvent.artistName ||
                    viewEvent.artistUsername ||
                    viewEvent.artistId}
                </Typography>
              </Stack>

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
                <Box>
                  <Typography
                    sx={{
                      color: "#666666",

                      fontSize: 10,
                    }}
                  >
                    Event date
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.3,

                      color: "#ffffff",

                      fontSize: 12,
                    }}
                  >
                    {formatDate(viewEvent.eventStartAt)}
                  </Typography>
                </Box>

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
                      mt: 0.3,

                      color: "#ffffff",

                      fontSize: 12,

                      fontWeight: 800,
                    }}
                  >
                    {formatMoney(viewEvent.ticketPrice, viewEvent.currency)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#666666",

                      fontSize: 10,
                    }}
                  >
                    Venue
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.3,

                      color: "#ffffff",

                      fontSize: 12,
                    }}
                  >
                    {viewEvent.venueName}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#666666",

                      fontSize: 10,
                    }}
                  >
                    Total tickets
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.3,

                      color: "#ffffff",

                      fontSize: 12,
                    }}
                  >
                    {viewEvent.totalQuantity}
                  </Typography>
                </Box>
              </Box>

              {viewEvent.description?.trim() && (
                <Box>
                  <Typography
                    sx={{
                      color: "#666666",

                      fontSize: 10,
                    }}
                  >
                    Description
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,

                      color: "#c0c0c0",

                      fontSize: 12,

                      lineHeight: 1.6,
                    }}
                  >
                    {viewEvent.description}
                  </Typography>
                </Box>
              )}

              {viewEvent.approvalStatus === "REJECTED" &&
                viewEvent.rejectionReason?.trim() && (
                  <Box
                    sx={{
                      p: 1.5,

                      bgcolor: "rgba(255,123,123,0.08)",

                      border: "1px solid rgba(255,123,123,0.22)",

                      borderRadius: "8px",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#ff7b7b",

                        fontSize: 11,

                        fontWeight: 900,
                      }}
                    >
                      Rejection reason
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.4,

                        color: "#c5c5c5",

                        fontSize: 12,
                      }}
                    >
                      {viewEvent.rejectionReason}
                    </Typography>
                  </Box>
                )}
            </Stack>
          )}
        </DialogContent>

        {viewEvent?.approvalStatus === "PENDING_REVIEW" && (
          <DialogActions
            sx={{
              px: 3,
              pb: 2.5,
            }}
          >
            <Button
              startIcon={<CancelRoundedIcon />}
              disabled={moderatingId === viewEvent.id}
              onClick={() => {
                setRejectingEvent(viewEvent);

                setRejectReason("");

                setViewEvent(null);
              }}
              sx={{
                color: "#ff7b7b",

                textTransform: "none",

                fontWeight: 900,
              }}
            >
              Reject
            </Button>

            <Button
              variant="contained"
              startIcon={<CheckCircleRoundedIcon />}
              disabled={moderatingId === viewEvent.id}
              onClick={() => {
                void handleApprove(viewEvent);

                setViewEvent(null);
              }}
              sx={{
                color: "#ffffff",

                bgcolor: "#ff5500",

                textTransform: "none",

                fontWeight: 900,

                boxShadow: "none",

                "&:hover": {
                  bgcolor: "#ff6a1a",

                  boxShadow: "none",
                },
              }}
            >
              Approve
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* REJECT EVENT DIALOG */}
      <Dialog
        open={Boolean(rejectingEvent)}
        onClose={() => {
          if (moderatingId) {
            return;
          }

          setRejectingEvent(null);

          setRejectReason("");
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "#111111",

            backgroundImage: "none",

            color: "#ffffff",

            border: "1px solid #303030",

            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
          }}
        >
          Reject ticket event
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              mb: 1.5,

              color: "#8d8d8d",

              fontSize: 12,

              lineHeight: 1.6,
            }}
          >
            Explain why this event cannot be approved. The artist will see this
            reason.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            value={rejectReason}
            onChange={(event) => {
              setRejectReason(event.target.value);
            }}
            placeholder="Enter rejection reason"
            disabled={Boolean(moderatingId)}
            inputProps={{
              maxLength: 2000,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#ffffff",

                bgcolor: "#171717",

                "& fieldset": {
                  borderColor: "#383838",
                },

                "&:hover fieldset": {
                  borderColor: "#555555",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#ff5500",
                },
              },
            }}
          />

          <Typography
            sx={{
              mt: 0.6,

              color: "#666666",

              fontSize: 10,

              textAlign: "right",
            }}
          >
            {rejectReason.length} / 2000
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            disabled={Boolean(moderatingId)}
            onClick={() => {
              setRejectingEvent(null);

              setRejectReason("");
            }}
            sx={{
              color: "#aaaaaa",

              textTransform: "none",

              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={Boolean(moderatingId) || !rejectReason.trim()}
            onClick={() => {
              void handleReject();
            }}
            startIcon={
              moderatingId ? (
                <CircularProgress
                  size={16}
                  thickness={5}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : (
                <CancelRoundedIcon />
              )
            }
            sx={{
              color: "#ffffff",

              bgcolor: "#d93b3b",

              textTransform: "none",

              fontWeight: 900,

              boxShadow: "none",

              "&:hover": {
                bgcolor: "#e34a4a",

                boxShadow: "none",
              },

              "&.Mui-disabled": {
                color: "#666666",

                bgcolor: "#292929",
              },
            }}
          >
            Reject event
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TicketEventsTable;
