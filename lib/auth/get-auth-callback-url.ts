import { env } from "@/lib/env";

/**
 * URL de retorno após OAuth (Google).
 * Deve estar em Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export function getAuthCallbackUrl(next = "/app"): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : env.appUrl.replace(/\/$/, "");

  const url = new URL("/auth/callback", base);
  if (next.startsWith("/") && !next.startsWith("//")) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

/** URI de redirect cadastrada no Google Cloud (aponta para o Supabase, não para o app). */
export function getSupabaseGoogleRedirectUri(supabaseProjectUrl?: string): string {
  const base = (supabaseProjectUrl ?? env.supabaseUrl).replace(/\/$/, "");
  return `${base}/auth/v1/callback`;
}
