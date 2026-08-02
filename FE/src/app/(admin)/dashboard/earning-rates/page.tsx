import type { Metadata } from "next";

import Box from "@mui/material/Box";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/auth.options";
import DashboardPageHeader from "@/components/dashboard/components/DashboardPageHeader";
import EarningRatesTable from "@/components/dashboard/earning-rates/EarningRatesTable";
import {
  getActiveAdminEarningRateApi,
  getAdminEarningRatesApi,
} from "@/utils/api";

export const metadata: Metadata = {
  title: "Earning Rates Management",
  description:
    "Manage qualified stream earning rates and view adjustment history.",
};

const DashboardEarningRatesPage = async () => {
  const session = await getServerSession(authOptions);

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token;

  const [historyResponse, activeResponse] = await Promise.all([
    getAdminEarningRatesApi(accessToken, {
      current: 1,
      pageSize: 100,
    }),
    getActiveAdminEarningRateApi(accessToken),
  ]);

  const historyData = historyResponse?.data;
  const historyResult = historyData?.result;

  const initialRates: IEarningRate[] = Array.isArray(historyResult)
    ? historyResult
    : [];

  const initialActiveRate: IEarningRate | null =
    activeResponse?.data ??
    initialRates.find(
      (rate) => String(rate.status ?? "").toUpperCase() === "ACTIVE"
    ) ??
    null;

  const initialMeta: IEarningRateHistoryMeta = {
    current: Number(historyData?.meta?.current) || 1,
    pageSize: Number(historyData?.meta?.pageSize) || 100,
    pages: Number(historyData?.meta?.pages) || 0,
    total: Number(historyData?.meta?.total) || initialRates.length,
  };

  return (
    <Box>
      <DashboardPageHeader
        title="Earning Rates"
        description="Manage the amount artists receive for each qualified stream without changing historical earnings."
      />

      <EarningRatesTable
        initialRates={initialRates}
        initialActiveRate={initialActiveRate}
        initialMeta={initialMeta}
        accessToken={accessToken}
      />
    </Box>
  );
};

export default DashboardEarningRatesPage;
