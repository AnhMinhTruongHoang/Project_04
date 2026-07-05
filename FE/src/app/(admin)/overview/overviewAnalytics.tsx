"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const donutData = [
  { name: "Tracks", value: 845, fill: "#005B5F" },
  { name: "Users", value: 620, fill: "#00856F" },
  { name: "Playlists", value: 260, fill: "#58D68D" },
  { name: "Comments", value: 420, fill: "#B8F7D4" },
];

const monthlyData = [
  { month: "Jan", plays: 18, likes: 11, comments: 7 },
  { month: "Feb", plays: 54, likes: 18, comments: 17 },
  { month: "Mar", plays: 42, likes: 14, comments: 14 },
  { month: "Apr", plays: 27, likes: 9, comments: 9 },
  { month: "May", plays: 60, likes: 20, comments: 20 },
  { month: "Jun", plays: 18, likes: 6, comments: 6 },
  { month: "Jul", plays: 66, likes: 22, comments: 22 },
  { month: "Aug", plays: 57, likes: 19, comments: 19 },
  { month: "Sep", plays: 24, likes: 8, comments: 8 },
  { month: "Oct", plays: 66, likes: 22, comments: 22 },
  { month: "Nov", plays: 24, likes: 8, comments: 8 },
  { month: "Dec", plays: 51, likes: 17, comments: 17 },
];

const totalContent = donutData.reduce((total, item) => total + item.value, 0);

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}k`;

  return value.toString();
};

const cardSx = {
  borderRadius: "22px",
  background: "#ffffff",
  border: "1px solid rgba(15,23,42,0.06)",
  boxShadow: "0 22px 60px rgba(15,23,42,0.06)",
};

const OverviewAnalytics = () => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "0.95fr 1.95fr",
        },
        gap: 3,
      }}
    >
      <Box
        sx={{
          ...cardSx,
          minHeight: 500,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography
            sx={{
              color: "#07111f",
              fontSize: 20,
              fontWeight: 900,
              mb: 0.8,
            }}
          >
            Content Distribution
          </Typography>

          <Typography
            sx={{
              color: "#64748B",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Overview by content type
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 300,
            position: "relative",
            px: 2,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={0}
                stroke="none"
                isAnimationActive
              />

              <Tooltip
                formatter={(value: any) => formatNumber(Number(value ?? 0))}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                  color: "#07111f",
                  fontWeight: 700,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              flexDirection: "column",
            }}
          >
            <Typography
              sx={{
                color: "#64748B",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Total
            </Typography>

            <Typography
              sx={{
                color: "#07111f",
                fontSize: 22,
                fontWeight: 950,
                mt: 1,
              }}
            >
              {formatNumber(totalContent)}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid rgba(15,23,42,0.08)",
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {donutData.map((item) => (
            <Box
              key={item.name}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
              }}
            >
              <Box
                sx={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: item.fill,
                }}
              />

              <Typography
                sx={{
                  color: "#07111f",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {item.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          ...cardSx,
          minHeight: 500,
          p: { xs: 2.5, sm: 3 },
        }}
      >
        <Box
          sx={{
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
                color: "#07111f",
                fontSize: 20,
                fontWeight: 900,
                mb: 0.8,
              }}
            >
              Monthly Activity
            </Typography>

            <Typography
              sx={{
                color: "#64748B",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              (+43%) than last year
            </Typography>
          </Box>

          <TextField
            select
            size="small"
            defaultValue="2026"
            sx={{
              minWidth: 86,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                color: "#07111f",
                fontWeight: 800,
                background: "#fff",
                "& fieldset": {
                  borderColor: "rgba(15,23,42,0.12)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(15,23,42,0.22)",
                },
              },
            }}
          >
            <MenuItem value="2023">2023</MenuItem>
            <MenuItem value="2024">2024</MenuItem>
            <MenuItem value="2025">2025</MenuItem>
            <MenuItem value="2026">2026</MenuItem>
          </TextField>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 2, sm: 3 },
            flexWrap: "wrap",
            mb: 4,
          }}
        >
          <LegendItem color="#00856F" label="Plays" value="6.79k" />
          <LegendItem color="#FFAA00" label="Likes" value="1.23k" />
          <LegendItem color="#16B5D1" label="Comments" value="1.01k" />
        </Box>

        <Box sx={{ width: "100%", height: 290 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="rgba(100,116,139,0.18)"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8CA0B3", fontSize: 12 }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8CA0B3", fontSize: 12 }}
              />

              <Tooltip
                formatter={(value: any) => formatNumber(Number(value ?? 0))}
                cursor={{ fill: "rgba(15,23,42,0.04)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                  color: "#07111f",
                  fontWeight: 700,
                }}
              />

              <Bar
                dataKey="plays"
                stackId="activity"
                fill="#00856F"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="likes"
                stackId="activity"
                fill="#FFAA00"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="comments"
                stackId="activity"
                fill="#16B5D1"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
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
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: color,
          }}
        />

        <Typography
          sx={{
            color: "#07111f",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {label}
        </Typography>
      </Box>

      <Typography
        sx={{
          color: "#07111f",
          fontSize: 19,
          fontWeight: 950,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

export default OverviewAnalytics;
