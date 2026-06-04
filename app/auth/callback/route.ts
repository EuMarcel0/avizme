import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { syncUserFromAuth } from "@/lib/users/sync-user";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    console.error("[auth/callback] oauth error", oauthError);
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          await syncUserFromAuth(supabase, user);
        } catch (e) {
          console.error("[auth/callback] sync user", e);
          return NextResponse.redirect(`${origin}/login?error=auth`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchangeCodeForSession", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
