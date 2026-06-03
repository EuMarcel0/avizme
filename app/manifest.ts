import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/marketing/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#53a08e",
    lang: "pt-BR",
    icons: [
      {
        src: "/images/LOGOTIPO.png",
        sizes: "320x104",
        type: "image/png",
      },
    ],
  };
}
