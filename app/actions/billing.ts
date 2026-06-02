"use server";

import { revalidateBillingPaths } from "@/lib/billing/revalidate-billing-paths";
import { redirect } from "next/navigation";

import { getUserBillingContext } from "@/lib/billing/get-user-billing";
import type { PlanTier } from "@/lib/billing/plans";
import {
  getStripe,
  isStripeCheckoutConfigured,
  isStripeConfigured,
  priceIdForPlan,
} from "@/lib/billing/stripe-config";
import { linkStripeCustomerToUser } from "@/lib/billing/sync-subscription";
import { syncActiveSubscriptionForUser } from "@/lib/billing/sync-active-subscription";
import { env } from "@/lib/env";
import { requireAuthenticatedUser } from "@/lib/reminders/require-auth";
import { createClient } from "@/lib/supabase/server";

export type BillingActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createCheckoutSessionAction(
  plan: Exclude<PlanTier, "free">,
): Promise<BillingActionResult> {
  if (!isStripeCheckoutConfigured()) {
    return {
      ok: false,
      error: "Pagamentos ainda não configurados. Verifique STRIPE_SECRET_KEY e os Price IDs (price_...) no .env.",
    };
  }

  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
  } catch {
    return { ok: false, error: "Não autenticado" };
  }

  const billing = await getUserBillingContext(supabase, user.id);
  if (billing.planTier === plan && billing.subscriptionStatus === "active") {
    return { ok: false, error: "Você já está neste plano." };
  }

  const stripe = getStripe();
  let customerId = (
    await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle()
  ).data?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { avizme_user_id: user.id },
    });
    customerId = customer.id;
    await linkStripeCustomerToUser(user.id, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
    success_url: `${env.appUrl}/app/plano?success=1`,
    cancel_url: `${env.appUrl}/app/plano?canceled=1`,
    metadata: {
      avizme_user_id: user.id,
      plan_tier: plan,
    },
    subscription_data: {
      metadata: {
        avizme_user_id: user.id,
        plan_tier: plan,
      },
    },
  });

  if (!session.url) {
    return { ok: false, error: "Não foi possível iniciar o checkout." };
  }

  return { ok: true, url: session.url };
}

export async function createBillingPortalAction(): Promise<BillingActionResult> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      error: "Portal de cobrança não configurado.",
    };
  }

  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
  } catch {
    return { ok: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return {
      ok: false,
      error: "Nenhuma assinatura encontrada para gerenciar.",
    };
  }

  const portal = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${env.appUrl}/app/plano`,
  });

  redirect(portal.url);
}

export async function redirectToCheckoutAction(
  plan: Exclude<PlanTier, "free">,
): Promise<void> {
  const result = await createCheckoutSessionAction(plan);
  if (!result.ok) {
    redirect(`/app/plano?error=${encodeURIComponent(result.error)}`);
  }
  redirect(result.url);
}

/** Sincroniza plano com Stripe após checkout (fallback se webhook falhar). */
export async function syncSubscriptionAfterCheckoutAction(): Promise<{
  ok: boolean;
  planTier?: string;
  reason?: string;
}> {
  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
  } catch {
    return { ok: false, reason: "Não autenticado" };
  }

  try {
    const result = await syncActiveSubscriptionForUser(user.id);
    if (!result.synced) {
      return { ok: false, reason: result.reason };
    }
    revalidateBillingPaths();
    return { ok: true, planTier: result.planTier };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao sincronizar plano";
    return { ok: false, reason: message };
  }
}
