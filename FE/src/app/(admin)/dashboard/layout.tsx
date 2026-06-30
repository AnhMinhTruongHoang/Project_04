import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import DashboardShell from "../../../components/dashboard/components/DashboardShell";

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user as any;

  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
};

export default DashboardLayout;
