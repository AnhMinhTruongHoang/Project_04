"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSession } from "next-auth/react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  cancelArtistPayoutRequestApi,
  getArtistPayoutHistoryApi,
} from "@/utils/api";

const payoutFilters = [
  "ALL",
  "PENDING",
  "APPROVED",
  "PAID",
  "REJECTED",
  "CANCELED",
] as const;

const getAccessToken = (session: unknown) => {
  const sessionData = session as any;

  return (
    sessionData?.access_token ||
    sessionData?.accessToken ||
    sessionData?.user?.access_token ||
    sessionData?.user?.accessToken ||
    ""
  );
};

const formatMoney = (amount: number, currency = "VND") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const maskAccountNumber = (value?: string | null) => {
  const normalized = String(value || "")
    .replace(/\s+/g, "")
    .trim();

  if (!normalized) {
    return "—";
  }

  if (normalized.length <= 4) {
    return normalized;
  }

  return `${"*".repeat(Math.max(normalized.length - 4, 4))}${normalized.slice(
    -4
  )}`;
};

const getStatusStyle = (status?: string | null) => {
  const normalizedStatus = String(status || "")
    .trim()
    .toUpperCase();

  if (normalizedStatus === "PAID") {
    return {
      color: "#63e6a6",
      backgroundColor: "rgba(99,230,166,0.1)",
      border: "1px solid rgba(99,230,166,0.3)",
    };
  }

  if (normalizedStatus === "APPROVED") {
    return {
      color: "#6eb6ff",
      backgroundColor: "rgba(82,158,255,0.11)",
      border: "1px solid rgba(82,158,255,0.3)",
    };
  }

  if (normalizedStatus === "REJECTED" || normalizedStatus === "CANCELED") {
    return {
      color: "#ff747c",
      backgroundColor: "rgba(255,90,100,0.1)",
      border: "1px solid rgba(255,90,100,0.28)",
    };
  }

  return {
    color: "#ffbd69",
    backgroundColor: "rgba(255,189,105,0.1)",
    border: "1px solid rgba(255,189,105,0.28)",
  };
};

