import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const taskPriorityEnum = pgEnum("task_priority", [
  "none",
  "low",
  "medium",
  "high",
]);

export const taskBoards = pgTable("task_boards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Quadro"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const taskColumns = pgTable("task_columns", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => taskBoards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#53a08e").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type TaskTag = {
  id: string;
  name: string;
  color: string;
};

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => taskBoards.id, { onDelete: "cascade" }),
  columnId: uuid("column_id")
    .notNull()
    .references(() => taskColumns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: taskPriorityEnum("priority").default("none").notNull(),
  progress: integer("progress").default(0).notNull(),
  tags: jsonb("tags").$type<TaskTag[]>().default([]).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const taskBoardsRelations = relations(taskBoards, ({ one, many }) => ({
  user: one(users, {
    fields: [taskBoards.userId],
    references: [users.id],
  }),
  columns: many(taskColumns),
  tasks: many(tasks),
}));

export const taskColumnsRelations = relations(taskColumns, ({ one, many }) => ({
  board: one(taskBoards, {
    fields: [taskColumns.boardId],
    references: [taskBoards.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  board: one(taskBoards, {
    fields: [tasks.boardId],
    references: [taskBoards.id],
  }),
  column: one(taskColumns, {
    fields: [tasks.columnId],
    references: [taskColumns.id],
  }),
}));
