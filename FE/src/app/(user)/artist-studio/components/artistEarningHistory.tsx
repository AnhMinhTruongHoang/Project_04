"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSession } from "next-auth/react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { getArtistEarningHistoryApi } from "@/utils/api";

const EARNING_PAGE_SIZE = 10;
const DEFAULT_CURRENCY = "VND";

const earningFilters = [
  "ALL",
  "PENDING",
  "AVAILABLE",
  "REJECTED",
  "REVERSED",
] as const;

type EarningFilter = (typeof earningFilters)[number];

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

const normalizeStatus = (value?: string | null) => {
  return String(value || "UNKNOWN")
    .trim()
    .toUpperCase();
};

const getSafeAmount = (value?: number | null) => {
  const amount = Number(value || 0);

  return Number.isFinite(amount) ? amount : 0;
};

const formatMoney = (
  amount: number,
  currency = DEFAULT_CURRENCY
) => {
  const safeAmount = getSafeAmount(amount);

  const normalizedCurrency =
    String(currency || DEFAULT_CURRENCY)
      .trim()
      .toUpperCase() || DEFAULT_CURRENCY;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits:
        normalizedCurrency === "VND" ? 0 : undefined,
      maximumFractionDigits:
        normalizedCurrency === "VND" ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return `${safeAmount.toLocaleString(
      "en-US"
    )} ${normalizedCurrency}`;
  }
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

