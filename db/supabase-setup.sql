-- =============================================================================
-- Avizme — rode este script INTEIRO no Supabase: SQL Editor → New query → Run
-- (cria tabelas, trigger de cadastro, RLS e policy de insert)
-- =============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.delivery_channel AS ENUM ('sms', 'whatsapp', 'email');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.occurrence_status AS ENUM ('pending', 'sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.reminder_status AS ENUM ('active', 'paused', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.schedule_type AS ENUM (
    'single', 'same_day_multi', 'interval', 'interval_multi', 'weekly', 'monthly', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabelas
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY NOT NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status public.reminder_status DEFAULT 'active' NOT NULL,
  timezone text DEFAULT 'America/Sao_Paulo' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reminder_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  reminder_id uuid NOT NULL,
  schedule_type public.schedule_type NOT NULL,
  start_date date,
  end_date date,
  interval_days integer,
  times jsonb DEFAULT '[]'::jsonb NOT NULL,
  dates jsonb DEFAULT '[]'::jsonb NOT NULL,
  weekdays jsonb DEFAULT '[]'::jsonb NOT NULL,
  day_of_month integer,
  config jsonb DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reminder_delivery_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  reminder_id uuid NOT NULL,
  channel public.delivery_channel NOT NULL,
  destination text,
  is_enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reminder_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  reminder_id uuid NOT NULL,
  schedule_id uuid,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status public.occurrence_status DEFAULT 'pending' NOT NULL,
  channel public.delivery_channel,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- FKs (ignora se já existir)
DO $$ BEGIN
  ALTER TABLE public.reminders
    ADD CONSTRAINT reminders_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.reminder_schedules
    ADD CONSTRAINT reminder_schedules_reminder_id_reminders_id_fk
    FOREIGN KEY (reminder_id) REFERENCES public.reminders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.reminder_delivery_channels
    ADD CONSTRAINT reminder_delivery_channels_reminder_id_reminders_id_fk
    FOREIGN KEY (reminder_id) REFERENCES public.reminders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.reminder_occurrences
    ADD CONSTRAINT reminder_occurrences_reminder_id_reminders_id_fk
    FOREIGN KEY (reminder_id) REFERENCES public.reminders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.reminder_occurrences
    ADD CONSTRAINT reminder_occurrences_schedule_id_reminder_schedules_id_fk
    FOREIGN KEY (schedule_id) REFERENCES public.reminder_schedules(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.users
    ADD CONSTRAINT users_id_auth_users_fk
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger: cria linha em public.users ao registrar no Auth
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_delivery_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_occurrences ENABLE ROW LEVEL SECURITY;

-- Policies users
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies reminders
DROP POLICY IF EXISTS reminders_all_own ON public.reminders;
CREATE POLICY reminders_all_own ON public.reminders
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS schedules_via_reminder ON public.reminder_schedules;
CREATE POLICY schedules_via_reminder ON public.reminder_schedules
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

DROP POLICY IF EXISTS channels_via_reminder ON public.reminder_delivery_channels;
CREATE POLICY channels_via_reminder ON public.reminder_delivery_channels
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

DROP POLICY IF EXISTS occurrences_via_reminder ON public.reminder_occurrences;
CREATE POLICY occurrences_via_reminder ON public.reminder_occurrences
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
