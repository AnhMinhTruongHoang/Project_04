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

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getCommentsFromResponse = (res: any): ITrackComment[] => {
  const data = res?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.comments)) return data.comments;

  return [];
};

const DashboardCommentsPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const res = await sendRequest<
    IBackendRes<IModelPaginate<ITrackComment> | ITrackComment[]>
  >({
    url: `${BACKEND_URL}/api/v1/comments`,
    method: "GET",
    queryParams: {
      current: 1,
      pageSize: 100,
    },
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {},
    nextOption: {
      cache: "no-store",
    },
  });

  console.log("DASHBOARD COMMENTS RESPONSE:", res);

  const comments = getCommentsFromResponse(res);

  return (
    <Box>
      <DashboardPageHeader
        title="Comments"
        description="Manage track comments, users, and moderation actions."
      />

      <CommentsTable comments={comments} accessToken={accessToken} />
    </Box>
  );
};

export default DashboardCommentsPage;
