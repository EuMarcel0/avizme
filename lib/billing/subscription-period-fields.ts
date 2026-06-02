import type Stripe from "stripe";

export type SubscriptionPeriodFields = {
  planPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionEndsAt: string | null;
};

export function isMissingSubscriptionDatesColumnsError(message: string): boolean {
  return (
    message.includes("subscription_cancel_at_period_end") ||
    message.includes("subscription_ends_at")
  );
}

export function extractSubscriptionPeriodFields(
  subscription: Stripe.Subscription,
): SubscriptionPeriodFields {
  const periodEndSeconds =
    "current_period_end" in subscription
      ? (subscription as Stripe.Subscription & { current_period_end?: number })
          .current_period_end
      : undefined;
  const planPeriodEnd = periodEndSeconds
    ? new Date(periodEndSeconds * 1000).toISOString()
    : null;

  const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? false;
  const cancelAtSeconds = subscription.cancel_at ?? null;
  const subscriptionEndsAt = cancelAtSeconds
    ? new Date(cancelAtSeconds * 1000).toISOString()
    : cancelAtPeriodEnd && planPeriodEnd
      ? planPeriodEnd
      : null;

  return { planPeriodEnd, cancelAtPeriodEnd, subscriptionEndsAt };
}
