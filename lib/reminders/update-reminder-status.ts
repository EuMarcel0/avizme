import "server-only";

import type { ReminderStatus } from "@/lib/reminders/reminder-status";
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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UpdateReminderStatusError("Não autenticado", 401);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("reminders")
    .select("id, status")
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw new UpdateReminderStatusError(fetchError.message, 500);
  }

  if (!existing) {
    throw new UpdateReminderStatusError("Lembrete não encontrado", 404);
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
