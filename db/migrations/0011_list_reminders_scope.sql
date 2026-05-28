-- Escopo da listagem: ongoing (sem ciclo finalizado) vs history (só completed)
CREATE OR REPLACE FUNCTION public.list_reminders_paginated(
  p_search text DEFAULT '',
  p_status_filter text DEFAULT 'todos',
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 12,
  p_scope text DEFAULT 'ongoing'
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
  v_scope text;
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

  v_scope := lower(trim(COALESCE(p_scope, 'ongoing')));
  IF v_scope NOT IN ('ongoing', 'history') THEN
    v_scope := 'ongoing';
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
        (v_scope = 'history' AND r.status = 'completed')
        OR (
          v_scope = 'ongoing'
          AND r.status <> 'completed'
          AND (
            v_status_filter IN ('todos', 'all')
            OR (v_status_filter = 'active' AND r.status = 'active')
            OR (v_status_filter = 'inactive' AND r.status = 'paused')
          )
        )
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
  counted AS (
    SELECT count(*)::bigint AS total FROM filtered
  ),
  paged AS (
    SELECT id
    FROM filtered
    ORDER BY created_at DESC
    OFFSET p_offset
    LIMIT p_limit
  )
  SELECT counted.total,
    COALESCE(
      (
        SELECT jsonb_agg(row_to_json(t)::jsonb)
        FROM (
          SELECT
            r.id,
            r.title,
            r.message,
            r.status,
            r.created_at,
            r.updated_at,
            COALESCE(
              (
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
                  ORDER BY rs.sort_order
                )
                FROM public.reminder_schedules rs
                WHERE rs.reminder_id = r.id
              ),
              '[]'::jsonb
            ) AS reminder_schedules,
            COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'channel', dc.channel,
                    'is_enabled', dc.is_enabled
                  )
                )
                FROM public.reminder_delivery_channels dc
                WHERE dc.reminder_id = r.id AND dc.is_enabled = true
              ),
              '[]'::jsonb
            ) AS reminder_delivery_channels
          FROM public.reminders r
          INNER JOIN paged p ON p.id = r.id
          ORDER BY r.created_at DESC
        ) t
      ),
      '[]'::jsonb
    )
  INTO v_total, v_items
  FROM counted;

  RETURN jsonb_build_object(
    'items', COALESCE(v_items, '[]'::jsonb),
    'total', COALESCE(v_total, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_reminders_paginated(
  text, text, date, date, integer, integer, text
) TO authenticated;
