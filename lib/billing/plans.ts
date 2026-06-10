import { isBillingEnforced } from "@/lib/billing/is-billing-enforced";
import type { ScheduleMode } from "@/lib/reminders/build-schedules";
import type { DeliveryChannel } from "@/lib/scheduling/types";

export type PlanTier = "free" | "pro" | "business";

export const ALL_SCHEDULE_MODES: ScheduleMode[] = [
  "single",
  "same_day_multi",
  "specific_dates",
  "interval",
  "interval_multi",
  "weekly",
  "monthly",
];

export const FREE_SCHEDULE_MODES: ScheduleMode[] = ["single"];

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

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    label: "Free",
    description: "E-mail com limite diário. Ideal para começar.",
    channels: ["email"],
    emailsPerDay: 10,
    smsPerMonth: 0,
    whatsappPerMonth: 0,
    maxActiveReminders: 5,
    allowRecipientLists: false,
    maxRecipientsPerChannel: 1,
    allowedScheduleModes: FREE_SCHEDULE_MODES,
  },
  pro: {
    label: "Pro",
    description: "SMS, WhatsApp e destinatários por lembrete.",
    channels: ["email", "sms", "whatsapp"],
    emailsPerDay: null,
    smsPerMonth: 100,
    whatsappPerMonth: 50,
    maxActiveReminders: 50,
    allowRecipientLists: true,
    maxRecipientsPerChannel: 20,
    allowedScheduleModes: ALL_SCHEDULE_MODES,
  },
  business: {
    label: "Business",
    description: "Listas de e-mails e números por lembrete.",
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
      text: "SMS para seu número",
      included: limits.channels.includes("sms"),
    },
    {
      text: "WhatsApp para seu número",
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
      text:
        limits.allowedScheduleModes.length === 1
          ? 'Agendamento "Uma vez" apenas'
          : "Todos os tipos de agendamento",
      included: true,
    },
  ];
}

export function isPaidPlan(tier: PlanTier): boolean {
  return tier === "pro" || tier === "business";
}

export function effectivePlanTier(
  tier: PlanTier,
  subscriptionStatus: SubscriptionStatus,
): PlanTier {
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return tier;
  }
  if (tier !== "free" && subscriptionStatus === "past_due") {
    return tier;
  }
  if (tier !== "free") {
    return "free";
  }
  return "free";
}

export function channelAllowedForPlan(
  tier: PlanTier,
  channel: DeliveryChannel,
): boolean {
  return PLAN_LIMITS[tier].channels.includes(channel);
}

export function scheduleModeAllowedForPlan(
  tier: PlanTier,
  mode: ScheduleMode,
): boolean {
  if (!isBillingEnforced()) return true;
  return PLAN_LIMITS[tier].allowedScheduleModes.includes(mode);
}

export function clampScheduleModeForPlan(
  tier: PlanTier,
  mode: ScheduleMode,
): ScheduleMode {
  if (!isBillingEnforced()) return mode;
  return scheduleModeAllowedForPlan(tier, mode) ? mode : "single";
}

/** Modos exibidos no picker (dev = todos; produção = conforme plano). */
export function allowedScheduleModesForPlan(tier: PlanTier): ScheduleMode[] {
  if (!isBillingEnforced()) return ALL_SCHEDULE_MODES;
  return PLAN_LIMITS[tier].allowedScheduleModes;
}
