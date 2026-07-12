import type { Metadata } from "next";
import Box from "@mui/material/Box";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import { getAdminTracksApi, sendRequest } from "@/utils/api";
import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import TracksTable from "@/components/dashboard/tracks/TracksTable";

export const metadata: Metadata = {
  title: "Tracks Management",
  description: "Manage uploaded tracks on Sound Clone",
};

const DashboardTracksPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const res = await getAdminTracksApi(accessToken, {
    current: 1,
    pageSize: 100,
  });

  const responseData = res?.data as any;

  const tracks: ITrackTop[] = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.result)
    ? responseData.result
    : Array.isArray(responseData?.content)
    ? responseData.content
    : [];

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
