"use client";

import { Form, Formik } from "formik";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ScheduleModePicker } from "@/components/reminders/schedule-mode-picker";
import { ReminderScheduleCalendar } from "@/components/reminders/reminder-schedule-calendar";
import { TimeSlotsEditor } from "@/components/reminders/time-slots-editor";
import { ButtonLabelSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { DeliveryChannelsField } from "@/components/reminders/delivery-channels-field";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createReminderAction,
  updateReminderAction,
} from "@/app/actions/reminders";
import { useModal } from "@/hooks/use-modal";
import { invalidateRemindersQueries } from "@/lib/reminders/reminders-query-keys";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";
import {
  buildSchedulesFromForm,
  describeScheduleSummary,
  type ScheduleMode,
} from "@/lib/reminders/build-schedules";
import { toDateString } from "@/lib/reminders/date-utils";
import { WEEKDAY_LABELS } from "@/lib/reminders/schedule-modes";
import { newReminderSchema, type NewReminderValues } from "@/lib/validations/reminder";
import { cn } from "@/lib/utils";

export const DEFAULT_REMINDER_FORM_VALUES: NewReminderValues = {
  title: "",
  message: "",
  mode: "single",
  selectedDates: [],
  times: ["09:00"],
  intervalDays: 1,
  weekdays: [],
  dayOfMonth: 1,
  channels: {
    sms: false,
    whatsapp: false,
    email: true,
  },
  recipientLists: {
    email: [],
    sms: [],
    whatsapp: [],
  },
};

export function defaultReminderFormValuesForBilling(
  billing?: ClientBillingInfo,
): NewReminderValues {
  const base = { ...DEFAULT_REMINDER_FORM_VALUES };
  if (!billing) return base;
  return {
    ...base,
    channels: {
      email: billing.limits.channels.includes("email"),
      sms: false,
      whatsapp: false,
    },
  };
}

function maxTimesForMode(mode: ScheduleMode): number {
  return mode === "single" || mode === "interval" ? 1 : 12;
}

function minTimesForMode(mode: ScheduleMode): number {
  return 1;
}

type ReminderFormProps = {
  initialValues: NewReminderValues;
  reminderId?: string;
  userEmail?: string | null;
  userPhone?: string | null;
  billing?: ClientBillingInfo;
};

