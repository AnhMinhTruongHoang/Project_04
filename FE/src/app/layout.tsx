import type { Metadata } from "next";
import ThemeRegistry from "@/components/theme-registry/theme.registry";
import NextAuthWrapper from "@/lib/next.auth.wrapper";
import NProgressWrapper from "@/lib/nprogress.wrapper";
import { TrackContextProvider } from "@/lib/track.wrapper";
import { ToastProvider } from "@/utils/toast";
import "../app/globals.scss";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "SoundCloud Clone",
  description: "SoundCloud Clone",
  openGraph: {
    title: "SoundCloud Clone",
    description: "SoundCloud Clone",
    type: "website",
    images: ["/audio/SC.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#181A1B", color: "#FFFFFF" }}>
        <ThemeRegistry>
          <NProgressWrapper>
            <NextAuthWrapper>
              <ToastProvider>
                <TrackContextProvider>{children}</TrackContextProvider>
              </ToastProvider>
            </NextAuthWrapper>
          </NProgressWrapper>
        </ThemeRegistry>
      </body>
    </html>
  );
}
