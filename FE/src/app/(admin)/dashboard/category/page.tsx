import type { Metadata } from "next";
import Box from "@mui/material/Box";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/auth.options";
import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import CategoriesTable from "@/components/dashboard/categories/CategoriesTable";
import { getCategories } from "@/utils/api";

export const metadata: Metadata = {
  title: "Categories Management",
  description: "Manage music categories on Sound Clone",
};

const DashboardCategoriesPage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const res = await getCategories(1, 100, accessToken);

  console.log("CATEGORIES RESPONSE:", JSON.stringify(res, null, 2));

  const responseData = res?.data as any;

  const categories: ICategory[] = Array.isArray(responseData)
    ? responseData
    : responseData?.result ?? responseData?.content ?? responseData?.data ?? [];

  return (
    <Box>
      <DashboardPageHeader
        title="Categories"
        description="Manage music categories, slugs, descriptions, and category status."
      />

      <CategoriesTable categories={categories} accessToken={accessToken} />
    </Box>
  );
};

export default DashboardCategoriesPage;
