import type { Metadata } from "next";
import ClientSearch from "./components/client.search";

export const metadata: Metadata = {
  title: "Search tracks",
  description: "Search tracks on Sound Clone",
};

type Props = {
  searchParams: {
    q?: string;
  };
};

const SearchPage = ({ searchParams }: Props) => {
  return <ClientSearch query={searchParams?.q || ""} />;
};

export default SearchPage;
