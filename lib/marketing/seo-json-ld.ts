import type { SeoPage } from "@/lib/marketing/seo-pages";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/marketing/site";

export function getSeoPageJsonLd(page: SeoPage) {
  const url = `${SITE_URL}/solucoes/${page.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: page.h1,
        description: page.description,
        inLanguage: "pt-BR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: {
          "@type": "Thing",
          name: page.keywords[0],
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: page.title,
            item: url,
          },
        ],
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: SITE_OG_IMAGE,
      },
    ],
  };
}
