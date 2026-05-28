import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

export class ReminderAuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 404 = 401,
  ) {
    super(message);
    this.name = "ReminderAuthError";
  }
}

/** Exige sessão válida (SSR / Route Handler / Server Action). */
export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ReminderAuthError("Não autenticado", 401);
  }

  return user;
}

/** Garante que o lembrete pertence ao usuário (RLS + filtro explícito no app). */
export async function requireReminderOwnedByUser(
  supabase: SupabaseClient,
  reminderId: string,
  userId: string,
): Promise<{ id: string; status: string }> {
  const { data, error } = await supabase
    .from("reminders")
    .select("id, status")
    .eq("id", reminderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ReminderAuthError(error.message, 401);
  }

  if (!data) {
    throw new ReminderAuthError("Lembrete não encontrado", 404);
  }

  return data;
}
