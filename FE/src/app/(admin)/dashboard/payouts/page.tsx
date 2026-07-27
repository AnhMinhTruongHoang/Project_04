import ArtistPayoutsTable from "@/components/dashboard/payouts/ArtistPayoutsTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artist Payouts | SoundClone Admin",
  description: "Review and process artist payout requests.",
};

const ArtistPayoutsPage = () => {
  return <ArtistPayoutsTable />;
};

export default ArtistPayoutsPage;
