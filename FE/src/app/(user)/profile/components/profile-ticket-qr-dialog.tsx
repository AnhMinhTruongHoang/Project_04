"use client";

import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";

import { useEffect, useState } from "react";

import { getMyTicketQrApi } from "@/utils/api";
import { useToast } from "@/utils/toast";
import { QRCodeSVG } from "qrcode.react";

const ProfileTicketQrDialog = ({
  open,
  ticket,
  accessToken,
  onClose,
}: IProfileTicketQrDialogProps) => {
  const toast = useToast();

  const [qrData, setQrData] = useState<IUserEventTicketQr | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !ticket || !accessToken) {
      setQrData(null);
      return;
    }

    let cancelled = false;

    const loadQr = async () => {
      try {
        setLoading(true);
        setQrData(null);

        const response = await getMyTicketQrApi(ticket.id, accessToken);

        if (!cancelled && response?.data) {
          setQrData(response.data);
        }
      } catch (error) {
        console.error("Cannot load ticket QR:", error);

        if (!cancelled) {
          toast.error("Unable to load the ticket QR.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadQr();

    return () => {
      cancelled = true;
    };
  }, [accessToken, open, ticket, toast]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: "#111111",
          backgroundImage: "none",

          color: "#FFFFFF",

          border: "1px solid #303030",

          borderRadius: 3,

          boxShadow: "0 30px 100px rgba(0,0,0,0.75)",
        },
      }}
    >
      {/* QR HEADER */}
      <DialogTitle>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <QrCode2RoundedIcon
              sx={{
                color: "#FF5500",
              }}
            />

            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              Event ticket
            </Typography>
          </Stack>

          <IconButton
            onClick={onClose}
            sx={{
              color: "#A0A0A0",

              "&:hover": {
                color: "#FFFFFF",
                bgcolor: "#242424",
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {loading ? (
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
                fontSize: 12,
              }}
            >
              Loading ticket QR...
            </Typography>
          </Stack>
        ) : qrData && ticket ? (
          <Stack spacing={2} alignItems="center">
            {/* TICKET QR CODE */}
            <Box
              sx={{
                width: {
                  xs: 230,
                  sm: 260,
                },

                height: {
                  xs: 230,
                  sm: 260,
                },

                p: {
                  xs: 1.5,
                  sm: 2,
                },

                display: "grid",
                placeItems: "center",

                bgcolor: "#FFFFFF",

                borderRadius: 2,
              }}
            >
              <QRCodeSVG
                value={qrData.qrValue}
                size={220}
                level="M"
                marginSize={2}
                title={`${qrData.eventName} - ${qrData.ticketCode}`}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: 17,
                  fontWeight: 900,
                }}
              >
                {qrData.eventName}
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  color: "#8D8D8D",

                  fontSize: 11,

                  fontFamily: "monospace",
                }}
              >
                {qrData.ticketCode}
              </Typography>

              <Typography
                sx={{
                  mt: 1,

                  color:
                    ticket.status === "VALID"
                      ? "#63e6a6"
                      : ticket.status === "USED"
                      ? "#7EB6FF"
                      : "#ff7b7b",

                  fontSize: 12,
                  fontWeight: 900,

                  textTransform: "uppercase",
                }}
              >
                {ticket.status}
              </Typography>

              {/* USED TICKET NOTICE */}
              {ticket.status === "USED" && (
                <Typography
                  sx={{
                    px: 1.5,
                    py: 1,

                    width: "100%",

                    color: "#7EB6FF",
                    bgcolor: "rgba(59,130,246,0.08)",

                    border: "1px solid rgba(59,130,246,0.20)",
                    borderRadius: 2,

                    fontSize: 11,
                    fontWeight: 800,

                    textAlign: "center",
                  }}
                >
                  This ticket has already been checked in.
                </Typography>
              )}

              {/* TICKET SCAN INSTRUCTION */}
              <Typography
                sx={{
                  maxWidth: 280,

                  color: "#777777",

                  fontSize: 11,
                  lineHeight: 1.6,

                  textAlign: "center",
                }}
              >
                Present this QR code at the event entrance for verification.
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Typography
            sx={{
              py: 5,

              color: "#777777",

              textAlign: "center",
              fontSize: 13,
            }}
          >
            Ticket QR is unavailable.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileTicketQrDialog;
