"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { duplicateReminderAction } from "@/app/actions/reminders";
import { PlanPageLink } from "@/components/billing/plan-page-link";
import { ButtonLabelSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";
import { canDuplicateReminder } from "@/lib/billing/client-billing";
import { isBillingEnforced } from "@/lib/billing/is-billing-enforced";
import type { ReminderListItem } from "@/lib/reminders/map-reminder-row";
import { invalidateRemindersQueries } from "@/lib/reminders/reminders-query-keys";
import { cn } from "@/lib/utils";

type DuplicateReminderButtonProps = {
  reminder: Pick<ReminderListItem, "id" | "title" | "status">;
  billing?: ClientBillingInfo;
  variant?: "button" | "icon";
  className?: string;
};

export function DuplicateReminderButton({
  reminder,
  billing,
  variant = "button",
  className,
}: DuplicateReminderButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const allowed =
    reminder.status === "active" &&
    (!isBillingEnforced() || canDuplicateReminder(billing));

  if (!allowed) return null;

  async function handleConfirm() {
    setLoading(true);
    const result = await duplicateReminderAction(reminder.id);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Lembrete duplicado.");
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
          className={cn("shrink-0", className)}
          onClick={() => setOpen(true)}
          aria-label="Duplicar lembrete"
          title="Duplicar"
        >
          <Copy className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1.5 text-xs", className)}
          onClick={() => setOpen(true)}
        >
          <Copy className="size-3.5" />
          Duplicar
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicar lembrete</DialogTitle>
            <DialogDescription>
              Será criada uma cópia de{" "}
              <span className="font-medium text-foreground">{reminder.title}</span>{" "}
              com &quot;(Duplicado)&quot; no título e na mensagem. Agendamento e
              canais serão copiados.
            </DialogDescription>
          </DialogHeader>
          {!billing?.hasActiveSubscription && isBillingEnforced() ? (
            <p className="text-sm text-muted-foreground">
              Recurso disponível nos planos Pro e Premium.{" "}
              <PlanPageLink>Ver planos</PlanPageLink>
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <ButtonLabelSkeleton className="w-20" />
              ) : (
                "Duplicar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
