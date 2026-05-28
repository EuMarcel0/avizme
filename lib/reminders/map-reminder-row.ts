import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { ScheduleType } from "@/lib/schedule-types";
import { SCHEDULE_TYPE_LABELS, DELIVERY_CHANNEL_LABELS } from "@/lib/schedule-types";
import type { ReminderStatus } from "@/lib/reminders/reminder-status";

type ScheduleRow = {
  schedule_type: ScheduleType;
  start_date: string | null;
  end_date: string | null;
  interval_days: number | null;
  times: string[] | null;
  dates: string[] | null;
  weekdays: number[] | null;
  day_of_month: number | null;
};

type ChannelRow = {
  channel: keyof typeof DELIVERY_CHANNEL_LABELS;
  is_enabled: boolean;
};

export type ReminderListItem = {
  id: string;
  title: string;
  message: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
  scheduleSummary: string;
  scheduleDateIso: string | null;
  scheduleDateLabel: string | null;
  timesLabel: string;
  channels: Array<keyof typeof DELIVERY_CHANNEL_LABELS>;
};

function formatIsoDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso), "dd/MM/yyyy", {
      locale: ptBR,
    });
  } catch {
    return iso;
  }
}

function earliestScheduleDate(schedules: ScheduleRow[]): string | null {
  const candidates: string[] = [];
  for (const s of schedules) {
    if (s.start_date) candidates.push(s.start_date);
    if (s.dates?.length) candidates.push(...s.dates);
  }
  if (candidates.length === 0) return null;
  return candidates.sort()[0];
}

function buildScheduleSummary(schedules: ScheduleRow[]): string {
  if (schedules.length === 0) return "Sem agendamento";
  const primary = schedules[0];
  const typeLabel = SCHEDULE_TYPE_LABELS[primary.schedule_type] ?? primary.schedule_type;
  const times = primary.times ?? [];
  const timePart =
    times.length > 0
      ? times.length === 1
        ? ` às ${times[0]}`
        : ` · ${times.length} horários`
      : "";

  if (primary.schedule_type === "interval" || primary.schedule_type === "interval_multi") {
    const start = formatIsoDate(primary.start_date);
    const every = primary.interval_days ?? 1;
    return `${typeLabel}${start ? ` desde ${start}` : ""} (a cada ${every} dia(s))${timePart}`;
  }

  if (primary.start_date && primary.end_date && primary.start_date !== primary.end_date) {
    return `${formatIsoDate(primary.start_date)} — ${formatIsoDate(primary.end_date)}${timePart}`;
  }

  const date = earliestScheduleDate(schedules);
  if (date) {
    return `${typeLabel} · ${formatIsoDate(date)}${timePart}`;
  }

  return `${typeLabel}${timePart}`;
}

export function mapReminderRow(row: {
  id: string;
  title: string;
  message: string;
  status: ReminderStatus;
  created_at: string;
  updated_at: string;
  reminder_schedules: ScheduleRow[] | null;
  reminder_delivery_channels: ChannelRow[] | null;
}): ReminderListItem {
  const schedules = row.reminder_schedules ?? [];
  const scheduleDateIso = earliestScheduleDate(schedules);
  const times = [
    ...new Set(schedules.flatMap((s) => s.times ?? []).filter(Boolean)),
  ].sort();

  return {
    id: row.id,
    title: row.title,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduleSummary: buildScheduleSummary(schedules),
    scheduleDateIso,
    scheduleDateLabel: formatIsoDate(scheduleDateIso),
    timesLabel: times.length > 0 ? times.join(", ") : "—",
    channels: (row.reminder_delivery_channels ?? [])
      .filter((c) => c.is_enabled)
      .map((c) => c.channel),
  };
}
