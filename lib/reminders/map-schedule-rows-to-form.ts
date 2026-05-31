import type { ScheduleMode } from "@/lib/reminders/build-schedules";
import type { NewReminderValues } from "@/lib/validations/reminder";

export type ScheduleRowForForm = {
  schedule_type: string;
  start_date: string | null;
  end_date: string | null;
  interval_days: number | null;
  times: string[] | null;
  dates: string[] | null;
  weekdays: number[] | null;
  day_of_month: number | null;
  config: Record<string, unknown> | null;
  sort_order: number;
};

type ChannelRowForForm = {
  channel: "sms" | "whatsapp" | "email";
  is_enabled: boolean;
};

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso.length === 10 ? `${iso}T12:00:00` : iso}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function collectDates(rows: ScheduleRowForForm[]): Date[] {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.start_date) set.add(row.start_date);
    for (const d of row.dates ?? []) {
      if (d) set.add(d);
    }
  }
  return [...set]
    .sort()
    .map((iso) => parseDate(iso))
    .filter((d): d is Date => d !== null);
}

function collectTimes(rows: ScheduleRowForForm[]): string[] {
  const times = new Set<string>();
  for (const row of rows) {
    for (const t of row.times ?? []) {
      if (t) times.add(t);
    }
  }
  const sorted = [...times].sort();
  return sorted.length > 0 ? sorted : ["09:00"];
}

function inferMode(rows: ScheduleRowForForm[]): ScheduleMode {
  if (rows.length === 0) return "single";

  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  const primary = sorted[0];
  const type = primary.schedule_type;

  if (type === "custom" && primary.config?.pattern === "specific_dates") {
    return "specific_dates";
  }
  if (type === "custom" && (primary.dates?.length ?? 0) > 1) {
    return "specific_dates";
  }
  if (type === "single") return "single";
  if (type === "interval") return "interval";
  if (type === "interval_multi") return "interval_multi";
  if (type === "weekly") return "weekly";
  if (type === "monthly") return "monthly";
  if (type === "same_day_multi" && sorted.length > 1) {
    return "specific_dates";
  }
  if (type === "same_day_multi") return "same_day_multi";

  return "single";
}

export function mapScheduleRowsToFormValues(
  schedules: ScheduleRowForForm[],
  channels: ChannelRowForForm[],
): Pick<
  NewReminderValues,
  | "mode"
  | "selectedDates"
  | "times"
  | "intervalDays"
  | "weekdays"
  | "dayOfMonth"
  | "channels"
> {
  const sorted = [...schedules].sort((a, b) => a.sort_order - b.sort_order);
  const mode = inferMode(sorted);
  const primary = sorted[0];

  const selectedDates = collectDates(sorted);
  const times = collectTimes(sorted);

  const enabled = new Set(
    channels.filter((c) => c.is_enabled).map((c) => c.channel),
  );
  return {
    mode,
    selectedDates: (() => {
      if (selectedDates.length > 0) return selectedDates;
      const fallback = parseDate(primary?.start_date);
      return fallback ? [fallback] : [new Date()];
    })(),
    times,
    intervalDays: primary?.interval_days ?? 1,
    weekdays: primary?.weekdays ?? [],
    dayOfMonth: primary?.day_of_month ?? 1,
    channels: {
      sms: enabled.has("sms"),
      whatsapp: enabled.has("whatsapp"),
      email: enabled.has("email"),
    },
  };
}
