import "server-only";

import { toClientBillingInfo } from "@/lib/billing/client-billing";
import { getUserBillingContext } from "@/lib/billing/get-user-billing";
import { clampScheduleModeForPlan } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe-config";
import { mapScheduleRowsToFormValues } from "@/lib/reminders/map-schedule-rows-to-form";
import {
  requireAuthenticatedUser,
  requireReminderOwnedByUser,
  ReminderAuthError,
} from "@/lib/reminders/require-auth";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";
import type { NewReminderValues } from "@/lib/validations/reminder";
import { createClient } from "@/lib/supabase/server";

export class GetReminderForEditError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 404 | 500 = 500,
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
  billing: ClientBillingInfo;
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
    throw new GetReminderForEditError("Lembrete não encontrado", 404);
  }

  if (reminder.status === "completed" || reminder.status === "archived") {
    throw new GetReminderForEditError(
      "Este lembrete teve o ciclo finalizado e não pode ser editado.",
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

  for (const row of channelRows) {
    const list = (row.destinations ?? []).filter(Boolean);
    if (list.length > 0 && row.channel in recipientLists) {
      recipientLists[row.channel as keyof typeof recipientLists] = list;
    }
  }

  const billingContext = await getUserBillingContext(supabase, user.id);
  const billing = toClientBillingInfo(billingContext, isStripeConfigured());

  const formValues: NewReminderValues = {
    title: reminder.title,
    message: reminder.message,
    ...schedulePart,
    mode: clampScheduleModeForPlan(billing.planTier, schedulePart.mode),
    recipientLists,
  };

  return {
    id: reminder.id,
    title: reminder.title,
    message: reminder.message,
    userEmail: profile?.email ?? user.email ?? null,
    userPhone: profile?.phone ?? null,
    billing,
    formValues,
  };
}
