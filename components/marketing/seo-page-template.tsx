import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { authLinkNewTab } from "@/components/marketing/auth-link-props";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Button } from "@/components/ui/button";
import type { SeoPage } from "@/lib/marketing/seo-pages";
import { getSeoPage } from "@/lib/marketing/seo-pages";

export function SeoPageTemplate({ page }: { page: SeoPage }) {
  const related = page.relatedSlugs
    .map((slug) => getSeoPage(slug))
    .filter((p): p is SeoPage => Boolean(p));

  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-foreground">
                Início
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/#solucoes" className="hover:text-foreground">
                Soluções
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground">{page.h1}</li>
          </ol>
        </nav>
        <article>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {page.h1}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{page.intro}</p>
          <div className="mt-8 space-y-4 text-muted-foreground">
            {page.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              render={<Link href="/cadastro" {...authLinkNewTab} />}
            >
              Criar conta grátis
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Voltar à página inicial
            </Button>
          </div>
        </article>
        {related.length > 0 ? (
          <aside className="mt-14 border-t border-border pt-10">
            <h2 className="font-heading text-lg font-semibold">
              Relacionados
            </h2>
            <ul className="mt-4 space-y-2">
              {related.map((rel) => (
                <li key={rel.slug}>
                  <Link
                    href={`/solucoes/${rel.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {rel.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </main>
      <MarketingFooter />
    </>
  );
}
