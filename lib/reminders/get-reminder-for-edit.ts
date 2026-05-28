import "server-only";

import { mapScheduleRowsToFormValues } from "@/lib/reminders/map-schedule-rows-to-form";
import {
  requireAuthenticatedUser,
  requireReminderOwnedByUser,
  ReminderAuthError,
} from "@/lib/reminders/require-auth";
import type { NewReminderValues } from "@/lib/validations/reminder";
import { createClient } from "@/lib/supabase/server";

export class GetReminderForEditError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 404 | 500 = 500,
  ) {
    super(message);
    this.name = "GetReminderForEditError";
  }
}

export type ReminderForEdit = {
  id: string;
  title: string;
  message: string;
  userEmail: string | null;
  userPhone: string | null;
  formValues: NewReminderValues;
};

export async function getReminderForEdit(
  reminderId: string,
): Promise<ReminderForEdit> {
  const supabase = await createClient();

  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
    await requireReminderOwnedByUser(supabase, reminderId, user.id);
  } catch (error) {
    if (error instanceof ReminderAuthError) {
      throw new GetReminderForEditError(
        error.message,
        error.status === 404 ? 404 : 401,
      );
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
        is_enabled
      )
    `,
    )
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .single();

  if (reminderError || !reminder) {
    throw new GetReminderForEditError("Lembrete não encontrado", 404);
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

  const formValues: NewReminderValues = {
    title: reminder.title,
    message: reminder.message,
    ...schedulePart,
  };

  return {
    id: reminder.id,
    title: reminder.title,
    message: reminder.message,
    userEmail: profile?.email ?? user.email ?? null,
    userPhone: profile?.phone ?? null,
    formValues,
  };
}
