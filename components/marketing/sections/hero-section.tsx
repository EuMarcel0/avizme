import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { authLinkNewTab } from "@/components/marketing/auth-link-props";
import { Button } from "@/components/ui/button";
import { HERO, TRUST_POINTS, USE_CASES } from "@/lib/marketing/content";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-aviz-cream/40 via-background to-background dark:from-aviz-teal/10"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
            {HERO.eyebrow}
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {HERO.title}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            {HERO.subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/cadastro" {...authLinkNewTab} />}
            >
              {HERO.primaryCta}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="#planos" />}
            >
              {HERO.secondaryCta}
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-1.5">
                <Check className="size-4 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto mt-14 max-w-2xl rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Perfeito para
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {USE_CASES.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
