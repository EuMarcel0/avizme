import { NextResponse } from "next/server";

import { syncUserFromAuth } from "@/lib/users/sync-user";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await syncUserFromAuth(supabase, user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[users/sync]", e);
    const message =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "Falha ao salvar usuário no banco";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
