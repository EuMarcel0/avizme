"use client";

import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import type { ReminderListItem } from "@/lib/reminders/map-reminder-row";
import {
  REMINDER_STATUS_LABELS,
  reminderStatusBadgeClass,
} from "@/lib/reminders/reminder-status";
import { cn } from "@/lib/utils";

type ViewReminderButtonProps = {
  reminder: ReminderListItem;
  variant?: "button" | "icon";
  className?: string;
};

function ReminderDetailsContent({ reminder }: { reminder: ReminderListItem }) {
  return (
    <div className="space-y-5 px-5 py-4 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Título</p>
        <p className="mt-1 font-semibold text-foreground">{reminder.title}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <Badge
          variant="outline"
          className={cn(
            "border text-[0.65rem]",
            reminderStatusBadgeClass(reminder.status),
          )}
        >
          {REMINDER_STATUS_LABELS[reminder.status]}
        </Badge>
      </div>

      <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Como você receberá
        </p>
        <p className="leading-relaxed text-foreground">
          {reminder.deliveryDetails}
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quando o ciclo encerra
        </p>
        <p className="leading-relaxed text-foreground">
          {reminder.cycleEndDetails}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Mensagem</p>
        <p className="mt-1 whitespace-pre-wrap text-foreground">
          {reminder.message}
        </p>
      </div>
    </div>
  );
}

export function ViewReminderButton({
  reminder,
  variant = "icon",
  className,
}: ViewReminderButtonProps) {
  const { openModal } = useModal();

  function handleOpen() {
    openModal({
      title: "Detalhes do lembrete",
      description: reminder.title,
      className: "w-[min(96vw,34rem)] max-w-[min(96vw,34rem)]",
      content: <ReminderDetailsContent reminder={reminder} />,
    });
  }

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-8 gap-1.5 text-xs", className)}
        onClick={handleOpen}
      >
        <Info className="size-3.5" />
        Detalhes
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
      aria-label="Detalhes do lembrete"
      title="Detalhes"
    >
      <Info className="size-4" />
    </Button>
  );
}
