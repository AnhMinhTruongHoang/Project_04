import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import WaveTrack from "@/components/track/wave.track";
import { sendRequest } from "@/utils/api";
import { notFound } from "next/navigation";
import AddPlaylistTrack from "@/app/(user)/playlist/components/add.playlist.track";

type Props = {
  params: {
    slug: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/logo/Sc.png`;

const getTrackIdFromSlug = (slug?: string) => {
  if (!slug) return "";

  const cleanSlug = slug.replace(".html", "");
  const parts = cleanSlug.split("-");

  return parts[parts.length - 1] || "";
};

const getOgImage = (imgUrl?: string) => {
  if (!imgUrl) return DEFAULT_OG_IMAGE;

  if (imgUrl.startsWith("http")) return imgUrl;

  if (imgUrl.startsWith("/")) {
    return `${SITE_URL}${imgUrl}`;
  }

  return `${BACKEND_URL}/images/${imgUrl}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = getTrackIdFromSlug(params?.slug);

  if (!id) {
    return {
      title: "Track not found",
      description: "This track could not be found.",
      openGraph: {
        title: "Track not found",
        description: "This track could not be found.",
        type: "website",
        images: [DEFAULT_OG_IMAGE],
      },
    };
  }

  try {
    const res = await sendRequest<IBackendRes<ITrackTop>>({
      url: `${BACKEND_URL}/api/v1/tracks/${id}`,
      method: "GET",
    });

    const track = res?.data;

    return {
      title: track?.title || "Track detail",
      description: track?.description || "Listen to this track on Sound Clone.",
      openGraph: {
        title: track?.title || "Sound Clone",
        description:
          track?.description || "Listen to this track on Sound Clone.",
        type: "website",
        images: [getOgImage(track?.imgUrl)],
      },
    };
  } catch (error) {
    console.log("GENERATE TRACK METADATA ERROR:", error);

    return {
      title: "Track detail",
      description: "Listen to this track on Sound Clone.",
      openGraph: {
        title: "Sound Clone",
        description: "Listen to this track on Sound Clone.",
        type: "website",
        images: [DEFAULT_OG_IMAGE],
      },
    };
  }
}

const DetailTrackPage = async ({ params }: Props) => {
  const id = getTrackIdFromSlug(params?.slug);

  if (!id) notFound();

  const res = await sendRequest<IBackendRes<ITrackTop>>({
    url: `${BACKEND_URL}/api/v1/tracks/${id}`,
    method: "GET",
    nextOption: {
      next: {
        tags: ["track-by-id"],
      },
    },
  });

  if (!res?.data) notFound();

  const resComments = await sendRequest<
    IBackendRes<IModelPaginate<ITrackComment>>
  >({
    url: `${BACKEND_URL}/api/v1/tracks/comments`,
    method: "POST",
    queryParams: {
      current: 1,
      pageSize: 100,
      trackId: id,
      sort: "-createdAt",
    },
    nextOption: {
      next: {
        tags: ["track-comment"],
      },
    },
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
        sx={{
          pt: 3,
          pb: 6,
        }}
      >
        <WaveTrack
          track={res.data}
          comments={resComments?.data?.result ?? []}
        />
      </Container>
    </Box>
  );
};

export default DetailTrackPage;
