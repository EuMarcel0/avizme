import Link from "next/link";
import { Check } from "lucide-react";

import { authLinkNewTab } from "@/components/marketing/auth-link-props";
import { Button } from "@/components/ui/button";
import { getMarketingPlans } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const plans = getMarketingPlans();

  return (
    <section
      id="planos"
      className="scroll-mt-20 border-b border-border/60 bg-muted/20 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Planos transparentes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Crie sua conta e assine quando precisar de SMS, WhatsApp ou
            destinatários extras.
          </p>
        </div>
        <ul className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <li
              key={plan.tier}
              className={cn(
                "flex flex-col rounded-lg border bg-card p-6 shadow-sm",
                plan.highlighted
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border",
              )}
            >
              {plan.highlighted ? (
                <span className="mb-2 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Mais popular
                </span>
              ) : null}
              <h3 className="font-heading text-xl font-bold">{plan.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                nativeButton={false}
                render={<Link href={plan.ctaHref} {...authLinkNewTab} />}
              >
                {plan.cta}
              </Button>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Valores e cobrança recorrente são definidos no checkout (Stripe) após
          criar sua conta.
        </p>
      </div>
    </section>
  );
}
