import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";

export type SyncUserInput = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
};

export function mapAuthUserToSyncInput(authUser: AuthUser): SyncUserInput {
  const meta = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    fullName:
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      null,
    phone: (meta.phone as string | undefined) ?? null,
  };
}

/** Garante registro na tabela `users` via API Supabase (sem conexão Postgres direta). */
export async function syncUserRecord(
  supabase: SupabaseClient,
  input: SyncUserInput,
) {
  const now = new Date().toISOString();

  const { error } = await supabase.from("users").upsert(
    {
      id: input.id,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

export async function syncUserFromAuth(
  supabase: SupabaseClient,
  authUser: AuthUser,
) {
  await syncUserRecord(supabase, mapAuthUserToSyncInput(authUser));
}
