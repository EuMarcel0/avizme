"use client";

import { useRef, useState } from "react";
import { Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  deleteReminderAttachmentAction,
  uploadReminderAttachmentAction,
} from "@/app/actions/reminder-attachments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatAttachmentSize,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_REMINDER,
} from "@/lib/reminders/attachment-utils";
import type { ReminderAttachmentRecord } from "@/lib/reminders/reminder-attachments";
import { cn } from "@/lib/utils";

type PendingFile = {
  key: string;
  file: File;
};

type ReminderAttachmentsFieldProps = {
  reminderId?: string;
  existingAttachments?: ReminderAttachmentRecord[];
  pendingFiles: PendingFile[];
  onPendingFilesChange: (files: PendingFile[]) => void;
  onExistingAttachmentsChange?: (attachments: ReminderAttachmentRecord[]) => void;
  disabled?: boolean;
  className?: string;
};

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function ReminderAttachmentsField({
  reminderId,
  existingAttachments = [],
  pendingFiles,
  onPendingFilesChange,
  onExistingAttachmentsChange,
  disabled,
  className,
}: ReminderAttachmentsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const totalCount = existingAttachments.length + pendingFiles.length;
  const canAddMore = totalCount < MAX_ATTACHMENTS_PER_REMINDER;

  function addPendingFiles(files: FileList | null) {
    if (!files?.length || disabled) return;

    const next = [...pendingFiles];
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name}: máximo ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.`);
        continue;
      }
      const key = fileKey(file);
      if (
        next.some((item) => item.key === key) ||
        existingAttachments.some((item) => item.fileName === file.name)
      ) {
        toast.error(`${file.name} já foi adicionado.`);
        continue;
      }
      if (next.length + existingAttachments.length >= MAX_ATTACHMENTS_PER_REMINDER) {
        toast.error(`Máximo de ${MAX_ATTACHMENTS_PER_REMINDER} anexos.`);
        break;
      }
      next.push({ key, file });
    }
    onPendingFilesChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadPendingImmediately(file: File) {
    if (!reminderId) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("reminderId", reminderId);
    formData.set("file", file);
    const result = await uploadReminderAttachmentAction(formData);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onExistingAttachmentsChange?.([...existingAttachments, result.attachment]);
    onPendingFilesChange(
      pendingFiles.filter((item) => item.file !== file),
    );
    toast.success("Anexo enviado.");
  }

  async function handleRemoveExisting(attachmentId: string) {
    setRemovingId(attachmentId);
    const result = await deleteReminderAttachmentAction(attachmentId);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onExistingAttachmentsChange?.(
      existingAttachments.filter((item) => item.id !== attachmentId),
    );
    toast.success("Anexo removido.");
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">Anexos</Label>
        <span className="text-xs text-muted-foreground">
          {totalCount}/{MAX_ATTACHMENTS_PER_REMINDER}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        PDF, imagens, textos ou documentos Office. Até{" "}
        {MAX_ATTACHMENT_BYTES / 1024 / 1024} MB por arquivo.
      </p>

      {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
        <ul className="space-y-2">
          {existingAttachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAttachmentSize(attachment.sizeBytes)}
                  </p>
                </div>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={removingId === attachment.id}
                  onClick={() => handleRemoveExisting(attachment.id)}
                  aria-label={`Remover ${attachment.fileName}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}

          {pendingFiles.map(({ key, file }) => (
            <li
              key={key}
              className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border/70 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAttachmentSize(file.size)} · pendente
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {reminderId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={uploading || disabled}
                    onClick={() => uploadPendingImmediately(file)}
                  >
                    Enviar
                  </Button>
                )}
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      onPendingFilesChange(
                        pendingFiles.filter((item) => item.key !== key),
                      )
                    }
                    aria-label={`Remover ${file.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canAddMore && !disabled && (
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => addPendingFiles(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Adicionar anexos
          </Button>
        </div>
      )}
    </div>
  );
}

export type { PendingFile };

export async function uploadPendingReminderAttachments(
  reminderId: string,
  pendingFiles: PendingFile[],
): Promise<boolean> {
  for (const { file } of pendingFiles) {
    const formData = new FormData();
    formData.set("reminderId", reminderId);
    formData.set("file", file);
    const result = await uploadReminderAttachmentAction(formData);
    if (!result.ok) {
      toast.error(`${file.name}: ${result.error}`);
      return false;
    }
  }
  return true;
}
