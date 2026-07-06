import type { Metadata } from "next";

import Box from "@mui/material/Box";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import { sendRequest } from "@/utils/api";
import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import OverviewStats from "../overview/overviewStats";
import OverviewAnalytics from "../overview/overviewAnalytics";
import SubscriptionChart from "../overview/subscriptionChart";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Sound Clone admin dashboard",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getResultList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.result)) return data.result;

  if (Array.isArray(data?.data?.result)) return data.data.result;

  return [];
};

const getTotal = (data: any) => {
  if (Array.isArray(data)) return data.length;

  return data?.meta?.total ?? data?.total ?? data?.result?.length ?? 0;
};

const sumTrackNumber = (tracks: any[], keys: string[]) => {
  return tracks.reduce((total, track) => {
    const value = keys.reduce((result, key) => {
      if (result !== null && result !== undefined) return result;
      return track?.[key];
    }, null as any);

    return total + Number(value || 0);
  }, 0);
};

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const headers = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};

  const [tracksRes, usersRes, playlistsRes, commentsRes] = await Promise.all([
    sendRequest<IBackendRes<IModelPaginate<ITrackTop> | ITrackTop[]>>({
      url: `${BACKEND_URL}/api/v1/tracks`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 1000,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<IUser> | IUser[]>>({
      url: `${BACKEND_URL}/api/v1/users`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 1000,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<IPlaylist> | IPlaylist[]>>({
      url: `${BACKEND_URL}/api/v1/playlists`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 1000,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<ITrackComment> | ITrackComment[]>>({
      url: `${BACKEND_URL}/api/v1/comments`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 1000,
      },
      headers,
    }),
  ]);

  const trackList = getResultList<ITrackTop>(tracksRes?.data);
  const userList = getResultList<IUser>(usersRes?.data);
  const playlistList = getResultList<IPlaylist>(playlistsRes?.data);
  const commentList = getResultList<ITrackComment>(commentsRes?.data);

  const overviewData = {
    totalTracks: getTotal(tracksRes?.data),
    totalUsers: getTotal(usersRes?.data),
    totalPlaylists: getTotal(playlistsRes?.data),
    totalComments: getTotal(commentsRes?.data),

    totalPlays: sumTrackNumber(trackList, [
      "countPlay",
      "count_play",
      "plays",
      "playCount",
    ]),

    totalLikes: sumTrackNumber(trackList, [
      "countLike",
      "count_like",
      "likes",
      "likeCount",
    ]),
  };

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
        <OverviewStats data={overviewData} />

        <OverviewAnalytics
          data={overviewData}
          tracks={trackList}
          users={userList}
          comments={commentList}
          playlists={playlistList}
        />

        <SubscriptionChart />
      </Box>
    </Box>
  );
};

export default DashboardPage;
