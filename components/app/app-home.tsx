"use client";

import { Bell } from "lucide-react";

import { NewReminderButton } from "@/components/reminders/new-reminder-button";
import { RemindersView } from "@/components/reminders/reminders-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";
type AppHomeProps = {
  displayName: string;
  userEmail?: string | null;
  userPhone?: string | null;
  hasReminders: boolean;
  billing?: ClientBillingInfo;
};

export function AppHome({
  displayName,
  userEmail,
  userPhone,
  hasReminders,
  billing,
}: AppHomeProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
            <Bell className="size-6 text-primary" />
            Meus lembretes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Olá, {displayName}. Gerencie avisos por SMS, WhatsApp e e-mail.
          </p>
        </div>
        <NewReminderButton
          className="w-full shrink-0 sm:w-auto"
          userEmail={userEmail}
          userPhone={userPhone}
          billing={billing}
        />
      </div>

      {!hasReminders ? (
        <Card className="border-border/80 bg-white shadow-sm dark:bg-card/90">
          <CardHeader>
            <CardTitle>Nenhum lembrete ainda</CardTitle>
            <CardDescription>
              Crie o primeiro lembrete com calendário, horários e repetição
              personalizada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewReminderButton
              className="w-full sm:w-auto"
              userEmail={userEmail}
              userPhone={userPhone}
              billing={billing}
            />
          </CardContent>
        </Card>
      ) : (
        <RemindersView scope="ongoing" billing={billing} />
      )}
    </div>
  );
}
