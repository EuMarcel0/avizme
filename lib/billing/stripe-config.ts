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

export function stripeSetupHint(): string | null {
  if (!env.stripeSecretKey) {
    return "Adicione STRIPE_SECRET_KEY (sk_test_...) no .env";
  }
  if (!env.stripePricePro?.startsWith("price_")) {
    return "STRIPE_PRICE_PRO deve ser um Price ID (price_...), não Product ID (prod_...)";
  }
  if (!env.stripePriceBusiness?.startsWith("price_")) {
    return "STRIPE_PRICE_BUSINESS deve ser um Price ID (price_...), não Product ID (prod_...)";
  }
  if (!env.stripeWebhookSecret) {
    return "Rode stripe listen e adicione STRIPE_WEBHOOK_SECRET (whsec_...) para sincronizar o plano após pagamento";
  }
  return null;
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
