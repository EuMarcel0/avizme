import "server-only";

import { randomUUID } from "crypto";

import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_REMINDER,
} from "@/lib/reminders/attachment-utils";
import {
  requireAuthenticatedUser,
  requireReminderOwnedByUser,
  ReminderAuthError,
} from "@/lib/reminders/require-auth";
import { createClient } from "@/lib/supabase/server";

export const REMINDER_ATTACHMENTS_BUCKET = "reminder-attachments";

const ALLOWED_MIME_PREFIXES = ["image/", "text/"];
const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
]);

export type ReminderAttachmentRecord = {
  id: string;
  reminderId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export class ReminderAttachmentError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 404 | 500 = 400,
  ) {
    super(message);
    this.name = "ReminderAttachmentError";
  }
}

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "arquivo";
  const cleaned = base
    .replace(/[^\w.\-() áàãâéêíóôúçÁÀÃÂÉÊÍÓÔÚÇ]/gi, "_")
    .trim();
  return cleaned.slice(0, 180) || "arquivo";
}

function isAllowedMime(mime: string): boolean {
  if (!mime) return false;
  if (ALLOWED_MIME_EXACT.has(mime)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

function buildStoragePath(
  userId: string,
  reminderId: string,
  attachmentId: string,
  fileName: string,
): string {
  return `${userId}/${reminderId}/${attachmentId}/${sanitizeFileName(fileName)}`;
}

function mapAttachmentRow(row: {
  id: string;
  reminder_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}): ReminderAttachmentRecord {
  return {
    id: row.id,
    reminderId: row.reminder_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

async function assertReminderWritable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reminderId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("reminders")
    .select("status")
    .eq("id", reminderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new ReminderAttachmentError(error.message, 500);
  if (!data) throw new ReminderAttachmentError("Lembrete não encontrado", 404);
  if (data.status === "completed" || data.status === "archived") {
    throw new ReminderAttachmentError(
      "Este lembrete não pode ser alterado.",
      400,
    );
  }
}

export async function listReminderAttachments(
  reminderId: string,
): Promise<ReminderAttachmentRecord[]> {
  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
    await requireReminderOwnedByUser(supabase, reminderId, user.id);
  } catch (error) {
    if (error instanceof ReminderAuthError) {
      throw new ReminderAttachmentError(
        error.message,
        error.status === 404 ? 404 : 401,
      );
    }
    throw error;
  }

  const { data, error } = await supabase
    .from("reminder_attachments")
    .select("id, reminder_id, file_name, mime_type, size_bytes, created_at")
    .eq("reminder_id", reminderId)
    .order("created_at", { ascending: true });

  if (error) throw new ReminderAttachmentError(error.message, 500);
  return (data ?? []).map(mapAttachmentRow);
}

export async function uploadReminderAttachment(
  reminderId: string,
  file: File,
): Promise<ReminderAttachmentRecord> {
  if (!file || file.size <= 0) {
    throw new ReminderAttachmentError("Arquivo inválido.");
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new ReminderAttachmentError(
      `Arquivo muito grande. Máximo ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB.`,
    );
  }
  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedMime(mimeType)) {
    throw new ReminderAttachmentError(
      "Tipo de arquivo não permitido. Use PDF, imagens, textos ou documentos Office.",
    );
  }

  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
    await requireReminderOwnedByUser(supabase, reminderId, user.id);
  } catch (error) {
    if (error instanceof ReminderAuthError) {
      throw new ReminderAttachmentError(
        error.message,
        error.status === 404 ? 404 : 401,
      );
    }
    throw error;
  }

  await assertReminderWritable(supabase, reminderId, user.id);

  const { count, error: countError } = await supabase
    .from("reminder_attachments")
    .select("id", { count: "exact", head: true })
    .eq("reminder_id", reminderId);

  if (countError) throw new ReminderAttachmentError(countError.message, 500);
  if ((count ?? 0) >= MAX_ATTACHMENTS_PER_REMINDER) {
    throw new ReminderAttachmentError(
      `Máximo de ${MAX_ATTACHMENTS_PER_REMINDER} anexos por lembrete.`,
    );
  }

  const attachmentId = randomUUID();
  const storagePath = buildStoragePath(
    user.id,
    reminderId,
    attachmentId,
    file.name,
  );
  const body = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(REMINDER_ATTACHMENTS_BUCKET)
    .upload(storagePath, body, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new ReminderAttachmentError(
      uploadError.message ?? "Falha ao enviar arquivo.",
      500,
    );
  }

  const { data, error: insertError } = await supabase
    .from("reminder_attachments")
    .insert({
      id: attachmentId,
      reminder_id: reminderId,
      user_id: user.id,
      file_name: sanitizeFileName(file.name),
      mime_type: mimeType,
      size_bytes: file.size,
      storage_path: storagePath,
    })
    .select("id, reminder_id, file_name, mime_type, size_bytes, created_at")
    .single();

  if (insertError || !data) {
    await supabase.storage.from(REMINDER_ATTACHMENTS_BUCKET).remove([storagePath]);
    throw new ReminderAttachmentError(
      insertError?.message ?? "Falha ao registrar anexo.",
      500,
    );
  }

  return mapAttachmentRow(data);
}

export async function deleteReminderAttachment(
  attachmentId: string,
): Promise<void> {
  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
  } catch {
    throw new ReminderAttachmentError("Não autenticado", 401);
  }

  const { data: attachment, error } = await supabase
    .from("reminder_attachments")
    .select("id, reminder_id, user_id, storage_path")
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) throw new ReminderAttachmentError(error.message, 500);
  if (!attachment || attachment.user_id !== user.id) {
    throw new ReminderAttachmentError("Anexo não encontrado", 404);
  }

  await assertReminderWritable(supabase, attachment.reminder_id, user.id);

  const { error: storageError } = await supabase.storage
    .from(REMINDER_ATTACHMENTS_BUCKET)
    .remove([attachment.storage_path as string]);

  if (storageError) {
    throw new ReminderAttachmentError(storageError.message, 500);
  }

  const { error: deleteError } = await supabase
    .from("reminder_attachments")
    .delete()
    .eq("id", attachmentId)
    .eq("user_id", user.id);

  if (deleteError) throw new ReminderAttachmentError(deleteError.message, 500);
}

export async function getReminderAttachmentDownloadUrl(
  attachmentId: string,
): Promise<{ url: string; fileName: string }> {
  const supabase = await createClient();
  let user;
  try {
    user = await requireAuthenticatedUser(supabase);
  } catch {
    throw new ReminderAttachmentError("Não autenticado", 401);
  }

  const { data: attachment, error } = await supabase
    .from("reminder_attachments")
    .select("file_name, storage_path, user_id")
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) throw new ReminderAttachmentError(error.message, 500);
  if (!attachment || attachment.user_id !== user.id) {
    throw new ReminderAttachmentError("Anexo não encontrado", 404);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(REMINDER_ATTACHMENTS_BUCKET)
    .createSignedUrl(attachment.storage_path as string, 120);

  if (signError || !signed?.signedUrl) {
    throw new ReminderAttachmentError(
      signError?.message ?? "Não foi possível gerar o link de download.",
      500,
    );
  }

  return {
    url: signed.signedUrl,
    fileName: attachment.file_name as string,
  };
}
