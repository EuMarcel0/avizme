-- Vínculo de users com auth.users (Supabase Auth)
ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
--> statement-breakpoint
-- Cria registro em public.users ao cadastrar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.reminder_schedules ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.reminder_delivery_channels ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.reminder_occurrences ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);
--> statement-breakpoint
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);
--> statement-breakpoint
CREATE POLICY "reminders_all_own" ON public.reminders
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
--> statement-breakpoint
CREATE POLICY "schedules_via_reminder" ON public.reminder_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.id = reminder_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.id = reminder_id AND r.user_id = auth.uid()
    )
  );
--> statement-breakpoint
CREATE POLICY "channels_via_reminder" ON public.reminder_delivery_channels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.id = reminder_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.id = reminder_id AND r.user_id = auth.uid()
    )
  );
--> statement-breakpoint
CREATE POLICY "occurrences_via_reminder" ON public.reminder_occurrences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.id = reminder_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.id = reminder_id AND r.user_id = auth.uid()
    )
  );
