import "server-only";

import { generateOccurrencesForReminder } from "@/lib/scheduling/generate-occurrences";
import { createServiceClient } from "@/lib/supabase/service";

/** Regenera ocorrências futuras após criar/editar lembrete (não bloqueia o fluxo). */
export async function syncOccurrencesAfterSave(reminderId: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    await generateOccurrencesForReminder(supabase, reminderId, {
      replaceFuturePending: true,
    });
  } catch (error) {
    console.error("[syncOccurrencesAfterSave]", reminderId, error);
  }
}
