"use client";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { completeTestPaymentApi } from "@/utils/api";
import { useToast } from "@/utils/toast";
import { useSession } from "next-auth/react";

const TestTicketPaymentDialog = ({
  open,
  orderCode,
  accessToken,
  onClose,
}: ITestTicketPaymentDialogProps) => {
  const router = useRouter();
  const toast = useToast();

  const [testCode, setTestCode] = useState("SC_TEST_SUCCESS_123456");

  const [processing, setProcessing] = useState(false);

  const { data: session } = useSession();

  const currentUserId =
    (session?.user as any)?.id || (session?.user as any)?._id || "";

  const handlePayment = async () => {
    if (!orderCode.trim()) {
      toast.error("Payment order is missing.");
      return;
    }

    if (!testCode.trim()) {
      toast.error("Please enter a test payment code.");
      return;
    }

    if (processing) return;

    try {
      setProcessing(true);

      const response = await completeTestPaymentApi(
        {
          orderCode,
          testCode: testCode.trim(),
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to process test payment.");
      }

      toast.success("Test payment processed successfully.");
      onClose();

      /* REDIRECT TO BUYER TICKET COLLECTION */
      if (!currentUserId) {
        toast.error("Unable to determine your profile.");
        router.push("/");
        return;
      }

      router.push(`/profile/${encodeURIComponent(currentUserId)}?tab=Tickets`);
    } catch (error) {
      console.error("TEST PAYMENT ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to process test payment."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!processing) {
          onClose();
        }
      }}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: "#101010",
          backgroundImage: "none",

          color: "#FFFFFF",

          border: "1px solid rgba(255,255,255,0.12)",

          borderRadius: 3,
        },
      }}
    >
      {/* TEST PAYMENT HEADER */}
      <DialogTitle>
        <Stack alignItems="center" spacing={1} textAlign="center">
          <Box
            sx={{
              width: 48,
              height: 48,

              display: "grid",
              placeItems: "center",

              color: "#FF6A1A",

              bgcolor: "rgba(255,85,0,0.12)",

              borderRadius: 2,
            }}
          >
            <ScienceRoundedIcon />
          </Box>

          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: 950,
            }}
          >
            Test Payment
          </Typography>

          <Typography
            sx={{
              color: "#777777",
              fontSize: 11,
            }}
          >
            Development mode only
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {/* TEST CARD */}
          <Box
            sx={{
              p: 2,

              minHeight: 150,

              background: "linear-gradient(135deg, #2A160C, #111111)",

              border: "1px solid rgba(255,85,0,0.28)",

              borderRadius: 2.5,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                SOUNDCLONE TEST
              </Typography>

              <CreditCardRoundedIcon
                sx={{
                  color: "#FF6A1A",
                }}
              />
            </Stack>

            <Typography
              sx={{
                mt: 4,

                color: "#FFFFFF",

                fontSize: 13,

                fontFamily: "monospace",

                wordBreak: "break-all",
              }}
            >
              {orderCode || "SCT••••••••"}
            </Typography>

            <Typography
              sx={{
                mt: 1,

                color: "#777777",

                fontSize: 10,
              }}
            >
              TEST TRANSACTION
            </Typography>
          </Box>

          {/* TEST CODE */}
          <TextField
            fullWidth
            value={testCode}
            disabled={processing}
            label="Test code"
            onChange={(event) => {
              setTestCode(event.target.value);
            }}
            sx={{
              "& .MuiInputLabel-root": {
                color: "#888888",
              },

              "& .MuiOutlinedInput-root": {
                color: "#FFFFFF",

                bgcolor: "#171717",

                "& fieldset": {
                  borderColor: "#383838",
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

          <Typography
            sx={{
              color: "#666666",

              fontSize: 10,
              lineHeight: 1.7,

              textAlign: "center",
            }}
          >
            SC_TEST_SUCCESS_123456 · SC_TEST_FAILED_123456 ·
            SC_TEST_CANCEL_123456 · SC_TEST_EXPIRED_123456
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,

          justifyContent: "center",

          gap: 1,
        }}
      >
        <Button
          disabled={processing}
          onClick={onClose}
          sx={{
            color: "#FFFFFF",

            bgcolor: "#252525",

            textTransform: "none",
            fontWeight: 850,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={processing}
          onClick={() => {
            void handlePayment();
          }}
          startIcon={
            processing ? (
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
            color: "#FFFFFF",

            bgcolor: "#FF5500",

            boxShadow: "none",

            textTransform: "none",
            fontWeight: 900,

            "&:hover": {
              bgcolor: "#FF6A1A",
              boxShadow: "none",
            },
          }}
        >
          {processing ? "Processing..." : "Complete test payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestTicketPaymentDialog;
