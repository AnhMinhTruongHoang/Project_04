import type { Metadata } from "next";

import { Box, Container } from "@mui/material";

import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/auth.options";

import {
  getBecauseYouListenedApi,
  getHiddenGemsApi,
  getHomeListeningHistoryApi,
  getTopTracksApi,
} from "@/utils/api";

import MainSlider from "@/components/main/main.slider";
import RightSidebar from "@/components/RightSidebar/right.sidebar";

export const metadata: Metadata = {
  title: "Sound Clone",
  description: "Discover music on Sound Clone",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getTracksFromHistory = (
  items?: IListeningHistoryItem[] | null
): ITrackTop[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => item?.track)
    .filter((track): track is ITrackTop =>
      Boolean(track && (track.id || track._id || track.slug))
    );
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const accessToken =
    (session as any)?.access_token || (session as any)?.accessToken || "";

  const [
    hiddenGemsResponse,
    ncsResponse,
    kpopResponse,
    popResponse,
    lofiResponse,
  ] = await Promise.all([
    getHiddenGemsApi(10, 1000),
    getTopTracksApi("ncs", 10),
    getTopTracksApi("kpop", 10),
    getTopTracksApi("pop", 10),
    getTopTracksApi("lofi", 10),
  ]);

  const [historyResponse, becauseResponse] = accessToken
    ? await Promise.all([
        getHomeListeningHistoryApi(accessToken, 10),
        getBecauseYouListenedApi(accessToken, 10),
      ])
    : [null, null];

  const continueListening = getTracksFromHistory(
    historyResponse?.data?.continueListening
  );

  const recentlyPlayed = getTracksFromHistory(
    historyResponse?.data?.recentlyPlayed
  );

  const historyTracks =
    continueListening.length > 0 ? continueListening : recentlyPlayed;

  const historyTitle =
    continueListening.length > 0 ? "Continue Listening" : "Recently Played";

  const becauseResult = becauseResponse?.data?.result;

  const becauseTracks = Array.isArray(becauseResult) ? becauseResult : [];

  const basedOnTrack = becauseResponse?.data?.basedOn;

  const becauseTitle = basedOnTrack?.title
    ? `Because You Listened to ${basedOnTrack.title}`
    : "Because You Listened To";

  const hiddenGems = Array.isArray(hiddenGemsResponse?.data)
    ? hiddenGemsResponse.data
    : [];

  const ncsTracks = Array.isArray(ncsResponse?.data) ? ncsResponse.data : [];

  const kpopTracks = Array.isArray(kpopResponse?.data) ? kpopResponse.data : [];

  const popTracks = Array.isArray(popResponse?.data) ? popResponse.data : [];

  const lofiTracks = Array.isArray(lofiResponse?.data) ? lofiResponse.data : [];

  return (
    <Box
      sx={{
        minHeight: "100vh",

        color: "#ffffff",

        backgroundColor: "#181A1B",

        pb: {
          xs: "82px",
          md: "72px",
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",

          gap: {
            xs: 0,
            lg: 3,
          },

          py: {
            xs: 2.5,
            md: 3,
          },

          px: {
            xs: 0,
            sm: 2,
            md: 3,
          },

          backgroundColor: "#181A1B",
        }}
      >
        {/* MAIN CONTENT */}
        <Box
          component="main"
          sx={{
            flex: 1,

            minWidth: 0,

            overflow: "hidden",
          }}
        >
          {/* LISTENING HISTORY */}
          {historyTracks.length > 0 && (
            <MainSlider title={historyTitle} data={historyTracks} />
          )}

          {/* BECAUSE YOU LISTENED */}
          {becauseTracks.length > 0 && (
            <MainSlider title={becauseTitle} data={becauseTracks} />
          )}

          {/* HIDDEN GEMS */}
          {hiddenGems.length > 0 && (
            <MainSlider title="Hidden Gems" data={hiddenGems} />
          )}

          {/* TOP NCS */}
          {ncsTracks.length > 0 && (
            <MainSlider title="Top NCS" data={ncsTracks} />
          )}

          {/* TOP KPOP */}
          {kpopTracks.length > 0 && (
            <MainSlider title="Top KPOP" data={kpopTracks} />
          )}

          {/* TOP POP */}
          {popTracks.length > 0 && (
            <MainSlider title="Top POP" data={popTracks} />
          )}

          {/* TOP LOFI */}
          {lofiTracks.length > 0 && (
            <MainSlider title="Top LOFI" data={lofiTracks} />
          )}
        </Box>

        {/* DESKTOP RIGHT SIDEBAR */}
        <Box
          sx={{
            display: {
              xs: "none",
              lg: "block",
            },

            flexShrink: 0,
          }}
        >
          <RightSidebar />
        </Box>
      </Container>
    </Box>
  );
}
