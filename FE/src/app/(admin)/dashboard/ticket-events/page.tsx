"use client";

import TicketEventsTable from "@/components/dashboard/ticket-events/TicketEventsTable";
import { Box } from "@mui/material";
import { useSession } from "next-auth/react";

const TicketEventsPage = () => {
  const { data: session } = useSession();

  const accessToken =
    (session as any)?.access_token || (session as any)?.accessToken || "";

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
      }}
    >
      <TicketEventsTable accessToken={accessToken} />
    </Box>
  );
};

export default TicketEventsPage;
