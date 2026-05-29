import "server-only";

import { Resend } from "resend";

import { formatEmailFrom } from "@/lib/dispatch/format-email-from";
import type { DispatchChannelResult, DispatchPayload } from "@/lib/dispatch/types";
import { env } from "@/lib/env";

function buildEmailHtml(payload: DispatchPayload): string {
  const title = escapeHtml(payload.title);
  const message = escapeHtml(payload.message).replace(/\n/g, "<br />");

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #18181b;">
    <h2 style="margin: 0 0 12px; font-size: 18px;">${title}</h2>
    <p style="margin: 0; white-space: pre-wrap;">${message}</p>
    <p style="margin: 24px 0 0; font-size: 12px; color: #71717a;">Enviado por Avizme</p>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmailStub(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  console.info("[dispatch:email:stub]", {
    to: payload.destination,
    title: payload.title,
    occurrenceId: payload.occurrenceId,
  });

  return { ok: true, providerMessageId: `stub-email-${payload.occurrenceId}` };
}

/** Envio real via Resend; cai em stub se RESEND_API_KEY não estiver configurada. */
export async function sendEmail(
  payload: DispatchPayload,
): Promise<DispatchChannelResult> {
  if (!env.resendApiKey) {
    return sendEmailStub(payload);
  }

  const to = payload.destination.trim();
  if (!to) {
    return { ok: false, error: "E-mail de destino vazio" };
  }

  const resend = new Resend(env.resendApiKey);
  const from = formatEmailFrom(env.emailFrom);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: payload.title,
    text: payload.message,
    html: buildEmailHtml(payload),
  });

  if (error) {
    console.error("[dispatch:email]", error);
    return {
      ok: false,
      error: error.message ?? "Falha ao enviar e-mail",
    };
  }

  console.info("[dispatch:email:sent]", {
    to,
    id: data?.id,
    occurrenceId: payload.occurrenceId,
  });

  return {
    ok: true,
    providerMessageId: data?.id ?? undefined,
  };
}
