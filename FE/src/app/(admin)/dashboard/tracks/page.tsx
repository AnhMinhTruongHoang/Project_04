import type { Metadata } from "next";

import Box from "@mui/material/Box";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import { sendRequest } from "@/utils/api";

import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import TracksTable from "@/components/dashboard/tracks/TracksTable";

export const metadata: Metadata = {
  title: "Tracks Management",
  description: "Manage uploaded tracks on Sound Clone",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const DashboardTracksPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const res = await sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
    url: `${BACKEND_URL}/api/v1/tracks`,
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
        tags: ["dashboard-tracks"],
      },
    },
  });

  const tracks = res?.data?.result ?? [];

  return (
    <Box>
      <DashboardPageHeader
        title="Tracks"
        description="Manage uploaded tracks, categories, likes, plays, and uploader data."
      />

      <TracksTable tracks={tracks} accessToken={accessToken} />
    </Box>
  );
};

export default DashboardTracksPage;
