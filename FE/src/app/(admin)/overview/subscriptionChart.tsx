"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const subscriptionData = [
  {
    week: "1st week",
    premium: 18,
    pro: 20,
  },
  {
    week: "2nd week",
    premium: 60,
    pro: 42,
  },
  {
    week: "3rd week",
    premium: 68,
    pro: 54,
  },
  {
    week: "4th week",
    premium: 82,
    pro: 64,
  },
  {
    week: "Now",
    premium: 96,
    pro: 80,
  },
];

const SubscriptionChart = () => {
  return (
    <Box
      sx={{
        borderRadius: "22px",
        background:
          "linear-gradient(180deg, rgba(24,26,27,0.98), rgba(12,14,15,0.98))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 22px 60px rgba(0,0,0,0.25)",
        p: { xs: 2.4, sm: 3 },
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          top: -130,
          right: -100,
          background:
            "radial-gradient(circle, rgba(0,255,224,0.14), transparent 62%)",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 950,
              mb: 0.8,
            }}
          >
            Subscription Insights
          </Typography>

          <Typography
            sx={{
              color: "#8B949E",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Hardcoded preview for future subscription analytics
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TextField
            select
            size="small"
            defaultValue="monthly"
            sx={{
              minWidth: 140,
              "& .MuiOutlinedInput-root": {
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

          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8B949E",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <MoreHorizRoundedIcon />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 3,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <LegendItem color="#00FF66" label="Premium Plan" value="95%" />
        <LegendItem color="#FFCC00" label="Pro Plan" value="80%" />
      </Box>

      <Box sx={{ position: "relative", zIndex: 1, height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={subscriptionData}
            margin={{
              top: 12,
              right: 14,
              bottom: 4,
              left: -20,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 4"
              stroke="rgba(255,255,255,0.14)"
            />

            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#8B949E",
                fontSize: 12,
                fontWeight: 700,
              }}
              dy={10}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[20, 40, 60, 80, 100]}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#8B949E",
                fontSize: 12,
                fontWeight: 700,
              }}
            />

            <Tooltip
              formatter={(value: any) => `${Number(value || 0)}%`}
              cursor={{ stroke: "rgba(0,255,224,0.2)" }}
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
              dataKey="premium"
              name="Premium Plan"
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
              dataKey="pro"
              name="Pro Plan"
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
  );
};

const LegendItem = ({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 16px ${color}`,
        }}
      />

      <Typography
        sx={{
          color: "#E5E7EB",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          color: "#ffffff",
          fontSize: 15,
          fontWeight: 950,
        }}
      >
        {value}
      </Typography>
      
    </Box>
  );
};

export default SubscriptionChart;
