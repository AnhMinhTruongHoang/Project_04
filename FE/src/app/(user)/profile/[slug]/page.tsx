import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import { sendRequest } from "@/utils/api";
import ProfileHero from "../components/profile.hero";
import ProfileMain from "../components/profile.main";

export const metadata: Metadata = {
  title: "Profile",
  description: "User profile on Sound Clone",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const getUserIdFromSlug = (slug: string) => {
  if (!slug) return "";

  const cleanSlug = decodeURIComponent(slug).replace(".html", "");
  const parts = cleanSlug.split("-");

  return parts[parts.length - 1] || cleanSlug;
};

const normalizeUser = (user?: any, fallbackId = ""): IUser => {
  const userId = getItemId(user) || fallbackId;

  return {
    ...user,
    _id: userId,
    id: userId,
    name: user?.name || user?.email || "User",
    email: user?.email || "",
    role: user?.role || "USER",
    type: user?.type || "SYSTEM",
  } as any;
};

const ProfilePage = async ({ params }: { params: { slug: string } }) => {
  const userId = getUserIdFromSlug(params.slug);
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.access_token;
  const headers: Record<string, string> = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const [tracksRes, userRes] = await Promise.all([
    sendRequest<IBackendRes<ITrackTop[]>>({
      url: `${BACKEND_URL}/api/v1/tracks/users/${encodeURIComponent(userId)}`,
      method: "GET",
      headers,
      nextOption: {
        cache: "no-store",
      },
    }),

    sendRequest<IBackendRes<IUser>>({
      url: `${BACKEND_URL}/api/v1/users/${encodeURIComponent(userId)}`,
      method: "GET",
      headers,
      nextOption: {
        cache: "no-store",
      },
    }),
  ]);

  const responseTracks = tracksRes?.data as any;

  const tracks: ITrackTop[] = Array.isArray(responseTracks)
    ? responseTracks
    : responseTracks?.result ?? [];

  const sessionUser = session?.user as any;
  const sessionUserId = getItemId(sessionUser);

  const profileUser = userRes?.data
    ? normalizeUser(userRes.data, userId)
    : sessionUserId === userId
    ? normalizeUser(sessionUser, userId)
    : normalizeUser(null, userId);

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
        disableGutters
        sx={{
          pt: 0,
          pb: 6,
        }}
      >
        <ProfileHero user={profileUser} trackCount={tracks.length} />

        <ProfileMain user={profileUser} tracks={tracks} />
      </Container>
    </Box>
  );
};

export default ProfilePage;
