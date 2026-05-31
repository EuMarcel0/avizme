import "server-only";

import twilio from "twilio";

import { env } from "@/lib/env";

export function isValidTwilioAccountSid(
  value: string | undefined,
): value is string {
  return Boolean(value?.startsWith("AC") && value.length > 2);
}

export function isValidTwilioMessagingServiceSid(
  value: string | undefined,
): value is string {
  return Boolean(value?.startsWith("MG") && value.length > 2);
}

export function isTwilioConfiguredAtAll(): boolean {
  return Boolean(
    env.twilioAccountSid ||
      env.twilioAuthToken ||
      env.twilioPhoneNumber ||
      env.twilioMessagingServiceSid ||
      env.twilioWhatsappFrom,
  );
}

export function resolveTwilioCredentialsError(): string | null {
  if (!isTwilioConfiguredAtAll()) {
    return null;
  }

  if (!isValidTwilioAccountSid(env.twilioAccountSid)) {
    return "TWILIO_ACCOUNT_SID inválido: use o Account SID da Twilio (começa com AC), não o Messaging Service (MG).";
  }

  if (!env.twilioAuthToken) {
    return "TWILIO_AUTH_TOKEN ausente.";
  }

  if (
    env.twilioMessagingServiceSid &&
    !isValidTwilioMessagingServiceSid(env.twilioMessagingServiceSid)
  ) {
    return "TWILIO_MESSAGING_SERVICE_SID inválido (deve começar com MG).";
  }

  return null;
}

export function resolveTwilioSmsSenderError(): string | null {
  const credentialsError = resolveTwilioCredentialsError();
  if (credentialsError) return credentialsError;

  if (!isTwilioConfiguredAtAll()) {
    return null;
  }

  if (
    !env.twilioPhoneNumber &&
    !isValidTwilioMessagingServiceSid(env.twilioMessagingServiceSid)
  ) {
    return "Configure TWILIO_MESSAGING_SERVICE_SID (MG…) ou TWILIO_PHONE_NUMBER.";
  }

  return null;
}

export function resolveTwilioWhatsappSenderError(): string | null {
  const credentialsError = resolveTwilioCredentialsError();
  if (credentialsError) return credentialsError;

  if (!env.twilioWhatsappFrom && !env.twilioMessagingServiceSid) {
    return null;
  }

  if (
    !env.twilioWhatsappFrom &&
    !isValidTwilioMessagingServiceSid(env.twilioMessagingServiceSid)
  ) {
    return "Configure TWILIO_WHATSAPP_FROM (whatsapp:+…) ou TWILIO_MESSAGING_SERVICE_SID com remetente WhatsApp.";
  }

  return null;
}

export function hasTwilioSmsConfig(): boolean {
  return Boolean(
    isValidTwilioAccountSid(env.twilioAccountSid) &&
      env.twilioAuthToken &&
      (env.twilioPhoneNumber ||
        isValidTwilioMessagingServiceSid(env.twilioMessagingServiceSid)),
  );
}

export function hasTwilioWhatsappConfig(): boolean {
  return Boolean(
    isValidTwilioAccountSid(env.twilioAccountSid) &&
      env.twilioAuthToken &&
      (env.twilioWhatsappFrom ||
        isValidTwilioMessagingServiceSid(env.twilioMessagingServiceSid)),
  );
}

export function isTwilioWhatsappConfiguredAtAll(): boolean {
  return Boolean(env.twilioWhatsappFrom || env.twilioMessagingServiceSid);
}

export function createTwilioClient() {
  return twilio(env.twilioAccountSid!, env.twilioAuthToken!);
}

/** Garante prefixo `whatsapp:` + E.164 (ex.: whatsapp:+5577998123456). */
export function normalizeWhatsappAddress(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("whatsapp:")) {
    return trimmed;
  }
  if (trimmed.startsWith("+")) {
    return `whatsapp:${trimmed}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `whatsapp:+${digits}` : trimmed;
}

export function toWhatsappDestination(e164: string): string {
  return normalizeWhatsappAddress(e164);
}
