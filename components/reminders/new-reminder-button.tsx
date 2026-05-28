"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { NewReminderForm } from "@/components/reminders/new-reminder-form";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { createClient } from "@/lib/supabase/client";

type NewReminderButtonProps = {
  className?: string;
  userEmail?: string | null;
  userPhone?: string | null;
};

export function NewReminderButton({
  className,
  userEmail: initialEmail,
  userPhone: initialPhone,
}: NewReminderButtonProps) {
  const { openModal } = useModal();
  const [email, setEmail] = useState(initialEmail ?? null);
  const [phone, setPhone] = useState(initialPhone ?? null);

  useEffect(() => {
    if (initialEmail && initialPhone) return;

    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("email, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.email) setEmail(data.email);
      if (data?.phone) setPhone(data.phone);
      if (!data?.email && user.email) setEmail(user.email);
    });
  }, [initialEmail, initialPhone]);

  function handleOpen() {
    openModal({
      title: "Novo lembrete",
      description:
        "Escolha no calendário, defina horários e como o aviso será repetido.",
      className: "w-[min(96vw,56rem)] max-w-[min(96vw,56rem)]",
      content: <NewReminderForm userEmail={email} userPhone={phone} />,
    });
  }

  return (
    <Button type="button" className={className} onClick={handleOpen}>
      <Plus className="size-4" />
      Novo lembrete
    </Button>
  );
}
