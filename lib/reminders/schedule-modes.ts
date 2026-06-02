import {
  CalendarDays,
  CalendarRange,
  CalendarSync,
  Clock,
  Repeat,
  Rows3,
} from "lucide-react";

import type { ScheduleMode } from "@/lib/reminders/build-schedules";
import { SCHEDULE_TYPE_LABELS } from "@/lib/schedule-types";

export type ScheduleModeOption = {
  id: ScheduleMode;
  label: string;
  description: string;
  icon: typeof Clock;
};

export const SCHEDULE_MODE_OPTIONS: ScheduleModeOption[] = [
  {
    id: "single",
    label: "Uma vez",
    description: SCHEDULE_TYPE_LABELS.single,
    icon: Clock,
  },
  {
    id: "same_day_multi",
    label: "Vários horários no dia",
    description: SCHEDULE_TYPE_LABELS.same_day_multi,
    icon: Rows3,
  },
  {
    id: "specific_dates",
    label: "Vários dias",
    description: "Mesmo horário (ou vários) em datas que você marcar no calendário",
    icon: CalendarDays,
  },
  {
    id: "interval",
    label: "A cada X dias",
    description: SCHEDULE_TYPE_LABELS.interval,
    icon: Repeat,
  },
  {
    id: "interval_multi",
    label: "A cada X dias, vários horários",
    description: SCHEDULE_TYPE_LABELS.interval_multi,
    icon: CalendarSync,
  },
  {
    id: "weekly",
    label: "Semanal",
    description: SCHEDULE_TYPE_LABELS.weekly,
    icon: CalendarRange,
  },
  {
    id: "monthly",
    label: "Mensal",
    description: SCHEDULE_TYPE_LABELS.monthly,
    icon: CalendarDays,
  },
];

export const WEEKDAY_LABELS = [
  { value: 0, short: "Dom", label: "Domingo" },
  { value: 1, short: "Seg", label: "Segunda" },
  { value: 2, short: "Ter", label: "Terça" },
  { value: 3, short: "Qua", label: "Quarta" },
  { value: 4, short: "Qui", label: "Quinta" },
  { value: 5, short: "Sex", label: "Sexta" },
  { value: 6, short: "Sáb", label: "Sábado" },
] as const;

export function calendarAllowsRangeSelection(mode: ScheduleMode): boolean {
  return mode === "specific_dates";
}

export function calendarSelectionMode(
  mode: ScheduleMode,
): "single" | "range" {
  if (mode === "specific_dates") return "single";
  return "single";
}

export function calendarHint(mode: ScheduleMode): string {
  switch (mode) {
    case "single":
      return "Toque no dia do lembrete.";
    case "same_day_multi":
      return "Toque no dia; defina vários horários abaixo.";
    case "specific_dates":
      return "Dia: toque em várias datas. Período: toque início e depois o fim.";
    case "interval":
      return "Toque no dia de início da repetição.";
    case "interval_multi":
      return "Toque no dia de início; vários horários a cada intervalo.";
    case "weekly":
      return "Opcional: escolha a data de início da rotina semanal.";
    case "monthly":
      return "Opcional: escolha a partir de qual data começar.";
    default:
      return "Selecione no calendário.";
  }
}
