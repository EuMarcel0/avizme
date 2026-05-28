import { env } from "@/lib/env";

/**
 * Valida chamadas de cron (Vercel envia `Authorization: Bearer CRON_SECRET`).
 * Em desenvolvimento, permite sem secret para testes locais com curl.
 */
export function verifyCronRequest(request: Request): boolean {
  const secret = env.cronSecret;

  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
