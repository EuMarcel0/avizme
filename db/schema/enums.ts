import { pgEnum } from "drizzle-orm/pg-core";

export const reminderStatusEnum = pgEnum("reminder_status", [
  "active",
  "paused",
  "completed",
  "archived",
]);

export const scheduleTypeEnum = pgEnum("schedule_type", [
  "single",
  "same_day_multi",
  "interval",
  "interval_multi",
  "weekly",
  "monthly",
  "custom",
]);

export const deliveryChannelEnum = pgEnum("delivery_channel", [
  "sms",
  "whatsapp",
  "email",
]);

export const occurrenceStatusEnum = pgEnum("occurrence_status", [
  "pending",
  "sent",
  "failed",
  "skipped",
]);

export const planTierEnum = pgEnum("plan_tier", ["free", "pro", "business"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "none",
  "active",
  "past_due",
  "canceled",
  "trialing",
]);
