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
import { OverviewStatsData } from "./overviewStats";


type AnyRecord = Record<string, any>;

type Props = {
  data?: Partial<OverviewStatsData>;
  tracks?: AnyRecord[];
  users?: AnyRecord[];
  comments?: AnyRecord[];
  playlists?: AnyRecord[];
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatNumber = (value?: number) => {
  const number = Number(value || 0);

  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(2)}k`;

  return number.toString();
};

const getDate = (item?: AnyRecord) => {
  const value =
    item?.createdAt ||
    item?.created_at ||
    item?.updatedAt ||
    item?.updated_at ||
    "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const buildMonthlyData = ({
  tracks = [],
  users = [],
  comments = [],
}: {
  tracks?: AnyRecord[];
  users?: AnyRecord[];
  comments?: AnyRecord[];
}) => {
  const result = months.map((month) => ({
    month,
    users: 0,
    tracks: 0,
    comments: 0,
  }));

  users.forEach((item) => {
    const date = getDate(item);
    if (!date) return;

    result[date.getMonth()].users += 1;
  });

  tracks.forEach((item) => {
    const date = getDate(item);
    if (!date) return;

    result[date.getMonth()].tracks += 1;
  });

  comments.forEach((item) => {
    const date = getDate(item);
    if (!date) return;

    result[date.getMonth()].comments += 1;
  });

  return result;
};

const chartCardSx = {
  borderRadius: "22px",
  background:
    "linear-gradient(180deg, rgba(24,26,27,0.98), rgba(12,14,15,0.98))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.25)",
};

const OverviewAnalytics = ({
  data,
  tracks = [],
  users = [],
  comments = [],
}: Props) => {
  const donutData = [
    { name: "Tracks", value: data?.totalTracks || 0, fill: "#005B5F" },
    { name: "Users", value: data?.totalUsers || 0, fill: "#00856F" },
    { name: "Playlists", value: data?.totalPlaylists || 0, fill: "#58D68D" },
    { name: "Comments", value: data?.totalComments || 0, fill: "#B8F7D4" },
  ].filter((item) => item.value > 0);

  const safeDonutData =
    donutData.length > 0
      ? donutData
      : [{ name: "No Data", value: 1, fill: "rgba(255,255,255,0.12)" }];

  const totalContent = donutData.reduce((total, item) => total + item.value, 0);

  const monthlyData = buildMonthlyData({
    tracks,
    users,
    comments,
  });

  const totalMonthlyUsers = monthlyData.reduce(
    (total, item) => total + item.users,
    0
  );

  const totalMonthlyTracks = monthlyData.reduce(
    (total, item) => total + item.tracks,
    0
  );

  const totalMonthlyComments = monthlyData.reduce(
    (total, item) => total + item.comments,
    0
  );

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
          ...chartCardSx,
          minHeight: 500,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 900,
              mb: 0.8,
            }}
          >
            Content Distribution
          </Typography>

          <Typography
            sx={{
              color: "#8B949E",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Overview by real content data
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
                data={safeDonutData}
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
                  background: "#111315",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
                labelStyle={{
                  color: "#ffffff",
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
                color: "#8B949E",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Total
            </Typography>

            <Typography
              sx={{
                color: "#ffffff",
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
            borderTop: "1px solid rgba(255,255,255,0.08)",
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {safeDonutData.map((item) => (
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
                  color: "#E5E7EB",
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
          ...chartCardSx,
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
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 900,
                mb: 0.8,
              }}
            >
              Monthly Growth
            </Typography>

            <Typography
              sx={{
                color: "#8B949E",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Based on created data in the system
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
          <LegendItem
            color="#00856F"
            label="Users"
            value={formatNumber(totalMonthlyUsers)}
          />
          <LegendItem
            color="#FFAA00"
            label="Tracks"
            value={formatNumber(totalMonthlyTracks)}
          />
          <LegendItem
            color="#16B5D1"
            label="Comments"
            value={formatNumber(totalMonthlyComments)}
          />
        </Box>

        <Box sx={{ width: "100%", height: 290 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barSize={28}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8B949E", fontSize: 12 }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8B949E", fontSize: 12 }}
              />

              <Tooltip
                formatter={(value: any) => formatNumber(Number(value ?? 0))}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  borderRadius: 12,
                  background: "#111315",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
                labelStyle={{
                  color: "#ffffff",
                }}
              />

              <Bar
                dataKey="users"
                stackId="activity"
                fill="#00856F"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="tracks"
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
            color: "#E5E7EB",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {label}
        </Typography>
      </Box>

      <Typography
        sx={{
          color: "#ffffff",
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
