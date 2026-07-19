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
              textAlign: "center",
            }}
          >
            Content Distribution
          </Typography>

          <Typography
            sx={{
              color: "#8B949E",
              fontSize: 14,
              fontWeight: 600,
              textAlign: "center",
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
      {/* ========================================
    MONTHLY GROWTH
======================================== */}
      <Box
        sx={{
          ...chartCardSx,

          minWidth: 0,

          minHeight: {
            xs: 430,
            sm: 470,
            md: 500,
          },

          p: {
            xs: 1.8,
            sm: 2.5,
            md: 3,
          },

          overflow: "hidden",
        }}
      >
        {/* ========================================
      MONTHLY GROWTH HEADER
  ======================================== */}
        <Box
          sx={{
            display: "flex",

            alignItems: {
              xs: "center",
              sm: "center",
            },

            justifyContent: {
              xs: "center",
              sm: "space-between",
            },

            flexDirection: {
              xs: "column",
              sm: "row",
            },

            gap: {
              xs: 1.5,
              sm: 2,
            },

            mb: {
              xs: 2,
              sm: 3,
            },

            textAlign: {
              xs: "center",
              sm: "left",
            },
          }}
        >
          {/* TITLE */}
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",

                fontSize: {
                  xs: 18,
                  sm: 20,
                },

                fontWeight: 900,

                lineHeight: 1.25,

                mb: 0.6,
              }}
            >
              Monthly Growth
            </Typography>

            <Typography
              sx={{
                color: "#8B949E",

                fontSize: {
                  xs: 11,
                  sm: 13,
                  md: 14,
                },

                fontWeight: 600,

                lineHeight: 1.5,
              }}
            >
              Based on created data in the system
            </Typography>
          </Box>

          {/* YEAR SELECT */}
          <TextField
            select
            size="small"
            defaultValue="2026"
            sx={{
              width: {
                xs: 92,
                sm: "auto",
              },

              minWidth: {
                xs: 92,
                sm: 86,
              },

              "& .MuiOutlinedInput-root": {
                height: {
                  xs: 36,
                  sm: 40,
                },

                borderRadius: "9px",

                color: "#ffffff",

                fontSize: {
                  xs: 12,
                  sm: 13,
                },

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

              "& .MuiSelect-select": {
                py: 0.8,
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

        {/* ========================================
      MOBILE / DESKTOP LEGEND
  ======================================== */}
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "repeat(3, minmax(0, 1fr))",
              sm: "repeat(3, max-content)",
            },

            justifyContent: {
              xs: "stretch",
              sm: "flex-start",
            },

            gap: {
              xs: 0.8,
              sm: 3,
            },

            mb: {
              xs: 2.5,
              sm: 4,
            },

            width: "100%",
          }}
        >
          {/* USERS */}
          <Box
            sx={{
              minWidth: 0,

              textAlign: {
                xs: "center",
                sm: "left",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                justifyContent: {
                  xs: "center",
                  sm: "flex-start",
                },

                gap: 0.55,

                mb: {
                  xs: 0.6,
                  sm: 1,
                },
              }}
            >
              <Box
                sx={{
                  width: {
                    xs: 8,
                    sm: 11,
                  },

                  height: {
                    xs: 8,
                    sm: 11,
                  },

                  borderRadius: "50%",

                  background: "#00856F",

                  flexShrink: 0,
                }}
              />

              <Typography
                noWrap
                sx={{
                  color: "#E5E7EB",

                  fontSize: {
                    xs: 9,
                    sm: 13,
                  },

                  fontWeight: 800,
                }}
              >
                Users
              </Typography>
            </Box>

            <Typography
              sx={{
                color: "#ffffff",

                fontSize: {
                  xs: 16,
                  sm: 19,
                },

                fontWeight: 950,

                lineHeight: 1,
              }}
            >
              {formatNumber(totalMonthlyUsers)}
            </Typography>
          </Box>

          {/* TRACKS */}
          <Box
            sx={{
              minWidth: 0,

              textAlign: {
                xs: "center",
                sm: "left",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                justifyContent: {
                  xs: "center",
                  sm: "flex-start",
                },

                gap: 0.55,

                mb: {
                  xs: 0.6,
                  sm: 1,
                },
              }}
            >
              <Box
                sx={{
                  width: {
                    xs: 8,
                    sm: 11,
                  },

                  height: {
                    xs: 8,
                    sm: 11,
                  },

                  borderRadius: "50%",

                  background: "#FFAA00",

                  flexShrink: 0,
                }}
              />

              <Typography
                noWrap
                sx={{
                  color: "#E5E7EB",

                  fontSize: {
                    xs: 9,
                    sm: 13,
                  },

                  fontWeight: 800,
                }}
              >
                Tracks
              </Typography>
            </Box>

            <Typography
              sx={{
                color: "#ffffff",

                fontSize: {
                  xs: 16,
                  sm: 19,
                },

                fontWeight: 950,

                lineHeight: 1,
              }}
            >
              {formatNumber(totalMonthlyTracks)}
            </Typography>
          </Box>

          {/* COMMENTS */}
          <Box
            sx={{
              minWidth: 0,

              textAlign: {
                xs: "center",
                sm: "left",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",

                alignItems: "center",

                justifyContent: {
                  xs: "center",
                  sm: "flex-start",
                },

                gap: 0.55,

                mb: {
                  xs: 0.6,
                  sm: 1,
                },
              }}
            >
              <Box
                sx={{
                  width: {
                    xs: 8,
                    sm: 11,
                  },

                  height: {
                    xs: 8,
                    sm: 11,
                  },

                  borderRadius: "50%",

                  background: "#16B5D1",

                  flexShrink: 0,
                }}
              />

              <Typography
                noWrap
                sx={{
                  color: "#E5E7EB",

                  fontSize: {
                    xs: 9,
                    sm: 13,
                  },

                  fontWeight: 800,
                }}
              >
                Comments
              </Typography>
            </Box>

            <Typography
              sx={{
                color: "#ffffff",

                fontSize: {
                  xs: 16,
                  sm: 19,
                },

                fontWeight: 950,

                lineHeight: 1,
              }}
            >
              {formatNumber(totalMonthlyComments)}
            </Typography>
          </Box>
        </Box>

        {/* ========================================
      MOBILE SCROLL HINT
  ======================================== */}
        <Typography
          sx={{
            display: {
              xs: "block",
              sm: "none",
            },

            mb: 1,

            color: "#606A75",

            fontSize: 9,

            fontWeight: 700,

            textAlign: "right",
          }}
        >
          Swipe to view all months →
        </Typography>

        {/* ========================================
      CHART HORIZONTAL SCROLL
  ======================================== */}
        <Box
          sx={{
            width: "100%",

            overflowX: {
              xs: "auto",
              sm: "hidden",
            },

            overflowY: "hidden",

            WebkitOverflowScrolling: "touch",

            scrollbarWidth: "none",

            scrollSnapType: {
              xs: "x proximity",
              sm: "none",
            },

            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {/* CHART INNER WIDTH */}
          <Box
            sx={{
              width: {
                xs: 610,
                sm: "100%",
              },

              minWidth: {
                xs: 610,
                sm: 0,
              },

              height: {
                xs: 245,
                sm: 290,
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                barSize={20}
                margin={{
                  top: 5,
                  right: 8,
                  left: -12,
                  bottom: 5,
                }}
              >
                {/* GRID */}
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.07)"
                />

                {/* X AXIS */}
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{
                    fill: "#8B949E",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                  dy={8}
                />

                {/* Y AXIS */}
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={34}
                  tick={{
                    fill: "#75808C",
                    fontSize: 10,
                  }}
                />

                {/* TOOLTIP */}
                <Tooltip
                  formatter={(value: any) => formatNumber(Number(value ?? 0))}
                  cursor={{
                    fill: "rgba(255,255,255,0.035)",
                  }}
                  contentStyle={{
                    borderRadius: 10,

                    background: "#111315",

                    border: "1px solid rgba(255,255,255,0.12)",

                    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",

                    color: "#ffffff",

                    fontSize: 11,

                    fontWeight: 700,
                  }}
                  labelStyle={{
                    color: "#ffffff",
                  }}
                />

                {/* USERS */}
                <Bar
                  dataKey="users"
                  stackId="activity"
                  fill="#00856F"
                  radius={[4, 4, 0, 0]}
                />

                {/* TRACKS */}
                <Bar
                  dataKey="tracks"
                  stackId="activity"
                  fill="#FFAA00"
                  radius={[4, 4, 0, 0]}
                />

                {/* COMMENTS */}
                <Bar
                  dataKey="comments"
                  stackId="activity"
                  fill="#16B5D1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
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
