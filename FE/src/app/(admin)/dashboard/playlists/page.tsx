import type { Metadata } from "next";

import Box from "@mui/material/Box";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import { sendRequest } from "@/utils/api";

import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import PlaylistsTable from "@/components/dashboard/playlists/PlaylistsTable";

export const metadata: Metadata = {
  title: "Playlists Management",
  description: "Manage playlists on Sound Clone",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const DashboardPlaylistsPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const res = await sendRequest<IBackendRes<IModelPaginate<IPlaylist>>>({
    url: `${BACKEND_URL}/api/v1/playlists`,
    method: "GET",
    queryParams: {
      current: 1,
      pageSize: 100,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    nextOption: {
      next: {
        tags: ["dashboard-playlists"],
      },
    },
  });

  const playlists = res?.data?.result ?? [];

  return (
    <Box>
      <DashboardPageHeader
        title="Playlists"
        description="Manage playlist visibility, owners, and playlist data."
      />

      <PlaylistsTable playlists={playlists} accessToken={accessToken} />
    </Box>
  );
};

export default DashboardPlaylistsPage;
