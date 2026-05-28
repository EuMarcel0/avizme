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

-- Índices e updated_at em reminders (migration 0004)
CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON public.reminders (user_id);
CREATE INDEX IF NOT EXISTS reminders_user_id_created_at_idx
  ON public.reminders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reminder_schedules_reminder_id_idx
  ON public.reminder_schedules (reminder_id);
CREATE INDEX IF NOT EXISTS reminder_delivery_channels_reminder_id_idx
  ON public.reminder_delivery_channels (reminder_id);
CREATE INDEX IF NOT EXISTS reminder_occurrences_reminder_id_scheduled_at_idx
  ON public.reminder_occurrences (reminder_id, scheduled_at);

ALTER TABLE public.reminder_occurrences
  DROP CONSTRAINT IF EXISTS reminder_occurrences_dedup_key;

ALTER TABLE public.reminder_occurrences
  ADD CONSTRAINT reminder_occurrences_dedup_key
  UNIQUE (reminder_id, schedule_id, scheduled_at, channel);

CREATE OR REPLACE FUNCTION public.set_reminders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reminders_set_updated_at ON public.reminders;
CREATE TRIGGER reminders_set_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reminders_updated_at();

-- Listagem paginada com filtros (migration 0005)
CREATE OR REPLACE FUNCTION public.reminder_earliest_schedule_date(p_reminder_id uuid)
RETURNS date
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT MIN(d)::date
  FROM (
    SELECT rs.start_date AS d
    FROM public.reminder_schedules rs
    INNER JOIN public.reminders r ON r.id = rs.reminder_id
    WHERE rs.reminder_id = p_reminder_id
      AND r.user_id = auth.uid()
      AND rs.start_date IS NOT NULL
    UNION ALL
    SELECT elem::date
    FROM public.reminder_schedules rs
    INNER JOIN public.reminders r ON r.id = rs.reminder_id,
         LATERAL jsonb_array_elements_text(COALESCE(rs.dates, '[]'::jsonb)) AS elem
    WHERE rs.reminder_id = p_reminder_id
      AND r.user_id = auth.uid()
      AND elem ~ '^\d{4}-\d{2}-\d{2}'
  ) dates
  WHERE d IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.reminder_earliest_schedule_date(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reminder_earliest_schedule_date(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_reminders_paginated(
  p_search text DEFAULT '',
  p_status_filter text DEFAULT 'todos',
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 12
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total bigint;
  v_items jsonb;
  v_search text := trim(COALESCE(p_search, ''));
  v_status_filter text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
  END IF;

  IF p_limit < 1 OR p_limit > 50 THEN
    RAISE EXCEPTION 'p_limit must be between 1 and 50';
  END IF;

  IF p_offset < 0 THEN
    RAISE EXCEPTION 'p_offset must be >= 0';
  END IF;

  v_status_filter := lower(trim(COALESCE(p_status_filter, 'todos')));
  IF v_status_filter IN ('all', '') THEN
    v_status_filter := 'todos';
  END IF;

  WITH filtered AS (
    SELECT r.id, r.created_at
    FROM public.reminders r
    WHERE r.user_id = v_user_id
      AND (
        v_search = ''
        OR r.title ILIKE '%' || v_search || '%'
        OR r.message ILIKE '%' || v_search || '%'
      )
      AND (
        v_status_filter IN ('todos', 'all')
        OR (v_status_filter = 'active' AND r.status = 'active')
        OR (v_status_filter = 'inactive' AND r.status <> 'active')
      )
      AND (
        (p_date_from IS NULL AND p_date_to IS NULL)
        OR (
          public.reminder_earliest_schedule_date(r.id) IS NOT NULL
          AND (p_date_from IS NULL OR public.reminder_earliest_schedule_date(r.id) >= p_date_from)
          AND (p_date_to IS NULL OR public.reminder_earliest_schedule_date(r.id) <= p_date_to)
        )
      )
  ),
  paged AS (
    SELECT f.id
    FROM filtered f
    ORDER BY f.created_at DESC
    OFFSET p_offset
    LIMIT p_limit
  ),
  items_json AS (
    SELECT COALESCE(
      jsonb_agg(row_data ORDER BY row_data->>'created_at' DESC),
      '[]'::jsonb
    ) AS items
    FROM (
      SELECT jsonb_build_object(
        'id', r.id,
        'title', r.title,
        'message', r.message,
        'status', r.status,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'reminder_schedules', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'schedule_type', rs.schedule_type,
              'start_date', rs.start_date,
              'end_date', rs.end_date,
              'interval_days', rs.interval_days,
              'times', rs.times,
              'dates', rs.dates,
              'weekdays', rs.weekdays,
              'day_of_month', rs.day_of_month
            )
            ORDER BY rs.sort_order, rs.created_at
          )
          FROM public.reminder_schedules rs
          WHERE rs.reminder_id = r.id
        ), '[]'::jsonb),
        'reminder_delivery_channels', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'channel', dc.channel,
              'is_enabled', dc.is_enabled
            )
          )
          FROM public.reminder_delivery_channels dc
          WHERE dc.reminder_id = r.id
        ), '[]'::jsonb)
      ) AS row_data
      FROM paged p
      INNER JOIN public.reminders r ON r.id = p.id
    ) rows
  )
  SELECT
    (SELECT count(*)::bigint FROM filtered),
    (SELECT items FROM items_json)
  INTO v_total, v_items;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', COALESCE(v_total, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_reminders_paginated(
  text, text, date, date, integer, integer
) TO authenticated;
