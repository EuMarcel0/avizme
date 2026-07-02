import "server-only";

import { assertDuplicateReminderAllowed, BillingLimitError } from "@/lib/billing/enforce-limits";
import { getUserBillingContext } from "@/lib/billing/get-user-billing";
import { clampScheduleModeForPlan } from "@/lib/billing/plans";
import { recipientExtrasFromStored } from "@/lib/billing/recipient-lists";
import {
  createReminder,
  CreateReminderError,
  type CreateReminderInput,
} from "@/lib/reminders/create-reminder";
import { toDateString } from "@/lib/reminders/date-utils";
import { mapScheduleRowsToFormValues } from "@/lib/reminders/map-schedule-rows-to-form";
import {
  requireAuthenticatedUser,
  requireReminderOwnedByUser,
  ReminderAuthError,
} from "@/lib/reminders/require-auth";
import type { DeliveryChannel } from "@/lib/scheduling/types";
import { createClient } from "@/lib/supabase/server";

export const DUPLICATE_REMINDER_SUFFIX = " (Duplicado)";

export class DuplicateReminderError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 404 | 500 = 500,
  ) {
    super(message);
    this.name = "DuplicateReminderError";
  }
}

function withDuplicateSuffix(value: string): string {
  const trimmed = value.trim();
  if (trimmed.endsWith(DUPLICATE_REMINDER_SUFFIX)) return trimmed;
  return `${trimmed}${DUPLICATE_REMINDER_SUFFIX}`;
}

export async function duplicateReminder(
  reminderId: string,
): Promise<{ id: string }> {
  const supabase = await createClient();

  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
    await requireReminderOwnedByUser(supabase, reminderId, user.id);
  } catch (error) {
    if (error instanceof ReminderAuthError) {
      throw new DuplicateReminderError(
        error.message,
        error.status === 404 ? 404 : 401,
      );
    }
    throw error;
  }

  const billing = await getUserBillingContext(supabase, user.id);
  try {
    assertDuplicateReminderAllowed(billing);
  } catch (error) {
    if (error instanceof BillingLimitError) {
      throw new DuplicateReminderError(error.message, 400);
    }
    throw error;
  }

  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select(
      `
      id,
      title,
      message,
      status,
      reminder_schedules (
        schedule_type,
        start_date,
        end_date,
        interval_days,
        times,
        dates,
        weekdays,
        day_of_month,
        config,
        sort_order
      ),
      reminder_delivery_channels (
        channel,
        is_enabled,
        destination,
        destinations
      )
    `,
    )
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .single();

  if (reminderError || !reminder) {
    throw new DuplicateReminderError("Lembrete não encontrado", 404);
  }

  if (reminder.status !== "active") {
    throw new DuplicateReminderError(
      "Só é possível duplicar lembretes ativos.",
      400,
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, phone")
    .eq("id", user.id)
    .maybeSingle();

  const schedulePart = mapScheduleRowsToFormValues(
    (reminder.reminder_schedules ?? []) as Parameters<
      typeof mapScheduleRowsToFormValues
    >[0],
    (reminder.reminder_delivery_channels ?? []) as Parameters<
      typeof mapScheduleRowsToFormValues
    >[1],
  );

  const channelRows = (reminder.reminder_delivery_channels ?? []) as Array<{
    channel: string;
    destinations?: string[] | null;
    destination?: string | null;
  }>;

  const recipientLists = {
    email: [] as string[],
    sms: [] as string[],
    whatsapp: [] as string[],
  };

  const profileEmail = profile?.email ?? user.email ?? null;
  const profilePhone = profile?.phone ?? null;

  for (const row of channelRows) {
    const rawDestinations = (row.destinations ?? []).filter(
      (d): d is string => Boolean(d),
    );
    const stored =
      rawDestinations.length > 0
        ? rawDestinations
        : row.destination?.trim()
          ? [row.destination.trim()]
          : [];

    if (stored.length === 0 || !(row.channel in recipientLists)) continue;

    const channel = row.channel as DeliveryChannel;
    recipientLists[channel as keyof typeof recipientLists] =
      recipientExtrasFromStored(
        channel,
        stored,
        profileEmail,
        profilePhone,
      );
  }

  const mode = clampScheduleModeForPlan(billing.limits, schedulePart.mode);
  const selectedDates = schedulePart.selectedDates.map(toDateString);
  const times = schedulePart.times.filter((t): t is string => Boolean(t));

  const input: CreateReminderInput = {
    title: withDuplicateSuffix(reminder.title),
    message: withDuplicateSuffix(reminder.message),
    mode,
    selectedDates,
    times,
    intervalDays: schedulePart.intervalDays ?? undefined,
    weekdays: schedulePart.weekdays?.filter((d): d is number => d !== undefined),
    dayOfMonth: schedulePart.dayOfMonth ?? undefined,
    channels: schedulePart.channels,
    recipientLists,
  };

  try {
    return await createReminder(input);
  } catch (error) {
    if (error instanceof CreateReminderError) {
      throw new DuplicateReminderError(error.message, error.status);
    }
    throw error;
  }
}
