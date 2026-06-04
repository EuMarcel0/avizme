"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ReminderForm } from "@/components/reminders/reminder-form";
import { ReminderFormSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { getReminderForEditAction } from "@/app/actions/reminders";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";

type EditReminderButtonProps = {
  reminderId: string;
  variant?: "button" | "icon";
  className?: string;
};

export function EditReminderButton({
  reminderId,
  variant = "button",
  className,
}: EditReminderButtonProps) {
  const { openModal, closeModal, updateModal } = useModal();
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setLoading(true);
    openModal({
      title: "Editar lembrete",
      className: "w-[min(96vw,56rem)] max-w-[min(96vw,56rem)]",
      preventClose: true,
      content: <ReminderFormSkeleton />,
    });

    const result = await getReminderForEditAction(reminderId);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      closeModal();
      return;
    }

    updateModal({
      description: "Altere título, mensagem, agendamento ou canais de envio.",
      preventClose: false,
      content: (
        <ReminderForm
          reminderId={result.data.id}
          initialValues={result.data.formValues}
          userEmail={result.data.userEmail}
          userPhone={result.data.userPhone}
          billing={result.data.billing}
        />
      ),
    });
  }

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className={cn("shrink-0", className)}
        onClick={() => void handleOpen()}
        disabled={loading}
        aria-label="Editar lembrete"
      >
        <Pencil className={cn("size-4", loading && "opacity-50")} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-8 gap-1.5 text-xs", className)}
      onClick={() => void handleOpen()}
      disabled={loading}
    >
      <Pencil className={cn("size-3.5", loading && "opacity-50")} />
      Editar
    </Button>
  );
}
