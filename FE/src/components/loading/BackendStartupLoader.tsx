// components/loading/BackendStartupLoader.tsx
"use client";

import React, { useEffect, useState } from "react";

const BACKEND_HEALTH_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/health`
  : "/api/health"; // fallback: bạn có thể tạo API route proxy

export default function BackendStartupLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    const check = async () => {
      try {
        // no-store để không dùng cache và to avoid Next.js caching
        const res = await fetch(BACKEND_HEALTH_URL, { cache: "no-store" });
        if (!mounted) return;
        if (res.ok) {
          setReady(true);
          setError(null);
        } else {
          setError(`Status ${res.status}`);
          scheduleRetry();
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Network error");
        scheduleRetry();
      }
    };

    function scheduleRetry() {
      setAttempts((a) => {
        const next = a + 1;
        const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(next, 6))); // exp backoff up to 30s
        timer = window.setTimeout(check, delay);
        return next;
      });
    }

    // start immediately
    check();

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ marginBottom: 12 }}>
            {/* Simple spinner */}
            <svg width="48" height="48" viewBox="0 0 50 50" aria-hidden>
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="#bbb"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 25 25"
                  to="360 25 25"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            Waking up backend...
          </div>
          <div style={{ marginTop: 8, opacity: 0.85 }}>
            The server may take a few seconds.{" "}
            {error ? `Last error: ${error}` : "Please wait..."}
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              onClick={async () => {
                // manual wake: fire a request to wake endpoint and reset attempts
                try {
                  setError(null);
                  setAttempts(0);
                  await fetch(BACKEND_HEALTH_URL, { cache: "no-store" });
                } catch (e: any) {
                  setError(e?.message || "Network error");
                }
              }}
              style={{
                background: "#1db954",
                color: "#000",
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              Retry now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
