import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";
import type { PlanTier } from "@/lib/billing/plans";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

function premiumPriceId(): string | undefined {
  return env.stripePricePremium ?? env.stripePriceBusiness;
}

export function isStripeCheckoutConfigured(): boolean {
  const premium = premiumPriceId();
  return Boolean(
    env.stripeSecretKey &&
      env.stripePricePro &&
      premium &&
      env.stripePricePro.startsWith("price_") &&
      premium.startsWith("price_"),
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(isStripeCheckoutConfigured() && env.stripeWebhookSecret);
}

function stripePriceHint(
  name: string,
  value: string | undefined,
): string | null {
  if (!value) {
    return `${name} não está definida no ambiente (.env local ou variáveis da Vercel). Use um Price ID (price_...).`;
  }
  if (!value.startsWith("price_")) {
    const kind = value.startsWith("prod_") ? "Product ID (prod_...)" : "valor inválido";
    return `${name} deve ser um Price ID (price_...), não ${kind}. Valor atual: ${value.slice(0, 20)}…`;
  }
  return null;
}

export function stripeSetupHint(): string | null {
  if (!env.stripeSecretKey) {
    return "Adicione STRIPE_SECRET_KEY (sk_test_...) no .env ou na Vercel.";
  }
  const proHint = stripePriceHint("STRIPE_PRICE_PRO", env.stripePricePro);
  if (proHint) return proHint;
  const premiumHint = stripePriceHint(
    "STRIPE_PRICE_PREMIUM (ou STRIPE_PRICE_BUSINESS)",
    premiumPriceId(),
  );
  if (premiumHint) return premiumHint;
  return null;
}

export function stripeWebhookHint(): string | null {
  if (!isStripeCheckoutConfigured() || env.stripeWebhookSecret) {
    return null;
  }
  return "Para atualizar o plano automaticamente após pagamento, configure o webhook do Stripe em produção (veja docs/stripe-webhook.md) e adicione STRIPE_WEBHOOK_SECRET na Vercel.";
}

export function planTierFromPriceId(priceId: string): PlanTier | null {
  if (priceId === env.stripePricePro) return "pro";
  const premium = premiumPriceId();
  if (premium && priceId === premium) return "premium";
  return null;
}

export function priceIdForPlan(plan: PlanTier): string {
  if (plan === "pro") {
    if (!env.stripePricePro) throw new Error("STRIPE_PRICE_PRO não configurada");
    return env.stripePricePro;
  }
  const premium = premiumPriceId();
  if (!premium) {
    throw new Error("STRIPE_PRICE_PREMIUM não configurada");
  }
  return premium;
}
