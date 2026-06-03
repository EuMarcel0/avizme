import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/marketing/json-ld";
import { SeoPageTemplate } from "@/components/marketing/seo-page-template";
import { buildSeoPageMetadata } from "@/lib/marketing/page-metadata";
import { getSeoPageJsonLd } from "@/lib/marketing/seo-json-ld";
import {
  getAllSeoSlugs,
  getSeoPage,
} from "@/lib/marketing/seo-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllSeoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) return {};
  return buildSeoPageMetadata(page);
}

export default async function SolucaoSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) notFound();

  return (
    <>
      <JsonLd data={getSeoPageJsonLd(page)} />
      <SeoPageTemplate page={page} />
    </>
  );
}
