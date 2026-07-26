-- Anotações (pastas + notas) e Tarefas (quadro kanban)
CREATE TYPE "public"."task_priority" AS ENUM('none', 'low', 'medium', 'high');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "note_folders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "folder_id" uuid REFERENCES "note_folders"("id") ON DELETE set null,
  "title" text DEFAULT '' NOT NULL,
  "content" text DEFAULT '' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "task_boards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" text DEFAULT 'Quadro' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "task_columns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "board_id" uuid NOT NULL REFERENCES "task_boards"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "color" text DEFAULT '#53a08e' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "board_id" uuid NOT NULL REFERENCES "task_boards"("id") ON DELETE cascade,
  "column_id" uuid NOT NULL REFERENCES "task_columns"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "priority" "task_priority" DEFAULT 'none' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "due_date" timestamptz,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "note_folders_user_id_idx" ON "note_folders" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notes_user_id_idx" ON "notes" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notes_folder_id_idx" ON "notes" ("folder_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_boards_user_id_idx" ON "task_boards" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "task_boards_user_id_unique" ON "task_boards" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_columns_board_id_idx" ON "task_columns" ("board_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_board_id_idx" ON "tasks" ("board_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_column_id_idx" ON "tasks" ("column_id");
--> statement-breakpoint

ALTER TABLE "note_folders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "task_boards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "task_columns" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "note_folders_all_own" ON "note_folders"
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint

CREATE POLICY "notes_all_own" ON "notes"
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint

CREATE POLICY "task_boards_all_own" ON "task_boards"
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint

CREATE POLICY "task_columns_via_board" ON "task_columns"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = board_id AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = board_id AND b.user_id = auth.uid()
    )
  );
--> statement-breakpoint

CREATE POLICY "tasks_via_board" ON "tasks"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = board_id AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = board_id AND b.user_id = auth.uid()
    )
  );
