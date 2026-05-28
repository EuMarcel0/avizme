import "server-only";

import type { DispatchChannelResult, DispatchPayload } from "@/lib/dispatch/types";

/** Fase 1: stub — integrar Twilio/Zenvia na fase 3. */
export async function sendSms(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  console.info("[dispatch:sms]", {
    to: payload.destination,
    title: payload.title,
    occurrenceId: payload.occurrenceId,
  });

  return { ok: true, providerMessageId: `stub-sms-${payload.occurrenceId}` };
}
