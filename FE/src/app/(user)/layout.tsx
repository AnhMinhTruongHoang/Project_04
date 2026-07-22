import AppHeader from "@/components/header/app.header";
import AppOpenAds from "@/components/common/app.open.ads";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoundClone",
  description: "Discover, stream, and share music on SoundClone.",

  openGraph: {
    title: "SoundClone",
    description: "Discover, stream, and share music on SoundClone.",
    images: [
      {
        url: "https://res.cloudinary.com/eybmkz9z/image/upload/v1784726300/default_djtlyj.png",
      },
    ],
  },
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

      <AppOpenAds />
    </>
  );
}
