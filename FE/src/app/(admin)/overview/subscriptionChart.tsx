"use client";

import * as React from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";

import { useSession } from "next-auth/react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SubscriptionPeriod = "weekly" | "monthly" | "yearly";

type SubscriptionPoint = {
  label: string;
  artist: number;
  artistPro: number;
};

type SubscriptionTotals = {
  artist: number;
  artistPro: number;
};

type SubscriptionInsight = {
  period: SubscriptionPeriod;
  points: SubscriptionPoint[];
  totals: SubscriptionTotals;
};

const EMPTY_INSIGHT: SubscriptionInsight = {
  period: "monthly",
  points: [],
  totals: {
    artist: 0,
    artistPro: 0,
  },
};

const getAccessToken = (session: any) => {
  return (
    session?.access_token ||
    session?.accessToken ||
    session?.user?.access_token ||
    ""
  );
};

const normalizeSubscriptionResponse = (
  json: any,
  period: SubscriptionPeriod,
): SubscriptionInsight => {
  const payload = json?.data || json;

  const points = Array.isArray(payload?.points)
    ? payload.points.map((item: any) => ({
        label: item?.label || item?.week || item?.month || item?.year || "",

        artist: Number(item?.artist ?? item?.ARTIST ?? 0),

        artistPro: Number(
          item?.artistPro ?? item?.artist_pro ?? item?.ARTIST_PRO ?? 0,
        ),
      }))
    : [];

  return {
    period: payload?.period || period,

    points,

    totals: {
      artist: Number(payload?.totals?.artist ?? payload?.totals?.ARTIST ?? 0),

      artistPro: Number(
        payload?.totals?.artistPro ??
          payload?.totals?.artist_pro ??
          payload?.totals?.ARTIST_PRO ??
          0,
      ),
    },
  };
};

