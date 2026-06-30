import type { Metadata } from "next";
import ClientSearch from "./components/client.search";

export const metadata: Metadata = {
  title: "Search tracks",
  description: "Search tracks on Sound Clone",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: {
    q?: string;
  };
};

const SearchPage = ({ searchParams }: Props) => {
  const keyword = searchParams?.q || "";

  return <ClientSearch key={keyword} query={keyword} />;
};

export default SearchPage;
