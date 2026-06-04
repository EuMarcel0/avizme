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

export function isStripeCheckoutConfigured(): boolean {
  return Boolean(
    env.stripeSecretKey &&
      env.stripePricePro &&
      env.stripePriceBusiness &&
      env.stripePricePro.startsWith("price_") &&
      env.stripePriceBusiness.startsWith("price_"),
  );
}

/** Checkout + webhook completo (sync automático do plano). */
export function isStripeConfigured(): boolean {
  return Boolean(isStripeCheckoutConfigured() && env.stripeWebhookSecret);
}

function stripePriceHint(
  name: "STRIPE_PRICE_PRO" | "STRIPE_PRICE_BUSINESS",
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

/** Bloqueia checkout — preços ou secret ausentes/inválidos. */
export function stripeSetupHint(): string | null {
  if (!env.stripeSecretKey) {
    return "Adicione STRIPE_SECRET_KEY (sk_test_...) no .env ou na Vercel.";
  }
  const proHint = stripePriceHint("STRIPE_PRICE_PRO", env.stripePricePro);
  if (proHint) return proHint;
  const businessHint = stripePriceHint(
    "STRIPE_PRICE_BUSINESS",
    env.stripePriceBusiness,
  );
  if (businessHint) return businessHint;
  return null;
}

/** Opcional — checkout funciona; webhook melhora sync automático do plano. */
export function stripeWebhookHint(): string | null {
  if (!isStripeCheckoutConfigured() || env.stripeWebhookSecret) {
    return null;
  }
  return "Para atualizar o plano automaticamente após pagamento, configure o webhook do Stripe em produção (veja docs/stripe-webhook.md) e adicione STRIPE_WEBHOOK_SECRET na Vercel.";
}

export function planTierFromPriceId(priceId: string): PlanTier | null {
  if (priceId === env.stripePricePro) return "pro";
  if (priceId === env.stripePriceBusiness) return "business";
  return null;
}

export function priceIdForPlan(plan: Exclude<PlanTier, "free">): string {
  if (plan === "pro") {
    if (!env.stripePricePro) throw new Error("STRIPE_PRICE_PRO não configurada");
    return env.stripePricePro;
  }
  if (!env.stripePriceBusiness) {
    throw new Error("STRIPE_PRICE_BUSINESS não configurada");
  }
  return env.stripePriceBusiness;
}
