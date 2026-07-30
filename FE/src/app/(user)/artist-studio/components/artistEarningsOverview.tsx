"use client";

import type { ReactNode } from "react";

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
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

import { getArtistWalletApi } from "@/utils/api";

import ArtistEarningHistory from "./artistEarningHistory";
import ArtistPayoutDialog from "./artistPayoutDialog";
import ArtistPayoutHistory from "./artistPayoutHistory";

type WalletCardKey =
  | "available"
  | "pending"
  | "reserved"
  | "withdrawn";

type WalletCard = {
  key: WalletCardKey;
  label: string;
  description: string;
  amount: number;
  icon: ReactNode;
};

const WALLET_REFRESH_EVENT = "artist-wallet-refresh";
const PAYOUT_REFRESH_EVENT = "artist-payout-refresh";

const DEFAULT_CURRENCY = "VND";
const DEFAULT_MINIMUM_PAYOUT = 100000;

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
    return `${safeAmount.toLocaleString("en-US")} ${normalizedCurrency}`;
  }
};

const normalizeWalletStatus = (status?: string | null) => {
  return String(status || "UNKNOWN")
    .trim()
    .toUpperCase();
};

const ArtistEarningsOverview = () => {
  const { data: session, status: sessionStatus } = useSession();

  const requestIdRef = useRef(0);

  const [wallet, setWallet] =
    useState<ArtistWalletData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [payoutDialogOpen, setPayoutDialogOpen] =
    useState(false);

  const accessToken = useMemo(
    () => getAccessToken(session),
    [session]
  );

  /*
   * Đây chỉ là validation UI.
   * Backend vẫn bắt buộc phải kiểm tra minimum payout.
   */
  const minimumPayoutAmount = useMemo(() => {
    const configuredAmount = Number(
      process.env.NEXT_PUBLIC_ARTIST_PAYOUT_MINIMUM_AMOUNT
    );

    return Number.isFinite(configuredAmount) &&
      configuredAmount > 0
      ? configuredAmount
      : DEFAULT_MINIMUM_PAYOUT;
  }, []);

  const loadWallet = useCallback(
    async (silent = false) => {
      if (sessionStatus === "loading") {
        return;
      }

      const requestId = ++requestIdRef.current;

      if (!accessToken) {
        setWallet(null);
        setLoading(false);
        setRefreshing(false);

        setErrorMessage(
          "Please sign in to view your artist earnings."
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

        const response = await getArtistWalletApi(accessToken);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const statusCode = Number(response?.statusCode || 0);

        if (
          response?.error ||
          statusCode >= 400 ||
          !response?.data
        ) {
          throw new Error(
            response?.message || "Unable to load artist wallet."
          );
        }

        setWallet(response.data);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        /*
         * Refresh âm thầm thất bại không được xóa dữ liệu
         * wallet hiện tại. Chỉ lần tải đầu mới đưa wallet về null.
         */
        if (!silent) {
          setWallet(null);
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load artist wallet."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [accessToken, sessionStatus]
  );

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    const handleWalletRefresh = () => {
      void loadWallet(true);
    };

    window.addEventListener(
      WALLET_REFRESH_EVENT,
      handleWalletRefresh
    );

    return () => {
      window.removeEventListener(
        WALLET_REFRESH_EVENT,
        handleWalletRefresh
      );
    };
  }, [loadWallet]);

  const currency =
    String(wallet?.currency || DEFAULT_CURRENCY)
      .trim()
      .toUpperCase() || DEFAULT_CURRENCY;

  const availableBalance = getSafeAmount(
    wallet?.availableBalance
  );

  const walletStatus = normalizeWalletStatus(wallet?.status);

  const walletActive = walletStatus === "ACTIVE";

  const canRequestPayout =
    Boolean(wallet) &&
    walletActive &&
    availableBalance >= minimumPayoutAmount &&
    !loading;

  const payoutDisabledReason = useMemo(() => {
    if (loading) {
      return "Artist wallet is still loading.";
    }

    if (!wallet) {
      return "Artist wallet is unavailable.";
    }

    if (!walletActive) {
      return `Payouts are unavailable while wallet status is ${walletStatus}.`;
    }

    if (availableBalance < minimumPayoutAmount) {
      return `A minimum balance of ${formatMoney(
        minimumPayoutAmount,
        currency
      )} is required.`;
    }

    return "Request a payout";
  }, [
    loading,
    wallet,
    walletActive,
    walletStatus,
    availableBalance,
    minimumPayoutAmount,
    currency,
  ]);

  const cards = useMemo<WalletCard[]>(
    () => [
      {
        key: "available",
        label: "Available balance",
        description: "Ready to request a payout",
        amount: availableBalance,
        icon: <AccountBalanceWalletRoundedIcon />,
      },
      {
        key: "pending",
        label: "Pending earnings",
        description: "Waiting for the holding period",
        amount: getSafeAmount(wallet?.pendingBalance),
        icon: <ScheduleRoundedIcon />,
      },
      {
        key: "reserved",
        label: "Reserved balance",
        description: "Held for an active payout",
        amount: getSafeAmount(wallet?.reservedBalance),
        icon: <LockRoundedIcon />,
      },
      {
        key: "withdrawn",
        label: "Total withdrawn",
        description: "Completed artist payouts",
        amount: getSafeAmount(wallet?.withdrawnBalance),
        icon: <PaymentsRoundedIcon />,
      },
    ],
    [availableBalance, wallet]
  );

  const handlePayoutSuccess = useCallback(
    (data: ArtistPayoutActionData) => {
      setWallet((currentWallet) => {
        if (!currentWallet) {
          return currentWallet;
        }

        return {
          ...currentWallet,

          availableBalance: getSafeAmount(
            data.availableBalance ??
              currentWallet.availableBalance
          ),

          reservedBalance: getSafeAmount(
            data.reservedBalance ??
              currentWallet.reservedBalance
          ),

          withdrawnBalance: getSafeAmount(
            data.withdrawnBalance ??
              currentWallet.withdrawnBalance
          ),
        };
      });

      setPayoutDialogOpen(false);

      window.dispatchEvent(
        new Event(PAYOUT_REFRESH_EVENT)
      );

      void loadWallet(true);
    },
    [loadWallet]
  );

  return (
    <Box
      component="section"
      aria-labelledby="artist-earnings-title"
      sx={{
        width: "100%",
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
          mb: 2.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            id="artist-earnings-title"
            component="h2"
            sx={{
              color: "#ffffff",
              fontSize: {
                xs: 22,
                md: 26,
              },
              fontWeight: 950,
              lineHeight: 1.2,
              letterSpacing: "-0.025em",
            }}
          >
            Artist earnings
          </Typography>

          <Typography
            sx={{
              mt: 0.6,
              color: "#969a9d",
              fontSize: 13,
              fontWeight: 650,
            }}
          >
            Review your earnings, payout balance and payment
            history.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: {
              xs: "100%",
              sm: "auto",
            },
          }}
        >
          <Button
            type="button"
            onClick={() => void loadWallet(true)}
            disabled={
              refreshing || sessionStatus === "loading"
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
              minHeight: 40,
              px: 1.8,
              flex: {
                xs: 1,
                sm: "initial",
              },
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#ffffff",
              backgroundColor: "rgba(255,255,255,0.04)",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 900,

              "&:hover": {
                borderColor: "rgba(255,255,255,0.36)",
                backgroundColor: "rgba(255,255,255,0.08)",
              },

              "&.Mui-disabled": {
                color: "#6f7477",
                borderColor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>

          <Tooltip
            arrow
            title={payoutDisabledReason}
          >
            <Box
              component="span"
              sx={{
                display: "flex",
                flex: {
                  xs: 1,
                  sm: "initial",
                },
              }}
            >
              <Button
                type="button"
                onClick={() => setPayoutDialogOpen(true)}
                disabled={!canRequestPayout}
                startIcon={<PaymentsRoundedIcon />}
                sx={{
                  width: "100%",
                  minHeight: 40,
                  px: 2,
                  borderRadius: "6px",
                  color: "#ffffff",
                  backgroundColor: "#ff5500",
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 950,

                  "&:hover": {
                    backgroundColor: "#ff6a1a",
                  },

                  "&.Mui-disabled": {
                    color: "#777777",
                    backgroundColor: "#252728",
                  },
                }}
              >
                Request payout
              </Button>
            </Box>
          </Tooltip>
        </Stack>
      </Stack>

      {errorMessage && wallet && (
        <Alert
          severity="warning"
          action={
            <Button
              type="button"
              color="inherit"
              size="small"
              onClick={() => void loadWallet(true)}
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
            backgroundColor: "rgba(255,179,92,0.09)",
            border: "1px solid rgba(255,179,92,0.24)",

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
          aria-label="Loading artist wallet"
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
          <Stack alignItems="center" spacing={1.5}>
            <CircularProgress
              size={30}
              sx={{
                color: "#ff5500",
              }}
            />

            <Typography
              sx={{
                color: "#a7aaac",
                fontSize: 13,
                fontWeight: 750,
              }}
            >
              Loading artist wallet...
            </Typography>
          </Stack>
        </Box>
      ) : !wallet ? (
        <Box
          role="alert"
          sx={{
            minHeight: 230,
            px: 3,
            py: 5,
            borderRadius: 2,
            border: "1px solid rgba(255,85,0,0.2)",
            background:
              "linear-gradient(180deg, rgba(255,85,0,0.045), #151718)",
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
                fontSize: 36,
                mb: 1,
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 950,
              }}
            >
              Artist wallet is unavailable
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                maxWidth: 480,
                color: "#a7aaac",
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.55,
              }}
            >
              {errorMessage ||
                "The artist wallet could not be loaded."}
            </Typography>

            {accessToken && (
              <Button
                type="button"
                onClick={() => void loadWallet()}
                startIcon={<RefreshRoundedIcon />}
                sx={{
                  mt: 2,
                  borderRadius: "999px",
                  px: 2.5,
                  color: "#ffffff",
                  border:
                    "1px solid rgba(255,255,255,0.25)",
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 900,

                  "&:hover": {
                    borderColor: "#ff5500",
                    backgroundColor: "rgba(255,85,0,0.08)",
                  },
                }}
              >
                Try again
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.5,
            }}
          >
            {cards.map((card) => {
              const highlighted = card.key === "available";

              return (
                <Box
                  key={card.key}
                  sx={{
                    minWidth: 0,
                    minHeight: 145,
                    p: 2,
                    borderRadius: 2,
                    border: highlighted
                      ? "1px solid rgba(255,85,0,0.22)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: highlighted
                      ? "linear-gradient(145deg, rgba(255,85,0,0.17), rgba(25,27,28,0.96) 62%)"
                      : "#17191a",
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: highlighted
                        ? "#ff6a1a"
                        : "#c9ccce",
                      backgroundColor: highlighted
                        ? "rgba(255,85,0,0.14)"
                        : "rgba(255,255,255,0.06)",

                      "& svg": {
                        fontSize: 21,
                      },
                    }}
                  >
                    {card.icon}
                  </Box>

                  <Typography
                    sx={{
                      mt: 1.6,
                      color: "#ffffff",
                      fontSize: {
                        xs: 20,
                        md: 22,
                      },
                      fontWeight: 950,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {formatMoney(card.amount, currency)}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      color: "#d7d9da",
                      fontSize: 13,
                      fontWeight: 850,
                    }}
                  >
                    {card.label}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      color: "#7f8487",
                      fontSize: 11.5,
                      fontWeight: 650,
                    }}
                  >
                    {card.description}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              mt: 1.5,
              p: {
                xs: 2,
                md: 2.4,
              },
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#151718",
              display: "flex",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent: "space-between",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: 1.5,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.4}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#63e6a6",
                  backgroundColor: "rgba(99,230,166,0.1)",
                  flexShrink: 0,
                }}
              >
                <TrendingUpRoundedIcon />
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  Lifetime earnings
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color: "#85898c",
                    fontSize: 12,
                    fontWeight: 650,
                  }}
                >
                  Total qualified-stream revenue recorded for
                  this wallet
                </Typography>
              </Box>
            </Stack>

            <Typography
              sx={{
                color: "#63e6a6",
                fontSize: {
                  xs: 23,
                  md: 27,
                },
                fontWeight: 950,
              }}
            >
              {formatMoney(
                getSafeAmount(wallet.lifetimeEarnings),
                currency
              )}
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 1.2,
              color: "#717679",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Wallet status:{" "}
            <Box
              component="span"
              sx={{
                color: walletActive
                  ? "#63e6a6"
                  : "#ffb35c",
                fontWeight: 950,
              }}
            >
              {walletStatus}
            </Box>
          </Typography>

          <ArtistEarningHistory />

          <ArtistPayoutHistory />
        </>
      )}

      <ArtistPayoutDialog
        open={payoutDialogOpen}
        onClose={() => setPayoutDialogOpen(false)}
        availableBalance={availableBalance}
        currency={currency}
        minimumAmount={minimumPayoutAmount}
        onSuccess={handlePayoutSuccess}
      />
    </Box>
  );
};

export default ArtistEarningsOverview;