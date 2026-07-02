"use client";

import { useState } from "react";
import { Download, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { getReminderAttachmentDownloadUrlAction } from "@/app/actions/reminder-attachments";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { formatAttachmentSize } from "@/lib/reminders/attachment-utils";
import type { ReminderAttachmentSummary } from "@/lib/reminders/attachment-utils";
import { cn } from "@/lib/utils";

type ReminderAttachmentsButtonProps = {
  reminderId: string;
  reminderTitle: string;
  attachments: ReminderAttachmentSummary[];
  variant?: "button" | "icon";
  className?: string;
};

function AttachmentsModalContent({
  attachments,
}: {
  attachments: ReminderAttachmentSummary[];
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(attachmentId: string, fileName: string) {
    setDownloadingId(attachmentId);
    const result = await getReminderAttachmentDownloadUrlAction(attachmentId);
    setDownloadingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = fileName;
    anchor.rel = "noopener noreferrer";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  if (attachments.length === 0) {
    return (
      <p className="px-5 py-4 text-sm text-muted-foreground">
        Nenhum anexo neste lembrete.
      </p>
    );
  }

  return (
    <ul className="space-y-2 px-5 py-4">
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{attachment.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatAttachmentSize(attachment.sizeBytes)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5"
            disabled={downloadingId === attachment.id}
            onClick={() => handleDownload(attachment.id, attachment.fileName)}
          >
            <Download className="size-3.5" />
            Baixar
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function ReminderAttachmentsButton({
  reminderId,
  reminderTitle,
  attachments,
  variant = "icon",
  className,
}: ReminderAttachmentsButtonProps) {
  const { openModal } = useModal();
  const count = attachments.length;

  function handleOpen() {
    openModal({
      title: "Anexos",
      description: reminderTitle,
      className: "w-[min(96vw,32rem)] max-w-[min(96vw,32rem)]",
      content: <AttachmentsModalContent attachments={attachments} />,
    });
  }

  if (count === 0) return null;

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-8 gap-1.5 text-xs", className)}
        onClick={handleOpen}
      >
        <Paperclip className="size-3.5" />
        Anexos ({count})
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn("shrink-0", className)}
      onClick={handleOpen}
      aria-label={`${count} anexo(s)`}
      title={`Anexos (${count})`}
    >
      <Paperclip className="size-4" />
    </Button>
  );
}

export function ReminderAttachmentsList({
  attachments,
}: {
  attachments: ReminderAttachmentSummary[];
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Anexos ({attachments.length})
      </p>
      <ul className="space-y-1.5 text-sm">
        {attachments.map((attachment) => (
          <li key={attachment.id} className="flex items-center gap-2">
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{attachment.fileName}</span>
            <span className="text-xs text-muted-foreground">
              ({formatAttachmentSize(attachment.sizeBytes)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