const shortenId = (value?: string | null) => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "—";
  }

  if (normalizedValue.length <= 14) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(
    0,
    7
  )}...${normalizedValue.slice(-5)}`;
};

const getStatusStyle = (status?: string | null) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "AVAILABLE") {
    return {
      color: "#63e6a6",
      backgroundColor: "rgba(99,230,166,0.1)",
      border: "1px solid rgba(99,230,166,0.28)",
    };
  }

  if (
    normalizedStatus === "REJECTED" ||
    normalizedStatus === "REVERSED"
  ) {
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

const getFilterLabel = (status: EarningFilter) => {
  switch (status) {
    case "ALL":
      return "All earnings";

    case "PENDING":
      return "Pending";

    case "AVAILABLE":
      return "Available";

    case "REJECTED":
      return "Rejected";

    case "REVERSED":
      return "Reversed";

    default:
      return status;
  }
};

const ArtistEarningHistory = () => {
  const { data: session, status: sessionStatus } =
    useSession();

  const requestIdRef = useRef(0);

  const [history, setHistory] =
    useState<ArtistEarningHistoryData | null>(null);

  const [selectedStatus, setSelectedStatus] =
    useState<EarningFilter>("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const accessToken = useMemo(
    () => getAccessToken(session),
    [session]
  );

  const loadHistory = useCallback(
    async (silent = false) => {
      if (sessionStatus === "loading") {
        return;
      }

      const requestId = ++requestIdRef.current;

      if (!accessToken) {
        setHistory(null);
        setLoading(false);
        setRefreshing(false);

        setErrorMessage(
          "Please sign in to view your earning history."
        );

        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const response = await getArtistEarningHistoryApi(
          accessToken,
          {
            status:
              selectedStatus === "ALL"
                ? undefined
                : selectedStatus,
            current: currentPage,
            pageSize: EARNING_PAGE_SIZE,
          }
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        const statusCode = Number(
          response?.statusCode || 0
        );

        if (
          response?.error ||
          statusCode >= 400 ||
          !response?.data
        ) {
          throw new Error(
            response?.message ||
              "Unable to load earning history."
          );
        }

        setHistory(response.data);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        /*
         * Refresh lỗi không được xóa dữ liệu cũ.
         * Chỉ request tải chính mới đưa history về null.
         */
        if (!silent) {
          setHistory(null);
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load earning history."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      accessToken,
      currentPage,
      selectedStatus,
      sessionStatus,
    ]
  );

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const earnings = Array.isArray(history?.result)
    ? history.result
    : [];

  const rawTotalPages = Number(
    history?.totalPages || 0
  );

  const totalPages = Math.max(
    Number.isFinite(rawTotalPages)
      ? rawTotalPages
      : 0,
    1
  );

  /*
   * Khi filter làm giảm số trang, đưa user về trang cuối
   * hợp lệ thay vì để UI hiển thị một trang rỗng.
   */
  useEffect(() => {
    if (
      history &&
      rawTotalPages > 0 &&
      currentPage > rawTotalPages
    ) {
      setCurrentPage(rawTotalPages);
    }
  }, [history, rawTotalPages, currentPage]);

  const handleStatusChange = (
    status: EarningFilter
  ) => {
    if (status === selectedStatus) {
      return;
    }

    setSelectedStatus(status);
    setCurrentPage(1);
  };

  return (
    <Box
      component="section"
      aria-labelledby="earning-history-title"
      sx={{
        mt: 3,
        minWidth: 0,
      }}
    >
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
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <HistoryRoundedIcon
              sx={{
                color: "#ff650f",
                fontSize: 22,
              }}
            />

            <Typography
              id="earning-history-title"
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
              Earning history
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
            Revenue generated from qualified listening
            sessions.
          </Typography>
        </Box>

        <Button
          type="button"
          onClick={() => void loadHistory(true)}
          disabled={
            refreshing ||
            loading ||
            sessionStatus === "loading"
          }
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
            px: 1.8,
            color: "#ffffff",
            border:
              "1px solid rgba(255,255,255,0.14)",
            backgroundColor:
              "rgba(255,255,255,0.035)",
            textTransform: "none",
            fontSize: 12,
            fontWeight: 900,

            "&:hover": {
              borderColor:
                "rgba(255,255,255,0.3)",
              backgroundColor:
                "rgba(255,255,255,0.07)",
            },

            "&.Mui-disabled": {
              color: "#666a6c",
              borderColor:
                "rgba(255,255,255,0.06)",
            },
          }}
        >
          {refreshing
            ? "Refreshing"
            : "Refresh history"}
        </Button>
      </Stack>

      <Box
        role="tablist"
        aria-label="Earning status filters"
        sx={{
          mb: 2,
          display: "flex",
          gap: 1,
          overflowX: "auto",
          overflowY: "hidden",
          pb: 0.5,
          scrollbarWidth: "none",

          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {earningFilters.map((status) => {
          const active = selectedStatus === status;

          return (
            <Button
              key={status}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                handleStatusChange(status)
              }
              sx={{
                minWidth: "max-content",
                minHeight: 32,
                px: 1.7,
                borderRadius: "999px",
                color: active
                  ? "#ffffff"
                  : "#a0a5a8",
                backgroundColor: active
                  ? "#ff5500"
                  : "rgba(255,255,255,0.035)",
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

                "&:focus-visible": {
                  outline: "2px solid #ffffff",
                  outlineOffset: "2px",
                },
              }}
            >
              {getFilterLabel(status)}
            </Button>
          );
        })}
      </Box>

      {errorMessage && history && (
        <Alert
          severity="warning"
          action={
            <Button
              type="button"
              color="inherit"
              size="small"
              onClick={() => void loadHistory(true)}
              disabled={refreshing}
              sx={{
                textTransform: "none",
                fontWeight: 900,
              }}
            >
              Retry
            </Button>
          }
          sx={{
            mb: 2,
            color: "#ffd39d",
            backgroundColor:
              "rgba(255,179,92,0.09)",
            border:
              "1px solid rgba(255,179,92,0.24)",

            "& .MuiAlert-icon": {
              color: "#ffb35c",
            },
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {loading ? (
        <Box
          aria-label="Loading earning history"
          sx={{
            minHeight: 240,
            borderRadius: 2,
            border:
              "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#151718",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack spacing={1.2} alignItems="center">
            <CircularProgress
              size={28}
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
              Loading earning history...
            </Typography>
          </Stack>
        </Box>
      ) : !history && errorMessage ? (
        <Box
          role="alert"
          sx={{
            minHeight: 230,
            px: 3,
            py: 4,
            borderRadius: 2,
            border:
              "1px solid rgba(255,85,0,0.2)",
            background:
              "linear-gradient(180deg, rgba(255,85,0,0.04), #151718)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Box>
            <ErrorOutlineRoundedIcon
              sx={{
                color: "#ff5500",
                fontSize: 34,
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
              Earning history is unavailable
            </Typography>

            <Typography
              sx={{
                mt: 0.6,
                maxWidth: 460,
                color: "#92979a",
                fontSize: 12,
                fontWeight: 650,
                lineHeight: 1.5,
              }}
            >
              {errorMessage}
            </Typography>

            {accessToken && (
              <Button
                type="button"
                onClick={() => void loadHistory()}
                startIcon={<RefreshRoundedIcon />}
                sx={{
                  mt: 2,
                  borderRadius: "999px",
                  px: 2.4,
                  color: "#ffffff",
                  border:
                    "1px solid rgba(255,255,255,0.24)",
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 900,

                  "&:hover": {
                    borderColor: "#ff5500",
                    backgroundColor:
                      "rgba(255,85,0,0.08)",
                  },
                }}
              >
                Try again
              </Button>
            )}
          </Box>
        </Box>
      ) : earnings.length === 0 ? (
        <Box
          sx={{
            minHeight: 230,
            borderRadius: 2,
            border:
              "1px dashed rgba(255,255,255,0.12)",
            backgroundColor:
              "rgba(255,255,255,0.025)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            textAlign: "center",
          }}
        >
          <Box>
            <MusicNoteRoundedIcon
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
              No earnings found
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: "#777c7f",
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              {selectedStatus === "ALL"
                ? "Qualified stream earnings will appear here."
                : `No ${getFilterLabel(
                    selectedStatus
                  ).toLowerCase()} earnings were found.`}
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
              borderRadius: 2,
              border:
                "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#151718",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                minHeight: 44,
                px: 2,
                display: "grid",
                gridTemplateColumns:
                  "minmax(150px,1fr) 115px 125px minmax(160px,1fr) minmax(160px,1fr)",
                gap: 1.5,
                alignItems: "center",
                borderBottom:
                  "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "#111314",
              }}
            >
              <Typography sx={headerSx}>
                Track
              </Typography>

              <Typography sx={headerSx}>
                Status
              </Typography>

              <Typography sx={headerSx}>
                Amount
              </Typography>

              <Typography sx={headerSx}>
                Qualified
              </Typography>

              <Typography sx={headerSx}>
                Available
              </Typography>
            </Box>

            {earnings.map((earning) => {
              const status = normalizeStatus(
                earning.status
              );

              return (
                <Box
                  key={earning.id}
                  sx={{
                    minHeight: 72,
                    px: 2,
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(150px,1fr) 115px 125px minmax(160px,1fr) minmax(160px,1fr)",
                    gap: 1.5,
                    alignItems: "center",
                    borderBottom:
                      "1px solid rgba(255,255,255,0.06)",

                    "&:last-child": {
                      borderBottom: "none",
                    },

                    "&:hover": {
                      backgroundColor:
                        "rgba(255,255,255,0.025)",
                    },
                  }}
                >
                  <Tooltip
                    title={earning.trackId || ""}
                    arrow
                  >
                    <Typography
                      noWrap
                      sx={{
                        color: "#d9dcde",
                        fontSize: 12,
                        fontWeight: 800,
                        fontFamily: "monospace",
                        cursor: "help",
                      }}
                    >
                      {shortenId(earning.trackId)}
                    </Typography>
                  </Tooltip>

                  <Chip
                    size="small"
                    label={status}
                    sx={{
                      ...getStatusStyle(status),
                      width: "fit-content",
                      height: 24,
                      fontSize: 9.5,
                      fontWeight: 950,

                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />

                  <Typography
                    sx={{
                      color:
                        status === "REJECTED" ||
                        status === "REVERSED"
                          ? "#ff747c"
                          : "#63e6a6",
                      fontSize: 13,
                      fontWeight: 950,
                    }}
                  >
                    {formatMoney(
                      earning.amount,
                      earning.currency
                    )}
                  </Typography>

                  <Typography sx={cellSx}>
                    {formatDateTime(
                      earning.qualifiedAt
                    )}
                  </Typography>

                  <Typography sx={cellSx}>
                    {formatDateTime(
                      earning.availableAt
                    )}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Stack
            spacing={1.2}
            sx={{
              display: {
                xs: "flex",
                md: "none",
              },
            }}
          >
            {earnings.map((earning) => {
              const status = normalizeStatus(
                earning.status
              );

              return (
                <Box
                  key={earning.id}
                  sx={{
                    p: 1.7,
                    borderRadius: 2,
                    border:
                      "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "#151718",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1.5}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: "#858a8d",
                          fontSize: 10,
                          fontWeight: 850,
                          textTransform: "uppercase",
                        }}
                      >
                        Track
                      </Typography>

                      <Tooltip
                        title={earning.trackId || ""}
                        arrow
                      >
                        <Typography
                          noWrap
                          sx={{
                            mt: 0.4,
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: 850,
                            fontFamily: "monospace",
                          }}
                        >
                          {shortenId(
                            earning.trackId
                          )}
                        </Typography>
                      </Tooltip>
                    </Box>

                    <Chip
                      size="small"
                      label={status}
                      sx={{
                        ...getStatusStyle(status),
                        flexShrink: 0,
                        height: 23,
                        fontSize: 9,
                        fontWeight: 950,
                      }}
                    />
                  </Stack>

                  <Typography
                    sx={{
                      mt: 1.4,
                      color:
                        status === "REJECTED" ||
                        status === "REVERSED"
                          ? "#ff747c"
                          : "#63e6a6",
                      fontSize: 20,
                      fontWeight: 950,
                    }}
                  >
                    {formatMoney(
                      earning.amount,
                      earning.currency
                    )}
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.4,
                      pt: 1.3,
                      borderTop:
                        "1px solid rgba(255,255,255,0.06)",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0,1fr))",
                      gap: 1.2,
                    }}
                  >
                    <Box>
                      <Typography sx={mobileLabelSx}>
                        Qualified
                      </Typography>

                      <Typography sx={mobileValueSx}>
                        {formatDateTime(
                          earning.qualifiedAt
                        )}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={mobileLabelSx}>
                        Available
                      </Typography>

                      <Typography sx={mobileValueSx}>
                        {formatDateTime(
                          earning.availableAt
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  {earning.rejectionReason && (
                    <Typography
                      sx={{
                        mt: 1.2,
                        color: "#ff858c",
                        fontSize: 11,
                        fontWeight: 750,
                        lineHeight: 1.5,
                      }}
                    >
                      {earning.rejectionReason}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>

          {rawTotalPages > 1 && (
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
                onChange={(_, page) =>
                  setCurrentPage(page)
                }
                disabled={loading || refreshing}
                shape="rounded"
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#aeb2b5",
                    borderColor:
                      "rgba(255,255,255,0.12)",
                  },

                  "& .MuiPaginationItem-root:hover": {
                    color: "#ffffff",
                    backgroundColor:
                      "rgba(255,255,255,0.08)",
                  },

                  "& .Mui-selected": {
                    color: "#ffffff !important",
                    backgroundColor:
                      "#ff5500 !important",
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

const headerSx = {
  color: "#9da2a5",
  fontSize: 10,
  fontWeight: 950,
  textTransform: "uppercase",
} as const;

const cellSx = {
  color: "#aeb2b5",
  fontSize: 11.5,
  fontWeight: 700,
} as const;

const mobileLabelSx = {
  color: "#73787b",
  fontSize: 9.5,
  fontWeight: 850,
  textTransform: "uppercase",
} as const;

const mobileValueSx = {
  mt: 0.35,
  color: "#c8cbcd",
  fontSize: 10.5,
  fontWeight: 700,
  lineHeight: 1.45,
} as const;

export default ArtistEarningHistory;