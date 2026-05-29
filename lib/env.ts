function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

function optional(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
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
  /** Service role — apenas rotas cron / jobs (nunca no cliente). */
  supabaseServiceRoleKey: optional(process.env.SUPABASE_SERVICE_ROLE_KEY),
  /** Vercel injeta CRON_SECRET e envia Bearer nas chamadas agendadas. */
  cronSecret: optional(process.env.CRON_SECRET),
  /** Resend — envio de e-mail (fase 1). */
  resendApiKey: optional(process.env.RESEND_API_KEY),
  emailFrom: optional(process.env.EMAIL_FROM),
};

export function getDatabaseUrl(): string {
  return required(
    "SUPABASE_DB_DIRECT_CONNECTION_STRING / DATABASE_URL",
    process.env.SUPABASE_DB_DIRECT_CONNECTION_STRING ??
      process.env.DATABASE_URL,
  );
}

export function requireServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    env.supabaseServiceRoleKey,
  );
}
