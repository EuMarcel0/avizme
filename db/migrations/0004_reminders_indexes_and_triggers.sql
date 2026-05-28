-- Índices e trigger de updated_at para lembretes (persistência e listagem)

CREATE INDEX IF NOT EXISTS "reminders_user_id_idx"
  ON "public"."reminders" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_user_id_created_at_idx"
  ON "public"."reminders" ("user_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminder_schedules_reminder_id_idx"
  ON "public"."reminder_schedules" ("reminder_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminder_delivery_channels_reminder_id_idx"
  ON "public"."reminder_delivery_channels" ("reminder_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminder_occurrences_reminder_id_scheduled_at_idx"
  ON "public"."reminder_occurrences" ("reminder_id", "scheduled_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.set_reminders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS reminders_set_updated_at ON public.reminders;
--> statement-breakpoint
CREATE TRIGGER reminders_set_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reminders_updated_at();
