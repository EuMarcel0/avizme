"use server";

import { revalidatePath } from "next/cache";

import {
  deleteReminderAttachment,
  getReminderAttachmentDownloadUrl,
  listReminderAttachments,
  ReminderAttachmentError,
  type ReminderAttachmentRecord,
  uploadReminderAttachment,
} from "@/lib/reminders/reminder-attachments";

export type AttachmentActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type UploadAttachmentActionResult =
  | { ok: true; attachment: ReminderAttachmentRecord }
  | { ok: false; error: string };

export type DownloadAttachmentActionResult =
  | { ok: true; url: string; fileName: string }
  | { ok: false; error: string };

export type ListAttachmentsActionResult =
  | { ok: true; attachments: ReminderAttachmentRecord[] }
  | { ok: false; error: string };

export async function uploadReminderAttachmentAction(
  formData: FormData,
): Promise<UploadAttachmentActionResult> {
  const reminderId = String(formData.get("reminderId") ?? "");
  const file = formData.get("file");

  if (!reminderId) {
    return { ok: false, error: "Lembrete inválido." };
  }
  if (!(file instanceof File)) {
    return { ok: false, error: "Selecione um arquivo." };
  }

  try {
    const attachment = await uploadReminderAttachment(reminderId, file);
    revalidatePath("/app");
    return { ok: true, attachment };
  } catch (error) {
    if (error instanceof ReminderAttachmentError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível enviar o anexo." };
  }
}

export async function deleteReminderAttachmentAction(
  attachmentId: string,
): Promise<AttachmentActionResult> {
  try {
    await deleteReminderAttachment(attachmentId);
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    if (error instanceof ReminderAttachmentError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível remover o anexo." };
  }
}

export async function getReminderAttachmentDownloadUrlAction(
  attachmentId: string,
): Promise<DownloadAttachmentActionResult> {
  try {
    const result = await getReminderAttachmentDownloadUrl(attachmentId);
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof ReminderAttachmentError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível baixar o anexo." };
  }
}

export async function listReminderAttachmentsAction(
  reminderId: string,
): Promise<ListAttachmentsActionResult> {
  try {
    const attachments = await listReminderAttachments(reminderId);
    return { ok: true, attachments };
  } catch (error) {
    if (error instanceof ReminderAttachmentError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível carregar os anexos." };
  }
}
