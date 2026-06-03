import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { authLinkNewTab } from "@/components/marketing/auth-link-props";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="border-t border-border/60 bg-gradient-to-r from-aviz-teal/15 via-aviz-mint/10 to-aviz-sage/15 py-16 dark:from-aviz-teal/25 dark:to-aviz-teal/10 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Pronto para o primeiro lembrete?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Crie sua conta em menos de um minuto e agende o primeiro aviso por
          e-mail — sem cartão.
        </p>
        <Button
          className="mt-8"
          size="lg"
          nativeButton={false}
          render={<Link href="/cadastro" {...authLinkNewTab} />}
        >
          Criar conta grátis
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </section>
  );
}
