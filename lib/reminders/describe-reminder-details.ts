import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { describeScheduleSummary } from "@/lib/reminders/describe-schedule-summary";
import {
  mapScheduleRowsToFormValues,
  type ScheduleRowForForm,
} from "@/lib/reminders/map-schedule-rows-to-form";
import type { ReminderStatus } from "@/lib/reminders/reminder-status";
import { SCHEDULE_TYPE_LABELS, type ScheduleType } from "@/lib/schedule-types";

type ChannelRow = {
  channel: "sms" | "whatsapp" | "email";
  is_enabled: boolean;
};

export type ReminderDetailsCopy = {
  deliveryDetails: string;
  cycleEndDetails: string;
};

const TERMINATING_SCHEDULE_TYPES = new Set(["single", "same_day_multi"]);

function formatDateBr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const value =
      iso.length === 10 ? parseISO(`${iso}T12:00:00`) : parseISO(iso);
    return format(value, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

function formatDateTimeBr(dateIso: string, time: string): string {
  const dateLabel = formatDateBr(dateIso) ?? dateIso;
  return `${dateLabel} às ${time}`;
}

function normalizeScheduleRows(
  rows: ScheduleRowForForm[],
): ScheduleRowForForm[] {
  return rows.map((row, index) => ({
    ...row,
    sort_order: row.sort_order ?? index,
    config: row.config ?? null,
  }));
}

function isTerminatingSchedule(row: ScheduleRowForForm): boolean {
  if (TERMINATING_SCHEDULE_TYPES.has(row.schedule_type)) return true;
  if (row.schedule_type === "custom") {
    if (row.config?.pattern === "specific_dates") return true;
    if ((row.dates?.length ?? 0) > 1) return true;
  }
  return false;
}

function isRecurringScheduleType(type: string): boolean {
  return (
    type === "interval" ||
    type === "interval_multi" ||
    type === "weekly" ||
    type === "monthly"
  );
}

function lastTerminatingSendLabel(rows: ScheduleRowForForm[]): string | null {
  let latestMs: number | null = null;
  let latestLabel: string | null = null;

  for (const row of rows) {
    if (!isTerminatingSchedule(row)) continue;

    const dates: string[] =
      (row.dates?.length ?? 0) > 0
        ? (row.dates ?? [])
        : row.start_date
          ? [row.start_date]
          : [];
    const times: string[] = row.times?.length ? (row.times ?? []) : [];

    for (const date of dates) {
      for (const time of times) {
        const parsed = parseISO(`${date}T${time}:00`);
        const ms = parsed.getTime();
        if (Number.isNaN(ms)) continue;
        if (latestMs === null || ms > latestMs) {
          latestMs = ms;
          latestLabel = formatDateTimeBr(date, time);
        }
      }
    }
  }

  return latestLabel;
}

function recurringScheduleLabel(type: ScheduleType): string {
  return SCHEDULE_TYPE_LABELS[type] ?? type;
}

function describeCycleEnd(
  rows: ScheduleRowForForm[],
  status: ReminderStatus,
): string {
  if (status === "completed") {
    const lastSend = lastTerminatingSendLabel(rows);
    if (lastSend) {
      return `Este ciclo já foi finalizado. O último envio estava previsto para ${lastSend}. Não haverá novos avisos.`;
    }
    return "Este ciclo já foi finalizado. Não haverá novos avisos.";
  }

  if (status === "archived") {
    return "Este lembrete foi arquivado e não enviará novas mensagens.";
  }

  if (status === "paused") {
    return "O lembrete está pausado. Enquanto estiver pausado, nenhum envio será disparado.";
  }

  if (rows.length === 0) {
    return "Não há agendamento configurado para encerrar ou continuar envios.";
  }

  const normalized = normalizeScheduleRows(rows);
  const allTerminating = normalized.every(isTerminatingSchedule);

  if (allTerminating) {
    const lastSend = lastTerminatingSendLabel(normalized);
    if (lastSend) {
      return `Este é um lembrete pontual. O ciclo se encerra após o último envio, previsto para ${lastSend}. Depois disso, ele será marcado como ciclo finalizado.`;
    }
    return "Este é um lembrete pontual. O ciclo se encerra após o último envio programado.";
  }

  const primary = normalized[0];
  const endDateLabel = formatDateBr(primary.end_date);
  const typeLabel = recurringScheduleLabel(primary.schedule_type as ScheduleType);

  if (endDateLabel) {
    return `Este lembrete é recorrente (${typeLabel.toLowerCase()}) e continua enviando até ${endDateLabel}.`;
  }

  if (isRecurringScheduleType(primary.schedule_type)) {
    return `Este lembrete é recorrente (${typeLabel.toLowerCase()}) e continua enviando enquanto estiver ativo, sem data de encerramento definida.`;
  }

  return "O ciclo deste lembrete segue ativo conforme a regra de agendamento configurada.";
}

function describeDelivery(
  rows: ScheduleRowForForm[],
  channels: ChannelRow[],
): string {
  const normalized = normalizeScheduleRows(rows);
  if (normalized.length === 0) {
    return "Este lembrete ainda não possui datas ou horários configurados.";
  }

  const formValues = mapScheduleRowsToFormValues(normalized, channels);
  return describeScheduleSummary({
    mode: formValues.mode,
    selectedDates: formValues.selectedDates,
    times: formValues.times.filter((value): value is string => Boolean(value)),
    intervalDays: formValues.intervalDays,
    weekdays: (formValues.weekdays ?? []).filter(
      (value): value is number => value != null,
    ),
    dayOfMonth: formValues.dayOfMonth,
    channels: formValues.channels,
  });
}

export function buildReminderDetails(
  schedules: ScheduleRowForForm[],
  channels: ChannelRow[],
  status: ReminderStatus,
): ReminderDetailsCopy {
  const normalized = normalizeScheduleRows(schedules);

  return {
    deliveryDetails: describeDelivery(normalized, channels),
    cycleEndDetails: describeCycleEnd(normalized, status),
  };
}
