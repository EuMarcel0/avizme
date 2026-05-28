-- Para quem já aplicou a migration 0000 com a tabela `profiles`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    ALTER TABLE public.profiles RENAME TO users;
    ALTER TABLE public.reminders
      DROP CONSTRAINT IF EXISTS reminders_user_id_profiles_id_fk;
    ALTER TABLE public.reminders
      ADD CONSTRAINT reminders_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS profiles_id_auth_users_fk;
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_auth_users_fk
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    DROP POLICY IF EXISTS profiles_select_own ON public.users;
    DROP POLICY IF EXISTS profiles_update_own ON public.users;
    CREATE POLICY users_select_own ON public.users
      FOR SELECT USING (auth.uid() = id);
    CREATE POLICY users_update_own ON public.users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;
--> statement-breakpoint
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
