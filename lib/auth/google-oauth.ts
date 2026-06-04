"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getAuthCallbackUrl } from "@/lib/auth/get-auth-callback-url";

export type SignInWithGoogleOptions = {
  /** Rota interna após login (ex.: /app, /app/plano). */
  next?: string;
};

export async function signInWithGoogle(
  supabase: SupabaseClient,
  options: SignInWithGoogleOptions = {},
) {
  const next = options.next ?? "/app";

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(next),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}
