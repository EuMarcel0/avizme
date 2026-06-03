/** Configuração central do site público (LP / SEO). */

export const SITE_NAME = "Avizme";

export const SITE_TAGLINE =
  "Lembretes, avisos e alertas por e-mail, SMS e WhatsApp";

export const SITE_DESCRIPTION =
  "Avizme: agende lembretes, avisos, alertas e recados automáticos. Lembre-me por SMS, WhatsApp ou e-mail — consultas, reuniões, medicamentos, pagamentos e agenda. Comece grátis.";

export const SITE_KEYWORDS = [
  "lembretes",
  "lembrete automático",
  "lembre-me",
  "avise-me",
  "avisos",
  "alertas",
  "alarmes",
  "recados",
  "agendamento",
  "agenda",
  "calendário",
  "lembrete por SMS",
  "lembrete WhatsApp",
  "lembrete por e-mail",
  "agendar lembrete",
  "lembrete de reunião",
  "lembrete de medicamento",
  "lembrete de pagamento",
  "mensagem agendada",
  "notificação recorrente",
  "Avizme",
  "lembretes Brasil",
] as const;

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";
  return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`;
}

export const SITE_URL = getSiteUrl();

export const SITE_OG_IMAGE = `${SITE_URL}/images/LOGOTIPO.png`;

export const SITE_LOCALE = "pt_BR";

export const SITE_TWITTER_HANDLE = "@avizme";
