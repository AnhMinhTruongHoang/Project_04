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

/*
 * ============================================================
 * SOUNDCLONE - BACKEND STARTUP LOADER
 * ============================================================
 *
 * Mục đích:
 * - Hiển thị full-screen loading khi Backend Spring Boot đang cold start.
 * - Poll Backend thật thay vì dùng progress của asset/Three.js.
 * - Progress chạy kiểu "game loading screen":
 *      0% -> ~92%: tăng giả có kiểm soát.
 *      Backend ready -> 100%.
 * - Nếu Backend khởi động quá lâu:
 *      hiển thị "Still waking up..." + nút Retry.
 *
 * Logo:
 *   FE/public/images/logo/Sc.png
 *
 * Cách dùng:
 *
 *   <BackendStartupLoader>
 *     {children}
 *   </BackendStartupLoader>
 *
 * Nên đặt ở root layout/client provider để loader bao toàn bộ app.
 *
 * LƯU Ý:
 * - NEXT_PUBLIC_BACKEND_URL ví dụ:
 *     http://localhost:8000
 * - Loader mặc định ping:
 *     /api/v1/auth/account
 *
 * Endpoint này có thể trả 401 khi chưa login.
 * 401 vẫn có nghĩa là Backend đã sống và nhận request,
 * nên loader xem BẤT KỲ HTTP response nào là "ready".
 * Chỉ network error / connection refused / timeout mới là "not ready".
 */

interface BackendStartupLoaderProps {
  children: ReactNode;

  /*
   * Nếu sau này Backend có endpoint health public riêng,
   * chỉ cần truyền:
   *
   *   healthPath="/actuator/health"
   *
   * hoặc endpoint khác.
   */
  healthPath?: string;

  /*
   * Thời gian giữa các lần ping Backend.
   */
  pollIntervalMs?: number;

  /*
   * Timeout của từng request ping.
   */
  requestTimeoutMs?: number;

  /*
   * Sau bao lâu thì đổi UI sang "Still waking up..."
   * nhưng VẪN tiếp tục poll Backend.
   */
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

function getStatus(progress: number) {
  return (
    STATUS_STEPS.find((step) => progress >= step.min && progress <= step.max) ??
    STATUS_STEPS[0]
  );
}

function formatElapsed(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

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
   * ============================================================
   * BACKEND HEALTH CHECK
   * ============================================================
   *
   * Quan trọng:
   * fetch() chỉ throw khi network fail/timeout.
   *
   * Nếu server trả:
   * 200, 400, 401, 403, 404, 409, 500...
   *
   * thì Backend đã accept connection => xem là READY.
   *
   * Loader không dùng response.ok vì /auth/account có thể trả 401
   * khi user chưa login.
   */
  const checkBackend = useCallback(async () => {
    if (checkingRef.current || isReady) {
      return;
    }

    checkingRef.current = true;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      requestTimeoutMs
    );

    try {
      setAttempt((current) => current + 1);

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

      setIsReady(true);
      setProgress(100);
      setIsSlowStartup(false);
    } catch {
      /*
       * Backend chưa nhận connection:
       * - ECONNREFUSED
       * - Failed to fetch
       * - timeout
       *
       * Không hiển thị error cứng ngay.
       * Loader tiếp tục poll.
       */
    } finally {
      window.clearTimeout(timeoutId);
      checkingRef.current = false;
    }
  }, [healthUrl, isReady, requestTimeoutMs]);

  /*
   * ============================================================
   * INITIAL + REPEATED BACKEND POLLING
   * ============================================================
   */
  useEffect(() => {
    void checkBackend();

    if (isReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void checkBackend();
    }, pollIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [checkBackend, isReady, manualRetryKey, pollIntervalMs]);

  /*
   * ============================================================
   * GAME-LIKE FAKE PROGRESS
   * ============================================================
   *
   * Không bao giờ fake lên 100%.
   * Backend chưa ready => progress tối đa 92%.
   *
   * Càng gần 92% càng tăng chậm để tạo cảm giác tự nhiên.
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

    return () => window.clearInterval(intervalId);
  }, [isReady]);

  /*
   * ============================================================
   * ELAPSED TIME + SLOW STARTUP STATE
   * ============================================================
   */
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;

      setElapsedMs(elapsed);

      if (!isReady && elapsed >= slowStartupAfterMs) {
        setIsSlowStartup(true);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isReady, slowStartupAfterMs]);

  /*
   * ============================================================
   * ROTATING GAME TIPS
   * ============================================================
   */
  useEffect(() => {
    if (isReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % TIPS.length);
    }, 4300);

