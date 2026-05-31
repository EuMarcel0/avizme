import { Calendar, Clock, MessageSquare } from "lucide-react";

import { EditReminderButton } from "@/components/reminders/edit-reminder-button";
import { ReminderStatusToggle } from "@/components/reminders/reminder-status-toggle";
import { ViewReminderButton } from "@/components/reminders/view-reminder-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ReminderListItem } from "@/lib/reminders/map-reminder-row";
import {
  REMINDER_STATUS_LABELS,
  isReminderReadOnly,
  reminderStatusBadgeClass,
} from "@/lib/reminders/reminder-status";
import { DELIVERY_CHANNEL_LABELS } from "@/lib/schedule-types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ReminderCardProps = {
  reminder: ReminderListItem;
};

export function ReminderCard({ reminder }: ReminderCardProps) {
  const readOnly = isReminderReadOnly(reminder.status);

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-border/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-card/90",
        readOnly && "opacity-90",
      )}
    >
      <CardHeader className="gap-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-base font-semibold leading-snug text-foreground">
            {reminder.title}
          </h3>
          <Badge
              variant="outline"
              className={cn(
                "border px-2 text-[0.65rem]",
                reminderStatusBadgeClass(reminder.status),
              )}
            >
              {REMINDER_STATUS_LABELS[reminder.status]}
            </Badge>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {reminder.message}
        </p>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-3 pt-0 text-xs">
        <div className="space-y-1.5 text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0 text-primary" />
            <span>
              {reminder.scheduleDateLabel ?? "—"}
              <span className="text-muted-foreground/80">
                {" "}
                · {reminder.scheduleSummary}
              </span>
            </span>
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0 text-primary" />
            {reminder.timesLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {reminder.channels.length > 0 ? (
            reminder.channels.map((ch) => (
              <Badge key={ch} variant="secondary" className="text-[0.65rem]">
                {DELIVERY_CHANNEL_LABELS[ch]}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">Sem canal</span>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-border/50 pt-2">
          <p className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
            <MessageSquare className="size-3" />
            Criado em{" "}
            {format(new Date(reminder.createdAt), "dd/MM/yyyy", {
              locale: ptBR,
            })}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ViewReminderButton reminder={reminder} variant="button" />
            {!readOnly && (
              <>
                <EditReminderButton reminderId={reminder.id} variant="button" />
                <ReminderStatusToggle reminder={reminder} variant="button" />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
