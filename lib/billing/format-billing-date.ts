import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

const APP_TIMEZONE = "America/Sao_Paulo";

export function formatBillingDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const zoned = toZonedTime(date, APP_TIMEZONE);
  return format(zoned, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}
