import "server-only";

import type { DispatchChannelResult, DispatchPayload } from "@/lib/dispatch/types";

/** Fase 1: stub — integrar Twilio/Meta WhatsApp na fase 3. */
export async function sendWhatsapp(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  console.info("[dispatch:whatsapp]", {
    to: payload.destination,
    title: payload.title,
    occurrenceId: payload.occurrenceId,
  });

  return { ok: true, providerMessageId: `stub-whatsapp-${payload.occurrenceId}` };
}
