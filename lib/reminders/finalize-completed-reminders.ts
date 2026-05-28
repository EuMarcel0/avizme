import "server-only";

import { fromZonedTime } from "date-fns-tz";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FinalizeCompletedResult = {
  finalized: number;
};

const TERMINATING_SCHEDULE_TYPES = new Set([
  "single",
  "same_day_multi",
]);

type ScheduleRow = {
  schedule_type: string;
  config: Record<string, unknown> | null;
  start_date: string | null;
  dates: string[] | null;
  times: string[] | null;
};

function isTerminatingSchedule(
  scheduleType: string,
  config: Record<string, unknown> | null,
): boolean {
  if (TERMINATING_SCHEDULE_TYPES.has(scheduleType)) return true;
  if (scheduleType === "custom" && config?.pattern === "specific_dates") {
    return true;
  }
  return false;
}

function scheduleEndIso(
  schedules: ScheduleRow[],
  timezone: string,
): string | null {
  let maxMs: number | null = null;

  for (const schedule of schedules) {
    if (!isTerminatingSchedule(schedule.schedule_type, schedule.config)) {
      continue;
    }

    const dates =
      schedule.dates?.length
        ? schedule.dates
        : schedule.start_date
          ? [schedule.start_date]
          : [];
    const times = schedule.times?.length ? schedule.times : [];

    for (const date of dates) {
      for (const time of times) {
        const at = fromZonedTime(`${date}T${time}:00`, timezone);
        const ms = at.getTime();
        if (maxMs === null || ms > maxMs) maxMs = ms;
      }
    }
  }

  return maxMs === null ? null : new Date(maxMs).toISOString();
}

async function reminderHasPendingOccurrences(
  supabase: SupabaseClient,
  reminderId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("reminder_occurrences")
    .select("id", { count: "exact", head: true })
    .eq("reminder_id", reminderId)
    .eq("status", "pending");

  if (error) return true;
  return (count ?? 0) > 0;
}

async function lastOccurrenceScheduledAt(
  supabase: SupabaseClient,
  reminderId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("reminder_occurrences")
    .select("scheduled_at")
    .eq("reminder_id", reminderId)
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.scheduled_at) return null;
  return data.scheduled_at as string;
}

/**
 * Marca lembretes pontuais como `completed` quando não há ocorrências pendentes
 * e o último horário agendado já passou.
 */
export async function finalizeCompletedReminders(
  supabase: SupabaseClient,
): Promise<FinalizeCompletedResult> {
  const now = new Date().toISOString();
  let finalized = 0;

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select(
      `
      id,
      timezone,
      reminder_schedules (
        schedule_type,
        config,
        start_date,
        dates,
        times
      )
    `,
    )
    .eq("status", "active");

  if (error || !reminders?.length) {
    return { finalized: 0 };
  }

  for (const row of reminders) {
    const schedules = (row.reminder_schedules ?? []) as ScheduleRow[];
    if (schedules.length === 0) continue;

    const allTerminating = schedules.every((s) =>
      isTerminatingSchedule(s.schedule_type, s.config),
    );
    if (!allTerminating) continue;

    if (await reminderHasPendingOccurrences(supabase, row.id as string)) {
      continue;
    }

    const timezone = (row.timezone as string) || "America/Sao_Paulo";
    const lastFromOccurrences = await lastOccurrenceScheduledAt(
      supabase,
      row.id as string,
    );
    const lastFromSchedule = scheduleEndIso(schedules, timezone);
    const lastScheduled = lastFromOccurrences ?? lastFromSchedule;

    if (!lastScheduled || lastScheduled > now) continue;

    const { error: updateError } = await supabase
      .from("reminders")
      .update({ status: "completed" })
      .eq("id", row.id as string)
      .eq("status", "active");

    if (!updateError) finalized += 1;
  }

  return { finalized };
}
