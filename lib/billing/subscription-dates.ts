import { formatBillingDate } from "@/lib/billing/format-billing-date";
import type { PlanTier, SubscriptionStatus } from "@/lib/billing/plans";
import { hasActiveSubscription } from "@/lib/billing/plans";

export type SubscriptionDatesDisplay = {
  primary: string | null;
  secondary: string | null;
  variant: "default" | "warning" | "destructive";
};

export function buildSubscriptionDatesDisplay(input: {
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  planPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionEndsAt: string | null;
}): SubscriptionDatesDisplay | null {
  if (!hasActiveSubscription(input.subscriptionStatus)) return null;

  const periodEnd = input.planPeriodEnd;
  const endsAt = input.subscriptionEndsAt ?? periodEnd;
  const isCanceling =
    input.cancelAtPeriodEnd || input.subscriptionEndsAt !== null;

  if (input.subscriptionStatus === "past_due") {
    return {
      primary: endsAt
        ? `Pagamento pendente — regularize até o fim do período (${formatBillingDate(endsAt)})`
        : "Pagamento pendente — regularize no portal de cobrança",
      secondary:
        "Enquanto o Stripe mantiver a assinatura, os limites do plano continuam valendo.",
      variant: "destructive",
    };
  }

  if (input.subscriptionStatus === "trialing" && periodEnd) {
    const endLabel = formatBillingDate(endsAt ?? periodEnd);
    return {
      primary: isCanceling
        ? `Período de teste até ${endLabel}`
        : `Período de teste até ${formatBillingDate(periodEnd)}`,
      secondary: isCanceling
        ? "Depois dessa data você volta ao Pro sem assinatura (limite de 10 lembretes)."
        : "Após o teste, a cobrança mensal começa automaticamente.",
      variant: isCanceling ? "warning" : "default",
    };
  }

  if (isCanceling && endsAt) {
    return {
      primary: `Seu plano permanece ativo até ${formatBillingDate(endsAt)}`,
      secondary:
        "A assinatura não será renovada. Depois dessa data você volta ao Pro sem assinatura.",
      variant: "warning",
    };
  }

  if (periodEnd) {
    return {
      primary: `Próxima renovação em ${formatBillingDate(periodEnd)}`,
      secondary: "Cobrança mensal automática via Stripe.",
      variant: "default",
    };
  }

  return null;
}
