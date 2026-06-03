import { FAQ_ITEMS, SEO_DISCOVERY } from "@/lib/marketing/content";
import { SITE_DESCRIPTION } from "@/lib/marketing/site";
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/marketing/site";

const landingTitle = `${SITE_NAME} — Lembretes, Avisos e Alertas por SMS, WhatsApp e E-mail`;

export function getLandingJsonLd(): { "@context": string; "@graph": object[] } {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: SITE_OG_IMAGE,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_TAGLINE,
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: landingTitle,
      description: SITE_DESCRIPTION,
      inLanguage: "pt-BR",
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "Service",
      name: `${SITE_NAME} — lembretes automáticos`,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "BR",
      serviceType: "Agendamento de lembretes e avisos por mensagem",
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
        description: "Plano Free com lembretes por e-mail",
      },
    },
    {
      "@type": "ItemList",
      name: "Soluções de lembretes e avisos",
      itemListElement: SEO_DISCOVERY.topics.map((topic, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: topic.label,
        url: `${SITE_URL}${topic.href}`,
      })),
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
      },
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      inLanguage: "pt-BR",
      featureList: [
        "Lembretes e avisos por e-mail",
        "Alertas por SMS",
        "Lembrete no WhatsApp",
        "Agendamento e calendário flexível",
        "Lembrete de reunião",
        "Lembrete de medicamento",
        "Lembrete de pagamento",
        "Recados agendados",
        "Histórico de envios",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
