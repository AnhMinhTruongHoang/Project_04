"use client";

import Image from "next/image";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";

interface BackendStartupLoaderProps {
  children: ReactNode;
  healthPath?: string;
  pollIntervalMs?: number;
  requestTimeoutMs?: number;
  slowStartupAfterMs?: number;
}

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const TIPS = [
  "The first startup may take a little longer while the server wakes up.",
  "Your music, playlists, memberships, and tickets are being prepared.",
  "SoundClone keeps payment and ticket verification on the server for safety.",
  "Artist Studio data will appear as soon as the backend is ready.",
  "You can keep this tab open — SoundClone will continue automatically.",
];

const STATUS_STEPS = [
  {
    min: 0,
    max: 17,
    label: "Connecting to SoundClone",
    detail: "Checking the music server...",
  },
  {
    min: 18,
    max: 37,
    label: "Waking up the server",
    detail: "Starting SoundClone services...",
  },
  {
    min: 38,
    max: 57,
    label: "Preparing your music",
    detail: "Loading tracks, artists, and playlists...",
  },
  {
    min: 58,
    max: 74,
    label: "Loading creator services",
    detail: "Preparing memberships, tickets, and Artist Studio...",
  },
  {
    min: 75,
    max: 91,
    label: "Almost ready",
    detail: "Finishing the last startup checks...",
  },
  {
    min: 92,
    max: 99,
    label: "Waiting for the server",
    detail: "SoundClone is still waking up...",
  },
  {
    min: 100,
    max: 100,
    label: "SoundClone is ready",
    detail: "Welcome back.",
  },
];

const getStatus = (progress: number) =>
  STATUS_STEPS.find((step) => progress >= step.min && progress <= step.max) ??
  STATUS_STEPS[0];

const formatElapsed = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

