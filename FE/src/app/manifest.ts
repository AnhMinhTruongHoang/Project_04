import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SoundClone",
    short_name: "SoundClone",
    description: "Discover, stream, and share music on SoundClone.",

    icons: [
      {
        src: "https://res.cloudinary.com/eybmkz9z/image/upload/v1784726300/default_djtlyj.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "https://res.cloudinary.com/eybmkz9z/image/upload/v1784726300/default_djtlyj.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    theme_color: "#121212",
    background_color: "#121212",

    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
  };
}
