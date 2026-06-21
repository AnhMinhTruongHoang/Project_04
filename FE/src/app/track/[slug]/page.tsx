import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import WaveTrack from "@/components/track/wave.track";
import { sendRequest } from "@/utils/api";
import { notFound } from "next/navigation";

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

// Giữ nguyên slug, không tách lấy id cuối nữa
// VD: lofi-midnight-rain-1b0e0f.html => lofi-midnight-rain-1b0e0f
const getTrackKeyFromSlug = (slug?: string) => {
  if (!slug) return "";

  return decodeURIComponent(slug).replace(".html", "");
};

const getTrackId = (track?: ITrackTop) => {
  if (!track) return "";

  return (track as any)._id || (track as any).id || "";
};

const getOgImage = (imgUrl?: string) => {
  if (!imgUrl) return DEFAULT_OG_IMAGE;

  if (imgUrl.startsWith("http")) return imgUrl;

  if (imgUrl.startsWith("/uploads/images")) {
    return `${BACKEND_URL}${imgUrl}`;
  }

  if (imgUrl.startsWith("/")) {
    return `${SITE_URL}${imgUrl}`;
  }

  return `${BACKEND_URL}/uploads/images/${imgUrl}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trackKey = getTrackKeyFromSlug(params?.slug);

  if (!trackKey) {
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
      url: `${BACKEND_URL}/api/v1/tracks/${trackKey}`,
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
  const trackKey = getTrackKeyFromSlug(params?.slug);

  if (!trackKey) notFound();

  const res = await sendRequest<IBackendRes<ITrackTop>>({
    url: `${BACKEND_URL}/api/v1/tracks/${trackKey}`,
    method: "GET",
    nextOption: {
      next: {
        tags: ["track-by-id"],
      },
    },
  });

  if (!res?.data) notFound();

  const trackId = getTrackId(res.data);

  const resComments = await sendRequest<IBackendRes<ITrackComment[]>>({
    url: `${BACKEND_URL}/api/v1/tracks/${trackId}/comments`,
    method: "GET",
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
          comments={resComments?.data ?? []}
          autoPlay
        />
      </Container>
    </Box>
  );
};

export default DetailTrackPage;
