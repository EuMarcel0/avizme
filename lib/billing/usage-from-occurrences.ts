import "server-only";

import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import type { DeliveryChannel } from "@/lib/scheduling/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const APP_TIMEZONE = "America/Sao_Paulo";

function periodBoundsInUtc(reference = new Date()) {
  const zoned = toZonedTime(reference, APP_TIMEZONE);
  const dayStart = fromZonedTime(startOfDay(zoned), APP_TIMEZONE);
  const dayEnd = fromZonedTime(endOfDay(zoned), APP_TIMEZONE);
  const monthStart = fromZonedTime(startOfMonth(zoned), APP_TIMEZONE);
  return { dayStart, dayEnd, monthStart };
}

async function countSentInRange(
  supabase: SupabaseClient,
  userId: string,
  channel: DeliveryChannel,
  fromIso: string,
  toIso?: string,
): Promise<number> {
  let query = supabase
    .from("reminder_occurrences")
    .select("id, reminders!inner(user_id)", { count: "exact", head: true })
    .eq("status", "sent")
    .eq("channel", channel)
    .eq("reminders.user_id", userId)
    .gte("sent_at", fromIso);

  if (toIso) {
    query = query.lte("sent_at", toIso);
  }

  const { count, error } = await query;

  if (error) {
    console.error("[billing:usage-from-occurrences]", channel, error.message);
    return 0;
  }

  return count ?? 0;
}

/** Conta envios reais (status sent) — fonte de verdade quando counters não gravaram. */
export async function countUsageFromOccurrences(
  supabase: SupabaseClient,
  userId: string,
  reference = new Date(),
): Promise<{
  emailToday: number;
  smsThisMonth: number;
  whatsappThisMonth: number;
}> {
  const { dayStart, dayEnd, monthStart } = periodBoundsInUtc(reference);

  const [emailToday, smsThisMonth, whatsappThisMonth] = await Promise.all([
    countSentInRange(
      supabase,
      userId,
      "email",
      dayStart.toISOString(),
      dayEnd.toISOString(),
    ),
    countSentInRange(supabase, userId, "sms", monthStart.toISOString()),
    countSentInRange(
      supabase,
      userId,
      "whatsapp",
      monthStart.toISOString(),
    ),
  ]);

  return { emailToday, smsThisMonth, whatsappThisMonth };
}
