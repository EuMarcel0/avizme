import "server-only";

import { buildChannelRows } from "@/lib/billing/build-channel-rows";
import { normalizeRecipientLists } from "@/lib/billing/recipient-lists";
import {
  assertChannelsAllowedForPlan,
  assertRecipientListsAllowed,
  assertScheduleModeAllowed,
  BillingLimitError,
  type RecipientLists,
} from "@/lib/billing/enforce-limits";
import { getUserBillingContext } from "@/lib/billing/get-user-billing";
import {
  buildSchedulesFromForm,
  type ScheduleMode,
} from "@/lib/reminders/build-schedules";
import {
  requireAuthenticatedUser,
  requireReminderOwnedByUser,
  ReminderAuthError,
} from "@/lib/reminders/require-auth";
import { syncOccurrencesAfterSave } from "@/lib/reminders/sync-occurrences-after-save";
import type { DeliveryChannel } from "@/lib/scheduling/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateReminderInput = {
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

export class UpdateReminderError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 404 | 500 = 500,
  ) {
    super(message);
    this.name = "UpdateReminderError";
  }
}

export async function updateReminder(
  reminderId: string,
  input: UpdateReminderInput,
): Promise<void> {
  const supabase = await createClient();

  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
    await requireReminderOwnedByUser(supabase, reminderId, user.id);
  } catch (error) {
    if (error instanceof ReminderAuthError) {
      throw new UpdateReminderError(
        error.message,
        error.status === 404 ? 404 : 401,
      );
    }
    throw error;
  }

  const { data: existing, error: existingError } = await supabase
    .from("reminders")
    .select("status")
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existing) {
    throw new UpdateReminderError("Lembrete não encontrado", 404);
  }

  if (existing.status === "completed" || existing.status === "archived") {
    throw new UpdateReminderError(
      "Este lembrete teve o ciclo finalizado e não pode ser alterado.",
      400,
    );
  }

  const {
    title,
    message,
    mode,
    selectedDates,
    times,
    intervalDays,
    weekdays,
    dayOfMonth,
    channels,
    recipientLists,
  } = input;

  const billing = await getUserBillingContext(supabase, user.id);

  try {
    assertChannelsAllowedForPlan(billing, channels);
    assertScheduleModeAllowed(billing, mode);
    assertRecipientListsAllowed(billing, recipientLists);
  } catch (error) {
    if (error instanceof BillingLimitError) {
      throw new UpdateReminderError(error.message, 400);
    }
    throw error;
  }

  if (!title?.trim() || !message?.trim()) {
    throw new UpdateReminderError("Título e mensagem são obrigatórios", 400);
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
    throw new UpdateReminderError(
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
    throw new UpdateReminderError(
      "Selecione pelo menos um canal de envio",
      400,
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, phone")
    .eq("id", user.id)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("reminders")
    .update({
      title: title.trim(),
      message: message.trim(),
    })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new UpdateReminderError(updateError.message, 500);
  }

  const { error: deleteSchedulesError } = await supabase
    .from("reminder_schedules")
    .delete()
    .eq("reminder_id", reminderId);

  if (deleteSchedulesError) {
    throw new UpdateReminderError(deleteSchedulesError.message, 500);
  }

  const scheduleRows = schedules.map((s) => ({
    reminder_id: reminderId,
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
    throw new UpdateReminderError(schedulesError.message, 500);
  }

  const { error: deleteChannelsError } = await supabase
    .from("reminder_delivery_channels")
    .delete()
    .eq("reminder_id", reminderId);

  if (deleteChannelsError) {
    throw new UpdateReminderError(deleteChannelsError.message, 500);
  }

  const normalizedRecipientLists = normalizeRecipientLists(recipientLists);

  const channelRows = buildChannelRows({
    reminderId,
    enabledChannels,
    billing,
    profileEmail: profile?.email ?? user.email ?? null,
    profilePhone: profile?.phone ?? null,
    recipientLists: normalizedRecipientLists,
  });

  const { error: channelsError } = await supabase
    .from("reminder_delivery_channels")
    .insert(channelRows);

  if (channelsError) {
    throw new UpdateReminderError(channelsError.message, 500);
  }

  await syncOccurrencesAfterSave(reminderId);
}
