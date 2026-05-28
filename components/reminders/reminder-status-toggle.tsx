"use client";

import { useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { toggleReminderStatusAction } from "@/app/actions/reminders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReminderListItem } from "@/lib/reminders/map-reminder-row";
import {
  getToggleActionLabel,
  getToggleConfirmCopy,
} from "@/lib/reminders/toggle-reminder-status";
import type { ReminderStatus } from "@/lib/reminders/reminder-status";
import { invalidateRemindersQueries } from "@/lib/reminders/reminders-query-keys";
import { cn } from "@/lib/utils";

type ReminderStatusToggleProps = {
  reminder: Pick<ReminderListItem, "id" | "title" | "status">;
  variant?: "button" | "icon";
  className?: string;
};

export function ReminderStatusToggle({
  reminder,
  variant = "button",
  className,
}: ReminderStatusToggleProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const actionLabel = getToggleActionLabel(reminder.status);
  const copy = getToggleConfirmCopy(reminder.status, reminder.title);
  const isActive = reminder.status === "active";
  const Icon = isActive ? Pause : Play;

  const activateButtonClass =
    "border-aviz-teal/50 bg-aviz-teal/15 text-aviz-teal hover:bg-aviz-teal/25 hover:text-aviz-teal dark:border-aviz-mint/40 dark:bg-aviz-teal/20 dark:text-aviz-mint dark:hover:bg-aviz-teal/30";
  const deactivateButtonClass =
    "border-red-500/50 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25";
  const actionButtonClass = isActive ? deactivateButtonClass : activateButtonClass;

  async function handleConfirm() {
    setLoading(true);
    const result = await toggleReminderStatusAction(
      reminder.id,
      reminder.status as ReminderStatus,
    );
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      isActive ? "Lembrete desativado." : "Lembrete ativado.",
    );
    setOpen(false);
    await invalidateRemindersQueries(queryClient);
  }

  return (
    <>
      {variant === "icon" ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={cn("shrink-0", actionButtonClass, className)}
          onClick={() => setOpen(true)}
          aria-label={actionLabel}
        >
          <Icon className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1.5 text-xs", actionButtonClass, className)}
          onClick={() => setOpen(true)}
        >
          <Icon className="size-3.5" />
          {actionLabel}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className={actionButtonClass}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Aguarde…
                </>
              ) : (
                copy.confirmLabel
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
