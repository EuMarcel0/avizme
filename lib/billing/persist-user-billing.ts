import "server-only";

import type { PlanTier, SubscriptionStatus } from "@/lib/billing/plans";
import { isMissingSubscriptionDatesColumnsError } from "@/lib/billing/subscription-period-fields";
import { createServiceClient } from "@/lib/supabase/service";

type PersistUserBillingInput = {
  userId: string;
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string;
  planPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionEndsAt: string | null;
};

export async function persistUserBilling(
  input: PersistUserBillingInput,
): Promise<void> {
  const supabase = createServiceClient();
  const updatedAt = new Date().toISOString();

  const base = {
    plan_tier: input.planTier,
    subscription_status: input.subscriptionStatus,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_customer_id: input.stripeCustomerId,
    plan_period_end: input.planPeriodEnd,
    updated_at: updatedAt,
  };

  const extended = {
    ...base,
    subscription_cancel_at_period_end: input.cancelAtPeriodEnd,
    subscription_ends_at: input.subscriptionEndsAt,
  };

  const { error: extendedError } = await supabase
    .from("users")
    .update(extended)
    .eq("id", input.userId);

  if (!extendedError) return;

  if (!isMissingSubscriptionDatesColumnsError(extendedError.message)) {
    throw extendedError;
  }

  console.warn(
    "[billing:persist] colunas de datas ausentes — rode db/migrations/0013_subscription_dates.sql no Supabase",
  );

  const { error: baseError } = await supabase
    .from("users")
    .update(base)
    .eq("id", input.userId);

  if (baseError) throw baseError;
}

export async function persistUserBillingDowngrade(
  customerId: string,
): Promise<void> {
  const supabase = createServiceClient();
  const updatedAt = new Date().toISOString();

  const base = {
    plan_tier: "free" as const,
    subscription_status: "none" as const,
    stripe_subscription_id: null,
    plan_period_end: null,
    updated_at: updatedAt,
  };

  const extended = {
    ...base,
    subscription_cancel_at_period_end: false,
    subscription_ends_at: null,
  };

  const { error: extendedError } = await supabase
    .from("users")
    .update(extended)
    .eq("stripe_customer_id", customerId);

  if (!extendedError) return;

  if (!isMissingSubscriptionDatesColumnsError(extendedError.message)) {
    throw extendedError;
  }

  const { error: baseError } = await supabase
    .from("users")
    .update(base)
    .eq("stripe_customer_id", customerId);

  if (baseError) throw baseError;
}
