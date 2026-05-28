import "server-only";

import type { ReminderStatus } from "@/lib/reminders/reminder-status";
import {
  requireAuthenticatedUser,
  requireReminderOwnedByUser,
  ReminderAuthError,
} from "@/lib/reminders/require-auth";
import { createClient } from "@/lib/supabase/server";

export class UpdateReminderStatusError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 404 | 500 = 500,
  ) {
    super(message);
    this.name = "UpdateReminderStatusError";
  }
}

export async function updateReminderStatus(
  reminderId: string,
  nextStatus: ReminderStatus,
): Promise<void> {
  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
    await requireReminderOwnedByUser(supabase, reminderId, user.id);
  } catch (error) {
    if (error instanceof ReminderAuthError) {
      throw new UpdateReminderStatusError(
        error.message,
        error.status === 404 ? 404 : 401,
      );
    }
    throw error;
  }

  const { error: updateError } = await supabase
    .from("reminders")
    .update({ status: nextStatus })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new UpdateReminderStatusError(updateError.message, 500);
  }
}
