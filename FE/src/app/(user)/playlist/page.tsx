import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";

import { sendRequest } from "@/utils/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import NewPlaylist from "./components/new.playlist";
import AddPlaylistTrack from "./components/add.playlist.track";
import CurrentTrack from "./components/current.track";

export const metadata: Metadata = {
  title: "Playlists",
  description: "miêu tả thôi mà",
};

const isTrackObject = (
  track: string | ITrackTop | IShareTrack
): track is ITrackTop | IShareTrack => {
  return typeof track === "object" && track !== null && "_id" in track;
};

const toShareTrack = (track: ITrackTop | IShareTrack): IShareTrack => {
  return {
    ...track,
    isPlaying: "isPlaying" in track ? track.isPlaying : false,
  };
};

const PlaylistPage = async () => {
  const session = await getServerSession(authOptions);

  const res = await sendRequest<IBackendRes<IModelPaginate<IPlaylist>>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists/by-user`,
    method: "POST",
    queryParams: { current: 1, pageSize: 100 },
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
    nextOption: {
      next: { tags: ["playlist-by-user"] },
    },
  });

  const res1 = await sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks`,
    method: "GET",
    queryParams: { current: 1, pageSize: 100 },
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  });

  const playlists = res?.data?.result ?? [];
  const tracks = res1?.data?.result ?? [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#181A1B",
        color: "#ffffff",
        pb: 10,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          pt: 4,
          pb: 6,
        }}
      >
        <Box
          sx={{
            backgroundColor: "#111314",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 18px 50px rgba(0,0,0,0.24)",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: 2.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              background:
                "linear-gradient(135deg, rgba(255,85,0,0.12), rgba(24,26,27,0.2))",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.3 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  backgroundColor: "#ff5500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 26px rgba(255,85,0,0.28)",
                }}
              >
                <QueueMusicRoundedIcon
                  sx={{ color: "#ffffff", fontSize: 25 }}
                />
              </Box>

              <Box>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: 22, md: 28 },
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1.2,
                  }}
                >
                  Playlist
                </Typography>

                <Typography
                  sx={{
                    color: "#9a9a9a",
                    fontSize: 13,
                    fontWeight: 600,
                    mt: 0.4,
                  }}
                >
                  Manage playlists and add tracks to your playlist.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1.2,
                flexWrap: "wrap",
                "& button": {
                  borderRadius: "999px",
                  textTransform: "none",
                  fontWeight: 800,
                },
              }}
            >
              <NewPlaylist />
              <AddPlaylistTrack playlists={playlists} tracks={tracks} />
            </Box>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

          {/* Content */}
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {!playlists.length && (
              <Box
                sx={{
                  minHeight: 220,
                  border: "1px dashed rgba(255,255,255,0.14)",
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "#9a9a9a",
                }}
              >
                <QueueMusicRoundedIcon
                  sx={{ fontSize: 54, color: "#ff5500", mb: 1 }}
                />

                <Typography
                  sx={{ color: "#ffffff", fontSize: 20, fontWeight: 900 }}
                >
                  No playlists yet
                </Typography>

                <Typography sx={{ mt: 0.5, fontSize: 14 }}>
                  Create a new playlist to save your favorite tracks.
                </Typography>
              </Box>
            )}

            {playlists.map((playlist) => {
              const playlistTracks =
                playlist.tracks?.filter(isTrackObject) ?? [];

              return (
                <Accordion
                  key={playlist._id}
                  disableGutters
                  sx={{
                    mb: 1.5,
                    backgroundColor: "#181A1B",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px !important",
                    overflow: "hidden",
                    boxShadow: "none",
                    "&::before": { display: "none" },
                    "&.Mui-expanded": { margin: "0 0 12px 0" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: "#ffffff" }} />}
                    sx={{
                      minHeight: 64,
                      px: 2.2,
                      "& .MuiAccordionSummary-content": {
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: "#ffffff",
                        }}
                      >
                        {playlist.title}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#9a9a9a",
                          fontSize: 13,
                          mt: 0.3,
                        }}
                      >
                        {playlist.isPublic
                          ? "Public playlist"
                          : "Private playlist"}
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={`${playlistTracks.length} tracks`}
                      sx={{
                        color: "#ff5500",
                        backgroundColor: "rgba(255,85,0,0.1)",
                        border: "1px solid rgba(255,85,0,0.28)",
                        fontWeight: 800,
                      }}
                    />
                  </AccordionSummary>

                  <AccordionDetails
                    sx={{
                      px: 2.2,
                      pb: 2,
                      pt: 0,
                      backgroundColor: "#141617",
                    }}
                  >
                    {playlistTracks.length > 0 ? (
                      playlistTracks.map((track, index: number) => {
                        const normalizedTrack = toShareTrack(track);

                        return (
                          <Box key={normalizedTrack._id}>
                            {index === 0 && (
                              <Divider
                                sx={{ borderColor: "rgba(255,255,255,0.08)" }}
                              />
                            )}

                            <Box
                              sx={{
                                py: 1.2,
                                "&:hover": {
                                  backgroundColor: "rgba(255,255,255,0.025)",
                                },
                              }}
                            >
                              <CurrentTrack track={normalizedTrack} />
                            </Box>

                            <Divider
                              sx={{ borderColor: "rgba(255,255,255,0.06)" }}
                            />
                          </Box>
                        );
                      })
                    ) : (
                      <Box
                        sx={{
                          py: 4,
                          textAlign: "center",
                          color: "#9a9a9a",
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        No data.
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PlaylistPage;
