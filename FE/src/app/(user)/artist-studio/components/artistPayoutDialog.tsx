"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import { createArtistPayoutRequestApi } from "@/utils/api";

type Props = {
  open: boolean;
  onClose: () => void;
  availableBalance: number;
  currency?: string;
  minimumAmount?: number;
  onSuccess?: (data: ArtistPayoutActionData) => void;
};

type FormData = {
  amount: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  artistNote: string;
};

const INITIAL_FORM: FormData = {
  amount: "",
  bankCode: "",
  bankName: "",
  accountNumber: "",
  accountHolderName: "",
  artistNote: "",
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

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

const ArtistPayoutDialog = ({
  open,
  onClose,
  availableBalance,
  currency = "VND",
  minimumAmount = 100000,
  onSuccess,
}: Props) => {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: session } = useSession();

  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const accessToken = useMemo(() => getAccessToken(session), [session]);

  const normalizedAvailableBalance = Math.max(Number(availableBalance || 0), 0);

  const normalizedMinimumAmount = Math.max(Number(minimumAmount || 1), 1);

  const payoutAmount = Number(form.amount || 0);

  const accountNumber = form.accountNumber.replace(/\s+/g, "");

  const bankCode = form.bankCode.trim().toUpperCase();

  const accountHolderName = form.accountHolderName
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

  const isAmountValid =
    Number.isInteger(payoutAmount) &&
    payoutAmount >= normalizedMinimumAmount &&
    payoutAmount <= normalizedAvailableBalance;

  const isBankCodeValid = /^[A-Z0-9_-]{2,30}$/.test(bankCode);

  const isAccountNumberValid = /^[0-9]{6,30}$/.test(accountNumber);

  const isFormValid =
    Boolean(accessToken) &&
    isAmountValid &&
    isBankCodeValid &&
    Boolean(form.bankName.trim()) &&
    isAccountNumberValid &&
    Boolean(accountHolderName);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM);
      setErrorMessage("");
      setSubmitting(false);
    }
  }, [open]);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleUseFullBalance = () => {
    updateField("amount", String(Math.floor(normalizedAvailableBalance)));
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setErrorMessage("Please sign in again before requesting a payout.");
      return;
    }

    if (payoutAmount < normalizedMinimumAmount) {
      setErrorMessage(
        `Minimum payout amount is ${formatMoney(
          normalizedMinimumAmount,
          currency
        )}.`
      );
      return;
    }

    if (payoutAmount > normalizedAvailableBalance) {
      setErrorMessage("Payout amount exceeds your available balance.");
      return;
    }

    if (!isFormValid) {
      setErrorMessage("Please complete all payout information correctly.");
      return;
    }

    const payload: CreateArtistPayoutPayload = {
      amount: payoutAmount,
      bankCode,
      bankName: form.bankName.trim(),
      accountNumber,
      accountHolderName,
      artistNote: form.artistNote.trim() || undefined,
    };

    try {
      setSubmitting(true);
      setErrorMessage("");

      const response = await createArtistPayoutRequestApi(payload, accessToken);

      if (response?.statusCode !== 200 || !response?.data) {
        throw new Error(
          response?.message || "Unable to create payout request."
        );
      }

      onSuccess?.(response.data);

      setForm(INITIAL_FORM);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create payout request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          color: "#ffffff",
          backgroundColor: "#111314",
          backgroundImage: "none",
          border: {
            xs: "none",
            sm: "1px solid rgba(255,255,255,0.1)",
          },
          borderRadius: {
            xs: 0,
            sm: 2,
          },
          overflow: "hidden",
        },
      }}
    >
      {/* PAYOUT DIALOG HEADER */}
      <DialogTitle
        sx={{
          px: {
            xs: 2,
            sm: 2.5,
          },
          py: 2,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.2}
            sx={{
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: "10px",
                color: "#ff650f",
                backgroundColor: "rgba(255,85,0,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PaymentsRoundedIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h2"
                sx={{
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: 950,
                }}
              >
                Request payout
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,
                  color: "#858a8d",
                  fontSize: 11.5,
                  fontWeight: 650,
                }}
              >
                Withdraw your available artist earnings
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close payout dialog"
            sx={{
              color: "#a4a8aa",
              backgroundColor: "rgba(255,255,255,0.04)",

              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.09)",
              },

              "&.Mui-disabled": {
                color: "#55595b",
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent
          sx={{
            px: {
              xs: 2,
              sm: 2.5,
            },
            py: 2.5,
          }}
        >
          {/* AVAILABLE BALANCE */}
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(255,85,0,0.22)",
              background:
                "linear-gradient(145deg, rgba(255,85,0,0.13), rgba(255,255,255,0.025))",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" alignItems="center" spacing={1.2}>
                <AccountBalanceRoundedIcon
                  sx={{
                    color: "#ff650f",
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      color: "#a8acae",
                      fontSize: 11.5,
                      fontWeight: 750,
                    }}
                  >
                    Available balance
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,
                      color: "#ffffff",
                      fontSize: {
                        xs: 20,
                        sm: 23,
                      },
                      fontWeight: 950,
                    }}
                  >
                    {formatMoney(normalizedAvailableBalance, currency)}
                  </Typography>
                </Box>
              </Stack>

              <Button
                type="button"
                onClick={handleUseFullBalance}
                disabled={submitting || normalizedAvailableBalance <= 0}
                sx={{
                  minWidth: 0,
                  color: "#ff782f",
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 900,

                  "&:hover": {
                    backgroundColor: "rgba(255,85,0,0.1)",
                  },

                  "&.Mui-disabled": {
                    color: "#55595b",
                  },
                }}
              >
                Use full balance
              </Button>
            </Stack>
          </Box>

          {/* PAYOUT ERROR */}
          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                color: "#ffb5b5",
                backgroundColor: "rgba(255,70,70,0.1)",
                border: "1px solid rgba(255,90,90,0.22)",

                "& .MuiAlert-icon": {
                  color: "#ff7777",
                },
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {normalizedAvailableBalance < normalizedMinimumAmount && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                color: "#ffd39d",
                backgroundColor: "rgba(255,170,70,0.09)",
                border: "1px solid rgba(255,170,70,0.2)",

                "& .MuiAlert-icon": {
                  color: "#ffb057",
                },
              }}
            >
              The minimum payout is{" "}
              {formatMoney(normalizedMinimumAmount, currency)}.
            </Alert>
          )}

          <Stack spacing={2}>
            {/* PAYOUT AMOUNT */}
            <TextField
              required
              fullWidth
              type="number"
              label="Payout amount"
              value={form.amount}
              disabled={submitting}
              onChange={(event) => updateField("amount", event.target.value)}
              error={Boolean(form.amount) && !isAmountValid}
              helperText={
                form.amount && !isAmountValid
                  ? `Enter an amount between ${formatMoney(
                      normalizedMinimumAmount,
                      currency
                    )} and ${formatMoney(
                      normalizedAvailableBalance,
                      currency
                    )}.`
                  : `Minimum payout: ${formatMoney(
                      normalizedMinimumAmount,
                      currency
                    )}`
              }
              inputProps={{
                min: normalizedMinimumAmount,
                max: normalizedAvailableBalance,
                step: 1,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{currency}</InputAdornment>
                ),
              }}
              sx={textFieldSx}
            />

            {/* BANK INFORMATION */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "minmax(0, 0.7fr) minmax(0, 1.3fr)",
                },
                gap: 2,
              }}
            >
              <TextField
                required
                fullWidth
                label="Bank code"
                placeholder="VCB"
                value={form.bankCode}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "bankCode",
                    event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
                  )
                }
                inputProps={{
                  maxLength: 30,
                }}
                sx={textFieldSx}
              />

              <TextField
                required
                fullWidth
                label="Bank name"
                placeholder="Vietcombank"
                value={form.bankName}
                disabled={submitting}
                onChange={(event) =>
                  updateField("bankName", event.target.value)
                }
                inputProps={{
                  maxLength: 100,
                }}
                sx={textFieldSx}
              />
            </Box>

            <TextField
              required
              fullWidth
              label="Bank account number"
              placeholder="0123456789"
              value={form.accountNumber}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "accountNumber",
                  event.target.value.replace(/\D/g, "")
                )
              }
              inputProps={{
                inputMode: "numeric",
                maxLength: 30,
              }}
              error={Boolean(form.accountNumber) && !isAccountNumberValid}
              helperText={
                form.accountNumber && !isAccountNumberValid
                  ? "Account number must contain 6–30 digits."
                  : "Check this number carefully before submitting."
              }
              sx={textFieldSx}
            />

            <TextField
              required
              fullWidth
              label="Account holder name"
              placeholder="NGUYEN VAN A"
              value={form.accountHolderName}
              disabled={submitting}
              onChange={(event) =>
                updateField(
                  "accountHolderName",
                  event.target.value.toUpperCase()
                )
              }
              inputProps={{
                maxLength: 150,
              }}
              helperText="Use the exact name registered with the bank."
              sx={textFieldSx}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={5}
              label="Note"
              placeholder="Optional note for this payout request"
              value={form.artistNote}
              disabled={submitting}
              onChange={(event) =>
                updateField("artistNote", event.target.value)
              }
              inputProps={{
                maxLength: 500,
              }}
              helperText={`${form.artistNote.length}/500`}
              sx={textFieldSx}
            />
          </Stack>

          {/* PAYOUT NOTICE */}
          <Typography
            sx={{
              mt: 2,
              color: "#777c7f",
              fontSize: 11.5,
              lineHeight: 1.6,
            }}
          >
            The requested amount will be moved from your available balance to
            your reserved balance until the payout is completed, rejected or
            canceled.
          </Typography>
        </DialogContent>

        {/* PAYOUT ACTIONS */}
        <DialogActions
          sx={{
            px: {
              xs: 2,
              sm: 2.5,
            },
            py: 2,
            gap: 1,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#0e1011",
          }}
        >
          <Button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            sx={{
              minHeight: 42,
              px: 2.2,
              color: "#d3d6d7",
              border: "1px solid rgba(255,255,255,0.14)",
              textTransform: "none",
              fontWeight: 850,

              "&:hover": {
                color: "#ffffff",
                borderColor: "rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.05)",
              },

              "&.Mui-disabled": {
                color: "#55595b",
                borderColor: "rgba(255,255,255,0.06)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting || !isFormValid}
            startIcon={
              submitting ? (
                <CircularProgress size={16} thickness={5} color="inherit" />
              ) : (
                <PaymentsRoundedIcon />
              )
            }
            sx={{
              minHeight: 42,
              px: 2.4,
              color: "#ffffff",
              backgroundColor: "#ff5500",
              textTransform: "none",
              fontWeight: 950,

              "&:hover": {
                backgroundColor: "#ff681a",
              },

              "&.Mui-disabled": {
                color: "#777b7d",
                backgroundColor: "#252829",
              },
            }}
          >
            {submitting ? "Submitting..." : "Submit payout request"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const textFieldSx = {
  "& .MuiInputLabel-root": {
    color: "#8e9396",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#ff742c",
  },

  "& .MuiOutlinedInput-root": {
    color: "#ffffff",
    backgroundColor: "#17191a",

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.12)",
    },

    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.28)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#ff650f",
    },

    "&.Mui-disabled": {
      color: "#666b6d",
      backgroundColor: "#121415",
    },
  },

  "& .MuiInputAdornment-root": {
    color: "#969b9e",
    fontWeight: 800,
  },

  "& .MuiFormHelperText-root": {
    color: "#74797c",
    mx: 0.2,
  },

  "& .MuiFormHelperText-root.Mui-error": {
    color: "#ff8585",
  },

  "& .MuiOutlinedInput-root.Mui-error fieldset": {
    borderColor: "#ff6565",
  },
} as const;

export default ArtistPayoutDialog;
