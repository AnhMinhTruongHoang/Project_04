"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { getArtistWalletApi } from "@/utils/api";
import ArtistPayoutDialog from "./artistPayoutDialog";
import ArtistEarningHistory from "./artistEarningHistory";
import ArtistPayoutHistory from "./artistPayoutHistory";

type WalletCards = {
  key: "available" | "pending" | "reserved" | "withdrawn";
  label: string;
  description: string;
  amount: number;
  icon: ReactNode;
};

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

const ArtistEarningsOverview = () => {
  const { data: session, status: sessionStatus } = useSession();

  const [wallet, setWallet] = useState<ArtistWalletData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const accessToken = useMemo(() => getAccessToken(session), [session]);

  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

  const minimumPayoutAmount = useMemo(() => {
    const configuredAmount = Number(
      process.env.NEXT_PUBLIC_ARTIST_PAYOUT_MINIMUM_AMOUNT
    );

    return Number.isFinite(configuredAmount) && configuredAmount > 0
      ? configuredAmount
      : 100000;
  }, []);

  const loadWallet = useCallback(
    async (silent = false) => {
      if (sessionStatus === "loading") {
        return;
      }

      if (!accessToken) {
        setWallet(null);
        setLoading(false);
        setRefreshing(false);
        setErrorMessage("Please sign in to view your artist earnings.");
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

        if (response?.statusCode !== 200 || !response?.data) {
          throw new Error(response?.message || "Unable to load artist wallet.");
        }

        setWallet(response.data);
      } catch (error) {
        setWallet(null);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load artist wallet."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, sessionStatus]
  );

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const currency = wallet?.currency || "VND";

  const availableBalance = Number(wallet?.availableBalance || 0);

  const cards = useMemo<WalletCards[]>(
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
        amount: Number(wallet?.pendingBalance || 0),
        icon: <ScheduleRoundedIcon />,
      },
      {
        key: "reserved",
        label: "Reserved balance",
        description: "Held for an active payout",
        amount: Number(wallet?.reservedBalance || 0),
        icon: <LockRoundedIcon />,
      },
      {
        key: "withdrawn",
        label: "Total withdrawn",
        description: "Completed artist payouts",
        amount: Number(wallet?.withdrawnBalance || 0),
        icon: <PaymentsRoundedIcon />,
      },
    ],
    [availableBalance, wallet]
  );

  useEffect(() => {
    const handleWalletRefresh = () => {
      void loadWallet(true);
    };

    window.addEventListener("artist-wallet-refresh", handleWalletRefresh);

    return () => {
      window.removeEventListener("artist-wallet-refresh", handleWalletRefresh);
    };
  }, [loadWallet]);

  /* PAYOUT SUCCESS */
  const handlePayoutSuccess = useCallback(
    (data: ArtistPayoutActionData) => {
      setWallet((currentWallet) => {
        if (!currentWallet) {
          return currentWallet;
        }

        return {
          ...currentWallet,
          availableBalance: Number(
            data.availableBalance ?? currentWallet.availableBalance
          ),
          reservedBalance: Number(
            data.reservedBalance ?? currentWallet.reservedBalance
          ),
          withdrawnBalance: Number(
            data.withdrawnBalance ?? currentWallet.withdrawnBalance
          ),
        };
      });

      setPayoutDialogOpen(false);

      /* REFRESH PAYOUT HISTORY */
      window.dispatchEvent(new Event("artist-payout-refresh"));

      void loadWallet(true);
    },
    [loadWallet]
  );

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* EARNINGS HEADER */}
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
            component="h2"
            sx={{
              color: "#ffffff",
              fontSize: {
                xs: 22,
                md: 26,
              },
              fontWeight: 950,
              lineHeight: 1.2,
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
            Review your earnings and available payout balance.
          </Typography>
        </Box>

        {/* DESKTOP AND MOBILE ACTIONS */}
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
            onClick={() => void loadWallet(true)}
            disabled={refreshing || sessionStatus === "loading"}
            startIcon={
              refreshing ? (
                <CircularProgress size={15} thickness={5} />
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
            Refresh
          </Button>

          <Button
            onClick={() => setPayoutDialogOpen(true)}
            disabled={
              availableBalance < minimumPayoutAmount ||
              loading ||
              wallet?.status !== "ACTIVE"
            }
            startIcon={<PaymentsRoundedIcon />}
            sx={{
              minHeight: 40,
              px: 2,
              flex: {
                xs: 1,
                sm: "initial",
              },
              borderRadius: "6px",
              color: "#ffffff",
              backgroundColor: "#ff5500",
              textTransform: "none",
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
        </Stack>
      </Stack>

      {/* WALLET ERROR */}
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

      {/* WALLET LOADING */}
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
      ) : (
        <>
          {/* WALLET BALANCE CARDS */}
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
            {cards.map((card) => (
              <Box
                key={card.key}
                sx={{
                  minWidth: 0,
                  minHeight: 145,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    card.key === "available"
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
                    color: card.key === "available" ? "#ff6a1a" : "#c9ccce",
                    backgroundColor:
                      card.key === "available"
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
            ))}
          </Box>

          {/* LIFETIME EARNINGS */}
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
            <Stack direction="row" alignItems="center" spacing={1.4}>
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
                  Total qualified-stream revenue recorded for this wallet
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
              {formatMoney(Number(wallet?.lifetimeEarnings || 0), currency)}
            </Typography>
          </Box>

          {/* WALLET STATUS */}
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
                color: wallet?.status === "ACTIVE" ? "#63e6a6" : "#ffb35c",
                fontWeight: 950,
              }}
            >
              {wallet?.status || "UNKNOWN"}
            </Box>
          </Typography>
        </>
      )}

      {/* ARTIST EARNING HISTORY */}
      {!loading && !errorMessage && <ArtistEarningHistory />}

      {/* ARTIST PAYOUT HISTORY */}
      {!loading && !errorMessage && <ArtistPayoutHistory />}

      {/* ARTIST PAYOUT DIALOG */}
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
