import {
  eachDayOfInterval,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
} from "date-fns";

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateString(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isPastDate(date: Date): boolean {
  return isBefore(startOfDay(date), startOfDay(new Date()));
}

export function formatDateLabel(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: undefined });
}

export function formatTimeLabel(time: string): string {
  return time;
}

export function eachDayInRange(start: Date, end: Date): Date[] {
  const a = startOfDay(start);
  const b = startOfDay(end);
  const [from, to] = isBefore(a, b) ? [a, b] : [b, a];
  return eachDayOfInterval({ start: from, end: to });
}

export function isDateInSelection(
  day: Date,
  selectedDates: Date[],
): boolean {
  return selectedDates.some((d) => isSameDay(d, day));
}

export function isDateInRangeMiddle(
  day: Date,
  selectedDates: Date[],
): boolean {
  if (selectedDates.length < 2) return false;
  const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  if (isSameDay(day, start) || isSameDay(day, end)) return false;
  return isWithinInterval(startOfDay(day), {
    start: startOfDay(start),
    end: startOfDay(end),
  });
}

export function getRangeEnds(selectedDates: Date[]): {
  start: Date | null;
  end: Date | null;
} {
  if (selectedDates.length === 0) return { start: null, end: null };
  const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}
