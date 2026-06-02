import "server-only";

import { buildChannelRows } from "@/lib/billing/build-channel-rows";
import {
  assertActiveReminderLimit,
  assertChannelsAllowedForPlan,
  assertRecipientListsAllowed,
  assertScheduleModeAllowed,
  BillingLimitError,
  type RecipientLists,
} from "@/lib/billing/enforce-limits";
import { getUserBillingContext } from "@/lib/billing/get-user-billing";
import { buildSchedulesFromForm, type ScheduleMode } from "@/lib/reminders/build-schedules";
import { requireAuthenticatedUser } from "@/lib/reminders/require-auth";
import { syncOccurrencesAfterSave } from "@/lib/reminders/sync-occurrences-after-save";
import type { DeliveryChannel } from "@/lib/scheduling/types";
import { createClient } from "@/lib/supabase/server";

export type CreateReminderInput = {
  title: string;
  message: string;
  mode: ScheduleMode;
  selectedDates: string[];
  times: string[];
  intervalDays?: number;
  weekdays?: number[];
  dayOfMonth?: number;
  channels: {
    sms?: boolean;
    whatsapp?: boolean;
    email?: boolean;
  };
  recipientLists?: RecipientLists;
};

export class CreateReminderError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 500 = 500,
  ) {
    super(message);
    this.name = "CreateReminderError";
  }
}

export async function createReminder(
  input: CreateReminderInput,
): Promise<{ id: string }> {
  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
  } catch {
    throw new CreateReminderError("Não autenticado", 401);
  }

  const { title, message, mode, selectedDates, times, intervalDays, weekdays, dayOfMonth, channels, recipientLists } =
    input;

  const billing = await getUserBillingContext(supabase, user.id);

  try {
    assertChannelsAllowedForPlan(billing, channels);
    assertScheduleModeAllowed(billing, mode);
    assertActiveReminderLimit(billing, true);
    assertRecipientListsAllowed(billing, recipientLists);
  } catch (error) {
    if (error instanceof BillingLimitError) {
      throw new CreateReminderError(error.message, 400);
    }
    throw error;
  }

  if (!title?.trim() || !message?.trim()) {
    throw new CreateReminderError("Título e mensagem são obrigatórios", 400);
  }

  const dates = (selectedDates ?? [])
    .map((d) => new Date(`${d}T12:00:00`))
    .filter((d) => !Number.isNaN(d.getTime()));

  const schedules = buildSchedulesFromForm({
    mode,
    selectedDates: dates,
    times: times ?? [],
    intervalDays,
    weekdays,
    dayOfMonth,
  });

  if (schedules.length === 0) {
    throw new CreateReminderError(
      "Agendamento inválido. Revise datas e horários.",
      400,
    );
  }

  const enabledChannels = (
    [
      channels?.sms && "sms",
      channels?.whatsapp && "whatsapp",
      channels?.email && "email",
    ] as const
  ).filter(Boolean) as DeliveryChannel[];

  if (enabledChannels.length === 0) {
    throw new CreateReminderError(
      "Selecione pelo menos um canal de envio",
      400,
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, phone")
    .eq("id", user.id)
    .maybeSingle();

  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .insert({
      user_id: user.id,
      title: title.trim(),
      message: message.trim(),
      timezone: "America/Sao_Paulo",
    })
    .select("id")
    .single();

  if (reminderError || !reminder) {
    throw new CreateReminderError(
      reminderError?.message ?? "Falha ao criar lembrete",
      500,
    );
  }

  const scheduleRows = schedules.map((s) => ({
    reminder_id: reminder.id,
    schedule_type: s.scheduleType,
    start_date: s.startDate,
    end_date: s.endDate,
    interval_days: s.intervalDays,
    times: s.times,
    dates: s.dates,
    weekdays: s.weekdays,
    day_of_month: s.dayOfMonth,
    config: s.config,
    sort_order: s.sortOrder,
  }));

  const { error: schedulesError } = await supabase
    .from("reminder_schedules")
    .insert(scheduleRows);

  if (schedulesError) {
    await supabase
      .from("reminders")
      .delete()
      .eq("id", reminder.id)
      .eq("user_id", user.id);
    throw new CreateReminderError(schedulesError.message, 500);
  }

  const channelRows = buildChannelRows({
    reminderId: reminder.id,
    enabledChannels,
    billing,
    profileEmail: profile?.email ?? user.email ?? null,
    profilePhone: profile?.phone ?? null,
    recipientLists,
  });

  const { error: channelsError } = await supabase
    .from("reminder_delivery_channels")
    .insert(channelRows);

  if (channelsError) {
    await supabase
      .from("reminders")
      .delete()
      .eq("id", reminder.id)
      .eq("user_id", user.id);
    throw new CreateReminderError(channelsError.message, 500);
  }

  await syncOccurrencesAfterSave(reminder.id);

  return { id: reminder.id };
}
