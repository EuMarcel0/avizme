import "server-only";

import { usagePeriodKey } from "@/lib/billing/get-user-billing";
import { countUsageFromOccurrences } from "@/lib/billing/usage-from-occurrences";
import type { DeliveryChannel } from "@/lib/scheduling/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Espelha totais reais (reminder_occurrences sent) em user_usage_counters. */
export async function persistUsageCountersFromOccurrences(
  supabase: SupabaseClient,
  userId: string,
  reference = new Date(),
): Promise<void> {
  const usage = await countUsageFromOccurrences(supabase, userId, reference);

  const rows: Array<{
    user_id: string;
    period_key: string;
    channel: DeliveryChannel;
    count: number;
  }> = [
    {
      user_id: userId,
      period_key: usagePeriodKey("email", reference),
      channel: "email",
      count: usage.emailToday,
    },
    {
      user_id: userId,
      period_key: usagePeriodKey("sms", reference),
      channel: "sms",
      count: usage.smsThisMonth,
    },
    {
      user_id: userId,
      period_key: usagePeriodKey("whatsapp", reference),
      channel: "whatsapp",
      count: usage.whatsappThisMonth,
    },
  ];

  const { error } = await supabase.from("user_usage_counters").upsert(rows, {
    onConflict: "user_id,period_key,channel",
  });

  if (error) {
    console.error("[billing:persist-usage-counters]", error.message, { userId });
  }
}
