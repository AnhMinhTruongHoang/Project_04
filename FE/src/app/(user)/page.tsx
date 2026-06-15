import { Box, Container } from "@mui/material";
import { sendRequest } from "@/utils/api";
import type { Metadata } from "next";
import MainSlider from "@/components/main/main.slider";
import RightSidebar from "@/components/RightSidebar/right.sidebar";

export const metadata: Metadata = {
  title: "Sound Clone",
  description: "miêu tả",
};

export default async function HomePage() {
  const chills = await sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top`,
    method: "POST",
    body: { category: "CHILL", limit: 10 },
  });

  const workouts = await sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top`,
    method: "POST",
    body: { category: "WORKOUT", limit: 10 },
  });

  const party = await sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top`,
    method: "POST",
    body: { category: "PARTY", limit: 10 },
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#181A1B",
        color: "#ffffff",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          gap: 3,
          backgroundColor: "#181A1B",
          py: 3,
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <MainSlider title={"Top Chill"} data={chills?.data ?? []} />
          <MainSlider title={"Top Workout"} data={workouts?.data ?? []} />
          <MainSlider title={"Top Party"} data={party?.data ?? []} />
        </Box>

        <RightSidebar />
      </Container>
    </Box>
  );
}
