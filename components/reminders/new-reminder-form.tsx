"use client";

import {
  DEFAULT_REMINDER_FORM_VALUES,
  ReminderForm,
} from "@/components/reminders/reminder-form";

type NewReminderFormProps = {
  userEmail?: string | null;
  userPhone?: string | null;
};

export function NewReminderForm({ userEmail, userPhone }: NewReminderFormProps) {
  return (
    <ReminderForm
      initialValues={DEFAULT_REMINDER_FORM_VALUES}
      userEmail={userEmail}
      userPhone={userPhone}
    />
  );
}
