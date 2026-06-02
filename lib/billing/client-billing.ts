import type { UserBillingContext } from "@/lib/billing/get-user-billing";
import { allowedScheduleModesForPlan, getPlanFeatures, PLAN_LIMITS, type PlanTier } from "@/lib/billing/plans";
import type { SubscriptionPeriodFields } from "@/lib/billing/subscription-period-fields";
import {
  buildSubscriptionDatesDisplay,
  type SubscriptionDatesDisplay,
} from "@/lib/billing/subscription-dates";
import type { ScheduleMode } from "@/lib/reminders/build-schedules";

/** Subconjunto seguro para o cliente (sem IDs Stripe). */
export type ClientBillingInfo = {
  planTier: PlanTier;
  planLabel: string;
  subscriptionStatus: UserBillingContext["subscriptionStatus"];
  subscriptionDates: SubscriptionDatesDisplay | null;
  features: ReturnType<typeof getPlanFeatures>;
  usage: UserBillingContext["usage"];
  limits: {
    emailsPerDay: number | null;
    smsPerMonth: number | null;
    whatsappPerMonth: number | null;
    maxActiveReminders: number;
    allowRecipientLists: boolean;
    maxRecipientsPerChannel: number;
    channels: UserBillingContext["limits"]["channels"];
    allowedScheduleModes: ScheduleMode[];
  };
  stripeEnabled: boolean;
};

export function toClientBillingInfo(
  billing: UserBillingContext,
  stripeEnabled: boolean,
  periodFieldsFromStripe?: SubscriptionPeriodFields | null,
): ClientBillingInfo {
  const { limits, planTier, subscriptionStatus, usage } = billing;
  const planPeriodEnd =
    periodFieldsFromStripe?.planPeriodEnd ?? billing.planPeriodEnd;
  const cancelAtPeriodEnd =
    periodFieldsFromStripe?.cancelAtPeriodEnd ?? billing.cancelAtPeriodEnd;
  const subscriptionEndsAt =
    periodFieldsFromStripe?.subscriptionEndsAt ?? billing.subscriptionEndsAt;

  return {
    planTier,
    planLabel: PLAN_LIMITS[planTier].label,
    subscriptionStatus,
    subscriptionDates: buildSubscriptionDatesDisplay({
      planTier: billing.rawPlanTier,
      subscriptionStatus: billing.subscriptionStatus,
      planPeriodEnd,
      cancelAtPeriodEnd,
      subscriptionEndsAt,
    }),
    features: getPlanFeatures(planTier),
    usage,
    limits: {
      emailsPerDay: limits.emailsPerDay,
      smsPerMonth: limits.smsPerMonth,
      whatsappPerMonth: limits.whatsappPerMonth,
      maxActiveReminders: limits.maxActiveReminders,
      allowRecipientLists: limits.allowRecipientLists,
      maxRecipientsPerChannel: limits.maxRecipientsPerChannel,
      channels: limits.channels,
      allowedScheduleModes: allowedScheduleModesForPlan(planTier),
    },
    stripeEnabled,
  };
}

export function canUseScheduleMode(
  billing: ClientBillingInfo | undefined,
  mode: ScheduleMode,
): boolean {
  if (!billing) return true;
  return billing.limits.allowedScheduleModes.includes(mode);
}

export function canUseChannel(
  billing: ClientBillingInfo,
  channel: "email" | "sms" | "whatsapp",
): boolean {
  return billing.limits.channels.includes(channel);
}