const SubscriptionChart = () => {
  const { data: session, status } = useSession();

  const [period, setPeriod] = React.useState<SubscriptionPeriod>("monthly");

  const [insight, setInsight] =
    React.useState<SubscriptionInsight>(EMPTY_INSIGHT);

  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState("");

  const accessToken = getAccessToken(session);

  React.useEffect(() => {
    if (status === "loading") {
      return;
    }

    const controller = new AbortController();

    const fetchSubscriptionInsights = async () => {
      try {
        setLoading(true);
        setError("");

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        if (!backendUrl) {
          throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured.");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/subscriptions/insights?period=${period}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              ...(accessToken
                ? {
                    Authorization: `Bearer ${accessToken}`,
                  }
                : {}),
            },
          },
        );
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);

          throw new Error(
            errorPayload?.message ||
              `Request failed with status ${response.status}`,
          );
        }

        const json = await response.json();

        const normalized = normalizeSubscriptionResponse(json, period);

        setInsight(normalized);
      } catch (fetchError: any) {
        if (fetchError?.name === "AbortError") {
          return;
        }

        console.error("Fetch subscription insights failed:", fetchError);

        setInsight({
          ...EMPTY_INSIGHT,
          period,
        });

        setError(
          fetchError?.message || "Unable to load subscription insights.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchSubscriptionInsights();

    return () => {
      controller.abort();
    };
  }, [period, status, accessToken]);

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",

        p: {
          xs: 2,
          sm: 3,
        },

        borderRadius: {
          xs: "18px",
          sm: "22px",
        },

        background:
          "linear-gradient(180deg, rgba(24,26,27,0.98), rgba(12,14,15,0.98))",

        border: "1px solid rgba(255,255,255,0.08)",

        boxShadow: "0 22px 60px rgba(0,0,0,0.25)",

        "&::before": {
          content: '""',

          position: "absolute",

          width: {
            xs: 190,
            sm: 260,
          },

          height: {
            xs: 190,
            sm: 260,
          },

          borderRadius: "50%",

          top: {
            xs: -100,
            sm: -130,
          },

          right: {
            xs: -90,
            sm: -100,
          },

          background:
            "radial-gradient(circle, rgba(0,255,224,0.14), transparent 62%)",

          pointerEvents: "none",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,

          display: "flex",

          flexDirection: {
            xs: "column",
            sm: "row",
          },

          alignItems: {
            xs: "stretch",
            sm: "center",
          },

          justifyContent: "space-between",

          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#ffffff",

              fontSize: {
                xs: 18,
                sm: 20,
              },

              fontWeight: 950,
              mb: 0.8,
            }}
          >
            Subscription Insights
          </Typography>

          <Typography
            sx={{
              color: "#8B949E",

              fontSize: {
                xs: 13,
                sm: 14,
              },

              lineHeight: "22px",
              fontWeight: 700,
            }}
          >
            Active paid subscriptions grouped by selected period
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,

            width: {
              xs: "100%",
              sm: "auto",
            },
          }}
        >
          <TextField
            select
            size="small"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as SubscriptionPeriod)
            }
            sx={{
              flex: {
                xs: 1,
                sm: "initial",
              },

              minWidth: {
                xs: 0,
                sm: 140,
              },

              "& .MuiOutlinedInput-root": {
                height: 40,

                borderRadius: "12px",

                color: "#ffffff",
                fontWeight: 800,

                background: "rgba(255,255,255,0.04)",

                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.12)",
                },

                "&:hover fieldset": {
                  borderColor: "rgba(0,255,224,0.32)",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#00FFE0",
                },
              },

              "& .MuiSvgIcon-root": {
                color: "#8B949E",
              },
            }}
          >
            <MenuItem value="weekly">Weekly</MenuItem>

            <MenuItem value="monthly">Monthly</MenuItem>

            <MenuItem value="yearly">Yearly</MenuItem>
          </TextField>

          <IconButton
            aria-label="Subscription chart options"
            sx={{
              width: 40,
              height: 40,

              flexShrink: 0,

              borderRadius: "12px",

              color: "#8B949E",

              background: "rgba(255,255,255,0.04)",

              border: "1px solid rgba(255,255,255,0.08)",

              "&:hover": {
                color: "#00FFE0",

                background: "rgba(0,255,224,0.08)",

                borderColor: "rgba(0,255,224,0.25)",
              },
            }}
          >
            <MoreHorizRoundedIcon />
          </IconButton>
        </Box>
      </Box>

      {/* LEGEND */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,

          display: "flex",
          alignItems: "center",

          gap: {
            xs: 1.5,
            sm: 3,
          },

          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <LegendItem
          color="#00FF66"
          label="Artist Plan"
          value={insight.totals.artist}
        />

        <LegendItem
          color="#FFCC00"
          label="Artist Pro"
          value={insight.totals.artistPro}
        />
      </Box>

      {/* CHART CONTENT */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,

          minHeight: {
            xs: 270,
            sm: 300,
          },

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <Box
            sx={{
              minHeight: 270,

              display: "flex",
              flexDirection: "column",

              alignItems: "center",
              justifyContent: "center",

              gap: 1.5,
            }}
          >
            <CircularProgress
              size={30}
              sx={{
                color: "#00FFE0",
              }}
            />

            <Typography
              sx={{
                color: "#8B949E",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Loading subscription insights...
            </Typography>
          </Box>
        ) : error ? (
          <Box
            sx={{
              minHeight: 270,

              display: "flex",
              flexDirection: "column",

              alignItems: "center",
              justifyContent: "center",

              px: 2,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#ff6b6b",
                fontSize: 15,
                fontWeight: 900,
              }}
            >
              Unable to load chart
            </Typography>

            <Typography
              sx={{
                mt: 1,
                maxWidth: 420,

                color: "#8B949E",
                fontSize: 13,
                lineHeight: "22px",
                fontWeight: 600,
              }}
            >
              {error}
            </Typography>
          </Box>
        ) : insight.points.length === 0 ? (
          <Box
            sx={{
              minHeight: 270,

              display: "flex",
              flexDirection: "column",

              alignItems: "center",
              justifyContent: "center",

              px: 2,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              No subscription data
            </Typography>

            <Typography
              sx={{
                mt: 1,
                color: "#8B949E",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              No paid subscriptions were found for this period.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",

              mx: {
                xs: -1,
                sm: 0,
              },

              pb: 0.5,

              "&::-webkit-scrollbar": {
                height: 5,
              },

              "&::-webkit-scrollbar-thumb": {
                bgcolor: "rgba(255,255,255,0.12)",

                borderRadius: "999px",
              },
            }}
          >
            <Box
              sx={{
                width: "100%",

                minWidth: {
                  xs: 560,
                  sm: 0,
                },

                height: {
                  xs: 270,
                  sm: 300,
                  md: 320,
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={insight.points}
                  margin={{
                    top: 12,
                    right: 18,
                    bottom: 8,
                    left: -18,
                  }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="2 4"
                    stroke="rgba(255,255,255,0.14)"
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={18}
                    tick={{
                      fill: "#8B949E",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                    dy={10}
                  />

                  <YAxis
                    allowDecimals={false}
                    domain={[0, "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#8B949E",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />

                  <Tooltip
                    formatter={(value: any, name: any) => [
                      Number(value || 0).toLocaleString(),
                      name,
                    ]}
                    cursor={{
                      stroke: "rgba(0,255,224,0.2)",
                    }}
                    contentStyle={{
                      borderRadius: 14,

                      background: "#111315",

                      border: "1px solid rgba(255,255,255,0.12)",

                      boxShadow: "0 12px 30px rgba(0,0,0,0.35)",

                      color: "#ffffff",
                      fontWeight: 800,
                    }}
                    labelStyle={{
                      color: "#ffffff",
                      fontWeight: 900,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="artist"
                    name="Artist Plan"
                    stroke="#00FF66"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: "#00FF66",
                      strokeWidth: 2,
                      fill: "#111315",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="artistPro"
                    name="Artist Pro"
                    stroke="#FFCC00"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: "#FFCC00",
                      strokeWidth: 2,
                      fill: "#111315",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const LegendItem = ({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.8,
      }}
    >
      <Box
        sx={{
          width: 9,
          height: 9,

          flexShrink: 0,
          borderRadius: "50%",

          background: color,
          boxShadow: `0 0 16px ${color}`,
        }}
      />

      <Typography
        sx={{
          color: "#E5E7EB",

          fontSize: {
            xs: 12,
            sm: 13,
          },

          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          color: "#ffffff",

          fontSize: {
            xs: 14,
            sm: 15,
          },

          fontWeight: 950,
        }}
      >
        {Number(value || 0).toLocaleString()}
      </Typography>
    </Box>
  );
};

export default SubscriptionChart;
