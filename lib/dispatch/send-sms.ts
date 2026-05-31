import "server-only";

import { formatSmsBody } from "@/lib/dispatch/format-sms-body";
import type { DispatchChannelResult, DispatchPayload } from "@/lib/dispatch/types";
import {
  createTwilioClient,
  hasTwilioSmsConfig,
  isTwilioConfiguredAtAll,
  isValidTwilioMessagingServiceSid,
  resolveTwilioSmsSenderError
} from "@/lib/dispatch/twilio-config";
import { env } from "@/lib/env";
import { toE164Brazil } from "@/lib/phone/to-e164-brazil";

async function sendSmsStub(payload: DispatchPayload): Promise<DispatchChannelResult> {
  console.info("[dispatch:sms:stub]", {
    to: payload.destination,
    title: payload.title,
    occurrenceId: payload.occurrenceId
  });

  return { ok: true, providerMessageId: `stub-sms-${payload.occurrenceId}` };
}

/** Envio real via Twilio; cai em stub se credenciais não estiverem configuradas. */
export async function sendSms(payload: DispatchPayload): Promise<DispatchChannelResult> {
  if (!isTwilioConfiguredAtAll()) {
    return sendSmsStub(payload);
  }

  const configError = resolveTwilioSmsSenderError();
  if (configError) {
    console.error("[dispatch:sms:config]", configError);
    return { ok: false, error: configError };
  }

  if (!hasTwilioSmsConfig()) {
    return {
      ok: false,
      error: "Configuração Twilio incompleta."
    };
  }

  const to = toE164Brazil(payload.destination);
  if (!to) {
    return {
      ok: false,
      error: "Telefone de destino inválido para SMS"
    };
  }

  const body = formatSmsBody(payload);

  try {
    const client = createTwilioClient();
    const message = await client.messages.create({
      body,
      to,
      ...(isValidTwilioMessagingServiceSid(env.twilioMessagingServiceSid)
        ? { messagingServiceSid: env.twilioMessagingServiceSid }
        : { from: env.twilioPhoneNumber! })
    });

    console.info("[dispatch:sms:sent]", {
      to,
      sid: message.sid,
      occurrenceId: payload.occurrenceId
    });

    return {
      ok: true,
      providerMessageId: message.sid
    };
  } catch (error) {
    const twilioMessage = error instanceof Error ? error.message : "Falha ao enviar SMS";
    console.error("[dispatch:sms]", error);

    return {
      ok: false,
      error: twilioMessage
    };
  }
}
