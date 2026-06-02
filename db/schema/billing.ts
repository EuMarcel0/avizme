import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { deliveryChannelEnum } from "./enums";
import { users } from "./users";

export const userUsageCounters = pgTable(
  "user_usage_counters",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodKey: text("period_key").notNull(),
    channel: deliveryChannelEnum("channel").notNull(),
    count: integer("count").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.periodKey, table.channel] })],
);
