import {
  addDays,
  addMonths,
  endOfDay,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import type {
  ExpandedSlot,
  GenerationRange,
  ScheduleRow,
} from "@/lib/scheduling/types";

function parseDateOnly(iso: string): Date {
  return parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso);
}

function toDateOnlyString(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

function zonedDayOfWeek(date: Date, timezone: string): number {
  const iso = Number(formatInTimeZone(date, timezone, "i"));
  return iso === 7 ? 0 : iso;
}

function dateOnlyInRange(
  dateIso: string,
  range: GenerationRange,
  timezone: string,
): boolean {
  const dayStart = fromZonedTime(`${dateIso}T00:00:00`, timezone);
  const dayEnd = fromZonedTime(`${dateIso}T23:59:59`, timezone);
  return !isAfter(dayStart, range.to) && !isBefore(dayEnd, range.from);
}

function pushSlot(
  slots: ExpandedSlot[],
  scheduleId: string,
  dateIso: string,
  time: string,
  range: GenerationRange,
  timezone: string,
): void {
  if (!dateOnlyInRange(dateIso, range, timezone)) return;
  const scheduledAt = fromZonedTime(`${dateIso}T${time}:00`, timezone);
  if (isBefore(scheduledAt, range.from) || isAfter(scheduledAt, range.to)) {
    return;
  }
  slots.push({ scheduleId, date: dateIso, time });
}

function expandSingle(
  schedule: ScheduleRow,
  range: GenerationRange,
  timezone: string,
): ExpandedSlot[] {
  const slots: ExpandedSlot[] = [];
  const date =
    schedule.dates[0] ?? schedule.start_date ?? null;
  const time = schedule.times[0];
  if (!date || !time) return slots;
  pushSlot(slots, schedule.id, date, time, range, timezone);
  return slots;
}

function expandSameDayMulti(
  schedule: ScheduleRow,
  range: GenerationRange,
  timezone: string,
): ExpandedSlot[] {
  const slots: ExpandedSlot[] = [];
  const date =
    schedule.dates[0] ?? schedule.start_date ?? null;
  if (!date) return slots;
  for (const time of schedule.times) {
    pushSlot(slots, schedule.id, date, time, range, timezone);
  }
  return slots;
}

function expandSpecificDates(
  schedule: ScheduleRow,
  range: GenerationRange,
  timezone: string,
): ExpandedSlot[] {
  const slots: ExpandedSlot[] = [];
  const dates =
    schedule.dates.length > 0
      ? schedule.dates
      : schedule.start_date
        ? [schedule.start_date]
        : [];
  for (const date of dates) {
    for (const time of schedule.times) {
      pushSlot(slots, schedule.id, date, time, range, timezone);
    }
  }
  return slots;
}

function expandInterval(
  schedule: ScheduleRow,
  range: GenerationRange,
  timezone: string,
  multiTimes: boolean,
): ExpandedSlot[] {
  const slots: ExpandedSlot[] = [];
  const startIso = schedule.start_date ?? schedule.dates[0];
  if (!startIso) return slots;

  const interval = Math.max(1, schedule.interval_days ?? 1);
  const endBound = schedule.end_date
    ? endOfDay(parseDateOnly(schedule.end_date))
    : range.to;

  let current = startOfDay(parseDateOnly(startIso));

  while (!isAfter(current, endBound) && !isAfter(current, range.to)) {
    const dateIso = toDateOnlyString(current, timezone);
    if (!isBefore(current, startOfDay(range.from))) {
      const times = multiTimes ? schedule.times : schedule.times.slice(0, 1);
      for (const time of times) {
        pushSlot(slots, schedule.id, dateIso, time, range, timezone);
      }
    }
    current = addDays(current, interval);
  }

  return slots;
}

function expandWeekly(
  schedule: ScheduleRow,
  range: GenerationRange,
  timezone: string,
): ExpandedSlot[] {
  const slots: ExpandedSlot[] = [];
  const weekdays = new Set(schedule.weekdays ?? []);
  if (weekdays.size === 0 || schedule.times.length === 0) return slots;

  const startBound = schedule.start_date
    ? startOfDay(parseDateOnly(schedule.start_date))
    : startOfDay(range.from);

  let current = startOfDay(range.from);
  const end = schedule.end_date
    ? endOfDay(parseDateOnly(schedule.end_date))
    : range.to;

  while (!isAfter(current, end) && !isAfter(current, range.to)) {
    if (!isBefore(current, startBound)) {
      const dow = zonedDayOfWeek(current, timezone);
      if (weekdays.has(dow)) {
        const dateIso = toDateOnlyString(current, timezone);
        for (const time of schedule.times) {
          pushSlot(slots, schedule.id, dateIso, time, range, timezone);
        }
      }
    }
    current = addDays(current, 1);
  }

  return slots;
}

function expandMonthly(
  schedule: ScheduleRow,
  range: GenerationRange,
  timezone: string,
): ExpandedSlot[] {
  const slots: ExpandedSlot[] = [];
  const dom = schedule.day_of_month;
  if (!dom || schedule.times.length === 0) return slots;

  const startBound = schedule.start_date
    ? startOfDay(parseDateOnly(schedule.start_date))
    : startOfDay(range.from);

  let monthCursor = startOfDay(range.from);
  monthCursor.setDate(1);

  while (!isAfter(monthCursor, range.to)) {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(dom, lastDay);
    const candidate = new Date(year, month, day);

    if (
      !isBefore(candidate, startBound) &&
      !isAfter(candidate, range.to) &&
      (!schedule.end_date ||
        !isAfter(candidate, endOfDay(parseDateOnly(schedule.end_date))))
    ) {
      const dateIso = toDateOnlyString(candidate, timezone);
      for (const time of schedule.times) {
        pushSlot(slots, schedule.id, dateIso, time, range, timezone);
      }
    }

    monthCursor = addMonths(monthCursor, 1);
  }

  return slots;
}

export function expandSchedule(
  schedule: ScheduleRow,
  range: GenerationRange,
  timezone: string,
): ExpandedSlot[] {
  const type = schedule.schedule_type;
  const pattern = schedule.config?.pattern;

  if (type === "custom" && pattern === "specific_dates") {
    return expandSpecificDates(schedule, range, timezone);
  }

  switch (type) {
    case "single":
      return expandSingle(schedule, range, timezone);
    case "same_day_multi":
      return expandSameDayMulti(schedule, range, timezone);
    case "interval":
      return expandInterval(schedule, range, timezone, false);
    case "interval_multi":
      return expandInterval(schedule, range, timezone, true);
    case "weekly":
      return expandWeekly(schedule, range, timezone);
    case "monthly":
      return expandMonthly(schedule, range, timezone);
    default:
      if (schedule.dates.length > 0) {
        return expandSpecificDates(schedule, range, timezone);
      }
      return [];
  }
}

export function slotToScheduledAt(
  slot: ExpandedSlot,
  timezone: string,
): Date {
  return fromZonedTime(`${slot.date}T${slot.time}:00`, timezone);
}
