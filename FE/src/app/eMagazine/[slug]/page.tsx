import { notFound } from "next/navigation";
import SonTungMagazine from "../sontung/sontung";
import NcsMagazine from "../ncs/ncs";
import WeekndMagazine from "../weeknd/weeknd";
import BlackpinkMagazine from "../blackpink/blackpink";

const magazineMap = {
  sontung: SonTungMagazine,
  ncs: NcsMagazine,
  weeknd: WeekndMagazine,
  blackpink: BlackpinkMagazine,
};

type MagazineSlug = keyof typeof magazineMap;

export default function Page({ params }: { params: { slug: string } }) {
  const Component = magazineMap[params.slug as MagazineSlug];

  if (!Component) {
    notFound();
  }

  return <Component />;
}
