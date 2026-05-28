function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

function readSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_API_URL
  );
}

function readSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY
  );
}

export const env = {
  supabaseUrl: required(
    "SUPABASE_API_URL / NEXT_PUBLIC_SUPABASE_URL",
    readSupabaseUrl(),
  ),
  supabaseAnonKey: required(
    "SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    readSupabaseAnonKey(),
  ),
};

export function getDatabaseUrl(): string {
  return required(
    "SUPABASE_DB_DIRECT_CONNECTION_STRING / DATABASE_URL",
    process.env.SUPABASE_DB_DIRECT_CONNECTION_STRING ??
      process.env.DATABASE_URL,
  );
}
