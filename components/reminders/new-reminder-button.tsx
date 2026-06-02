"use client";

import { Plus } from "lucide-react";

import { NewReminderForm } from "@/components/reminders/new-reminder-form";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";
import { cn } from "@/lib/utils";

type NewReminderButtonProps = {
  className?: string;
  /** No header: só ícone no mobile, texto a partir de md. */
  inHeader?: boolean;
  userEmail?: string | null;
  userPhone?: string | null;
  billing?: ClientBillingInfo;
};

export function NewReminderButton({
  className,
  inHeader = false,
  userEmail,
  userPhone,
  billing,
}: NewReminderButtonProps) {
  const { openModal } = useModal();

  function handleOpen() {
    openModal({
      title: "Novo lembrete",
      description:
        "Escolha no calendário, defina horários e como o aviso será repetido.",
      className: "w-[min(96vw,56rem)] max-w-[min(96vw,56rem)]",
      content: (
        <NewReminderForm
          userEmail={userEmail}
          userPhone={userPhone}
          billing={billing}
        />
      ),
    });
  }

  return (
    <Button
      type="button"
      variant={inHeader ? "outline" : "default"}
      className={cn(
        inHeader &&
          "size-9 shrink-0 border-border/80 bg-transparent px-0 font-normal shadow-none hover:bg-muted/50 md:h-9 md:w-auto md:gap-1.5 md:px-2.5",
        className,
      )}
      onClick={handleOpen}
      aria-label="Novo lembrete"
    >
      <Plus className={cn("size-4", inHeader && "md:size-4")} />
      <span className={cn(inHeader && "hidden md:inline")}>Novo lembrete</span>
    </Button>
  );
}
