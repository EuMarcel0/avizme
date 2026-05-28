import "server-only";

import type { DispatchChannelResult, DispatchPayload } from "@/lib/dispatch/types";

/** Fase 1: stub — integrar Resend/SES na fase 2. */
export async function sendEmail(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  console.info("[dispatch:email]", {
    to: payload.destination,
    title: payload.title,
    occurrenceId: payload.occurrenceId,
  });

  return { ok: true, providerMessageId: `stub-email-${payload.occurrenceId}` };
}
