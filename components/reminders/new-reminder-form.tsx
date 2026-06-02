"use client";

import {
  defaultReminderFormValuesForBilling,
  ReminderForm,
} from "@/components/reminders/reminder-form";
import type { ClientBillingInfo } from "@/lib/billing/client-billing";

type NewReminderFormProps = {
  userEmail?: string | null;
  userPhone?: string | null;
  billing?: ClientBillingInfo;
};

export function NewReminderForm({
  userEmail,
  userPhone,
  billing,
}: NewReminderFormProps) {
  return (
    <ReminderForm
      initialValues={defaultReminderFormValuesForBilling(billing)}
      userEmail={userEmail}
      userPhone={userPhone}
      billing={billing}
    />
  );
}
