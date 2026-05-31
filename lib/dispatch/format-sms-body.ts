import type { DispatchPayload } from "@/lib/dispatch/types";

const SMS_MAX_LENGTH = 1600;

/** Texto do SMS: título + mensagem (limite seguro para multipart). */
export function formatSmsBody(payload: DispatchPayload): string {
  const title = payload.title.trim();
  const message = payload.message.trim();

  let body: string;
  if (title && message) {
    body = `${title}\n\n${message}`;
  } else {
    body = title || message;
  }

  if (body.length <= SMS_MAX_LENGTH) {
    return body;
  }

  return `${body.slice(0, SMS_MAX_LENGTH - 1)}…`;
}
