"use client";

import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RejectRoundedIcon from "@mui/icons-material/CancelRounded";

import {
  approveAdminArtistPayoutApi,
  markAdminArtistPayoutPaidApi,
  rejectAdminArtistPayoutApi,
} from "@/utils/api";

const INITIAL_FORM: IAdminArtistPayoutFormData = {
  adminNote: "",
  transactionReference: "",
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

const ArtistPayoutActionDialog = ({
  open,
  payout,
  accessToken,
  onClose,
  onSuccess,
}: IAdminArtistPayoutDialogProps) => {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [form, setForm] = useState<IAdminArtistPayoutFormData>(INITIAL_FORM);

  const [submittingAction, setSubmittingAction] =
    useState<AdminArtistPayoutAction | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const status = String(payout?.status || "").toUpperCase();

  const canApprove = status === "PENDING";

  const canReject = status === "PENDING" || status === "APPROVED";

  const canMarkPaid = status === "APPROVED";

  const processing = submittingAction !== null;

  const rejectionNoteValid = form.adminNote.trim().length > 0;

  const transactionReferenceValid = form.transactionReference.trim().length > 0;

  const title = useMemo(() => {
    if (!payout) {
      return "Artist payout";
    }

    return `Payout ${payout.id}`;
  }, [payout]);

  useEffect(() => {
    if (!open || !payout) {
      setForm(INITIAL_FORM);
      setSubmittingAction(null);
      setErrorMessage("");
      return;
    }

    setForm({
      adminNote: payout.adminNote || "",
      transactionReference: payout.transactionReference || "",
    });

    setSubmittingAction(null);
    setErrorMessage("");
  }, [open, payout]);

  const updateField = (
    field: keyof IAdminArtistPayoutFormData,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleClose = () => {
    if (processing) {
      return;
    }

    onClose();
  };

  const handleAction = async (action: AdminArtistPayoutAction) => {
    if (!payout || !accessToken || processing) {
      return;
    }

    if (action === "REJECT" && !rejectionNoteValid) {
      setErrorMessage("Rejection reason is required.");
      return;
    }

    if (action === "PAID" && !transactionReferenceValid) {
      setErrorMessage(
        "Transaction reference is required before marking this payout as paid."
      );
      return;
    }

    try {
      setSubmittingAction(action);
      setErrorMessage("");

      let response;

      if (action === "APPROVE") {
        response = await approveAdminArtistPayoutApi(
          payout.id,
          {
            adminNote: form.adminNote.trim() || undefined,
          },
          accessToken
        );
      } else if (action === "REJECT") {
        response = await rejectAdminArtistPayoutApi(
          payout.id,
          {
            adminNote: form.adminNote.trim(),
          },
          accessToken
        );
      } else {
        response = await markAdminArtistPayoutPaidApi(
          payout.id,
          {
            adminNote: form.adminNote.trim() || undefined,

            transactionReference: form.transactionReference.trim(),
          },
          accessToken
        );
      }

      if (
        response?.error ||
        Number(response?.statusCode) >= 400 ||
        !response?.data
      ) {
        throw new Error(
          response?.message || "Unable to process payout request."
        );
      }

      onSuccess(response.data);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to process payout request."
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
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
      {/* ADMIN PAYOUT DIALOG HEADER */}
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
                width: 42,
                height: 42,
                flexShrink: 0,

                borderRadius: "11px",

                color: "#ff650f",

                backgroundColor: "rgba(255,85,0,0.12)",

                border: "1px solid rgba(255,85,0,0.2)",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReceiptLongRoundedIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h2"
                noWrap
                sx={{
                  color: "#ffffff",
                  fontSize: {
                    xs: 16,
                    sm: 19,
                  },
                  fontWeight: 950,
                }}
              >
                {title}
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,
                  color: "#858a8d",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Review artist banking and payout information
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={handleClose}
            disabled={processing}
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

      <DialogContent
        sx={{
          px: {
            xs: 2,
            sm: 2.5,
          },

          py: 2.5,
        }}
      >
        {!payout ? (
          <Box
            sx={{
              minHeight: 240,
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
        ) : (
          <>
            {/* PAYOUT SUMMARY */}
            <Box
              sx={{
                mb: 2.5,

                p: {
                  xs: 1.8,
                  sm: 2.2,
                },

                borderRadius: 2,

                border: "1px solid rgba(255,85,0,0.2)",

                background:
                  "linear-gradient(145deg, rgba(255,85,0,0.13), rgba(255,255,255,0.025))",
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                alignItems={{
                  xs: "flex-start",
                  sm: "center",
                }}
                justifyContent="space-between"
                spacing={1.5}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#94999c",
                      fontSize: 10.5,
                      fontWeight: 850,
                      textTransform: "uppercase",
                    }}
                  >
                    Requested amount
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      color: "#63e6a6",
                      fontSize: {
                        xs: 24,
                        sm: 29,
                      },
                      fontWeight: 950,
                    }}
                  >
                    {formatMoney(payout.amount, payout.currency)}
                  </Typography>
                </Box>

                <Chip
                  label={payout.status}
                  sx={{
                    ...getStatusStyle(payout.status),

                    height: 28,
                    fontSize: 10,
                    fontWeight: 950,
                  }}
                />
              </Stack>
            </Box>

            {/* PAYOUT DETAILS */}
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0,1fr))",
                },

                gap: 1.4,
              }}
            >
              <Box sx={detailCardSx}>
                <PersonRoundedIcon sx={detailIconSx} />

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={detailLabelSx}>Account holder</Typography>

                  <Typography sx={detailValueSx}>
                    {payout.accountHolderName}
                  </Typography>
                </Box>
              </Box>

              <Box sx={detailCardSx}>
                <AccountBalanceRoundedIcon sx={detailIconSx} />

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={detailLabelSx}>Bank</Typography>

                  <Typography sx={detailValueSx}>
                    {payout.bankName} ({payout.bankCode})
                  </Typography>
                </Box>
              </Box>

              <Box sx={detailCardSx}>
                <ReceiptLongRoundedIcon sx={detailIconSx} />

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={detailLabelSx}>
                    Bank account number
                  </Typography>

                  <Typography
                    sx={{
                      ...detailValueSx,
                      fontFamily: "monospace",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {payout.accountNumber}
                  </Typography>
                </Box>
              </Box>

              <Box sx={detailCardSx}>
                <PaidRoundedIcon sx={detailIconSx} />

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={detailLabelSx}>Payout method</Typography>

                  <Typography sx={detailValueSx}>
                    {payout.payoutMethod}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* PAYOUT METADATA */}
            <Box
              sx={{
                mt: 2,
                p: 1.7,

                borderRadius: 2,

                border: "1px solid rgba(255,255,255,0.07)",

                backgroundColor: "rgba(255,255,255,0.025)",

                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))",
                },

                gap: 1.4,
              }}
            >
              <Box>
                <Typography sx={detailLabelSx}>Artist ID</Typography>

                <Typography
                  sx={{
                    ...metadataValueSx,
                    fontFamily: "monospace",
                  }}
                >
                  {payout.artistId}
                </Typography>
              </Box>

              <Box>
                <Typography sx={detailLabelSx}>Wallet ID</Typography>

                <Typography
                  sx={{
                    ...metadataValueSx,
                    fontFamily: "monospace",
                  }}
                >
                  {payout.walletId}
                </Typography>
              </Box>

              <Box>
                <Typography sx={detailLabelSx}>Requested at</Typography>

                <Typography sx={metadataValueSx}>
                  {formatDateTime(payout.requestedAt)}
                </Typography>
              </Box>

              <Box>
                <Typography sx={detailLabelSx}>Reviewed at</Typography>

                <Typography sx={metadataValueSx}>
                  {formatDateTime(payout.reviewedAt)}
                </Typography>
              </Box>

              <Box>
                <Typography sx={detailLabelSx}>Approved at</Typography>

                <Typography sx={metadataValueSx}>
                  {formatDateTime(payout.approvedAt)}
                </Typography>
              </Box>

              <Box>
                <Typography sx={detailLabelSx}>Paid at</Typography>

                <Typography sx={metadataValueSx}>
                  {formatDateTime(payout.paidAt)}
                </Typography>
              </Box>
            </Box>

            {/* EXISTING PAYOUT NOTES */}
            {(payout.artistNote ||
              payout.adminNote ||
              payout.transactionReference) && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.7,

                  borderRadius: 2,

                  border: "1px solid rgba(255,255,255,0.07)",

                  backgroundColor: "#151718",
                }}
              >
                {payout.artistNote && (
                  <Box>
                    <Typography sx={detailLabelSx}>Artist note</Typography>

                    <Typography sx={noteValueSx}>
                      {payout.artistNote}
                    </Typography>
                  </Box>
                )}

                {payout.adminNote && (
                  <Box
                    sx={{
                      mt: payout.artistNote ? 1.4 : 0,
                    }}
                  >
                    <Typography sx={detailLabelSx}>Admin note</Typography>

                    <Typography sx={noteValueSx}>{payout.adminNote}</Typography>
                  </Box>
                )}

                {payout.transactionReference && (
                  <Box
                    sx={{
                      mt: payout.artistNote || payout.adminNote ? 1.4 : 0,
                    }}
                  >
                    <Typography sx={detailLabelSx}>
                      Transaction reference
                    </Typography>

                    <Typography
                      sx={{
                        ...noteValueSx,
                        color: "#69b4ff",
                        fontFamily: "monospace",
                      }}
                    >
                      {payout.transactionReference}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Divider
              sx={{
                my: 2.5,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            />

            {/* ADMIN ACTION ERROR */}
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

            {/* ADMIN ACTION FORM */}
            {(canApprove || canReject || canMarkPaid) && (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={5}
                  label={
                    canReject ? "Admin note / rejection reason" : "Admin note"
                  }
                  value={form.adminNote}
                  disabled={processing}
                  onChange={(event) =>
                    updateField("adminNote", event.target.value)
                  }
                  inputProps={{
                    maxLength: 500,
                  }}
                  helperText={`${form.adminNote.length}/500`}
                  sx={textFieldSx}
                />

                {canMarkPaid && (
                  <TextField
                    required
                    fullWidth
                    label="Transaction reference"
                    placeholder="SC-PAYOUT-20260728-0001"
                    value={form.transactionReference}
                    disabled={processing}
                    onChange={(event) =>
                      updateField("transactionReference", event.target.value)
                    }
                    inputProps={{
                      maxLength: 100,
                    }}
                    helperText="Enter the bank transfer reference after completing the payout."
                    sx={textFieldSx}
                  />
                )}
              </Stack>
            )}

            {!canApprove && !canReject && !canMarkPaid && (
              <Alert
                severity="info"
                sx={{
                  color: "#b9dcff",

                  backgroundColor: "rgba(80,155,255,0.09)",

                  border: "1px solid rgba(80,155,255,0.22)",

                  "& .MuiAlert-icon": {
                    color: "#69b4ff",
                  },
                }}
              >
                This payout request is finalized and can only be reviewed.
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      {/* ADMIN PAYOUT ACTIONS */}
      <DialogActions
        sx={{
          px: {
            xs: 2,
            sm: 2.5,
          },

          py: 2,

          gap: 1,

          flexWrap: "wrap",

          borderTop: "1px solid rgba(255,255,255,0.08)",

          backgroundColor: "#0e1011",
        }}
      >
        <Button
          onClick={handleClose}
          disabled={processing}
          sx={{
            minHeight: 40,
            px: 2,

            color: "#d3d6d7",

            border: "1px solid rgba(255,255,255,0.14)",

            textTransform: "none",
            fontWeight: 850,

            "&:hover": {
              color: "#ffffff",

              borderColor: "rgba(255,255,255,0.3)",

              backgroundColor: "rgba(255,255,255,0.05)",
            },
          }}
        >
          Close
        </Button>

        <Box sx={{ flex: 1 }} />

        {canReject && (
          <Button
            onClick={() => void handleAction("REJECT")}
            disabled={processing || !rejectionNoteValid}
            startIcon={
              submittingAction === "REJECT" ? (
                <CircularProgress size={15} thickness={5} color="inherit" />
              ) : (
                <RejectRoundedIcon />
              )
            }
            sx={{
              minHeight: 40,
              px: 2,

              color: "#ff858c",

              border: "1px solid rgba(255,100,110,0.28)",

              backgroundColor: "rgba(255,90,100,0.06)",

              textTransform: "none",
              fontWeight: 900,

              "&:hover": {
                color: "#ffffff",

                backgroundColor: "rgba(255,90,100,0.14)",
              },

              "&.Mui-disabled": {
                color: "#666a6c",

                borderColor: "rgba(255,255,255,0.06)",
              },
            }}
          >
            {submittingAction === "REJECT" ? "Rejecting..." : "Reject payout"}
          </Button>
        )}

        {canApprove && (
          <Button
            onClick={() => void handleAction("APPROVE")}
            disabled={processing}
            startIcon={
              submittingAction === "APPROVE" ? (
                <CircularProgress size={15} thickness={5} color="inherit" />
              ) : (
                <CheckCircleRoundedIcon />
              )
            }
            sx={{
              minHeight: 40,
              px: 2.2,

              color: "#ffffff",

              backgroundColor: "#3277d5",

              textTransform: "none",
              fontWeight: 950,

              "&:hover": {
                backgroundColor: "#4189ec",
              },

              "&.Mui-disabled": {
                color: "#777b7d",
                backgroundColor: "#292b2c",
              },
            }}
          >
            {submittingAction === "APPROVE" ? "Approving..." : "Approve payout"}
          </Button>
        )}

        {canMarkPaid && (
          <Button
            onClick={() => void handleAction("PAID")}
            disabled={processing || !transactionReferenceValid}
            startIcon={
              submittingAction === "PAID" ? (
                <CircularProgress size={15} thickness={5} color="inherit" />
              ) : (
                <PaidRoundedIcon />
              )
            }
            sx={{
              minHeight: 40,
              px: 2.2,

              color: "#0d1511",

              backgroundColor: "#63e6a6",

              textTransform: "none",
              fontWeight: 950,

              "&:hover": {
                backgroundColor: "#7af0b7",
              },

              "&.Mui-disabled": {
                color: "#777b7d",
                backgroundColor: "#292b2c",
              },
            }}
          >
            {submittingAction === "PAID" ? "Processing..." : "Mark as paid"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const detailCardSx = {
  minHeight: 76,

  p: 1.5,

  borderRadius: 2,

  border: "1px solid rgba(255,255,255,0.07)",

  backgroundColor: "rgba(255,255,255,0.025)",

  display: "flex",
  alignItems: "center",

  gap: 1.2,
} as const;

const detailIconSx = {
  color: "#ff650f",
  fontSize: 22,
  flexShrink: 0,
} as const;

const detailLabelSx = {
  color: "#74797c",
  fontSize: 9.5,
  fontWeight: 850,
  textTransform: "uppercase",
} as const;

const detailValueSx = {
  mt: 0.35,
  color: "#ffffff",
  fontSize: 12.5,
  fontWeight: 850,
  overflowWrap: "anywhere",
} as const;

const metadataValueSx = {
  mt: 0.35,
  color: "#c7cacc",
  fontSize: 11,
  fontWeight: 700,
  overflowWrap: "anywhere",
} as const;

const noteValueSx = {
  mt: 0.4,
  color: "#d1d4d6",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.55,
  overflowWrap: "anywhere",
} as const;

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

  "& .MuiFormHelperText-root": {
    color: "#74797c",
    mx: 0.2,
  },
} as const;

export default ArtistPayoutActionDialog;
