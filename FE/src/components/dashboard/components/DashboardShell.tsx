"use client";

import { ReactNode, useState } from "react";

import Box from "@mui/material/Box";

import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";

type Props = {
  children: ReactNode;
  user: any;
};

const DashboardShell = ({ children, user }: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#0f1111",
        color: "#ffffff",
      }}
    >
      <DashboardSidebar collapsed={collapsed} onToggle={handleToggleSidebar} />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DashboardTopbar
          user={user}
          collapsed={collapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 3 },
            py: 3,
            backgroundColor: "#0f1111",
            overflow: "hidden",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardShell;
