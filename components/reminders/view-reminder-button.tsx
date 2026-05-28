"use client";

import { Calendar, Clock, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import type { ReminderListItem } from "@/lib/reminders/map-reminder-row";
import {
  REMINDER_STATUS_LABELS,
  reminderStatusBadgeClass,
} from "@/lib/reminders/reminder-status";
import { DELIVERY_CHANNEL_LABELS } from "@/lib/schedule-types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewReminderButtonProps = {
  reminder: ReminderListItem;
  variant?: "button" | "icon";
  className?: string;
};

function ReminderViewContent({ reminder }: { reminder: ReminderListItem }) {
  return (
    <div className="space-y-4 px-5 py-4 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Título</p>
        <p className="mt-1 font-semibold text-foreground">{reminder.title}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Mensagem</p>
        <p className="mt-1 whitespace-pre-wrap text-foreground">
          {reminder.message}
        </p>
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
      <div className="space-y-2 text-muted-foreground">
        <p className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0 text-primary" />
          <span>
            {reminder.scheduleDateLabel ?? "—"} · {reminder.scheduleSummary}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-primary" />
          {reminder.timesLabel}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Canais</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {reminder.channels.length > 0 ? (
            reminder.channels.map((ch) => (
              <Badge key={ch} variant="secondary" className="text-[0.65rem]">
                {DELIVERY_CHANNEL_LABELS[ch]}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">Nenhum canal</span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Criado em{" "}
        {format(new Date(reminder.createdAt), "dd/MM/yyyy 'às' HH:mm", {
          locale: ptBR,
        })}
      </p>
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
      description:
        reminder.status === "completed"
          ? "Ciclo finalizado — apenas visualização."
          : undefined,
      className: "w-[min(96vw,32rem)] max-w-[min(96vw,32rem)]",
      content: <ReminderViewContent reminder={reminder} />,
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
        <Eye className="size-3.5" />
        Ver
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
      aria-label="Ver lembrete"
    >
      <Eye className="size-4" />
    </Button>
  );
}
