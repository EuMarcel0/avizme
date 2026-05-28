export type ScheduleType =
  | "single"
  | "same_day_multi"
  | "interval"
  | "interval_multi"
  | "weekly"
  | "monthly"
  | "custom";

/** Tipos de agendamento suportados pelo schema (referência para UI futura). */
export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  single: "Uma data e horário específicos",
  same_day_multi: "Vários horários no mesmo dia",
  interval: "A cada X dias, a partir de uma data",
  interval_multi: "Vários horários a cada X dias",
  weekly: "Dias da semana + horários",
  monthly: "Dia do mês + horários",
  custom: "Regra personalizada (JSON)",
};

export const DELIVERY_CHANNEL_LABELS = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "E-mail",
} as const;
