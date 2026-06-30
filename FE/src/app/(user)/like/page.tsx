import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import {
  convertSlugUrl,
  sendRequest,
  getTrackId,
  getImageUrl,
  getAudioUrl,
} from "@/utils/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tracks you liked",
  description: "miêu tả thôi mà",
};

const getTrackImage = (imgUrl?: string | null) => {
  if (!imgUrl) return "/audio/SC.png";

  return getImageUrl(imgUrl);
};

const LikePage = async () => {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;

  const res = await sendRequest<
    IBackendRes<ITrackTop[] | IModelPaginate<ITrackTop>>
  >({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/liked`,
    method: "GET",
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {},
    nextOption: {
      next: { tags: ["liked-by-user"] },
    },
  });

  const responseData = res?.data as any;

  const likes: ITrackTop[] = Array.isArray(responseData)
    ? responseData
    : responseData?.result ?? [];

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
        {/* Header */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 26, md: 34 },
              fontWeight: 900,
              color: "#ffffff",
              mb: 1,
              textAlign: "center",
            }}
          >
            Tracks you&apos;ve liked
          </Typography>

          <Typography
            sx={{
              color: "#9a9a9a",
              fontSize: 14,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            Listen again to the songs you loved on Sound Clone.
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 3 }} />

        {/* Empty state */}
        {!likes.length && (
          <Box
            sx={{
              minHeight: 260,
              border: "1px dashed rgba(255,255,255,0.14)",
              borderRadius: 3,
              backgroundColor: "#111314",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <FavoriteRoundedIcon
              sx={{
                fontSize: 54,
                color: "#ff5500",
                mb: 1.5,
              }}
            />

            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 900,
                color: "#ffffff",
                mb: 0.8,
              }}
            >
              You haven’t liked any songs yet !.
            </Typography>

            <Typography
              sx={{
                color: "#9a9a9a",
                fontSize: 14,
              }}
            >
              No songs liked so far. Like a track and it will be displayed here.
            </Typography>
          </Box>
        )}

        {/* Track grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {likes.map((track) => {
            const trackId = getTrackId(track);

            const trackSlug =
              (track as any).slug ||
              `${convertSlugUrl(track.title)}-${trackId}`;

            const href = `/track/${trackSlug}.html?audio=${encodeURIComponent(
              getAudioUrl(track.trackUrl)
            )}&autoplay=1`;

            return (
              <Box
                key={trackId}
                sx={{
                  minWidth: 0,
                  borderRadius: 2,
                  backgroundColor: "transparent",
                  transition: "0.18s ease",

                  "&:hover .track-cover-overlay": {
                    opacity: 1,
                  },

                  "&:hover .track-title": {
                    color: "#ff5500",
                  },
                }}
              >
                <Box
                  component={Link}
                  href={href}
                  sx={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: "4px",
                      overflow: "hidden",
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Image
                      alt={track.title}
                      src={getTrackImage(track?.imgUrl)}
                      fill
                      sizes="220px"
                      style={{
                        objectFit: "cover",
                      }}
                    />

                    <Box
                      className="track-cover-overlay"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.58))",
                        opacity: 0,
                        transition: "0.18s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          backgroundColor: "#ff5500",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 12px 28px rgba(255,85,0,0.35)",
                        }}
                      >
                        <PlayArrowRoundedIcon
                          sx={{
                            color: "#ffffff",
                            fontSize: 34,
                            ml: "2px",
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Typography
                    className="track-title"
                    title={track.title}
                    sx={{
                      mt: 1.2,
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 900,
                      lineHeight: 1.35,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      transition: "0.18s ease",
                    }}
                  >
                    {track.title}
                  </Typography>
                </Box>

                <Typography
                  title={track.description}
                  sx={{
                    mt: 0.4,
                    color: "#9a9a9a",
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {track.description || "Unknown artist"}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.4}
                  sx={{
                    mt: 0.8,
                    color: "#8f8f8f",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <PlayArrowRoundedIcon sx={{ fontSize: 16 }} />
                    {track.countPlay ?? 0}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <FavoriteRoundedIcon sx={{ fontSize: 15 }} />
                    {track.countLike ?? 0}
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

export default LikePage;
