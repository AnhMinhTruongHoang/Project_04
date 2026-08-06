"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import { getAllPaidAdminArtistPayoutsApi } from "@/utils/api";
import {
  Box,
  CircularProgress,
  IconButton,
  Tooltip as MuiTooltip,
  Typography,
} from "@mui/material";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCurrency = (amount?: number | null, currency = "VND") => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

const formatCompactAmount = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount) || 0);
};

const ArtistPayoutTrendChart = ({
  accessToken,
}: IArtistPayoutTrendChartProps) => {
  const [payouts, setPayouts] = useState<ArtistPayoutItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadPayouts = useCallback(async () => {
    if (!accessToken) {
      setPayouts([]);
      setError("Admin access token is unavailable.");
      setLoading(false);

      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getAllPaidAdminArtistPayoutsApi(accessToken);

      if (response?.statusCode !== 200 || !response?.data) {
        setPayouts([]);
        setError(response?.message || "Cannot load payout statistics.");

        return;
      }

      setPayouts(response.data);
    } catch (loadError) {
      console.error("Cannot load artist payout chart:", loadError);

      setPayouts([]);
      setError("Cannot load payout statistics.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadPayouts();
  }, [loadPayouts]);

  /*
   * Reload chart sau khi Admin đánh dấu payout là PAID.
   */
  useEffect(() => {
    const handleRefresh = () => {
      void loadPayouts();
    };

    window.addEventListener("admin-payout-chart-refresh", handleRefresh);

    return () => {
      window.removeEventListener("admin-payout-chart-refresh", handleRefresh);
    };
  }, [loadPayouts]);

  const chartData = useMemo<ArtistPayoutTrendPoint[]>(() => {
    const currentMonth = dayjs().startOf("month");

    const initialMonths: ArtistPayoutTrendPoint[] = Array.from(
      {
        length: 12,
      },
      (_, index) => {
        const month = currentMonth.subtract(11 - index, "month");

        return {
          monthKey: month.format("YYYY-MM"),
          monthLabel: month.format("MM/YYYY"),
          amount: 0,
          payoutCount: 0,
        };
      }
    );

    const monthMap = new Map(
      initialMonths.map((item) => [item.monthKey, item])
    );

    payouts.forEach((payout) => {
      if (
        String(payout.status || "").toUpperCase() !== "PAID" ||
        !payout.paidAt
      ) {
        return;
      }

      const paidDate = dayjs(payout.paidAt);

      if (!paidDate.isValid()) {
        return;
      }

      const monthKey = paidDate.format("YYYY-MM");

      const currentPoint = monthMap.get(monthKey);

      if (!currentPoint) {
        return;
      }

      currentPoint.amount += Math.max(Number(payout.amount) || 0, 0);

      currentPoint.payoutCount += 1;
    });

    return Array.from(monthMap.values());
  }, [payouts]);

  const totalPaid = useMemo(() => {
    return payouts.reduce((total, payout) => {
      return total + Math.max(Number(payout.amount) || 0, 0);
    }, 0);
  }, [payouts]);

  const currentMonthPaid = useMemo(() => {
    const currentMonthKey = dayjs().format("YYYY-MM");

    return (
      chartData.find((item) => item.monthKey === currentMonthKey)?.amount || 0
    );
  }, [chartData]);

  const currency = payouts[0]?.currency || "VND";

  return (
    <Box
      sx={{
        width: "100%",
        mb: 3,
        p: {
          xs: 2,
          md: 3,
        },
        overflow: "hidden",
        borderRadius: 3,
        backgroundColor: "#111314",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* CHART HEADER */}
      <Box
        sx={{
          mb: 2.5,
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
          gap: 2,
        }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PaymentsRoundedIcon
              sx={{
                color: "#ff5500",
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: {
                  xs: 17,
                  md: 20,
                },
                fontWeight: 900,
              }}
            >
              Artist payout trend
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 0.5,
              color: "#8f8f8f",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Total amount paid to artists during the last 12 months.
          </Typography>
        </Box>
      </Box>

      {/* PAYOUT SUMMARY */}
      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "#181A1B",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Typography
            sx={{
              color: "#8f8f8f",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Total paid
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "#63e6a6",
              fontSize: 17,
              fontWeight: 900,
            }}
          >
            {formatCurrency(totalPaid, currency)}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "#181A1B",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Typography
            sx={{
              color: "#8f8f8f",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Paid this month
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "#ffbd69",
              fontSize: 17,
              fontWeight: 900,
            }}
          >
            {formatCurrency(currentMonthPaid, currency)}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "#181A1B",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Typography
            sx={{
              color: "#8f8f8f",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Paid requests
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "#ffffff",
              fontSize: 17,
              fontWeight: 900,
            }}
          >
            {payouts.length.toLocaleString("vi-VN")}
          </Typography>
        </Box>
      </Box>

      {/* CHART ERROR */}
      {error ? (
        <Box
          sx={{
            minHeight: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            backgroundColor: "#181A1B",
            border: "1px solid rgba(255,95,103,0.2)",
          }}
        >
          <Typography
            sx={{
              px: 2,
              color: "#ff7b7b",
              fontSize: 13,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {error}
          </Typography>
        </Box>
      ) : loading && payouts.length === 0 ? (
        <Box
          sx={{
            minHeight: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            size={32}
            sx={{
              color: "#ff5500",
            }}
          />
        </Box>
      ) : (
        /* ARTIST PAYOUT LINE CHART */
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            overflowX: "auto",
          }}
        >
          <Box
            sx={{
              width: "100%",
              minWidth: {
                xs: 700,
                md: 0,
              },
            }}
          >
            {/* ARTIST PAYOUT LINE CHART */}
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: 330,
                  minWidth: {
                    xs: 700,
                    md: 0,
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 24,
                      bottom: 10,
                      left: 18,
                    }}
                  >
                    {/* CHART GRID */}
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.07)"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    {/* MONTH AXIS */}
                    <XAxis
                      dataKey="monthLabel"
                      axisLine={{
                        stroke: "rgba(255,255,255,0.18)",
                      }}
                      tickLine={{
                        stroke: "rgba(255,255,255,0.18)",
                      }}
                      tick={{
                        fill: "#a9a9a9",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                      minTickGap={20}
                    />

                    {/* PAYOUT AMOUNT AXIS */}
                    <YAxis
                      width={84}
                      axisLine={{
                        stroke: "rgba(255,255,255,0.18)",
                      }}
                      tickLine={{
                        stroke: "rgba(255,255,255,0.18)",
                      }}
                      tick={{
                        fill: "#a9a9a9",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                      tickFormatter={(value) =>
                        formatCompactAmount(Number(value) || 0)
                      }
                    />

                    {/* PAYOUT TOOLTIP */}
                    <RechartsTooltip
                      cursor={{
                        stroke: "rgba(255,85,0,0.45)",
                        strokeWidth: 1,
                      }}
                      contentStyle={{
                        color: "#ffffff",
                        backgroundColor: "#181A1B",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                      }}
                      labelStyle={{
                        color: "#ffffff",
                        fontWeight: 800,
                        marginBottom: 6,
                      }}
                      itemStyle={{
                        color: "#ffbd69",
                        fontWeight: 800,
                      }}
                      formatter={(value) => [
                        formatCurrency(Number(value) || 0, currency),
                        "Paid amount",
                      ]}
                    />

                    {/* PAID AMOUNT LINE */}
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="Paid amount"
                      stroke="#ff5500"
                      strokeWidth={3}
                      connectNulls
                      dot={{
                        r: 4,
                        fill: "#ff5500",
                        stroke: "#111314",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#ff5500",
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ArtistPayoutTrendChart;
