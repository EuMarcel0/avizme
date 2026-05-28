import type { ScheduleType } from "@/lib/schedule-types";
import { toDateString } from "@/lib/reminders/date-utils";

export type ScheduleMode =
  | "single"
  | "same_day_multi"
  | "specific_dates"
  | "interval"
  | "interval_multi"
  | "weekly"
  | "monthly";

export type ReminderSchedulePayload = {
  scheduleType: ScheduleType;
  startDate: string | null;
  endDate: string | null;
  intervalDays: number | null;
  times: string[];
  dates: string[];
  weekdays: number[];
  dayOfMonth: number | null;
  config: Record<string, unknown>;
  sortOrder: number;
};

export type BuildSchedulesInput = {
  mode: ScheduleMode;
  selectedDates: Date[];
  times: string[];
  intervalDays?: number;
  weekdays?: number[];
  dayOfMonth?: number;
};

function uniqueSortedTimes(times: string[]): string[] {
  return [...new Set(times)].sort();
}

function uniqueSortedDateStrings(dates: Date[]): string[] {
  return [...new Set(dates.map(toDateString))].sort();
}

export function buildSchedulesFromForm(
  input: BuildSchedulesInput,
): ReminderSchedulePayload[] {
  const dates = uniqueSortedDateStrings(input.selectedDates);
  const times = uniqueSortedTimes(input.times);

  switch (input.mode) {
    case "single": {
      const date = dates[0];
      const time = times[0];
      if (!date || !time) return [];
      return [
        {
          scheduleType: "single",
          startDate: date,
          endDate: null,
          intervalDays: null,
          times: [time],
          dates: [date],
          weekdays: [],
          dayOfMonth: null,
          config: {},
          sortOrder: 0,
        },
      ];
    }

    case "same_day_multi": {
      const date = dates[0];
      if (!date || times.length === 0) return [];
      return [
        {
          scheduleType: "same_day_multi",
          startDate: date,
          endDate: null,
          intervalDays: null,
          times,
          dates: [date],
          weekdays: [],
          dayOfMonth: null,
          config: {},
          sortOrder: 0,
        },
      ];
    }

    case "specific_dates": {
      if (dates.length === 0 || times.length === 0) return [];
      if (times.length === 1) {
        return [
          {
            scheduleType: "custom",
            startDate: dates[0],
            endDate: dates[dates.length - 1] ?? null,
            intervalDays: null,
            times,
            dates,
            weekdays: [],
            dayOfMonth: null,
            config: { pattern: "specific_dates" },
            sortOrder: 0,
          },
        ];
      }
      return dates.map((date, index) => ({
        scheduleType: "same_day_multi" as ScheduleType,
        startDate: date,
        endDate: null,
        intervalDays: null,
        times,
        dates: [date],
        weekdays: [],
        dayOfMonth: null,
        config: {},
        sortOrder: index,
      }));
    }

    case "interval": {
      const startDate = dates[0];
      const time = times[0];
      const intervalDays = input.intervalDays ?? 1;
      if (!startDate || !time || intervalDays < 1) return [];
      return [
        {
          scheduleType: "interval",
          startDate,
          endDate: null,
          intervalDays,
          times: [time],
          dates: [startDate],
          weekdays: [],
          dayOfMonth: null,
          config: {},
          sortOrder: 0,
        },
      ];
    }

    case "interval_multi": {
      const startDate = dates[0];
      const intervalDays = input.intervalDays ?? 1;
      if (!startDate || times.length === 0 || intervalDays < 1) return [];
      return [
        {
          scheduleType: "interval_multi",
          startDate,
          endDate: null,
          intervalDays,
          times,
          dates: [startDate],
          weekdays: [],
          dayOfMonth: null,
          config: {},
          sortOrder: 0,
        },
      ];
    }

    case "weekly": {
      const weekdays = input.weekdays ?? [];
      if (weekdays.length === 0 || times.length === 0) return [];
      const startDate = dates[0] ?? null;
      return [
        {
          scheduleType: "weekly",
          startDate,
          endDate: null,
          intervalDays: null,
          times,
          dates: startDate ? [startDate] : [],
          weekdays: [...weekdays].sort((a, b) => a - b),
          dayOfMonth: null,
          config: {},
          sortOrder: 0,
        },
      ];
    }

    case "monthly": {
      const dayOfMonth = input.dayOfMonth;
      if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31 || times.length === 0) {
        return [];
      }
      const startDate = dates[0] ?? null;
      return [
        {
          scheduleType: "monthly",
          startDate,
          endDate: null,
          intervalDays: null,
          times,
          dates: startDate ? [startDate] : [],
          weekdays: [],
          dayOfMonth,
          config: {},
          sortOrder: 0,
        },
      ];
    }

    default:
      return [];
  }
}

export function describeScheduleSummary(
  input: BuildSchedulesInput,
): string {
  const schedules = buildSchedulesFromForm(input);
  if (schedules.length === 0) return "Configure data e horários para ver o resumo.";

  const { mode } = input;
  const dates = input.selectedDates;
  const times = input.times;

  if (mode === "single" && dates[0] && times[0]) {
    return `Uma vez em ${toDateString(dates[0])} às ${times[0]}.`;
  }
  if (mode === "same_day_multi" && dates[0]) {
    return `${times.length} horário(s) no dia ${toDateString(dates[0])}.`;
  }
  if (mode === "specific_dates") {
    return `${dates.length} dia(s) com ${times.length} horário(s) cada.`;
  }
  if (mode === "interval" && dates[0]) {
    return `A cada ${input.intervalDays ?? 1} dia(s) a partir de ${toDateString(dates[0])}, às ${times[0]}.`;
  }
  if (mode === "interval_multi" && dates[0]) {
    return `A cada ${input.intervalDays ?? 1} dia(s) desde ${toDateString(dates[0])}, ${times.length} horário(s) por ocorrência.`;
  }
  if (mode === "weekly") {
    const days = (input.weekdays ?? []).join(", ");
    return `Semanalmente (${days}) — ${times.length} horário(s).`;
  }
  if (mode === "monthly" && input.dayOfMonth) {
    return `Todo dia ${input.dayOfMonth} do mês — ${times.length} horário(s).`;
  }

  return `${schedules.length} regra(s) de agendamento.`;
}
