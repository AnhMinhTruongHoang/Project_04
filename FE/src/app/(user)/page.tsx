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
  const ncs = await sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top?category=ncs`,
    method: "GET",
  });

  const pop = await sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top?category=pop`,
    method: "GET",
  });

  const kpop = await sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top?category=kpop`,
    method: "GET",
  });

  const lofi = await sendRequest<IBackendRes<ITrackTop[]>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/top?category=lofi`,
    method: "GET",
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
          <MainSlider title="Top NCS" data={ncs?.data ?? []} />
          <MainSlider title="Top POP" data={pop?.data ?? []} />
          <MainSlider title="Top KPOP" data={kpop?.data ?? []} />
          <MainSlider title="Top LOFI" data={lofi?.data ?? []} />
        </Box>

        <RightSidebar />
      </Container>
    </Box>
  );
}
