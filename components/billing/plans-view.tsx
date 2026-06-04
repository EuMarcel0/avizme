"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createCheckoutSessionAction } from "@/app/actions/billing";
import { ButtonLabelSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";
import { getPlanFeatures, PLAN_LIMITS, type PlanTier } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import { CalendarClock } from "lucide-react";
type PlansViewProps = {
  billing: ClientBillingInfo;
  setupHint?: string | null;
  webhookHint?: string | null;
};

const PAID_PLANS: Array<{
  tier: Exclude<PlanTier, "free">;
  highlight?: boolean;
}> = [
  { tier: "pro" },
  { tier: "business", highlight: true },
];

export function PlansView({ billing, setupHint, webhookHint }: PlansViewProps) {
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const error = searchParams.get("error");

  async function handleUpgrade(plan: Exclude<PlanTier, "free">) {
    setLoadingPlan(plan);
    const result = await createCheckoutSessionAction(plan);
    setLoadingPlan(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Plano e cobrança</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu plano atual:{" "}
          <span className="font-medium text-foreground">{billing.planLabel}</span>
          {billing.subscriptionStatus === "active" && (
            <Badge variant="secondary" className="ml-2">
              Ativo
            </Badge>
          )}
          {billing.subscriptionStatus === "past_due" && (
            <Badge variant="destructive" className="ml-2">
              Pagamento pendente
            </Badge>
          )}
        </p>
        {billing.subscriptionDates && (
          <SubscriptionDatesBanner dates={billing.subscriptionDates} />
        )}
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Assinatura atualizada com sucesso.
        </div>
      )}
      {canceled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout cancelado. Nenhuma cobrança foi feita.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Uso no período</CardTitle>
          <CardDescription>
            Conta cada envio concluído pelo servidor (e-mail, SMS ou WhatsApp).
            Criar ou agendar um lembrete não incrementa — só depois que a
            mensagem é disparada. Agendamentos futuros entram aqui na hora do
            envio.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <UsageStat
            label="E-mails hoje"
            value={billing.usage.emailToday}
            limit={billing.limits.emailsPerDay}
          />
          <UsageStat
            label="SMS este mês"
            value={billing.usage.smsThisMonth}
            limit={billing.limits.smsPerMonth}
          />
          <UsageStat
            label="WhatsApp este mês"
            value={billing.usage.whatsappThisMonth}
            limit={billing.limits.whatsappPerMonth}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <PlanCard
          tier="free"
          current={billing.planTier === "free"}
          features={getPlanFeatures("free")}
        />

        {PAID_PLANS.map(({ tier, highlight }) => (
          <PlanCard
            key={tier}
            tier={tier}
            current={billing.planTier === tier}
            highlight={highlight}
            features={getPlanFeatures(tier)}
            action={
              billing.planTier === tier ? (
                billing.stripeEnabled ? (
                  <form action="/api/billing/portal" method="post" className="w-full">
                    <Button type="submit" variant="outline" className="w-full">
                      Gerenciar assinatura
                    </Button>
                  </form>
                ) : null
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  variant="default"
                  disabled={!billing.stripeEnabled || loadingPlan !== null}
                  onClick={() => handleUpgrade(tier)}
                >
                  {loadingPlan === tier ? (
                    <ButtonLabelSkeleton className="w-32" />
                  ) : billing.stripeEnabled ? (
                    `Assinar ${PLAN_LIMITS[tier].label}`
                  ) : (
                    "Em breve"
                  )}
                </Button>
              )
            }
          />
        ))}
      </div>

      {setupHint ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {setupHint}
          <p className="mt-2 text-xs opacity-90">
            Após alterar o .env, reinicie o servidor (<code className="font-mono">pnpm dev</code>
            ). Em produção, configure as variáveis na Vercel e faça redeploy.
          </p>
        </div>
      ) : null}

      {webhookHint ? (
        <div className="rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {webhookHint}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Pagamentos processados via Stripe. Dúvidas?{" "}
        <Link href="/app" className="text-primary underline-offset-2 hover:underline">
          Voltar aos lembretes
        </Link>
      </p>
    </div>
  );
}

function SubscriptionDatesBanner({
  dates,
}: {
  dates: NonNullable<ClientBillingInfo["subscriptionDates"]>;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex gap-3 rounded-lg border px-4 py-3 text-sm",
        dates.variant === "destructive" &&
          "border-destructive/30 bg-destructive/5 text-destructive",
        dates.variant === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-950",
        dates.variant === "default" &&
          "border-border/80 bg-muted/30 text-foreground",
      )}
    >
      <CalendarClock
        className={cn(
          "mt-0.5 size-4 shrink-0",
          dates.variant === "destructive" && "text-destructive",
          dates.variant === "warning" && "text-amber-700",
          dates.variant === "default" && "text-muted-foreground",
        )}
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        {dates.primary && <p className="font-medium">{dates.primary}</p>}
        {dates.secondary && (
          <p
            className={cn(
              "text-xs",
              dates.variant === "default"
                ? "text-muted-foreground"
                : "opacity-90",
            )}
          >
            {dates.secondary}
          </p>
        )}
      </div>
    </div>
  );
}

function UsageStat({
  label,
  value,
  limit,
}: {
  label: string;
  value: number;
  limit: number | null;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value}
        {limit !== null && (
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {limit}
          </span>
        )}
        {limit === null && (
          <span className="text-sm font-normal text-muted-foreground"> / ∞</span>
        )}
      </p>
    </div>
  );
}

function PlanCard({
  tier,
  current,
  highlight,
  features,
  action,
}: {
  tier: PlanTier;
  current: boolean;
  highlight?: boolean;
  features: ReturnType<typeof getPlanFeatures>;
  action?: React.ReactNode;
}) {
  const plan = PLAN_LIMITS[tier];
  return (
    <Card
      className={cn(
        "flex flex-col border-border/80",
        highlight && "border-primary/40 shadow-md",
        current && "ring-2 ring-primary/30",
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{plan.label}</CardTitle>
          {current && <Badge>Atual</Badge>}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {features.map((feature) => (
          <p
            key={feature.text}
            className={cn(
              "text-sm",
              feature.included ? "text-foreground" : "text-muted-foreground line-through",
            )}
          >
            {feature.included ? "✓" : "—"} {feature.text}
          </p>
        ))}
      </CardContent>
      {action && <CardFooter className="w-full [&>*]:w-full">{action}</CardFooter>}
    </Card>
  );
}