export default function BackendStartupLoader({
  children,
  healthPath = "/api/v1/auth/account",
  pollIntervalMs = 1500,
  requestTimeoutMs = 4500,
  slowStartupAfterMs = 20000,
}: BackendStartupLoaderProps) {
  const [isReady, setIsReady] = useState(false);

  const [isVisible, setIsVisible] = useState(true);

  const [progress, setProgress] = useState(4);

  const [attempt, setAttempt] = useState(0);

  const [tipIndex, setTipIndex] = useState(0);

  const [elapsedMs, setElapsedMs] = useState(0);

  const [isSlowStartup, setIsSlowStartup] = useState(false);

  const [manualRetryKey, setManualRetryKey] = useState(0);

  const mountedRef = useRef(true);

  const checkingRef = useRef(false);

  const startedAtRef = useRef(Date.now());

  const healthUrl = useMemo(() => {
    if (/^https?:\/\//i.test(healthPath)) {
      return healthPath;
    }

    const normalizedPath = healthPath.startsWith("/")
      ? healthPath
      : `/${healthPath}`;

    return `${BACKEND_URL}${normalizedPath}`;
  }, [healthPath]);

  const status = useMemo(() => getStatus(progress), [progress]);

  /*
   * =========================================
   * CHECK BACKEND
   * =========================================
   */
  const checkBackend = useCallback(async () => {
    if (checkingRef.current || isReady) {
      return;
    }

    checkingRef.current = true;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, requestTimeoutMs);

    try {
      setAttempt((current) => current + 1);

      /*
       * Any HTTP response means Spring Boot
       * has accepted the connection.
       *
       * 401 from /auth/account is also READY.
       */
      await fetch(healthUrl, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (!mountedRef.current) {
        return;
      }

      setProgress(100);

      setIsReady(true);

      setIsSlowStartup(false);
    } catch {
      /*
       * Connection refused / timeout / network error.
       * Continue polling.
       */
    } finally {
      window.clearTimeout(timeoutId);

      checkingRef.current = false;
    }
  }, [healthUrl, isReady, requestTimeoutMs]);

  /*
   * =========================================
   * BACKEND POLLING
   * =========================================
   */
  useEffect(() => {
    void checkBackend();

    if (isReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void checkBackend();
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [checkBackend, isReady, manualRetryKey, pollIntervalMs]);

  /*
   * =========================================
   * FAKE LOADING PROGRESS
   * =========================================
   */
  useEffect(() => {
    if (isReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return 92;
        }

        let increment = 0;

        if (current < 20) {
          increment = Math.random() * 3.2 + 1.2;
        } else if (current < 45) {
          increment = Math.random() * 2.2 + 0.8;
        } else if (current < 70) {
          increment = Math.random() * 1.5 + 0.45;
        } else if (current < 86) {
          increment = Math.random() * 0.85 + 0.2;
        } else {
          increment = Math.random() * 0.3 + 0.05;
        }

        return Math.min(92, current + increment);
      });
    }, 420);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReady]);

  /*
   * =========================================
   * ELAPSED TIME
   * =========================================
   */
  useEffect(() => {
    if (isReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;

      setElapsedMs(elapsed);

      if (elapsed >= slowStartupAfterMs) {
        setIsSlowStartup(true);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReady, slowStartupAfterMs]);

  /*
   * =========================================
   * ROTATE TIPS
   * =========================================
   */
  useEffect(() => {
    if (isReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % TIPS.length);
    }, 4300);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReady]);

  /*
   * =========================================
   * READY FADE OUT
   * =========================================
   */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current) {
        setIsVisible(false);
      }
    }, 850);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isReady]);

  /*
   * =========================================
   * CLEANUP
   * =========================================
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /*
   * =========================================
   * RETRY
   * =========================================
   */
  const handleRetry = () => {
    checkingRef.current = false;

    startedAtRef.current = Date.now();

    setElapsedMs(0);

    setIsSlowStartup(false);

    setProgress((current) => Math.min(current, 78));

    setManualRetryKey((current) => current + 1);

    void checkBackend();
  };

  return (
    <>
      {/* APP ONLY MOUNTS AFTER BACKEND IS READY */}
      {isReady ? children : null}

      {isVisible && (
        <Box
          role="status"
          aria-live="polite"
          aria-busy={!isReady}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,

            overflow: "hidden",

            color: "#FFFFFF",

            background:
              "radial-gradient(circle at 50% 0%, rgba(255,85,0,0.18) 0%, rgba(255,85,0,0.03) 32%, transparent 52%), linear-gradient(180deg, #121212 0%, #090909 48%, #050505 100%)",

            opacity: isReady ? 0 : 1,

            transition: "opacity 700ms ease",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            px: 2.5,

            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,

              opacity: 0.035,

              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",

              backgroundSize: "48px 48px",

              pointerEvents: "none",
            },
          }}
        >
          {/* TOP HUD */}
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              position: "absolute",
              top: {
                xs: 18,
                sm: 28,
              },
              left: {
                xs: 20,
                sm: 32,
              },
              right: {
                xs: 20,
                sm: 32,
              },

              color: "rgba(255,255,255,0.28)",

              fontSize: 10,
              fontWeight: 900,

              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            <Box component="span">SoundClone</Box>

            <Box component="span">Server startup</Box>
          </Stack>

          {/* GLOW */}
          <Box
            sx={{
              position: "absolute",

              width: {
                xs: 320,
                sm: 520,
              },

              height: {
                xs: 320,
                sm: 520,
              },

              borderRadius: "50%",

              bgcolor: "rgba(255,85,0,0.075)",

              filter: "blur(90px)",

              pointerEvents: "none",
            }}
          />

          {/* CONTENT */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,

              width: "100%",
              maxWidth: 680,
            }}
          >
            {/* BRAND */}
            <Stack alignItems="center" textAlign="center">
              {/* LOGO */}
              <Box
                sx={{
                  position: "relative",

                  width: {
                    xs: 92,
                    sm: 108,
                  },

                  height: {
                    xs: 92,
                    sm: 108,
                  },

                  mb: 3,

                  display: "grid",
                  placeItems: "center",

                  overflow: "hidden",

                  bgcolor: "#111111",

                  border: "1px solid rgba(255,255,255,0.10)",

                  borderRadius: "26px",

                  boxShadow: "0 0 70px rgba(255,85,0,0.22)",

                  "&::before": {
                    content: '""',

                    position: "absolute",

                    inset: -20,

                    borderRadius: "36px",

                    border: "1px solid rgba(255,85,0,0.20)",

                    animation: "soundclonePulse 2s ease-out infinite",
                  },
                }}
              >
                <Image
                  src="/images/logo/Sc.png"
                  alt="SoundClone"
                  width={84}
                  height={84}
                  priority
                  style={{
                    width: "78%",
                    height: "78%",
                    objectFit: "contain",
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",

                    right: -6,
                    bottom: -6,

                    width: 20,
                    height: 20,

                    borderRadius: "50%",

                    border: "4px solid #080808",

                    bgcolor: isReady ? "#22c55e" : "#FF5500",

                    boxShadow: isReady
                      ? "0 0 15px rgba(34,197,94,0.7)"
                      : "0 0 15px rgba(255,85,0,0.7)",
                  }}
                />
              </Box>

              <Typography
                sx={{
                  color: "#FF7833",

                  fontSize: 11,
                  fontWeight: 900,

                  textTransform: "uppercase",
                  letterSpacing: "0.36em",
                }}
              >
                SoundClone
              </Typography>

              <Typography
                component="h1"
                sx={{
                  mt: 1.3,

                  color: "#FFFFFF",

                  fontSize: {
                    xs: 30,
                    sm: 46,
                  },

                  lineHeight: 1.1,

                  fontWeight: 950,

                  letterSpacing: "-0.035em",
                }}
              >
                {status.label}

                {!isReady && (
                  <Box
                    component="span"
                    sx={{
                      color: "#FF5500",
                    }}
                  >
                    ...
                  </Box>
                )}
              </Typography>

              <Typography
                sx={{
                  maxWidth: 520,

                  mt: 1.6,

                  color: "rgba(255,255,255,0.5)",

                  fontSize: {
                    xs: 13,
                    sm: 15,
                  },

                  lineHeight: 1.6,
                }}
              >
                {status.detail}
              </Typography>
            </Stack>

            {/* PROGRESS CARD */}
            <Box
              sx={{
                mt: 4,

                p: {
                  xs: 2,
                  sm: 2.5,
                },

                bgcolor: "rgba(255,255,255,0.035)",

                border: "1px solid rgba(255,255,255,0.08)",

                borderRadius: 3,

                backdropFilter: "blur(18px)",

                boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
              }}
            >
              <Stack
                direction="row"
                alignItems="flex-end"
                justifyContent="space-between"
                spacing={2}
                sx={{
                  mb: 1.4,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.32)",

                      fontSize: 10,
                      fontWeight: 900,

                      textTransform: "uppercase",
                      letterSpacing: "0.22em",
                    }}
                  >
                    Loading
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,

                      color: "rgba(255,255,255,0.55)",

                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {isReady
                      ? "Server connection established"
                      : `Connection attempt ${Math.max(attempt, 1)}`}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: {
                      xs: 26,
                      sm: 32,
                    },

                    fontFamily: "monospace",

                    fontWeight: 950,
                    lineHeight: 1,
                  }}
                >
                  {Math.round(progress)}

                  <Box
                    component="span"
                    sx={{
                      ml: 0.25,

                      color: "#FF5500",

                      fontSize: 14,
                    }}
                  >
                    %
                  </Box>
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, progress))}
                sx={{
                  height: 9,

                  borderRadius: 99,

                  bgcolor: "rgba(255,255,255,0.07)",

                  "& .MuiLinearProgress-bar": {
                    borderRadius: 99,

                    background:
                      "linear-gradient(90deg, #ff3d00 0%, #ff5500 52%, #ff8a4c 100%)",

                    boxShadow: "0 0 22px rgba(255,85,0,0.55)",

                    transition: "transform 500ms ease",
                  },
                }}
              />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  mt: 1.4,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 6,

                      borderRadius: "50%",

                      bgcolor: isReady ? "#22c55e" : "#FF5500",

                      boxShadow: isReady
                        ? "0 0 10px #22c55e"
                        : "0 0 10px #FF5500",
                    }}
                  />

                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.35)",

                      fontSize: 11,
                    }}
                  >
                    {isReady ? "Backend online" : "Waiting for backend"}
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.35)",

                    fontFamily: "monospace",

                    fontSize: 11,
                  }}
                >
                  Elapsed {formatElapsed(elapsedMs)}
                </Typography>
              </Stack>
            </Box>

            {/* TIP */}
            <Box
              sx={{
                mt: 2,

                minHeight: 74,

                p: 2,

                bgcolor: "rgba(0,0,0,0.20)",

                border: "1px solid rgba(255,255,255,0.06)",

                borderRadius: 3,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 28,
                    height: 28,

                    flexShrink: 0,

                    display: "grid",
                    placeItems: "center",

                    color: "#FF6D24",

                    bgcolor: "rgba(255,85,0,0.10)",

                    border: "1px solid rgba(255,85,0,0.25)",

                    borderRadius: 1.5,

                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  i
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#FF7833",

                      fontSize: 10,
                      fontWeight: 900,

                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                    }}
                  >
                    Loading tip
                  </Typography>

                  <Typography
                    key={tipIndex}
                    sx={{
                      mt: 0.5,

                      color: "rgba(255,255,255,0.45)",

                      fontSize: {
                        xs: 12,
                        sm: 13,
                      },

                      lineHeight: 1.55,

                      animation: "soundcloneTipFade 450ms ease-out",
                    }}
                  >
                    {TIPS[tipIndex]}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* SLOW STARTUP */}
            {isSlowStartup && !isReady && (
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
                  mt: 2,

                  p: 2,

                  bgcolor: "rgba(245,158,11,0.07)",

                  border: "1px solid rgba(245,158,11,0.20)",

                  borderRadius: 3,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#FBBF24",

                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    The server is taking longer than usual.
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,

                      color: "rgba(255,255,255,0.40)",

                      fontSize: 12,

                      lineHeight: 1.5,
                    }}
                  >
                    SoundClone is still checking automatically. You can also
                    retry the connection now.
                  </Typography>
                </Box>

                <Button
                  onClick={handleRetry}
                  sx={{
                    flexShrink: 0,

                    minHeight: 38,

                    px: 2,

                    color: "#FFFFFF",

                    bgcolor: "rgba(255,255,255,0.07)",

                    border: "1px solid rgba(255,255,255,0.10)",

                    borderRadius: 2,

                    fontSize: 12,
                    fontWeight: 850,

                    textTransform: "none",

                    "&:hover": {
                      color: "#FF7833",

                      bgcolor: "rgba(255,85,0,0.10)",

                      borderColor: "rgba(255,85,0,0.40)",
                    },
                  }}
                >
                  Retry connection
                </Button>
              </Stack>
            )}

            <Typography
              sx={{
                mt: 3,

                color: "rgba(255,255,255,0.18)",

                fontSize: 10,
                fontWeight: 700,

                textAlign: "center",

                textTransform: "uppercase",

                letterSpacing: "0.18em",
              }}
            >
              Please keep this page open
            </Typography>
          </Box>

          <style jsx global>{`
            @keyframes soundclonePulse {
              0% {
                opacity: 0.8;
                transform: scale(0.92);
              }

              100% {
                opacity: 0;
                transform: scale(1.22);
              }
            }

            @keyframes soundcloneTipFade {
              from {
                opacity: 0;
                transform: translateY(4px);
              }

              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </Box>
      )}
    </>
  );
}
