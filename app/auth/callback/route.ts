import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { syncUserFromAuth } from "@/lib/users/sync-user";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

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
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