export function ReminderForm({
  initialValues,
  reminderId,
  userEmail,
  userPhone,
  billing,
}: ReminderFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { closeModal } = useModal();
  const isEdit = Boolean(reminderId);

  return (
    <Formik
      key={reminderId ?? "new"}
      initialValues={initialValues}
      enableReinitialize
      validationSchema={newReminderSchema}
      onSubmit={async (values, { setSubmitting }) => {
        const schedules = buildSchedulesFromForm({
          mode: values.mode,
          selectedDates: values.selectedDates,
          times: values.times.filter((t): t is string => Boolean(t)),
          intervalDays: values.intervalDays ?? undefined,
          weekdays: values.weekdays?.filter((d): d is number => d !== undefined),
          dayOfMonth: values.dayOfMonth ?? undefined,
        });

        if (schedules.length === 0) {
          toast.error("Revise datas e horários do agendamento.");
          setSubmitting(false);
          return;
        }

        const normalizeList = (list?: (string | undefined)[]) =>
          list?.filter((item): item is string => Boolean(item?.trim()));

        const payload = {
          title: values.title,
          message: values.message,
          mode: values.mode,
          selectedDates: values.selectedDates.map(toDateString),
          times: values.times.filter((t): t is string => Boolean(t)),
          intervalDays: values.intervalDays ?? undefined,
          weekdays: values.weekdays?.filter((d): d is number => d !== undefined),
          dayOfMonth: values.dayOfMonth ?? undefined,
          channels: values.channels,
          recipientLists: billing?.limits.allowRecipientLists
            ? {
                email: normalizeList(values.recipientLists?.email),
                sms: normalizeList(values.recipientLists?.sms),
                whatsapp: normalizeList(values.recipientLists?.whatsapp),
              }
            : undefined,
        };

        const result = isEdit
          ? await updateReminderAction(reminderId!, payload)
          : await createReminderAction(payload);

        setSubmitting(false);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success(
          isEdit ? "Lembrete atualizado." : "Lembrete criado com sucesso!",
        );
        closeModal();
        await invalidateRemindersQueries(queryClient);
        router.refresh();
      }}
    >
      {({
        values,
        errors,
        touched,
        setFieldValue,
        isSubmitting,
        handleChange,
        handleBlur,
      }) => {
        const times = values.times.filter((t): t is string => Boolean(t));
        const summary = describeScheduleSummary({
          mode: values.mode,
          selectedDates: values.selectedDates,
          times,
          intervalDays: values.intervalDays ?? undefined,
          weekdays: values.weekdays?.filter((d): d is number => d !== undefined),
          dayOfMonth: values.dayOfMonth ?? undefined,
          channels: values.channels,
        });

        const handleModeChange = (mode: ScheduleMode) => {
          setFieldValue("mode", mode);
          if (mode === "single" || mode === "interval") {
            setFieldValue("times", [values.times[0] ?? "09:00"]);
          }
          if (mode !== "weekly") {
            setFieldValue("weekdays", []);
          }
          if (mode !== "monthly") {
            setFieldValue("dayOfMonth", 1);
          }
          if (mode !== "interval" && mode !== "interval_multi") {
            setFieldValue("intervalDays", 1);
          }
          if (mode !== "specific_dates" && values.selectedDates.length > 1) {
            setFieldValue("selectedDates", values.selectedDates.slice(0, 1));
          }
        };

        const datesError =
          touched.selectedDates && errors.selectedDates
            ? String(errors.selectedDates)
            : undefined;

        return (
          <Form className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-4">
            <section className="min-w-0 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Quando enviar?
              </h3>
              <ReminderScheduleCalendar
                mode={values.mode}
                selectedDates={values.selectedDates}
                onSelectDates={(dates) =>
                  setFieldValue("selectedDates", dates, true)
                }
              />
              {datesError && (
                <p className="text-xs text-destructive" role="alert">
                  {datesError}
                </p>
              )}
            </section>

            <section className="min-w-0 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Tipo de agendamento
              </h3>
              <ScheduleModePicker
                value={values.mode}
                onChange={handleModeChange}
                allowedModes={billing?.limits.allowedScheduleModes}
              />
            </section>

            <div className="grid min-w-0 gap-6 md:grid-cols-2">
              <section className="flex min-w-0 flex-col gap-5">

                {(values.mode === "interval" ||
                  values.mode === "interval_multi") && (
                  <FormField
                    id="intervalDays"
                    label="Repetir a cada (dias)"
                    showError={Boolean(touched.intervalDays && errors.intervalDays)}
                    error={
                      errors.intervalDays
                        ? String(errors.intervalDays)
                        : undefined
                    }
                  >
                    <Input
                      id="intervalDays"
                      name="intervalDays"
                      type="number"
                      min={1}
                      max={365}
                      value={values.intervalDays ?? 1}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </FormField>
                )}

                {values.mode === "weekly" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Dias da semana
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_LABELS.map((day) => {
                        const active = values.weekdays?.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const current = values.weekdays ?? [];
                              const next = active
                                ? current.filter((d) => d !== day.value)
                                : [...current, day.value];
                              setFieldValue("weekdays", next, true);
                            }}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:bg-muted/40",
                            )}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                    {touched.weekdays && errors.weekdays && (
                      <p className="text-xs text-destructive">
                        {String(errors.weekdays)}
                      </p>
                    )}
                  </div>
                )}

                {values.mode === "monthly" && (
                  <FormField
                    id="dayOfMonth"
                    label="Dia do mês (1–31)"
                    showError={Boolean(touched.dayOfMonth && errors.dayOfMonth)}
                    error={
                      errors.dayOfMonth
                        ? String(errors.dayOfMonth)
                        : undefined
                    }
                  >
                    <Input
                      id="dayOfMonth"
                      name="dayOfMonth"
                      type="number"
                      min={1}
                      max={31}
                      value={values.dayOfMonth ?? 1}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </FormField>
                )}

                <TimeSlotsEditor
                  times={times.length > 0 ? times : ["09:00"]}
                  onChange={(next) => setFieldValue("times", next, true)}
                  maxSlots={maxTimesForMode(values.mode)}
                  minSlots={minTimesForMode(values.mode)}
                  error={
                    touched.times && errors.times
                      ? String(errors.times)
                      : undefined
                  }
                />

              </section>

              <section className="flex min-w-0 flex-col gap-5">
                <Separator className="md:hidden" />

                <FormField
                  id="title"
                  label="Título"
                  showError={Boolean(touched.title && errors.title)}
                  error={errors.title ? String(errors.title) : undefined}
                >
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ex.: Tomar remédio"
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </FormField>

                <FormField
                  id="message"
                  label="Mensagem do lembrete"
                  showError={Boolean(touched.message && errors.message)}
                  error={
                    errors.message ? String(errors.message) : undefined
                  }
                >
                  <Textarea
                    id="message"
                    name="message"
                    rows={3}
                    placeholder="Texto enviado por SMS, WhatsApp ou e-mail"
                    value={values.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </FormField>

                <DeliveryChannelsField
                  channels={values.channels}
                  recipientLists={
                    values.recipientLists ?? {
                      email: [],
                      sms: [],
                      whatsapp: [],
                    }
                  }
                  userEmail={userEmail}
                  userPhone={userPhone}
                  billing={billing}
                  touched={Boolean(touched.channels)}
                  channelsError={
                    typeof errors.channels === "string"
                      ? errors.channels
                      : undefined
                  }
                  onWhatsappChange={(checked) =>
                    setFieldValue("channels.whatsapp", checked)
                  }
                  onSmsChange={(checked) =>
                    setFieldValue("channels.sms", checked)
                  }
                  onEmailChange={(checked) =>
                    setFieldValue("channels.email", checked)
                  }
                  onRecipientListChange={(channel, recipients) =>
                    setFieldValue(`recipientLists.${channel}`, recipients)
                  }
                />
              </section>
            </div>

            <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
              <span className="font-medium">Resumo: </span>
              {summary}
            </div>
            </div>

            <div className="shrink-0 border-t border-border/60 bg-popover px-5 py-4 shadow-[0_-8px_24px_-8px_rgba(30,61,54,0.12)]">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ButtonLabelSkeleton className="w-28" />
                  ) : (
                    isEdit ? "Salvar alterações" : "Criar lembrete"
                  )}
                </Button>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
