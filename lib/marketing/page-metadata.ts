import type { Metadata } from "next";

import type { SeoPage } from "@/lib/marketing/seo-pages";
import { SITE_NAME, SITE_URL } from "@/lib/marketing/site";

export function buildSeoPageMetadata(page: SeoPage): Metadata {
  const canonical = `/solucoes/${page.slug}`;
  const title = `${page.title} | ${SITE_NAME}`;

  return {
    title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description: page.description,
      url: `${SITE_URL}${canonical}`,
      type: "article",
      locale: "pt_BR",
    },
    robots: { index: true, follow: true },
  };
}
