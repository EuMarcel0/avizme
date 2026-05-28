"use client";

import { Plus } from "lucide-react";

import { NewReminderForm } from "@/components/reminders/new-reminder-form";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";

type NewReminderButtonProps = {
  className?: string;
  userEmail?: string | null;
  userPhone?: string | null;
};

export function NewReminderButton({
  className,
  userEmail,
  userPhone,
}: NewReminderButtonProps) {
  const { openModal } = useModal();

  function handleOpen() {
    openModal({
      title: "Novo lembrete",
      description:
        "Escolha no calendário, defina horários e como o aviso será repetido.",
      className: "w-[min(96vw,56rem)] max-w-[min(96vw,56rem)]",
      content: (
        <NewReminderForm userEmail={userEmail} userPhone={userPhone} />
      ),
    });
  }

  return (
    <Button type="button" className={className} onClick={handleOpen}>
      <Plus className="size-4" />
      Novo lembrete
    </Button>
  );
}