const ArtistPayoutHistory = () => {
  const { data: session, status: sessionStatus } = useSession();

  const [history, setHistory] = useState<ArtistPayoutHistoryData | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<
    ArtistPayoutStatus | "ALL"
  >("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [selectedPayout, setSelectedPayout] = useState<ArtistPayoutItem | null>(
    null
  );

  const [canceling, setCanceling] = useState(false);

  const pageSize = 10;

  const accessToken = useMemo(() => getAccessToken(session), [session]);

  const loadHistory = useCallback(
    async (silent = false) => {
      if (sessionStatus === "loading") {
        return;
      }

      if (!accessToken) {
        setHistory(null);
        setLoading(false);
        setRefreshing(false);

        setErrorMessage("Please sign in to view your payout history.");

        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const response = await getArtistPayoutHistoryApi(accessToken, {
          status: selectedStatus === "ALL" ? undefined : selectedStatus,
          current: currentPage,
          pageSize,
        });

        if (
          response?.error ||
          Number(response?.statusCode) >= 400 ||
          !response?.data
        ) {
          throw new Error(
            response?.message || "Unable to load payout history."
          );
        }

        setHistory(response.data);
      } catch (error) {
        setHistory(null);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load payout history."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, currentPage, selectedStatus, sessionStatus]
  );

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  /* PAYOUT HISTORY REFRESH EVENT */
  useEffect(() => {
    const handlePayoutRefresh = () => {
      setCurrentPage(1);
      void loadHistory(true);
    };

    window.addEventListener("artist-payout-refresh", handlePayoutRefresh);

    return () => {
      window.removeEventListener("artist-payout-refresh", handlePayoutRefresh);
    };
  }, [loadHistory]);

  const payouts = history?.result || [];

  const totalPages = Math.max(Number(history?.totalPages || 0), 1);

  const handleStatusChange = (status: ArtistPayoutStatus | "ALL") => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleConfirmCancel = async () => {
    if (!selectedPayout || !accessToken || canceling) {
      return;
    }

    try {
      setCanceling(true);
      setErrorMessage("");

      const response = await cancelArtistPayoutRequestApi(
        selectedPayout.id,
        accessToken
      );

      if (
        response?.error ||
        Number(response?.statusCode) >= 400 ||
        !response?.data
      ) {
        throw new Error(
          response?.message || "Unable to cancel payout request."
        );
      }

      setSelectedPayout(null);

      await loadHistory(true);

      window.dispatchEvent(new Event("artist-wallet-refresh"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to cancel payout request."
      );
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 3,
        minWidth: 0,
      }}
    >
      {/* PAYOUT HISTORY HEADER */}
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
        justifyContent="space-between"
        spacing={2}
        sx={{
          mb: 2,
        }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PaymentsRoundedIcon
              sx={{
                color: "#ff650f",
                fontSize: 22,
              }}
            />

            <Typography
              component="h3"
              sx={{
                color: "#ffffff",
                fontSize: {
                  xs: 19,
                  md: 22,
                },
                fontWeight: 950,
              }}
            >
              Payout history
            </Typography>
          </Stack>

          <Typography
            sx={{
              mt: 0.5,
              color: "#858a8d",
              fontSize: 12,
              fontWeight: 650,
            }}
          >
            Review and manage your artist payout requests.
          </Typography>
        </Box>

        {/* PAYOUT REFRESH ACTION */}
        <Button
          onClick={() => void loadHistory(true)}
          disabled={refreshing || sessionStatus === "loading"}
          startIcon={
            refreshing ? (
              <CircularProgress size={15} thickness={5} color="inherit" />
            ) : (
              <RefreshRoundedIcon />
            )
          }
          sx={{
            minHeight: 38,
            px: 1.8,
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.14)",
            backgroundColor: "rgba(255,255,255,0.035)",
            textTransform: "none",
            fontWeight: 900,

            "&:hover": {
              borderColor: "rgba(255,255,255,0.3)",
              backgroundColor: "rgba(255,255,255,0.07)",
            },

            "&.Mui-disabled": {
              color: "#666a6c",
              borderColor: "rgba(255,255,255,0.06)",
            },
          }}
        >
          Refresh payouts
        </Button>
      </Stack>

      {/* PAYOUT STATUS FILTERS */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 0.5,

          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {payoutFilters.map((status) => {
          const active = selectedStatus === status;

          return (
            <Button
              key={status}
              onClick={() => handleStatusChange(status)}
              sx={{
                minWidth: "max-content",
                minHeight: 32,
                px: 1.7,
                borderRadius: "999px",
                color: active ? "#ffffff" : "#a0a5a8",
                backgroundColor: active ? "#ff5500" : "rgba(255,255,255,0.035)",
                border: active
                  ? "1px solid #ff5500"
                  : "1px solid rgba(255,255,255,0.1)",
                textTransform: "none",
                fontSize: 11,
                fontWeight: 900,

                "&:hover": {
                  color: "#ffffff",
                  backgroundColor: active
                    ? "#ff681a"
                    : "rgba(255,255,255,0.08)",
                },
              }}
            >
              {status === "ALL" ? "All payouts" : status}
            </Button>
          );
        })}
      </Box>

      {/* PAYOUT ERROR */}
      {errorMessage && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            color: "#ffb4b4",
            backgroundColor: "rgba(255,80,80,0.1)",
            border: "1px solid rgba(255,100,100,0.22)",

            "& .MuiAlert-icon": {
              color: "#ff7777",
            },
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* PAYOUT LOADING */}
      {loading ? (
        <Box
          sx={{
            minHeight: 230,
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#151718",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            size={28}
            sx={{
              color: "#ff5500",
            }}
          />
        </Box>
      ) : payouts.length === 0 ? (
        /* EMPTY PAYOUT HISTORY */
        <Box
          sx={{
            minHeight: 220,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.025)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 2,
          }}
        >
          <Box>
            <AccountBalanceRoundedIcon
              sx={{
                color: "#ff650f",
                fontSize: 40,
              }}
            />

            <Typography
              sx={{
                mt: 1,
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 900,
              }}
            >
              No payout requests
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: "#777c7f",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              Your payout requests will appear here.
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          {/* PAYOUT CARDS */}
          <Stack spacing={1.2}>
            {payouts.map((payout) => (
              <Box
                key={payout.id}
                sx={{
                  p: {
                    xs: 1.7,
                    md: 2,
                  },
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "#151718",
                }}
              >
                <Stack
                  direction={{
                    xs: "column",
                    md: "row",
                  }}
                  alignItems={{
                    xs: "stretch",
                    md: "center",
                  }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      flexWrap="wrap"
                    >
                      <Typography
                        sx={{
                          color: "#63e6a6",
                          fontSize: {
                            xs: 20,
                            md: 22,
                          },
                          fontWeight: 950,
                        }}
                      >
                        {formatMoney(payout.amount, payout.currency)}
                      </Typography>

                      <Chip
                        size="small"
                        label={payout.status}
                        sx={{
                          ...getStatusStyle(payout.status),
                          height: 23,
                          fontSize: 9,
                          fontWeight: 950,
                        }}
                      />
                    </Stack>

                    <Typography
                      sx={{
                        mt: 0.6,
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 850,
                      }}
                    >
                      {payout.bankName} ·{" "}
                      {maskAccountNumber(payout.accountNumber)}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "#858a8d",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Requested {formatDateTime(payout.requestedAt)}
                    </Typography>
                  </Box>

                  {/* PAYOUT ACTIONS */}
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={1}
                  >
                    {payout.transactionReference && (
                      <Box
                        sx={{
                          px: 1.4,
                          py: 0.8,
                          borderRadius: 1,
                          border: "1px solid rgba(255,255,255,0.08)",
                          backgroundColor: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#74797c",
                            fontSize: 9,
                            fontWeight: 850,
                            textTransform: "uppercase",
                          }}
                        >
                          Transaction
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.2,
                            color: "#d9dcde",
                            fontSize: 11,
                            fontWeight: 800,
                            fontFamily: "monospace",
                          }}
                        >
                          {payout.transactionReference}
                        </Typography>
                      </Box>
                    )}

                    {payout.status === "PENDING" && (
                      <Button
                        onClick={() => setSelectedPayout(payout)}
                        startIcon={<CancelRoundedIcon />}
                        sx={{
                          minHeight: 38,
                          px: 1.7,
                          color: "#ff858c",
                          border: "1px solid rgba(255,100,110,0.25)",
                          backgroundColor: "rgba(255,90,100,0.06)",
                          textTransform: "none",
                          fontWeight: 900,

                          "&:hover": {
                            color: "#ffffff",
                            borderColor: "rgba(255,100,110,0.5)",
                            backgroundColor: "rgba(255,90,100,0.14)",
                          },
                        }}
                      >
                        Cancel request
                      </Button>
                    )}
                  </Stack>
                </Stack>

                {(payout.artistNote || payout.adminNote) && (
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.3,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {payout.artistNote && (
                      <Typography
                        sx={{
                          color: "#969b9e",
                          fontSize: 11,
                          lineHeight: 1.5,
                        }}
                      >
                        Artist note: {payout.artistNote}
                      </Typography>
                    )}

                    {payout.adminNote && (
                      <Typography
                        sx={{
                          mt: payout.artistNote ? 0.5 : 0,
                          color:
                            payout.status === "REJECTED"
                              ? "#ff858c"
                              : "#aeb2b5",
                          fontSize: 11,
                          lineHeight: 1.5,
                        }}
                      >
                        Admin note: {payout.adminNote}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Stack>

          {/* PAYOUT PAGINATION */}
          {Number(history?.totalPages || 0) > 1 && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Pagination
                page={currentPage}
                count={totalPages}
                onChange={(_, page) => setCurrentPage(page)}
                shape="rounded"
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#aeb2b5",
                  },

                  "& .MuiPaginationItem-root:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },

                  "& .Mui-selected": {
                    color: "#ffffff !important",
                    backgroundColor: "#ff5500 !important",
                  },
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* CANCEL PAYOUT CONFIRMATION */}
      <Dialog
        open={Boolean(selectedPayout)}
        onClose={() => {
          if (!canceling) {
            setSelectedPayout(null);
          }
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            color: "#ffffff",
            backgroundColor: "#121415",
            backgroundImage: "none",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#ffffff",
            fontWeight: 950,
          }}
        >
          Cancel payout request?
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#aeb2b5",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            The reserved amount will be returned to your available balance.
          </Typography>

          {selectedPayout && (
            <Typography
              sx={{
                mt: 1.5,
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 950,
              }}
            >
              {formatMoney(selectedPayout.amount, selectedPayout.currency)}
            </Typography>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            onClick={() => setSelectedPayout(null)}
            disabled={canceling}
            sx={{
              color: "#c7cacc",
              textTransform: "none",
              fontWeight: 850,
            }}
          >
            Keep request
          </Button>

          <Button
            onClick={() => void handleConfirmCancel()}
            disabled={canceling}
            startIcon={
              canceling ? (
                <CircularProgress size={15} color="inherit" />
              ) : (
                <CancelRoundedIcon />
              )
            }
            sx={{
              color: "#ffffff",
              backgroundColor: "#d93645",
              textTransform: "none",
              fontWeight: 900,

              "&:hover": {
                backgroundColor: "#ed4857",
              },

              "&.Mui-disabled": {
                color: "#777b7d",
                backgroundColor: "#292b2c",
              },
            }}
          >
            {canceling ? "Canceling..." : "Cancel payout"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArtistPayoutHistory;
