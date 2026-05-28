-- Data mínima de agendamento (espelha map-reminder-row no app)
CREATE OR REPLACE FUNCTION public.reminder_earliest_schedule_date(p_reminder_id uuid)
RETURNS date
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT MIN(d)::date
  FROM (
    SELECT rs.start_date AS d
    FROM public.reminder_schedules rs
    WHERE rs.reminder_id = p_reminder_id
      AND rs.start_date IS NOT NULL
    UNION ALL
    SELECT elem::date
    FROM public.reminder_schedules rs,
         LATERAL jsonb_array_elements_text(COALESCE(rs.dates, '[]'::jsonb)) AS elem
    WHERE rs.reminder_id = p_reminder_id
      AND elem ~ '^\d{4}-\d{2}-\d{2}'
  ) dates
  WHERE d IS NOT NULL;
$$;

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
