import { NextResponse } from "next/server";

import { verifyCronRequest } from "@/lib/cron/verify-cron-request";
import { dispatchDueReminders } from "@/lib/dispatch/dispatch-batch";
import { generateOccurrencesBatch } from "@/lib/scheduling/generate-occurrences";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Executa gerador + dispatcher numa única chamada.
 * Use com cron externo (cron-job.org, etc.) no plano Hobby da Vercel.
 */
export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const generate = await generateOccurrencesBatch(supabase);
    const dispatch = await dispatchDueReminders();

    return NextResponse.json({
      ok: true,
      generate,
      dispatch,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro no cron tick";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
