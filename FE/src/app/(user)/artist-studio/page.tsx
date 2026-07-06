import type { Metadata } from "next";
import ArtistStudioView from "./components/artistStudioView";

export const metadata: Metadata = {
  title: "Artist Studio",
  description: "Manage your tracks and artist analytics.",
};

const ArtistStudioPage = () => {
  return <ArtistStudioView />;
};

export default ArtistStudioPage;
