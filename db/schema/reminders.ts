import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import {
  deliveryChannelEnum,
  occurrenceStatusEnum,
  reminderStatusEnum,
  scheduleTypeEnum,
} from "./enums";

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: reminderStatusEnum("status").default("active").notNull(),
  timezone: text("timezone").default("America/Sao_Paulo").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reminderSchedules = pgTable("reminder_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  reminderId: uuid("reminder_id")
    .notNull()
    .references(() => reminders.id, { onDelete: "cascade" }),
  scheduleType: scheduleTypeEnum("schedule_type").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  intervalDays: integer("interval_days"),
  /** Horários no formato HH:mm — ex.: ["08:00", "18:30"] */
  times: jsonb("times").$type<string[]>().default([]).notNull(),
  /** Datas específicas ISO — ex.: ["2026-05-27"] */
  dates: jsonb("dates").$type<string[]>().default([]).notNull(),
  /** Dias da semana 0=domingo … 6=sábado */
  weekdays: jsonb("weekdays").$type<number[]>().default([]).notNull(),
  dayOfMonth: integer("day_of_month"),
  /** Regras extras (limites, exceções, etc.) */
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reminderDeliveryChannels = pgTable("reminder_delivery_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  reminderId: uuid("reminder_id")
    .notNull()
    .references(() => reminders.id, { onDelete: "cascade" }),
  channel: deliveryChannelEnum("channel").notNull(),
  destination: text("destination"),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reminderOccurrences = pgTable("reminder_occurrences", {
  id: uuid("id").primaryKey().defaultRandom(),
  reminderId: uuid("reminder_id")
    .notNull()
    .references(() => reminders.id, { onDelete: "cascade" }),
  scheduleId: uuid("schedule_id").references(() => reminderSchedules.id, {
    onDelete: "set null",
  }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  status: occurrenceStatusEnum("status").default("pending").notNull(),
  channel: deliveryChannelEnum("channel"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const remindersRelations = relations(reminders, ({ one, many }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  schedules: many(reminderSchedules),
  deliveryChannels: many(reminderDeliveryChannels),
  occurrences: many(reminderOccurrences),
}));

export const reminderSchedulesRelations = relations(
  reminderSchedules,
  ({ one }) => ({
    reminder: one(reminders, {
      fields: [reminderSchedules.reminderId],
      references: [reminders.id],
    }),
  }),
);
