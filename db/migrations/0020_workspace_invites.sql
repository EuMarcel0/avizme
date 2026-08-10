-- Convites e membros do workspace de anotações/tarefas
CREATE TYPE "public"."workspace_invite_status" AS ENUM('pending', 'accepted', 'revoked');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "member_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "role" text DEFAULT 'editor' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_owner_member_uidx"
  ON "workspace_members" ("owner_user_id", "member_user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "workspace_members_member_idx"
  ON "workspace_members" ("member_user_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "workspace_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "email" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "status" "workspace_invite_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "accepted_at" timestamptz
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "workspace_invites_owner_idx"
  ON "workspace_invites" ("owner_user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "workspace_invites_email_idx"
  ON "workspace_invites" ("email");
--> statement-breakpoint

ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "workspace_invites" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "workspace_members_owner_all" ON "workspace_members"
  FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);
--> statement-breakpoint

CREATE POLICY "workspace_members_member_select" ON "workspace_members"
  FOR SELECT USING (auth.uid() = member_user_id);
--> statement-breakpoint

CREATE POLICY "workspace_invites_owner_all" ON "workspace_invites"
  FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);
--> statement-breakpoint

-- Notas/pastas: dono ou membro editor
DROP POLICY IF EXISTS "note_folders_all_own" ON "note_folders";
--> statement-breakpoint
CREATE POLICY "note_folders_owner_or_member" ON "note_folders"
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.owner_user_id = note_folders.user_id
        AND m.member_user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.owner_user_id = note_folders.user_id
        AND m.member_user_id = auth.uid()
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "notes_all_own" ON "notes";
--> statement-breakpoint
CREATE POLICY "notes_owner_or_member" ON "notes"
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.owner_user_id = notes.user_id
        AND m.member_user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.owner_user_id = notes.user_id
        AND m.member_user_id = auth.uid()
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "task_boards_all_own" ON "task_boards";
--> statement-breakpoint
CREATE POLICY "task_boards_owner_or_member" ON "task_boards"
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.owner_user_id = task_boards.user_id
        AND m.member_user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.owner_user_id = task_boards.user_id
        AND m.member_user_id = auth.uid()
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "task_columns_via_board" ON "task_columns";
--> statement-breakpoint
CREATE POLICY "task_columns_via_board" ON "task_columns"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = board_id
        AND (
          b.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.workspace_members m
            WHERE m.owner_user_id = b.user_id
              AND m.member_user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = board_id
        AND (
          b.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.workspace_members m
            WHERE m.owner_user_id = b.user_id
              AND m.member_user_id = auth.uid()
          )
        )
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "tasks_via_board" ON "tasks";
--> statement-breakpoint
CREATE POLICY "tasks_via_board" ON "tasks"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = board_id
        AND (
          b.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.workspace_members m
            WHERE m.owner_user_id = b.user_id
              AND m.member_user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_boards b
      WHERE b.id = board_id
        AND (
          b.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.workspace_members m
            WHERE m.owner_user_id = b.user_id
              AND m.member_user_id = auth.uid()
          )
        )
    )
  );
