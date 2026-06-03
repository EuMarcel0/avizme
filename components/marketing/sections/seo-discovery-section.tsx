import Link from "next/link";

import { SEO_DISCOVERY } from "@/lib/marketing/content";

export function SeoDiscoverySection() {
  return (
    <section
      id="solucoes"
      className="scroll-mt-20 border-b border-border/60 bg-muted/10 py-16 sm:py-20"
      aria-labelledby="seo-discovery-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="seo-discovery-heading"
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {SEO_DISCOVERY.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{SEO_DISCOVERY.lead}</p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEO_DISCOVERY.topics.map((topic) => (
            <li key={topic.href}>
              <Link
                href={topic.href}
                className="block h-full rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <h3 className="font-heading font-semibold text-foreground">
                  {topic.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topic.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
