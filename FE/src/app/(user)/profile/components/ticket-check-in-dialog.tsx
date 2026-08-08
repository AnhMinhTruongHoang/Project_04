"use client";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";

import { useEffect, useRef, useState } from "react";

import { checkInTicketApi } from "@/utils/api";
import { useToast } from "@/utils/toast";
import QrScanner from "qr-scanner";

const TicketCheckInDialog = ({
  open,
  accessToken,
  onClose,
}: ITicketCheckInDialogProps) => {
  const toast = useToast();

  const [qrToken, setQrToken] = useState("");

  const [checking, setChecking] = useState(false);

  const [checkedTicket, setCheckedTicket] = useState<IUserEventTicket | null>(
    null
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const scannerRef = useRef<QrScanner | null>(null);

  const [cameraActive, setCameraActive] = useState(false);

  const [cameraStarting, setCameraStarting] = useState(false);

  /*
   * =========================
   * RESET DIALOG
   * =========================
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setQrToken("");
    setCheckedTicket(null);
    setChecking(false);
  }, [open]);

  /*
   * =========================
   * STOP CAMERA
   * =========================
   */
  const stopCamera = () => {
    const scanner = scannerRef.current;

    if (scanner) {
      scanner.stop();
      scanner.destroy();

      scannerRef.current = null;
    }

    setCameraActive(false);
    setCameraStarting(false);
  };

  /*
   * =========================
   * CAMERA CLEANUP
   * =========================
   */
  useEffect(() => {
    if (!open) {
      stopCamera();
    }

    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        scanner.stop();
        scanner.destroy();

        scannerRef.current = null;
      }
    };
  }, [open]);

  /*
   * =========================
   * START CAMERA
   * =========================
   */
  const startCamera = async () => {
    if (cameraStarting || cameraActive || !videoRef.current) {
      return;
    }

    try {
      setCameraStarting(true);
      setCheckedTicket(null);

      const hasCamera = await QrScanner.hasCamera();

      if (!hasCamera) {
        toast.error("No camera was detected on this device.");

        return;
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          const scannedValue = result.data?.trim();

          if (!scannedValue) {
            return;
          }

          setQrToken(scannedValue);

          scanner.stop();

          setCameraActive(false);

          toast.success("QR code scanned successfully.");
        },
        {
          preferredCamera: "environment",

          maxScansPerSecond: 10,

          highlightScanRegion: true,

          highlightCodeOutline: true,

          returnDetailedScanResult: true,
        }
      );

      scannerRef.current = scanner;

      await scanner.start();

      setCameraActive(true);
    } catch (error) {
      console.error("Cannot start QR camera:", error);

      scannerRef.current?.destroy();
      scannerRef.current = null;

      setCameraActive(false);

      toast.error(
        "Unable to access the camera. Please check camera permission."
      );
    } finally {
      setCameraStarting(false);
    }
  };

  /*
   * =========================
   * CHECK IN TICKET
   * =========================
   */
  const handleCheckIn = async () => {
    if (!accessToken) {
      toast.error("Please sign in again.");
      return;
    }

    const normalizedToken = qrToken.trim();

    if (!normalizedToken) {
      toast.error("Please enter a ticket QR token.");
      return;
    }

    if (checking) {
      return;
    }

    try {
      setChecking(true);
      setCheckedTicket(null);

      const response = await checkInTicketApi(
        {
          qrToken: normalizedToken,
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to check in this ticket.");
      }

      setCheckedTicket(response.data);

      toast.success("Ticket checked in successfully.");
    } catch (error) {
      console.error("Cannot check in ticket:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to check in this ticket."
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!checking) {
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

          border: "1px solid rgba(255,255,255,0.10)",

          borderRadius: 3,

          boxShadow: "0 30px 100px rgba(0,0,0,0.78)",
        },
      }}
    >
      {/* CHECK-IN HEADER */}
      <DialogTitle
        sx={{
          p: 0,

          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{
            minHeight: 70,
            px: 2.5,
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,

                display: "grid",
                placeItems: "center",

                color: "#FF6A1A",

                bgcolor: "rgba(255,85,0,0.12)",

                borderRadius: 2,
              }}
            >
              <QrCodeScannerRoundedIcon />
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: 19,
                  fontWeight: 900,
                }}
              >
                Ticket check-in
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,

                  color: "#777777",

                  fontSize: 11,
                }}
              >
                Verify a guest ticket
              </Typography>
            </Box>
          </Stack>

          <IconButton
            disabled={checking}
            onClick={onClose}
            sx={{
              color: "#999999",

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

      <DialogContent
        sx={{
          pt: "24px !important",
        }}
      >
        <Stack spacing={2}>
          {/* CAMERA QR SCANNER */}
          <Box
            sx={{
              position: "relative",

              overflow: "hidden",

              bgcolor: "#050505",

              border: "1px solid #303030",

              borderRadius: 2.5,
            }}
          >
            <Box
              component="video"
              ref={videoRef}
              muted
              playsInline
              sx={{
                width: "100%",
                height: {
                  xs: 250,
                  sm: 290,
                },

                display: cameraActive ? "block" : "none",

                objectFit: "cover",
              }}
            />

            {!cameraActive && (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1.5}
                sx={{
                  minHeight: {
                    xs: 220,
                    sm: 250,
                  },

                  px: 2,

                  textAlign: "center",
                }}
              >
                <QrCodeScannerRoundedIcon
                  sx={{
                    color: "#666666",
                    fontSize: 48,
                  }}
                />

                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  Scan ticket QR
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 290,

                    color: "#777777",

                    fontSize: 11,
                    lineHeight: 1.6,
                  }}
                >
                  Use the rear camera to scan the guest&apos;s ticket.
                </Typography>

                <Button
                  variant="contained"
                  disabled={cameraStarting}
                  onClick={() => {
                    void startCamera();
                  }}
                  startIcon={
                    cameraStarting ? (
                      <CircularProgress
                        size={15}
                        thickness={5}
                        sx={{
                          color: "inherit",
                        }}
                      />
                    ) : (
                      <QrCodeScannerRoundedIcon />
                    )
                  }
                  sx={{
                    minHeight: 40,

                    color: "#FFFFFF",
                    bgcolor: "#FF5500",

                    borderRadius: 2,

                    textTransform: "none",
                    fontWeight: 900,

                    boxShadow: "none",

                    "&:hover": {
                      bgcolor: "#FF6A1A",
                      boxShadow: "none",
                    },

                    "&.Mui-disabled": {
                      color: "#777777",
                      bgcolor: "#292929",
                    },
                  }}
                >
                  {cameraStarting ? "Starting camera..." : "Start camera"}
                </Button>
              </Stack>
            )}

            {/* STOP CAMERA */}
            {cameraActive && (
              <Button
                onClick={stopCamera}
                sx={{
                  position: "absolute",

                  right: 12,
                  bottom: 12,

                  color: "#FFFFFF",

                  bgcolor: "rgba(0,0,0,0.78)",

                  border: "1px solid rgba(255,255,255,0.18)",

                  textTransform: "none",
                  fontWeight: 850,

                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.92)",
                  },
                }}
              >
                Stop camera
              </Button>
            )}
          </Box>
          {/* QR TOKEN INPUT */}
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            value={qrToken}
            disabled={checking}
            placeholder="Paste or scan the ticket QR token"
            onChange={(event) => {
              setQrToken(event.target.value);

              if (checkedTicket) {
                setCheckedTicket(null);
              }
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#FFFFFF",

                bgcolor: "#171717",

                borderRadius: 2,

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

              fontSize: 11,
              lineHeight: 1.6,
            }}
          >
            Scan the QR code from the guest's ticket or paste the ticket token
            here.
          </Typography>

          {/* CHECK-IN SUCCESS */}
          {checkedTicket && (
            <Box
              sx={{
                p: 1.75,

                bgcolor: "rgba(34,197,94,0.08)",

                border: "1px solid rgba(34,197,94,0.24)",

                borderRadius: 2.5,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleRoundedIcon
                  sx={{
                    color: "#63e6a6",
                  }}
                />

                <Typography
                  sx={{
                    color: "#63e6a6",

                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  Check-in successful
                </Typography>
              </Stack>

              <Stack
                spacing={0.65}
                sx={{
                  mt: 1.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#666666",

                      fontSize: 10,
                    }}
                  >
                    Event
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,

                      color: "#FFFFFF",

                      fontSize: 13,
                      fontWeight: 850,
                    }}
                  >
                    {checkedTicket.eventName}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#666666",

                      fontSize: 10,
                    }}
                  >
                    Ticket
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,

                      color: "#CFCFCF",

                      fontSize: 11,

                      fontFamily: "monospace",
                    }}
                  >
                    {checkedTicket.ticketCode}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#666666",

                      fontSize: 10,
                    }}
                  >
                    Status
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,

                      color: "#7EB6FF",

                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {checkedTicket.status}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          pb: 2.5,
        }}
      >
        {/* SCAN NEXT */}
        {checkedTicket && (
          <Button
            disabled={checking}
            onClick={() => {
              setQrToken("");
              setCheckedTicket(null);

              void startCamera();
            }}
            sx={{
              color: "#B0B0B0",

              textTransform: "none",
              fontWeight: 800,

              "&:hover": {
                color: "#FFFFFF",
                bgcolor: "#242424",
              },
            }}
          >
            Scan next
          </Button>
        )}

        {/* CHECK IN */}
        <Button
          variant="contained"
          disabled={checking || !qrToken.trim()}
          onClick={() => {
            void handleCheckIn();
          }}
          startIcon={
            checking ? (
              <CircularProgress
                size={16}
                thickness={5}
                sx={{
                  color: "inherit",
                }}
              />
            ) : (
              <QrCodeScannerRoundedIcon />
            )
          }
          sx={{
            minHeight: 42,
            px: 2.25,

            color: "#FFFFFF",

            bgcolor: "#FF5500",

            borderRadius: 2,

            boxShadow: "none",

            textTransform: "none",
            fontWeight: 900,

            "&:hover": {
              bgcolor: "#FF6A1A",
              boxShadow: "none",
            },

            "&.Mui-disabled": {
              color: "#666666",
              bgcolor: "#292929",
            },
          }}
        >
          {checking ? "Checking..." : "Check in ticket"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketCheckInDialog;
