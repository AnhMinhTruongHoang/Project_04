import type { Metadata } from "next";

import Box from "@mui/material/Box";

import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/auth.options";
import { sendRequest } from "@/utils/api";

import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";

import OverviewStats from "../overview/overviewStats";
import OverviewAnalytics from "../overview/overviewAnalytics";
import SubscriptionChart from "../overview/subscriptionChart";

/* =====================================================
   METADATA
===================================================== */

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Sound Clone admin dashboard",
};

/* =====================================================
   CONFIG
===================================================== */

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

/*
 * Data dùng cho Monthly Growth chart.
 *
 * Không cần lấy playlist nữa.
 */
const ANALYTICS_PAGE_SIZE = 100;

/* =====================================================
   TYPES
===================================================== */

type DashboardOverview = {
  totalTracks: number;
  totalUsers: number;
  totalPlaylists: number;
  totalComments: number;
  totalPlays: number;
  totalLikes: number;
};

/* =====================================================
   HELPERS
===================================================== */

const getResultList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  if (Array.isArray(data?.data?.result)) {
    return data.data.result;
  }

  return [];
};

const getAccessToken = (session: any): string => {
  return (
    session?.access_token ||
    session?.accessToken ||
    session?.user?.access_token ||
    session?.user?.accessToken ||
    ""
  );
};

/*
 * Debug thời gian request.
 *
 * Sau khi tối ưu xong có thể xóa helper này.
 */
const timedRequest = async <T,>(
  name: string,
  request: Promise<T>
): Promise<T> => {
  const startedAt = performance.now();

  try {
    return await request;
  } finally {
    const elapsed = performance.now() - startedAt;

    console.log(`[Dashboard] ${name}: ${elapsed.toFixed(0)} ms`);
  }
};

/* =====================================================
   PAGE
===================================================== */

const DashboardPage = async () => {
  /*
   * =================================================
   * SESSION
   * =================================================
   */

  const sessionStartedAt = performance.now();

  const session = await getServerSession(authOptions);

  console.log(
    `[Dashboard] session: ${(performance.now() - sessionStartedAt).toFixed(
      0
    )} ms`
  );

  const accessToken = getAccessToken(session);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  console.log("[Dashboard] auth:", {
    hasSession: Boolean(session),
    hasAccessToken: Boolean(accessToken),
  });

  /*
   * =================================================
   * FETCH
   * =================================================
   *
   * 4 request chạy song song:
   *
   * 1. Dashboard overview:
   *    COUNT/SUM ở backend
   *
   * 2. Tracks:
   *    chỉ dùng cho Monthly Growth
   *
   * 3. Users:
   *    chỉ dùng cho Monthly Growth
   *
   * 4. Comments:
   *    chỉ dùng cho Monthly Growth
   *
   * KHÔNG fetch playlist list nữa.
   */

  const [overviewRes, tracksRes, usersRes, commentsRes] = await Promise.all([
    /*
     * =================================================
     * OVERVIEW STATS
     * =================================================
     */
    timedRequest(
      "overview",
      sendRequest<IBackendRes<DashboardOverview>>({
        url: `${BACKEND_URL}/api/v1/admin/dashboard/overview`,

        method: "GET",

        headers,

        nextOption: {
          cache: "no-store",
        },
      })
    ),

    /*
     * =================================================
     * TRACKS FOR MONTHLY CHART
     * =================================================
     */
    timedRequest(
      "tracks",
      sendRequest<IBackendRes<IModelPaginate<ITrackTop> | ITrackTop[]>>({
        url: `${BACKEND_URL}/api/v1/tracks`,

        method: "GET",

        queryParams: {
          current: 1,
          pageSize: ANALYTICS_PAGE_SIZE,
        },

        headers,

        nextOption: {
          cache: "no-store",
        },
      })
    ),

    /*
     * =================================================
     * USERS FOR MONTHLY CHART
     * =================================================
     */
    timedRequest(
      "users",
      sendRequest<IBackendRes<IModelPaginate<IUser> | IUser[]>>({
        url: `${BACKEND_URL}/api/v1/users`,

        method: "GET",

        queryParams: {
          current: 1,
          pageSize: ANALYTICS_PAGE_SIZE,
        },

        headers,

        nextOption: {
          cache: "no-store",
        },
      })
    ),

    /*
     * =================================================
     * COMMENTS FOR MONTHLY CHART
     * =================================================
     */
    timedRequest(
      "comments",
      sendRequest<IBackendRes<IModelPaginate<ITrackComment> | ITrackComment[]>>(
        {
          url: `${BACKEND_URL}/api/v1/comments`,

          method: "GET",

          queryParams: {
            current: 1,
            pageSize: ANALYTICS_PAGE_SIZE,
          },

          headers,

          nextOption: {
            cache: "no-store",
          },
        }
      )
    ),
  ]);

  /*
   * =================================================
   * NORMALIZE CHART DATA
   * =================================================
   */

  const trackList = getResultList<ITrackTop>(tracksRes?.data);

  const userList = getResultList<IUser>(usersRes?.data);

  const commentList = getResultList<ITrackComment>(commentsRes?.data);

  /*
   * =================================================
   * OVERVIEW
   * =================================================
   */

  const overview = overviewRes?.data;

  const overviewData = {
    totalTracks: Number(overview?.totalTracks || 0),

    totalUsers: Number(overview?.totalUsers || 0),

    totalPlaylists: Number(overview?.totalPlaylists || 0),

    totalComments: Number(overview?.totalComments || 0),

    totalPlays: Number(overview?.totalPlays || 0),

    totalLikes: Number(overview?.totalLikes || 0),
  };

  /*
   * =================================================
   * DEBUG
   * =================================================
   */

  console.log("[Dashboard] result:", {
    tracksLoaded: trackList.length,

    usersLoaded: userList.length,

    commentsLoaded: commentList.length,

    totalTracks: overviewData.totalTracks,

    totalUsers: overviewData.totalUsers,

    totalPlaylists: overviewData.totalPlaylists,

    totalComments: overviewData.totalComments,

    totalPlays: overviewData.totalPlays,

    totalLikes: overviewData.totalLikes,
  });

  /*
   * =================================================
   * UI
   * =================================================
   */

  return (
    <Box>
      <DashboardPageHeader
        title="Overview"
        description="Track your platform data and manage Sound Clone content."
      />

      <Box
        sx={{
          display: "flex",

          flexDirection: "column",

          gap: 3,

          marginTop: 3,
        }}
      >
        {/* =============================
            OVERVIEW CARDS
        ============================== */}

        <OverviewStats data={overviewData} />

        {/* =============================
            ANALYTICS
        ============================== */}

        <OverviewAnalytics
          data={overviewData}
          tracks={trackList}
          users={userList}
          comments={commentList}
        />

        {/* =============================
            SUBSCRIPTION
        ============================== */}

        <SubscriptionChart />
      </Box>
    </Box>
  );
};

export default DashboardPage;
