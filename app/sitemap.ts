import type { MetadataRoute } from "next";

import { SEO_PAGES } from "@/lib/marketing/seo-pages";
import { SITE_URL } from "@/lib/marketing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const seoRoutes: MetadataRoute.Sitemap = SEO_PAGES.map((page) => ({
    url: `${SITE_URL}/solucoes/${page.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...seoRoutes,
    {
      url: `${SITE_URL}/cadastro`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
