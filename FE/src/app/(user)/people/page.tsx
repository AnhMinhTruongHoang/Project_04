import type { Metadata } from "next";
import WhoToFollow from "./components/whoToFollow";

export const metadata: Metadata = {
  title: "Who to follow | SoundClone",
  description: "Discover artists and creators on SoundClone.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PeoplePage = () => {
  return <WhoToFollow />;
};

export default PeoplePage;
