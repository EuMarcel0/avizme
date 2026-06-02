import "server-only";

import type Stripe from "stripe";

import type { PlanTier } from "@/lib/billing/plans";
import { getStripe } from "@/lib/billing/stripe-config";
import {
  extractSubscriptionPeriodFields,
  type SubscriptionPeriodFields,
} from "@/lib/billing/subscription-period-fields";
import {
  linkStripeCustomerToUser,
  syncSubscriptionFromStripe,
} from "@/lib/billing/sync-subscription";
import { createServiceClient } from "@/lib/supabase/service";

export type SyncActiveSubscriptionResult = {
  synced: boolean;
  planTier?: PlanTier;
  /** Datas lidas do Stripe (útil se migration 0013 ainda não rodou). */
  periodFields?: SubscriptionPeriodFields;
  reason?: string;
};

async function findActiveSubscription(
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();

  for (const status of ["active", "trialing", "past_due"] as const) {
    const { data } = await stripe.subscriptions.list({
      customer: customerId,
      status,
      limit: 1,
    });
    if (data[0]) return data[0];
  }

  return null;
}

/**
 * Busca assinatura ativa no Stripe e atualiza public.users.
 * Fallback quando o webhook não chegou (comum em dev local).
 */
export async function syncActiveSubscriptionForUser(
  userId: string,
): Promise<SyncActiveSubscriptionResult> {
  const supabase = createServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return { synced: false, reason: profileError.message };
  }

  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    return { synced: false, reason: "Cliente Stripe não vinculado" };
  }

  const subscription = await findActiveSubscription(customerId);
  if (!subscription) {
    return { synced: false, reason: "Nenhuma assinatura ativa no Stripe" };
  }

  await linkStripeCustomerToUser(userId, customerId);
  const periodFields = extractSubscriptionPeriodFields(subscription);
  await syncSubscriptionFromStripe(subscription);

  const { data: updated } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", userId)
    .maybeSingle();

  return {
    synced: true,
    planTier: (updated?.plan_tier as PlanTier | undefined) ?? undefined,
    periodFields,
  };
}
