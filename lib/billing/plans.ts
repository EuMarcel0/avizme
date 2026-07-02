import { isBillingEnforced } from "@/lib/billing/is-billing-enforced";
import type { ScheduleMode } from "@/lib/reminders/build-schedules";
import type { DeliveryChannel } from "@/lib/scheduling/types";

/** Planos atuais no produto. */
export type PlanTier = "pro" | "premium";

/** Valores legados ainda presentes no banco / Stripe antigo. */
export type StoredPlanTier = PlanTier | "free" | "business";

export const ALL_SCHEDULE_MODES: ScheduleMode[] = [
  "single",
  "same_day_multi",
  "specific_dates",
  "interval",
  "interval_multi",
  "weekly",
  "monthly",
];

export type SubscriptionStatus =
  | "none"
  | "active"
  | "past_due"
  | "canceled"
  | "trialing";

export type PlanLimits = {
  label: string;
  description: string;
  channels: DeliveryChannel[];
  emailsPerDay: number | null;
  smsPerMonth: number | null;
  whatsappPerMonth: number | null;
  maxActiveReminders: number;
  allowRecipientLists: boolean;
  maxRecipientsPerChannel: number;
  allowedScheduleModes: ScheduleMode[];
};

/** Pro sem assinatura ativa — até 10 lembretes no banco. */
export const PRO_UNSUBSCRIBED_LIMITS: PlanLimits = {
  label: "Pro (trial)",
  description: "Até 10 lembretes. Assine o Pro para SMS, WhatsApp e destinatários extras.",
  channels: ["email"],
  emailsPerDay: 10,
  smsPerMonth: 0,
  whatsappPerMonth: 0,
  maxActiveReminders: 10,
  allowRecipientLists: false,
  maxRecipientsPerChannel: 1,
  allowedScheduleModes: ALL_SCHEDULE_MODES,
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  pro: {
    label: "Pro",
    description: "SMS, WhatsApp, destinatários por lembrete e lembretes ampliados.",
    channels: ["email", "sms", "whatsapp"],
    emailsPerDay: null,
    smsPerMonth: 100,
    whatsappPerMonth: 50,
    maxActiveReminders: 50,
    allowRecipientLists: true,
    maxRecipientsPerChannel: 20,
    allowedScheduleModes: ALL_SCHEDULE_MODES,
  },
  premium: {
    label: "Premium",
    description: "Limites ampliados para equipes e alto volume de envios.",
    channels: ["email", "sms", "whatsapp"],
    emailsPerDay: null,
    smsPerMonth: 500,
    whatsappPerMonth: 200,
    maxActiveReminders: 200,
    allowRecipientLists: true,
    maxRecipientsPerChannel: 20,
    allowedScheduleModes: ALL_SCHEDULE_MODES,
  },
};

export type PlanFeature = {
  text: string;
  included: boolean;
};

export function normalizeStoredPlanTier(value: string | null | undefined): PlanTier {
  if (value === "premium" || value === "business") return "premium";
  return "pro";
}

export function hasActiveSubscription(status: SubscriptionStatus): boolean {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due"
  );
}

export function resolvePlanLimits(
  rawPlanTier: PlanTier,
  subscriptionStatus: SubscriptionStatus,
): PlanLimits {
  if (!hasActiveSubscription(subscriptionStatus)) {
    return PRO_UNSUBSCRIBED_LIMITS;
  }
  return PLAN_LIMITS[rawPlanTier];
}

export function getPlanFeatures(tier: PlanTier): PlanFeature[] {
  const limits = PLAN_LIMITS[tier];
  return [
    {
      text:
        limits.emailsPerDay === null
          ? "E-mails ilimitados"
          : `${limits.emailsPerDay} e-mails por dia`,
      included: true,
    },
    {
      text: "SMS",
      included: limits.channels.includes("sms"),
    },
    {
      text: "WhatsApp",
      included: limits.channels.includes("whatsapp"),
    },
    {
      text: `Até ${limits.maxRecipientsPerChannel} destinos por canal`,
      included: limits.allowRecipientLists,
    },
    {
      text: `Até ${limits.maxActiveReminders} lembretes ativos`,
      included: true,
    },
    {
      text: "Todos os tipos de agendamento",
      included: true,
    },
  ];
}

export function getProUnsubscribedFeatures(): PlanFeature[] {
  const limits = PRO_UNSUBSCRIBED_LIMITS;
  return [
    { text: `${limits.emailsPerDay} e-mails por dia`, included: true },
    { text: "SMS", included: false },
    { text: "WhatsApp", included: false },
    {
      text: `Até ${limits.maxActiveReminders} lembretes (sem assinatura)`,
      included: true,
    },
    { text: "Destinatários extras", included: false },
    { text: "Todos os tipos de agendamento", included: true },
  ];
}

export function isPaidPlan(tier: PlanTier): boolean {
  return tier === "pro" || tier === "premium";
}

/** @deprecated Use normalizeStoredPlanTier + resolvePlanLimits */
export function effectivePlanTier(
  tier: StoredPlanTier,
  subscriptionStatus: SubscriptionStatus,
): PlanTier {
  void subscriptionStatus;
  return normalizeStoredPlanTier(tier);
}

export function channelAllowedForPlan(
  limits: PlanLimits,
  channel: DeliveryChannel,
): boolean {
  return limits.channels.includes(channel);
}

export function scheduleModeAllowedForPlan(
  limits: PlanLimits,
  mode: ScheduleMode,
): boolean {
  if (!isBillingEnforced()) return true;
  return limits.allowedScheduleModes.includes(mode);
}

export function clampScheduleModeForPlan(
  limits: PlanLimits,
  mode: ScheduleMode,
): ScheduleMode {
  if (!isBillingEnforced()) return mode;
  return scheduleModeAllowedForPlan(limits, mode) ? mode : "single";
}

export function allowedScheduleModesForPlan(limits: PlanLimits): ScheduleMode[] {
  if (!isBillingEnforced()) return ALL_SCHEDULE_MODES;
  return limits.allowedScheduleModes;
}
