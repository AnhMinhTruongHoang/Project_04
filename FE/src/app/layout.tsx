import type { Metadata } from "next";

import ThemeRegistry from "@/components/theme-registry/theme.registry";
import BackendStartupLoader from "@/components/loading/BackendStartupLoader";
import AppFooter from "@/components/footer/app.footer";

import NextAuthWrapper from "@/lib/next.auth.wrapper";
import NProgressWrapper from "@/lib/nprogress.wrapper";
import { TrackContextProvider } from "@/lib/track.wrapper";

import { ToastProvider } from "@/utils/toast";

import "../app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),

  title: "SoundClone",
  description: "SoundClone",

  openGraph: {
    title: "SoundClone",
    description: "SoundClone",
    type: "website",
    images: [
      "https://res.cloudinary.com/eybmkz9z/image/upload/v1784726300/default_djtlyj.png",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#181A1B",
          color: "#FFFFFF",
        }}
      >
        {/* BACKEND STARTUP LOADER */}
        <BackendStartupLoader>
          {/* APP THEME */}
          <ThemeRegistry>
            {/* PAGE NAVIGATION PROGRESS */}
            <NProgressWrapper>
              {/* AUTH SESSION */}
              <NextAuthWrapper>
                {/* GLOBAL TOAST */}
                <ToastProvider>
                  {/* GLOBAL AUDIO / TRACK STATE */}
                  <TrackContextProvider>
                    {/* PAGE CONTENT */}
                    {children}

                    {/* GLOBAL AUDIO PLAYER */}
                    <AppFooter />
                  </TrackContextProvider>
                </ToastProvider>
              </NextAuthWrapper>
            </NProgressWrapper>
          </ThemeRegistry>
        </BackendStartupLoader>
      </body>
    </html>
  );
}