    return () => window.clearInterval(intervalId);
  }, [isReady]);

  /*
   * ============================================================
   * READY TRANSITION
   * ============================================================
   */
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (mountedRef.current) {
        setIsVisible(false);
      }
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [isReady]);

  /*
   * ============================================================
   * MOUNT CLEANUP
   * ============================================================
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /*
   * ============================================================
   * MANUAL RETRY
   * ============================================================
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
      {children}

      {isVisible && (
        <div
          role="status"
          aria-live="polite"
          aria-busy={!isReady}
          className={[
            "fixed inset-0 z-[99999] overflow-hidden",
            "bg-[#080808] text-white",
            "transition-opacity duration-700",
            isReady ? "opacity-0" : "opacity-100",
          ].join(" ")}
        >
          {/* BACKGROUND */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,85,0,0.20),transparent_38%),radial-gradient(circle_at_10%_90%,rgba(255,85,0,0.08),transparent_28%),linear-gradient(180deg,#111111_0%,#090909_48%,#050505_100%)]" />

          {/* GRID / GAME HUD TEXTURE */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.75) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.75) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* ORANGE AMBIENT GLOW */}
          <div className="absolute left-1/2 top-[38%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff5500]/10 blur-[90px] sm:h-[520px] sm:w-[520px]" />

          {/* TOP HUD */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-5 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 sm:px-8 sm:py-7">
            <span>SoundClone</span>

            <span>Server startup</span>
          </div>

          {/* MAIN CONTENT */}
          <main className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-20">
            <div className="w-full max-w-[680px]">
              {/* LOGO */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-7">
                  {/* OUTER PULSE */}
                  <div className="absolute inset-[-20px] animate-ping rounded-[34px] border border-[#ff5500]/15 [animation-duration:2.4s]" />

                  {/* LOGO CARD */}
                  <div className="relative flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-[26px] border border-white/10 bg-[#111] shadow-[0_0_65px_rgba(255,85,0,0.22)] sm:h-[108px] sm:w-[108px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,85,0,0.20),transparent_65%)]" />

                    <Image
                      src="/images/logo/Sc.png"
                      alt="SoundClone"
                      width={84}
                      height={84}
                      priority
                      className="relative z-10 h-[72px] w-[72px] object-contain sm:h-[84px] sm:w-[84px]"
                    />
                  </div>

                  {/* ONLINE DOT */}
                  <span
                    className={[
                      "absolute -bottom-2 -right-2 h-5 w-5 rounded-full border-4 border-[#080808]",
                      isReady ? "bg-[#22c55e]" : "animate-pulse bg-[#ff5500]",
                    ].join(" ")}
                  />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#ff7833] sm:text-xs">
                  SoundClone
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-white sm:text-5xl">
                  {status.label}
                  {!isReady && (
                    <span className="ml-1 inline-flex w-8 justify-start text-[#ff5500]">
                      <span className="animate-pulse">...</span>
                    </span>
                  )}
                </h1>

                <p className="mt-4 max-w-[520px] text-sm leading-6 text-white/50 sm:text-base">
                  {status.detail}
                </p>
              </div>

              {/* PROGRESS PANEL */}
              <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
                {/* PROGRESS LABEL */}
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                      Loading
                    </p>

                    <p className="mt-1 text-xs font-medium text-white/55">
                      {isReady
                        ? "Server connection established"
                        : `Connection attempt ${Math.max(attempt, 1)}`}
                    </p>
                  </div>

                  <div className="font-mono text-2xl font-black tabular-nums text-white sm:text-3xl">
                    {Math.round(progress)}
                    <span className="ml-0.5 text-sm text-[#ff5500]">%</span>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#ff3d00_0%,#ff5500_52%,#ff8a4c_100%)] shadow-[0_0_22px_rgba(255,85,0,0.55)] transition-[width] duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, Math.max(0, progress))}%`,
                    }}
                  />

                  {!isReady && (
                    <div className="absolute inset-y-0 left-0 w-1/3 animate-[soundcloneLoaderSweep_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  )}
                </div>

                {/* MICRO STATUS */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/35">
                  <span className="flex items-center gap-2">
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full",
                        isReady ? "bg-[#22c55e]" : "animate-pulse bg-[#ff5500]",
                      ].join(" ")}
                    />

                    {isReady ? "Backend online" : "Waiting for backend"}
                  </span>

                  <span className="font-mono tabular-nums">
                    Elapsed {formatElapsed(elapsedMs)}
                  </span>
                </div>
              </div>

              {/* GAME TIP */}
              <div className="mt-5 min-h-[74px] rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4 sm:px-5">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#ff5500]/25 bg-[#ff5500]/10 text-xs font-black text-[#ff6d24]">
                    i
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff7833]">
                      Loading tip
                    </p>

                    <p
                      key={tipIndex}
                      className="mt-1 animate-[soundcloneTipFade_450ms_ease-out] text-xs leading-5 text-white/45 sm:text-sm"
                    >
                      {TIPS[tipIndex]}
                    </p>
                  </div>
                </div>
              </div>

              {/* SLOW STARTUP */}
              {isSlowStartup && !isReady && (
                <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#f59e0b]/20 bg-[#f59e0b]/[0.07] px-4 py-4 text-center sm:flex-row sm:text-left">
                  <div>
                    <p className="text-sm font-bold text-[#fbbf24]">
                      The server is taking longer than usual.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      SoundClone is still checking automatically. You can also
                      retry the connection now.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRetry}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-bold text-white transition hover:border-[#ff5500]/40 hover:bg-[#ff5500]/10 hover:text-[#ff7833] active:scale-[0.98]"
                  >
                    Retry connection
                  </button>
                </div>
              )}

              {/* FOOTER MESSAGE */}
              <p className="mt-7 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-white/20 sm:text-[11px]">
                Please keep this page open
              </p>
            </div>
          </main>

          {/* LOCAL KEYFRAMES */}
          <style jsx global>{`
            @keyframes soundcloneLoaderSweep {
              0% {
                transform: translateX(-150%);
                opacity: 0;
              }

              35% {
                opacity: 1;
              }

              100% {
                transform: translateX(420%);
                opacity: 0;
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

            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important;
                transition-duration: 0.01ms !important;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
