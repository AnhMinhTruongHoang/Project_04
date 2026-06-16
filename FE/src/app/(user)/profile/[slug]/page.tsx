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

const getUserIdFromSlug = (slug: string) => {
  if (!slug) return "";

  const parts = slug.split("-");
  return parts[parts.length - 1] || slug;
};

const ProfilePage = async ({ params }: { params: { slug: string } }) => {
  const userId = getUserIdFromSlug(params.slug);
  const session = await getServerSession(authOptions);

  const accessToken = (session as any)?.access_token;

  const headers = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};

  const [tracksRes, userRes] = await Promise.all([
    sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
      url: `${BACKEND_URL}/api/v1/tracks/users`,
      method: "POST",
      queryParams: {
        current: 1,
        pageSize: 100,
      },
      body: {
        id: userId,
      },
      headers,
      nextOption: {
        next: {
          tags: ["track-by-profile"],
        },
      },
    }),

    sendRequest<IBackendRes<IUser>>({
      url: `${BACKEND_URL}/api/v1/users/${userId}`,
      method: "GET",
      headers,
      nextOption: {
        next: {
          tags: ["profile-user"],
        },
      },
    }),
  ]);

  const tracks = tracksRes?.data?.result ?? [];

  const sessionUser = session?.user as any;

  const profileUser =
    userRes?.data ??
    (sessionUser?._id === userId
      ? sessionUser
      : {
          _id: userId,
          name: "User",
          email: "",
          role: "USER",
          type: "SYSTEM",
        });

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
