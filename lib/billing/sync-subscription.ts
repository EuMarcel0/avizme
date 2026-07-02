import "server-only";

import type Stripe from "stripe";

import {
  normalizeStoredPlanTier,
  type PlanTier,
  type SubscriptionStatus,
} from "@/lib/billing/plans";
import { persistUserBilling, persistUserBillingDowngrade } from "@/lib/billing/persist-user-billing";
import { extractSubscriptionPeriodFields } from "@/lib/billing/subscription-period-fields";
import { planTierFromPriceId } from "@/lib/billing/stripe-config";
import { createServiceClient } from "@/lib/supabase/service";

function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}

export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
): Promise<void> {
  const supabase = createServiceClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const priceId = subscription.items.data[0]?.price.id;
  const metaPlan = subscription.metadata?.plan_tier
    ? normalizeStoredPlanTier(subscription.metadata.plan_tier)
    : undefined;
  const fromPrice = priceId ? planTierFromPriceId(priceId) : null;
  const planTier: PlanTier = fromPrice ?? metaPlan ?? "pro";

  if (priceId && !fromPrice) {
    console.warn(
      "[billing:sync] price ID não mapeado no .env:",
      priceId,
      "— confira STRIPE_PRICE_PRO / STRIPE_PRICE_PREMIUM",
    );
  }

  const subscriptionStatus = mapSubscriptionStatus(subscription.status);
  const periodFields = extractSubscriptionPeriodFields(subscription);

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  let userId = userRow?.id as string | undefined;

  if (!userId) {
    const metaUserId =
      subscription.metadata?.avizme_user_id ??
      (typeof subscription.customer === "object" &&
      subscription.customer &&
      !("deleted" in subscription.customer && subscription.customer.deleted)
        ? subscription.customer.metadata?.avizme_user_id
        : undefined);

    if (metaUserId) {
      userId = metaUserId;
      await linkStripeCustomerToUser(userId, customerId);
    }
  }

  if (!userId) {
    console.warn("[billing:sync] usuário não encontrado para customer", customerId);
    return;
  }

  const effectiveTier =
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing" ||
    subscriptionStatus === "past_due"
      ? planTier
      : "pro";

  const effectiveStatus =
    subscriptionStatus === "canceled" ? "none" : subscriptionStatus;

  await persistUserBilling({
    userId,
    planTier: effectiveTier,
    subscriptionStatus: effectiveStatus,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    planPeriodEnd: periodFields.planPeriodEnd,
    cancelAtPeriodEnd: periodFields.cancelAtPeriodEnd,
    subscriptionEndsAt: periodFields.subscriptionEndsAt,
  });
}

export async function downgradeUserByCustomerId(
  customerId: string,
): Promise<void> {
  await persistUserBillingDowngrade(customerId);
}

export async function linkStripeCustomerToUser(
  userId: string,
  customerId: string,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("users")
    .update({
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
