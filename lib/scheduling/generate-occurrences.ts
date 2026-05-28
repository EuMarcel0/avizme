import "server-only";

import { addDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  expandSchedule,
  slotToScheduledAt,
} from "@/lib/scheduling/expand-schedule";
import {
  GENERATION_HORIZON_DAYS,
  type DeliveryChannel,
  type GenerationRange,
  type OccurrenceInsert,
  type ScheduleRow,
} from "@/lib/scheduling/types";

export type GenerateOccurrencesResult = {
  remindersProcessed: number;
  slotsExpanded: number;
  occurrencesInserted: number;
  errors: string[];
};

function normalizeScheduleRow(row: Record<string, unknown>): ScheduleRow {
  return {
    id: String(row.id),
    reminder_id: String(row.reminder_id),
    schedule_type: String(row.schedule_type),
    start_date: (row.start_date as string | null) ?? null,
    end_date: (row.end_date as string | null) ?? null,
    interval_days: (row.interval_days as number | null) ?? null,
    times: (row.times as string[]) ?? [],
    dates: (row.dates as string[]) ?? [],
    weekdays: (row.weekdays as number[]) ?? [],
    day_of_month: (row.day_of_month as number | null) ?? null,
    config: (row.config as Record<string, unknown> | null) ?? null,
  };
}

function buildRange(from?: Date): GenerationRange {
  const start = from ?? new Date();
  return {
    from: start,
    to: addDays(start, GENERATION_HORIZON_DAYS),
  };
}

export async function generateOccurrencesForReminder(
  supabase: SupabaseClient,
  reminderId: string,
  options?: { replaceFuturePending?: boolean },
): Promise<GenerateOccurrencesResult> {
  const result: GenerateOccurrencesResult = {
    remindersProcessed: 0,
    slotsExpanded: 0,
    occurrencesInserted: 0,
    errors: [],
  };

  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select("id, status, timezone")
    .eq("id", reminderId)
    .eq("status", "active")
    .maybeSingle();

  if (reminderError) {
    result.errors.push(reminderError.message);
    return result;
  }
  if (!reminder) return result;

  if (options?.replaceFuturePending) {
    await supabase
      .from("reminder_occurrences")
      .delete()
      .eq("reminder_id", reminderId)
      .eq("status", "pending")
      .gte("scheduled_at", new Date().toISOString());
  }

  return generateForReminders(supabase, [reminderId], result);
}

export async function generateOccurrencesBatch(
  supabase: SupabaseClient,
): Promise<GenerateOccurrencesResult> {
  const result: GenerateOccurrencesResult = {
    remindersProcessed: 0,
    slotsExpanded: 0,
    occurrencesInserted: 0,
    errors: [],
  };

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("id")
    .eq("status", "active");

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const ids = (reminders ?? []).map((r) => r.id as string);
  if (ids.length === 0) return result;

  return generateForReminders(supabase, ids, result);
}

async function generateForReminders(
  supabase: SupabaseClient,
  reminderIds: string[],
  result: GenerateOccurrencesResult,
): Promise<GenerateOccurrencesResult> {
  const range = buildRange();

  const { data: reminders, error: remindersError } = await supabase
    .from("reminders")
    .select("id, timezone")
    .in("id", reminderIds)
    .eq("status", "active");

  if (remindersError) {
    result.errors.push(remindersError.message);
    return result;
  }

  const timezoneByReminder = new Map(
    (reminders ?? []).map((r) => [
      r.id as string,
      (r.timezone as string) || "America/Sao_Paulo",
    ]),
  );

  const { data: schedules, error: schedulesError } = await supabase
    .from("reminder_schedules")
    .select("*")
    .in("reminder_id", reminderIds);

  if (schedulesError) {
    result.errors.push(schedulesError.message);
    return result;
  }

  const { data: channels, error: channelsError } = await supabase
    .from("reminder_delivery_channels")
    .select("reminder_id, channel")
    .in("reminder_id", reminderIds)
    .eq("is_enabled", true);

  if (channelsError) {
    result.errors.push(channelsError.message);
    return result;
  }

  const channelsByReminder = new Map<string, DeliveryChannel[]>();
  for (const ch of channels ?? []) {
    const rid = ch.reminder_id as string;
    const list = channelsByReminder.get(rid) ?? [];
    list.push(ch.channel as DeliveryChannel);
    channelsByReminder.set(rid, list);
  }

  const rows: OccurrenceInsert[] = [];

  for (const raw of schedules ?? []) {
    const schedule = normalizeScheduleRow(raw as Record<string, unknown>);
    const tz = timezoneByReminder.get(schedule.reminder_id) ?? "America/Sao_Paulo";
    const enabled = channelsByReminder.get(schedule.reminder_id) ?? [];
    if (enabled.length === 0) continue;

    const slots = expandSchedule(schedule, range, tz);
    result.slotsExpanded += slots.length;

    for (const slot of slots) {
      const scheduledAt = slotToScheduledAt(slot, tz);
      for (const channel of enabled) {
        rows.push({
          reminder_id: schedule.reminder_id,
          schedule_id: schedule.id,
          scheduled_at: scheduledAt.toISOString(),
          channel,
          status: "pending",
        });
      }
    }
  }

  result.remindersProcessed = reminderIds.length;

  if (rows.length === 0) return result;

  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: insertError } = await supabase
      .from("reminder_occurrences")
      .upsert(chunk, {
        onConflict: "reminder_id,schedule_id,scheduled_at,channel",
        ignoreDuplicates: true,
      });

    if (insertError) {
      const { error: fallbackError } = await supabase
        .from("reminder_occurrences")
        .insert(chunk);

      if (fallbackError) {
        result.errors.push(fallbackError.message);
      } else {
        result.occurrencesInserted += chunk.length;
      }
    } else {
      result.occurrencesInserted += chunk.length;
    }
  }

  return result;
}
