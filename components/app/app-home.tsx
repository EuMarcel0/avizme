"use client";

import { Bell } from "lucide-react";

import { NewReminderButton } from "@/components/reminders/new-reminder-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AppHomeProps = {
  displayName: string;
  userEmail?: string | null;
  userPhone?: string | null;
};

export function AppHome({ displayName, userEmail, userPhone }: AppHomeProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card className="border-border/80 bg-white shadow-sm dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Olá, {displayName}
          </CardTitle>
          <CardDescription>
            Agende avisos por SMS, WhatsApp e e-mail. Toque em novo lembrete
            para escolher datas no calendário, vários horários no mesmo dia,
            repetição a cada X dias e mais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewReminderButton
            className="w-full"
            userEmail={userEmail}
            userPhone={userPhone}
          />
        </CardContent>
      </Card>
    </div>
  );
}
