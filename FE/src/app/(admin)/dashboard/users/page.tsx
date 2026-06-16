import type { Metadata } from "next";

import Box from "@mui/material/Box";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import { sendRequest } from "@/utils/api";

import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import UsersTable from "@/components/dashboard/users/UsersTable";

export const metadata: Metadata = {
  title: "Users Management",
  description: "Manage users on Sound Clone",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const DashboardUsersPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const res = await sendRequest<IBackendRes<IModelPaginate<IUser>>>({
    url: `${BACKEND_URL}/api/v1/users`,
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
        tags: ["dashboard-users"],
      },
    },
  });

  const users = res?.data?.result ?? [];

  return (
    <Box>
      <DashboardPageHeader
        title="Users"
        description="Manage user accounts, roles, login type, and profile information."
      />

      <UsersTable users={users} accessToken={accessToken} />
    </Box>
  );
};

export default DashboardUsersPage;
