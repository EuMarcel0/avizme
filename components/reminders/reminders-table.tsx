import { ReminderStatusToggle } from "@/components/reminders/reminder-status-toggle";
import { Badge } from "@/components/ui/badge";
import type { ReminderListItem } from "@/lib/reminders/map-reminder-row";
import {
  REMINDER_STATUS_LABELS,
  reminderStatusBadgeClass,
} from "@/lib/reminders/reminder-status";
import { DELIVERY_CHANNEL_LABELS } from "@/lib/schedule-types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type RemindersTableProps = {
  reminders: ReminderListItem[];
};

export function RemindersTable({ reminders }: RemindersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/80 bg-card/90 shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/80 bg-muted/30 text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Horários</th>
            <th className="px-4 py-3 font-medium">Agendamento</th>
            <th className="px-4 py-3 font-medium">Canais</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Criado em</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {reminders.map((reminder) => (
            <tr
              key={reminder.id}
              className="border-b border-border/50 last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-foreground">{reminder.title}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {reminder.message}
                </p>
              </td>
              <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">
                {reminder.scheduleDateLabel ?? "—"}
              </td>
              <td className="px-4 py-3 align-top text-foreground">
                {reminder.timesLabel}
              </td>
              <td className="max-w-[200px] px-4 py-3 align-top text-xs text-muted-foreground">
                {reminder.scheduleSummary}
              </td>
              <td className="px-4 py-3 align-top">
                <div className="flex flex-wrap gap-1">
                  {reminder.channels.map((ch) => (
                    <Badge key={ch} variant="secondary" className="text-[0.65rem]">
                      {DELIVERY_CHANNEL_LABELS[ch]}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 align-top">
                <Badge
                  variant="outline"
                  className={cn(
                    "border text-[0.65rem]",
                    reminderStatusBadgeClass(reminder.status),
                  )}
                >
                  {REMINDER_STATUS_LABELS[reminder.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                {format(new Date(reminder.createdAt), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </td>
              <td className="px-4 py-3 align-top text-right">
                <ReminderStatusToggle reminder={reminder} variant="button" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
