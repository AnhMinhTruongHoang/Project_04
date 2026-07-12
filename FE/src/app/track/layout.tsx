import AppHeader from "@/components/header/app.header";
import Box from "@mui/material/Box";
import type { Metadata } from "next";
import Script from "next/script";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const LOGO_URL = `${SITE_URL}/images/logo/Sc.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "SoundClone",
    template: "%s | SoundClone",
  },

  description:
    "Listen to music, discover artists, create playlists and share tracks on SoundClone.",

  applicationName: "SoundClone",

  keywords: [
    "SoundClone",
    "music",
    "audio",
    "tracks",
    "artists",
    "playlists",
    "SoundCloud Clone",
  ],

  authors: [
    {
      name: "SoundClone",
      url: SITE_URL,
    },
  ],

  creator: "SoundClone",
  publisher: "SoundClone",

  alternates: {
    canonical: SITE_URL,
  },

  icons: {
    icon: [
      {
        url: "/images/logo/Sc.png",
        type: "image/png",
      },
    ],
    shortcut: "/images/logo/Sc.png",
    apple: "/images/logo/Sc.png",
  },

  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "SoundClone",
    title: "SoundClone",
    description:
      "Listen to music, discover artists, create playlists and share tracks on SoundClone.",
    images: [
      {
        url: "/images/logo/Sc.png",
        width: 1080,
        height: 1080,
        alt: "SoundClone",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "SoundClone",
    description:
      "Listen to music, discover artists, create playlists and share tracks on SoundClone.",
    images: ["/images/logo/Sc.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "SoundClone",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
        width: 1080,
        height: 1080,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "SoundClone",
      url: SITE_URL,
      description:
        "Listen to music, discover artists, create playlists and share tracks on SoundClone.",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />

      {children}

      <Box
        aria-hidden="true"
        sx={{
          height: "100px",
        }}
      />

      <Script
        id="soundclone-structured-data"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
