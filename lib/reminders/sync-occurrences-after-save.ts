import "server-only";

import { dispatchDueReminders } from "@/lib/dispatch/dispatch-batch";
import { generateOccurrencesForReminder } from "@/lib/scheduling/generate-occurrences";
import { createServiceClient } from "@/lib/supabase/service";

/** Regenera ocorrências futuras após criar/editar lembrete e envia as já vencidas. */
export async function syncOccurrencesAfterSave(reminderId: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    await generateOccurrencesForReminder(supabase, reminderId, {
      replaceFuturePending: true,
    });
    await dispatchDueReminders();
  } catch (error) {
    console.error("[syncOccurrencesAfterSave]", reminderId, error);
  }
}
