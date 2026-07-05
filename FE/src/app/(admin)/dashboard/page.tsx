import type { Metadata } from "next";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import { sendRequest } from "@/utils/api";
import DashboardStatCard from "../../../components/dashboard/components/DashboardStatCard";
import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import OverviewStats from "../overview/overviewStats";
import OverviewAnalytics from "../overview/overviewAnalytics";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Sound Clone admin dashboard",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const [tracksRes, usersRes, playlistsRes, commentsRes] = await Promise.all([
    sendRequest<IBackendRes<IModelPaginate<ITrackTop> | ITrackTop[]>>({
      url: `${BACKEND_URL}/api/v1/tracks`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 5,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<IUser> | IUser[]>>({
      url: `${BACKEND_URL}/api/v1/users`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 5,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<IPlaylist> | IPlaylist[]>>({
      url: `${BACKEND_URL}/api/v1/playlists`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 5,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<ITrackComment> | ITrackComment[]>>({
      url: `${BACKEND_URL}/api/v1/comments`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 5,
      },
      headers,
    }),
  ]);

  const getTotal = (data: any) => {
    if (Array.isArray(data)) return data.length;

    return data?.meta?.total ?? data?.total ?? data?.result?.length ?? 0;
  };

  const totalTracks = getTotal(tracksRes?.data);
  const totalUsers = getTotal(usersRes?.data);
  const totalPlaylists = getTotal(playlistsRes?.data);
  const totalComments = getTotal(commentsRes?.data);

  return (
    <Box>
      <DashboardPageHeader
        title="Overview"
        description="Track your platform data and manage Sound Clone content."
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        <DashboardStatCard
          title="Total Tracks"
          value={totalTracks}
          description="Uploaded tracks"
          icon={<LibraryMusicRoundedIcon />}
        />

        <DashboardStatCard
          title="Total Users"
          value={totalUsers}
          description="Registered users"
          icon={<PeopleAltRoundedIcon />}
        />

        <DashboardStatCard
          title="Total Playlists"
          value={totalPlaylists}
          description="Created playlists"
          icon={<QueueMusicRoundedIcon />}
        />

        <DashboardStatCard
          title="Total Comments"
          value={totalComments}
          description="Track comments"
          icon={<CommentRoundedIcon />}
        />
      </Box>

      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 5 }}
      >
        <OverviewStats />

        <OverviewAnalytics />
      </Box>
    </Box>
  );
};

export default DashboardPage;
