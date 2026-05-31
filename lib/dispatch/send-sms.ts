import "server-only";

import twilio from "twilio";

import { formatSmsBody } from "@/lib/dispatch/format-sms-body";
import type { DispatchChannelResult, DispatchPayload } from "@/lib/dispatch/types";
import { env } from "@/lib/env";
import { toE164Brazil } from "@/lib/phone/to-e164-brazil";

function hasTwilioConfig(): boolean {
  return Boolean(
    env.twilioAccountSid &&
      env.twilioAuthToken &&
      (env.twilioPhoneNumber || env.twilioMessagingServiceSid),
  );
}

async function sendSmsStub(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  console.info("[dispatch:sms:stub]", {
    to: payload.destination,
    title: payload.title,
    occurrenceId: payload.occurrenceId,
  });

  return { ok: true, providerMessageId: `stub-sms-${payload.occurrenceId}` };
}

/** Envio real via Twilio; cai em stub se credenciais não estiverem configuradas. */
export async function sendSms(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  if (!hasTwilioConfig()) {
    return sendSmsStub(payload);
  }

  const to = toE164Brazil(payload.destination);
  if (!to) {
    return {
      ok: false,
      error: "Telefone de destino inválido para SMS",
    };
  }

  const client = twilio(env.twilioAccountSid!, env.twilioAuthToken!);
  const body = formatSmsBody(payload);

  try {
    const message = await client.messages.create({
      body,
      to,
      ...(env.twilioMessagingServiceSid
        ? { messagingServiceSid: env.twilioMessagingServiceSid }
        : { from: env.twilioPhoneNumber! }),
    });

    console.info("[dispatch:sms:sent]", {
      to,
      sid: message.sid,
      occurrenceId: payload.occurrenceId,
    });

    return {
      ok: true,
      providerMessageId: message.sid,
    };
  } catch (error) {
    const twilioMessage =
      error instanceof Error ? error.message : "Falha ao enviar SMS";
    console.error("[dispatch:sms]", error);

    return {
      ok: false,
      error: twilioMessage,
    };
  }
}
