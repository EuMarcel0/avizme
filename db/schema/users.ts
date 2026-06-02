import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { planTierEnum, subscriptionStatusEnum } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  planTier: planTierEnum("plan_tier").default("free").notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .default("none")
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planPeriodEnd: timestamp("plan_period_end", { withTimezone: true }),
  subscriptionCancelAtPeriodEnd: boolean("subscription_cancel_at_period_end")
    .default(false)
    .notNull(),
  subscriptionEndsAt: timestamp("subscription_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
