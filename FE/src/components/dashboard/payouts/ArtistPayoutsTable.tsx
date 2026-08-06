"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSession } from "next-auth/react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { getAdminArtistPayoutsApi } from "@/utils/api";
import ArtistPayoutActionDialog from "../components/ArtistPayoutActionDialog";
import ArtistPayoutTrendChart from "./components/ArtistPayoutTrendChart";

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

const formatMoney = (amount?: number | null, currency = "VND") => {
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
      color: "#69b4ff",
      backgroundColor: "rgba(80,155,255,0.1)",
      border: "1px solid rgba(80,155,255,0.3)",
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

const ArtistPayoutsTable = () => {
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

  const pageSize = 10;

  const accessToken = useMemo(() => getAccessToken(session), [session]);

  const loadPayouts = useCallback(
    async (silent = false) => {
      if (sessionStatus === "loading") {
        return;
      }

      if (!accessToken) {
        setHistory(null);
        setLoading(false);
        setRefreshing(false);
        setErrorMessage("Administrator authentication is required.");
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const response = await getAdminArtistPayoutsApi(accessToken, {
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
            response?.message || "Unable to load artist payouts."
          );
        }

        setHistory(response.data);
      } catch (error) {
        setHistory(null);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load artist payouts."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, currentPage, selectedStatus, sessionStatus]
  );

  useEffect(() => {
    void loadPayouts();
  }, [loadPayouts]);

  const payouts = history?.result || [];

  const totalPages = Math.max(Number(history?.totalPages || 0), 1);

  const pendingCount = payouts.filter(
    (item) => item.status === "PENDING"
  ).length;

  const approvedCount = payouts.filter(
    (item) => item.status === "APPROVED"
  ).length;

  const paidAmount = payouts
    .filter((item) => item.status === "PAID")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const handleStatusChange = (status: ArtistPayoutStatus | "ALL") => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  /* REFRESH PAYOUT TABLE AND CHART */
  const handleRefreshPayoutData = useCallback(() => {
    void loadPayouts(true);

    window.dispatchEvent(new Event("admin-payout-chart-refresh"));

    window.dispatchEvent(new Event("admin-payout-chart-refresh"));
  }, [loadPayouts]);

  /* PAYOUT ACTION SUCCESS */
  const handlePayoutActionSuccess = useCallback(
    (data: ArtistPayoutActionData) => {
      setSelectedPayout(null);

      setHistory((currentHistory) => {
        if (!currentHistory) {
          return currentHistory;
        }

        return {
          ...currentHistory,
          result: currentHistory.result.map((item) =>
            item.id === data.payoutRequest.id ? data.payoutRequest : item
          ),
        };
      });

      void loadPayouts(true);

      window.dispatchEvent(new Event("admin-payout-chart-refresh"));
    },
    [loadPayouts]
  );

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        color: "#ffffff",
      }}
    >
      {/* ADMIN PAYOUT HEADER */}
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
        sx={{
          mb: 3,
        }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ff650f",
                backgroundColor: "rgba(255,85,0,0.12)",
                border: "1px solid rgba(255,85,0,0.2)",
              }}
            >
              <AccountBalanceWalletRoundedIcon />
            </Box>

            <Box>
              <Typography
                component="h1"
                sx={{
                  color: "#ffffff",
                  fontSize: {
                    xs: 24,
                    md: 30,
                  },
                  fontWeight: 950,
                  letterSpacing: "-0.03em",
                }}
              >
                Artist payouts
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  color: "#8B949E",
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                Review, approve and process artist withdrawal requests.
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* ADMIN REFRESH ACTION */}
        <Button
          onClick={handleRefreshPayoutData}
          disabled={refreshing || sessionStatus === "loading"}
          startIcon={
            refreshing ? (
              <CircularProgress size={15} thickness={5} color="inherit" />
            ) : (
              <RefreshRoundedIcon />
            )
          }
          sx={{
            minHeight: 40,
            px: 2,
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.15)",
            backgroundColor: "rgba(255,255,255,0.035)",
            textTransform: "none",
            fontWeight: 900,

            "&:hover": {
              borderColor: "rgba(255,255,255,0.32)",
              backgroundColor: "rgba(255,255,255,0.08)",
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

      {/* ARTIST PAYOUT STATISTICS */}
      {accessToken && <ArtistPayoutTrendChart accessToken={accessToken} />}

      {/* PAYOUT SUMMARY CARDS */}
      <Box
        sx={{
          mb: 3,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, minmax(0,1fr))",
          },
          gap: 1.5,
        }}
      >
        <Box sx={summaryCardSx}>
          <Typography sx={summaryLabelSx}>Pending review</Typography>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Typography sx={summaryValueSx}>{pendingCount}</Typography>

            <CloseRoundedIcon
              sx={{
                color: "#ffbd69",
              }}
            />
          </Stack>
        </Box>

        <Box sx={summaryCardSx}>
          <Typography sx={summaryLabelSx}>Approved</Typography>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Typography sx={summaryValueSx}>{approvedCount}</Typography>

            <CheckCircleRoundedIcon
              sx={{
                color: "#69b4ff",
              }}
            />
          </Stack>
        </Box>

        <Box sx={summaryCardSx}>
          <Typography sx={summaryLabelSx}>Paid on this page</Typography>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Typography
              sx={{
                ...summaryValueSx,
                color: "#63e6a6",
              }}
            >
              {formatMoney(paidAmount, payouts[0]?.currency || "VND")}
            </Typography>

            <PaidRoundedIcon
              sx={{
                color: "#63e6a6",
              }}
            />
          </Stack>
        </Box>
      </Box>

      {/* PAYOUT FILTERS */}
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
                minHeight: 34,
                px: 1.8,
                borderRadius: "999px",
                color: active ? "#ffffff" : "#9CA3AF",
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
            minHeight: 320,
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#151718",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack alignItems="center" spacing={1.3}>
            <CircularProgress
              size={30}
              sx={{
                color: "#ff5500",
              }}
            />

            <Typography
              sx={{
                color: "#92979a",
                fontSize: 12,
                fontWeight: 750,
              }}
            >
              Loading artist payouts...
            </Typography>
          </Stack>
        </Box>
      ) : payouts.length === 0 ? (
        /* EMPTY PAYOUTS */
        <Box
          sx={{
            minHeight: 300,
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
            <AccountBalanceWalletRoundedIcon
              sx={{
                color: "#ff650f",
                fontSize: 46,
              }}
            />

            <Typography
              sx={{
                mt: 1,
                color: "#ffffff",
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              No payout requests found
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: "#777c7f",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              Artist payout requests will appear here.
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          {/* DESKTOP PAYOUT TABLE */}
          <Box
            sx={{
              display: {
                xs: "none",
                lg: "block",
              },
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#151718",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                minHeight: 46,
                px: 2,
                display: "grid",
                gridTemplateColumns:
                  "minmax(185px,1fr) minmax(150px,0.9fr) 130px 115px minmax(155px,0.8fr) 55px",
                gap: 1.5,
                alignItems: "center",
                backgroundColor: "#111314",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography sx={headerSx}>Artist</Typography>

              <Typography sx={headerSx}>Bank account</Typography>

              <Typography sx={headerSx}>Amount</Typography>

              <Typography sx={headerSx}>Status</Typography>

              <Typography sx={headerSx}>Requested</Typography>

              <Box />
            </Box>

            {payouts.map((payout) => (
              <Box
                key={payout.id}
                sx={{
                  minHeight: 82,
                  px: 2,
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(185px,1fr) minmax(150px,0.9fr) 130px 115px minmax(155px,0.8fr) 55px",
                  gap: 1.5,
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",

                  "&:last-child": {
                    borderBottom: "none",
                  },

                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.025)",
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      color: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 900,
                    }}
                  >
                    {payout.accountHolderName}
                  </Typography>

                  <Tooltip title={payout.artistId} arrow>
                    <Typography
                      noWrap
                      sx={{
                        mt: 0.4,
                        color: "#73787b",
                        fontSize: 10.5,
                        fontFamily: "monospace",
                        cursor: "help",
                      }}
                    >
                      {payout.artistId}
                    </Typography>
                  </Tooltip>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      color: "#d2d5d7",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {payout.bankName}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      color: "#858a8d",
                      fontSize: 10.5,
                      fontFamily: "monospace",
                    }}
                  >
                    {maskAccountNumber(payout.accountNumber)}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: "#63e6a6",
                    fontSize: 13,
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
                    width: "fit-content",
                    height: 24,
                    fontSize: 9,
                    fontWeight: 950,
                  }}
                />

                <Typography
                  sx={{
                    color: "#aeb2b5",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.45,
                  }}
                >
                  {formatDateTime(payout.requestedAt)}
                </Typography>

                {/* DESKTOP ROW ACTION */}
                <Tooltip title="View payout details" arrow>
                  <IconButton
                    onClick={() => setSelectedPayout(payout)}
                    sx={{
                      color: "#aeb2b5",
                      border: "1px solid rgba(255,255,255,0.08)",

                      "&:hover": {
                        color: "#ffffff",
                        borderColor: "rgba(255,85,0,0.35)",
                        backgroundColor: "rgba(255,85,0,0.08)",
                      },
                    }}
                  >
                    <MoreHorizRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>

          {/* MOBILE AND TABLET PAYOUT CARDS */}
          <Stack
            spacing={1.2}
            sx={{
              display: {
                xs: "flex",
                lg: "none",
              },
            }}
          >
            {payouts.map((payout) => (
              <Box
                key={payout.id}
                sx={{
                  p: 1.7,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "#151718",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: "#63e6a6",
                        fontSize: 20,
                        fontWeight: 950,
                      }}
                    >
                      {formatMoney(payout.amount, payout.currency)}
                    </Typography>

                    <Typography
                      noWrap
                      sx={{
                        mt: 0.5,
                        color: "#ffffff",
                        fontSize: 12.5,
                        fontWeight: 900,
                      }}
                    >
                      {payout.accountHolderName}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={payout.status}
                    sx={{
                      ...getStatusStyle(payout.status),
                      flexShrink: 0,
                      height: 23,
                      fontSize: 9,
                      fontWeight: 950,
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    mt: 1.4,
                    pt: 1.3,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "grid",
                    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                    gap: 1.2,
                  }}
                >
                  <Box>
                    <Typography sx={mobileLabelSx}>Bank</Typography>

                    <Typography sx={mobileValueSx}>
                      {payout.bankName}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography sx={mobileLabelSx}>Account</Typography>

                    <Typography sx={mobileValueSx}>
                      {maskAccountNumber(payout.accountNumber)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography sx={mobileLabelSx}>Requested</Typography>

                    <Typography sx={mobileValueSx}>
                      {formatDateTime(payout.requestedAt)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography sx={mobileLabelSx}>Method</Typography>

                    <Typography sx={mobileValueSx}>
                      {payout.payoutMethod}
                    </Typography>
                  </Box>
                </Box>

                {/* MOBILE ROW ACTION */}
                <Button
                  fullWidth
                  onClick={() => setSelectedPayout(payout)}
                  endIcon={<MoreHorizRoundedIcon />}
                  sx={{
                    mt: 1.5,
                    minHeight: 38,
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(255,255,255,0.035)",
                    textTransform: "none",
                    fontWeight: 900,

                    "&:hover": {
                      borderColor: "rgba(255,85,0,0.4)",
                      backgroundColor: "rgba(255,85,0,0.08)",
                    },
                  }}
                >
                  View details
                </Button>
              </Box>
            ))}
          </Stack>

          {/* PAYOUT PAGINATION */}
          {Number(history?.totalPages || 0) > 1 && (
            <Box
              sx={{
                mt: 2.5,
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

      {/* ADMIN PAYOUT ACTION DIALOG */}
      <ArtistPayoutActionDialog
        open={Boolean(selectedPayout)}
        payout={selectedPayout}
        accessToken={accessToken}
        onClose={() => setSelectedPayout(null)}
        onSuccess={handlePayoutActionSuccess}
      />
    </Box>
  );
};

const summaryCardSx = {
  minHeight: 105,
  p: 2,
  borderRadius: 2,
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.045), rgba(20,22,23,0.98))",
} as const;

const summaryLabelSx = {
  mb: 1.2,
  color: "#858a8d",
  fontSize: 11,
  fontWeight: 850,
  textTransform: "uppercase",
} as const;

const summaryValueSx = {
  color: "#ffffff",
  fontSize: 25,
  fontWeight: 950,
} as const;

const headerSx = {
  color: "#8f9497",
  fontSize: 10,
  fontWeight: 950,
  textTransform: "uppercase",
} as const;

const mobileLabelSx = {
  color: "#73787b",
  fontSize: 9.5,
  fontWeight: 850,
  textTransform: "uppercase",
} as const;

const mobileValueSx = {
  mt: 0.35,
  color: "#d0d3d5",
  fontSize: 11,
  fontWeight: 750,
  lineHeight: 1.45,
} as const;

export default ArtistPayoutsTable;
