import "server-only";

import { formatInTimeZone } from "date-fns-tz";

import {
  effectivePlanTier,
  PLAN_LIMITS,
  type PlanTier,
  type SubscriptionStatus,
} from "@/lib/billing/plans";
import { countUsageFromOccurrences } from "@/lib/billing/usage-from-occurrences";
import type { DeliveryChannel } from "@/lib/scheduling/types";
import { isMissingSubscriptionDatesColumnsError } from "@/lib/billing/subscription-period-fields";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const APP_TIMEZONE = "America/Sao_Paulo";

export type UserBillingContext = {
  userId: string;
  planTier: PlanTier;
  rawPlanTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  planPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionEndsAt: string | null;
  limits: (typeof PLAN_LIMITS)[PlanTier];
  usage: {
    emailToday: number;
    smsThisMonth: number;
    whatsappThisMonth: number;
    activeReminders: number;
  };
};

function dailyPeriodKey(date = new Date()): string {
  return `daily:${formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd")}`;
}

function monthlyPeriodKey(date = new Date()): string {
  return `monthly:${formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM")}`;
}

function usagePeriodKey(channel: DeliveryChannel, date = new Date()): string {
  if (channel === "email") return dailyPeriodKey(date);
  return monthlyPeriodKey(date);
}

const BILLING_PROFILE_SELECT_FULL =
  "plan_tier, subscription_status, stripe_customer_id, stripe_subscription_id, plan_period_end, subscription_cancel_at_period_end, subscription_ends_at";

const BILLING_PROFILE_SELECT_LEGACY =
  "plan_tier, subscription_status, stripe_customer_id, stripe_subscription_id, plan_period_end";

async function fetchBillingProfile(
  supabase: SupabaseClient,
  userId: string,
) {
  const full = await supabase
    .from("users")
    .select(BILLING_PROFILE_SELECT_FULL)
    .eq("id", userId)
    .maybeSingle();

  if (!full.error) {
    return { data: full.data, hasDateColumns: true as const };
  }

  if (!isMissingSubscriptionDatesColumnsError(full.error.message)) {
    throw full.error;
  }

  const legacy = await supabase
    .from("users")
    .select(BILLING_PROFILE_SELECT_LEGACY)
    .eq("id", userId)
    .maybeSingle();

  if (legacy.error) throw legacy.error;

  return { data: legacy.data, hasDateColumns: false as const };
}

export async function getUserBillingContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserBillingContext> {
  const { data: profile } = await fetchBillingProfile(supabase, userId);

  const rawPlanTier = (profile?.plan_tier ?? "free") as PlanTier;
  const subscriptionStatus = (profile?.subscription_status ??
    "none") as SubscriptionStatus;
  const planTier = effectivePlanTier(rawPlanTier, subscriptionStatus);
  const limits = PLAN_LIMITS[planTier];
  const planPeriodEnd = (profile?.plan_period_end as string | null) ?? null;
  const cancelAtPeriodEnd =
    "subscription_cancel_at_period_end" in (profile ?? {})
      ? ((profile as { subscription_cancel_at_period_end?: boolean })
          .subscription_cancel_at_period_end ?? false)
      : false;
  const subscriptionEndsAt =
    "subscription_ends_at" in (profile ?? {})
      ? ((profile as { subscription_ends_at?: string | null }).subscription_ends_at ??
        null)
      : null;

  const emailKey = usagePeriodKey("email");
  const smsKey = usagePeriodKey("sms");
  const whatsappKey = usagePeriodKey("whatsapp");

  const [{ data: usageRows }, { count: activeReminders }, usageFromOccurrences] =
    await Promise.all([
    supabase
      .from("user_usage_counters")
      .select("period_key, channel, count")
      .eq("user_id", userId)
      .in("period_key", [emailKey, smsKey, whatsappKey]),
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["active", "paused"]),
    countUsageFromOccurrences(supabase, userId),
  ]);

  const usageByKey = new Map<string, number>();
  for (const row of usageRows ?? []) {
    usageByKey.set(
      `${row.period_key}:${row.channel}`,
      row.count as number,
    );
  }

  const emailFromCounters = usageByKey.get(`${emailKey}:email`) ?? 0;
  const smsFromCounters = usageByKey.get(`${smsKey}:sms`) ?? 0;
  const whatsappFromCounters = usageByKey.get(`${whatsappKey}:whatsapp`) ?? 0;

  return {
    userId,
    planTier,
    rawPlanTier,
    subscriptionStatus,
    planPeriodEnd,
    cancelAtPeriodEnd,
    subscriptionEndsAt,
    limits,
    usage: {
      emailToday: Math.max(emailFromCounters, usageFromOccurrences.emailToday),
      smsThisMonth: Math.max(smsFromCounters, usageFromOccurrences.smsThisMonth),
      whatsappThisMonth: Math.max(
        whatsappFromCounters,
        usageFromOccurrences.whatsappThisMonth,
      ),
      activeReminders: activeReminders ?? 0,
    },
  };
}

export async function getAuthenticatedUserBillingContext(): Promise<UserBillingContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getUserBillingContext(supabase, user.id);
}

export { usagePeriodKey, dailyPeriodKey, monthlyPeriodKey };
