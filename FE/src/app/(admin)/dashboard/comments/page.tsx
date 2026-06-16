import type { Metadata } from "next";

import Box from "@mui/material/Box";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import { sendRequest } from "@/utils/api";

import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import CommentsTable from "@/components/dashboard/comments/CommentsTable";

export const metadata: Metadata = {
  title: "Comments Management",
  description: "Manage comments on Sound Clone",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const DashboardCommentsPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const res = await sendRequest<IBackendRes<IModelPaginate<ITrackComment>>>({
    url: `${BACKEND_URL}/api/v1/comments`,
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
        tags: ["dashboard-comments"],
      },
    },
  });

  const comments = res?.data?.result ?? [];

  return (
    <Box>
      <DashboardPageHeader
        title="Comments"
        description="Manage track comments, users, comment time, and moderation actions."
      />

      <CommentsTable comments={comments} accessToken={accessToken} />
    </Box>
  );
};

export default DashboardCommentsPage;
