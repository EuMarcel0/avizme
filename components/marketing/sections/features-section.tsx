import {
  BarChart3,
  CalendarDays,
  History,
  Mail,
  MessageCircle,
  Smartphone,
} from "lucide-react";

import { FEATURES } from "@/lib/marketing/content";

const ICONS = {
  channels: Mail,
  calendar: CalendarDays,
  history: History,
  chart: BarChart3,
} as const;

export function FeaturesSection() {
  return (
    <section id="recursos" className="scroll-mt-20 border-b border-border/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo para lembrar no momento certo
          </h2>
          <p className="mt-4 text-muted-foreground">
            Um painel único para criar, agendar e acompanhar avisos — do e-mail
            simples ao envio em massa no Business.
          </p>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <li
                key={feature.title}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Mail className="size-4 text-primary" aria-hidden />
            E-mail
          </span>
          <span className="inline-flex items-center gap-2">
            <Smartphone className="size-4 text-primary" aria-hidden />
            SMS
          </span>
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="size-4 text-primary" aria-hidden />
            WhatsApp
          </span>
        </div>
      </div>
    </section>
  );
}
