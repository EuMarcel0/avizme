import "server-only";

import { persistUsageCountersFromOccurrences } from "@/lib/billing/persist-usage-counters";
import { usagePeriodKey } from "@/lib/billing/get-user-billing";
import type { DeliveryChannel } from "@/lib/scheduling/types";
import type { SupabaseClient } from "@supabase/supabase-js";

async function incrementCounterRow(
  supabase: SupabaseClient,
  userId: string,
  channel: DeliveryChannel,
  periodKey: string,
  increment: number,
): Promise<boolean> {
  const { error: rpcError } = await supabase.rpc("increment_usage_counter", {
    p_user_id: userId,
    p_period_key: periodKey,
    p_channel: channel,
    p_increment: increment,
  });

  if (!rpcError) return true;

  const { data: existing, error: selectError } = await supabase
    .from("user_usage_counters")
    .select("count")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .eq("channel", channel)
    .maybeSingle();

  if (selectError) {
    console.error("[billing:record-usage] select", selectError.message);
    return false;
  }

  const nextCount = (existing?.count ?? 0) + increment;

  const { error: upsertError } = await supabase.from("user_usage_counters").upsert(
    {
      user_id: userId,
      period_key: periodKey,
      channel,
      count: nextCount,
    },
    { onConflict: "user_id,period_key,channel" },
  );

  if (upsertError) {
    console.error("[billing:record-usage] upsert", upsertError.message, {
      userId,
      periodKey,
      channel,
      increment,
    });
    return false;
  }

  return true;
}

export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  channel: DeliveryChannel,
  increment = 1,
  at: Date = new Date(),
): Promise<void> {
  if (increment <= 0) return;

  const periodKey = usagePeriodKey(channel, at);
  const ok = await incrementCounterRow(
    supabase,
    userId,
    channel,
    periodKey,
    increment,
  );

  if (!ok) {
    await persistUsageCountersFromOccurrences(supabase, userId, at);
  }
}

export async function recordUsageBatch(
  supabase: SupabaseClient,
  userId: string,
  channel: DeliveryChannel,
  sentCount: number,
  at: Date = new Date(),
): Promise<void> {
  if (sentCount <= 0) return;
  await recordUsage(supabase, userId, channel, sentCount, at);
  await persistUsageCountersFromOccurrences(supabase, userId, at);
}
