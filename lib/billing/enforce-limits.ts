import "server-only";

import { isBillingEnforced } from "@/lib/billing/is-billing-enforced";
import {
  channelAllowedForPlan,
  scheduleModeAllowedForPlan,
} from "@/lib/billing/plans";
import type { UserBillingContext } from "@/lib/billing/get-user-billing";
import type { ScheduleMode } from "@/lib/reminders/build-schedules";
import { SCHEDULE_MODE_OPTIONS } from "@/lib/reminders/schedule-modes";
import type { DeliveryChannel } from "@/lib/scheduling/types";

function scheduleModeLabel(mode: ScheduleMode): string {
  return (
    SCHEDULE_MODE_OPTIONS.find((o) => o.id === mode)?.label ?? mode
  );
}

export class BillingLimitError extends Error {
  constructor(
    message: string,
    readonly code:
      | "channel_not_allowed"
      | "daily_limit"
      | "monthly_limit"
      | "active_reminders"
      | "recipient_list"
      | "schedule_mode"
      | "upgrade_required" = "upgrade_required",
  ) {
    super(message);
    this.name = "BillingLimitError";
  }
}

export type ChannelSelection = {
  sms?: boolean;
  whatsapp?: boolean;
  email?: boolean;
};

export type RecipientLists = {
  email?: string[];
  sms?: string[];
  whatsapp?: string[];
};

function selectedChannels(channels: ChannelSelection): DeliveryChannel[] {
  return (
    [
      channels.email && "email",
      channels.sms && "sms",
      channels.whatsapp && "whatsapp",
    ] as const
  ).filter(Boolean) as DeliveryChannel[];
}

export function assertChannelsAllowedForPlan(
  billing: UserBillingContext,
  channels: ChannelSelection,
): void {
  const selected = selectedChannels(channels);
  if (selected.length === 0) {
    throw new BillingLimitError(
      "Selecione pelo menos um canal de envio",
      "channel_not_allowed",
    );
  }

  for (const channel of selected) {
    if (!channelAllowedForPlan(billing.planTier, channel)) {
      const label =
        channel === "email"
          ? "E-mail"
          : channel === "sms"
            ? "SMS"
            : "WhatsApp";
      throw new BillingLimitError(
        `${label} não está disponível no plano ${billing.limits.label}. Faça upgrade em Plano e cobrança.`,
        "channel_not_allowed",
      );
    }
  }
}

export function assertScheduleModeAllowed(
  billing: UserBillingContext,
  mode: ScheduleMode,
): void {
  if (!isBillingEnforced()) return;
  if (!scheduleModeAllowedForPlan(billing.planTier, mode)) {
    throw new BillingLimitError(
      `"${scheduleModeLabel(mode)}" não está disponível no plano ${billing.limits.label}. No Free, use apenas "Uma vez". Faça upgrade em Plano e cobrança.`,
      "schedule_mode",
    );
  }
}

export function assertActiveReminderLimit(
  billing: UserBillingContext,
  isNewReminder: boolean,
): void {
  if (!isNewReminder) return;
  if (billing.usage.activeReminders >= billing.limits.maxActiveReminders) {
    throw new BillingLimitError(
      `Limite de ${billing.limits.maxActiveReminders} lembretes ativos no plano ${billing.limits.label}. Faça upgrade ou arquive lembretes antigos.`,
      "active_reminders",
    );
  }
}

export function assertRecipientListsAllowed(
  billing: UserBillingContext,
  recipientLists: RecipientLists | undefined,
): void {
  if (!recipientLists) return;

  const hasCustomLists = Object.values(recipientLists).some(
    (list) => (list?.length ?? 0) > 0,
  );

  if (hasCustomLists && !billing.limits.allowRecipientLists) {
    if (!isBillingEnforced()) return;
    throw new BillingLimitError(
      "Listas de destinatários estão disponíveis apenas no plano Business.",
      "recipient_list",
    );
  }

  for (const [channel, list] of Object.entries(recipientLists)) {
    if (!list?.length) continue;
    if (list.length > billing.limits.maxRecipientsPerChannel) {
      throw new BillingLimitError(
        `Máximo de ${billing.limits.maxRecipientsPerChannel} destinos por canal no plano ${billing.limits.label}.`,
        "recipient_list",
      );
    }
    if (!channelAllowedForPlan(billing.planTier, channel as DeliveryChannel)) {
      throw new BillingLimitError(
        `Canal ${channel} não permitido no seu plano.`,
        "channel_not_allowed",
      );
    }
  }
}

export function assertDispatchQuota(
  billing: UserBillingContext,
  channel: DeliveryChannel,
  sendCount = 1,
): { allowed: boolean; reason?: string } {
  const { limits, usage, planTier } = billing;

  if (!channelAllowedForPlan(planTier, channel)) {
    return {
      allowed: false,
      reason: `Canal ${channel} não permitido no plano ${limits.label}`,
    };
  }

  if (channel === "email" && limits.emailsPerDay !== null) {
    if (usage.emailToday + sendCount > limits.emailsPerDay) {
      return {
        allowed: false,
        reason: `Limite diário de ${limits.emailsPerDay} e-mails no plano Free`,
      };
    }
  }

  if (channel === "sms" && limits.smsPerMonth !== null) {
    if (limits.smsPerMonth === 0) {
      return { allowed: false, reason: "SMS não incluído no plano Free" };
    }
    if (usage.smsThisMonth + sendCount > limits.smsPerMonth) {
      return {
        allowed: false,
        reason: `Limite mensal de ${limits.smsPerMonth} SMS no plano ${limits.label}`,
      };
    }
  }

  if (channel === "whatsapp" && limits.whatsappPerMonth !== null) {
    if (limits.whatsappPerMonth === 0) {
      return {
        allowed: false,
        reason: "WhatsApp não incluído no plano Free",
      };
    }
    if (usage.whatsappThisMonth + sendCount > limits.whatsappPerMonth) {
      return {
        allowed: false,
        reason: `Limite mensal de ${limits.whatsappPerMonth} WhatsApp no plano ${limits.label}`,
      };
    }
  }

  return { allowed: true };
}
