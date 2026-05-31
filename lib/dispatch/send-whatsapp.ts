import "server-only";

import { formatSmsBody } from "@/lib/dispatch/format-sms-body";
import type { DispatchChannelResult, DispatchPayload } from "@/lib/dispatch/types";
import {
  createTwilioClient,
  hasTwilioWhatsappConfig,
  isTwilioWhatsappConfiguredAtAll,
  isValidTwilioMessagingServiceSid,
  normalizeWhatsappAddress,
  resolveTwilioWhatsappSenderError,
  toWhatsappDestination,
} from "@/lib/dispatch/twilio-config";
import { env } from "@/lib/env";
import { toE164Brazil } from "@/lib/phone/to-e164-brazil";

async function sendWhatsappStub(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  console.info("[dispatch:whatsapp:stub]", {
    to: payload.destination,
    title: payload.title,
    occurrenceId: payload.occurrenceId,
  });

  return {
    ok: true,
    providerMessageId: `stub-whatsapp-${payload.occurrenceId}`,
  };
}

/** Envio real via Twilio WhatsApp; cai em stub se credenciais não estiverem configuradas. */
export async function sendWhatsapp(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  if (!isTwilioWhatsappConfiguredAtAll()) {
    return sendWhatsappStub(payload);
  }

  const configError = resolveTwilioWhatsappSenderError();
  if (configError) {
    console.error("[dispatch:whatsapp:config]", configError);
    return { ok: false, error: configError };
  }

  if (!hasTwilioWhatsappConfig()) {
    return {
      ok: false,
      error: "Configuração Twilio WhatsApp incompleta.",
    };
  }

  const e164 = toE164Brazil(payload.destination);
  if (!e164) {
    return {
      ok: false,
      error: "Telefone de destino inválido para WhatsApp",
    };
  }

  const to = toWhatsappDestination(e164);
  const body = formatSmsBody(payload);

  try {
    const client = createTwilioClient();
    const message = await client.messages.create({
      body,
      to,
      ...(isValidTwilioMessagingServiceSid(env.twilioMessagingServiceSid) &&
      !env.twilioWhatsappFrom
        ? { messagingServiceSid: env.twilioMessagingServiceSid }
        : { from: normalizeWhatsappAddress(env.twilioWhatsappFrom!) }),
    });

    console.info("[dispatch:whatsapp:sent]", {
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
      error instanceof Error ? error.message : "Falha ao enviar WhatsApp";
    console.error("[dispatch:whatsapp]", error);

    return {
      ok: false,
      error: twilioMessage,
    };
  }
}
