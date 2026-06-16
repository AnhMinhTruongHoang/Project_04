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
    sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
      url: `${BACKEND_URL}/api/v1/tracks`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 5,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<IUser>>>({
      url: `${BACKEND_URL}/api/v1/users`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 5,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<IPlaylist>>>({
      url: `${BACKEND_URL}/api/v1/playlists`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 5,
      },
      headers,
    }),

    sendRequest<IBackendRes<IModelPaginate<ITrackComment>>>({
      url: `${BACKEND_URL}/api/v1/comments`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 5,
      },
      headers,
    }),
  ]);

  const totalTracks = tracksRes?.data?.meta?.total ?? 0;
  const totalUsers = usersRes?.data?.meta?.total ?? 0;
  const totalPlaylists = playlistsRes?.data?.meta?.total ?? 0;
  const totalComments = commentsRes?.data?.meta?.total ?? 0;

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
        sx={{
          mt: 3,
          p: 2.5,
          borderRadius: 3,
          backgroundColor: "#111314",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography
          sx={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 900,
            mb: 1,
          }}
        >
          Next steps
        </Typography>

        <Typography
          sx={{
            color: "#9a9a9a",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.7,
          }}
        >
          Continue building CRUD pages for tracks, users, playlists, and
          comments. The dashboard layout is now ready.
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardPage;
