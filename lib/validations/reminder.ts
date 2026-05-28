import * as yup from "yup";

import type { ScheduleMode } from "@/lib/reminders/build-schedules";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleModeSchema = yup
  .string()
  .oneOf([
    "single",
    "same_day_multi",
    "specific_dates",
    "interval",
    "interval_multi",
    "weekly",
    "monthly",
  ])
  .required() as yup.Schema<ScheduleMode>;

export const newReminderSchema = yup.object({
  title: yup.string().trim().min(2, "Título muito curto").required("Título é obrigatório"),
  message: yup
    .string()
    .trim()
    .min(2, "Mensagem muito curta")
    .required("Mensagem é obrigatória"),
  mode: scheduleModeSchema,
  selectedDates: yup
    .array()
    .of(yup.date().required())
    .min(1, "Selecione pelo menos uma data no calendário")
    .required(),
  times: yup
    .array()
    .of(yup.string().matches(timeRegex, "Horário inválido"))
    .when("mode", {
      is: (m: ScheduleMode) => m === "single" || m === "interval",
      then: (schema) => schema.min(1, "Informe um horário").max(1, "Apenas um horário"),
      otherwise: (schema) => schema.min(1, "Adicione pelo menos um horário"),
    })
    .required(),
  intervalDays: yup.number().when("mode", {
    is: (m: ScheduleMode) => m === "interval" || m === "interval_multi",
    then: (schema) =>
      schema
        .min(1, "Intervalo mínimo de 1 dia")
        .max(365, "Intervalo máximo de 365 dias")
        .required("Informe o intervalo em dias"),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  weekdays: yup.array().of(yup.number().min(0).max(6)).when("mode", {
    is: "weekly",
    then: (schema) => schema.min(1, "Selecione pelo menos um dia da semana"),
    otherwise: (schema) => schema.optional(),
  }),
  dayOfMonth: yup.number().when("mode", {
    is: "monthly",
    then: (schema) =>
      schema.min(1, "Dia inválido").max(31, "Dia inválido").required("Informe o dia do mês"),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  channels: yup
    .object({
      sms: yup.boolean(),
      whatsapp: yup.boolean(),
      email: yup.boolean(),
    })
    .test("at-least-one", "Escolha pelo menos um canal de envio", (value) =>
      Boolean(value?.sms || value?.whatsapp || value?.email),
    ),
});

export type NewReminderValues = yup.InferType<typeof newReminderSchema>;

export type CreateReminderBody = {
  title: string;
  message: string;
  schedules: ReturnType<
    typeof import("@/lib/reminders/build-schedules").buildSchedulesFromForm
  >;
  channels: Array<{
    channel: "sms" | "whatsapp" | "email";
    destination: string | null;
    isEnabled: boolean;
  }>;
};
