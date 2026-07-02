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
  /** Twilio — envio de SMS (fase 2). */
  twilioAccountSid: optional(process.env.TWILIO_ACCOUNT_SID),
  twilioAuthToken: optional(process.env.TWILIO_AUTH_TOKEN),
  /** Número remetente E.164 (ex.: +551140000000) ou use TWILIO_MESSAGING_SERVICE_SID. */
  twilioPhoneNumber: optional(process.env.TWILIO_PHONE_NUMBER),
  twilioMessagingServiceSid: optional(process.env.TWILIO_MESSAGING_SERVICE_SID),
  /** Remetente WhatsApp Twilio (ex.: whatsapp:+14155238886 no sandbox). */
  twilioWhatsappFrom: optional(process.env.TWILIO_WHATSAPP_FROM),
  /** Stripe — cobrança e assinaturas. */
  stripeSecretKey: optional(process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: optional(process.env.STRIPE_WEBHOOK_SECRET),
  stripePricePro: optional(process.env.STRIPE_PRICE_PRO),
  /** Premium (legado: STRIPE_PRICE_BUSINESS). */
  stripePricePremium: optional(process.env.STRIPE_PRICE_PREMIUM),
  stripePriceBusiness: optional(process.env.STRIPE_PRICE_BUSINESS),
  appUrl: optional(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
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
