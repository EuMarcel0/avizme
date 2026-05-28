-- Garante que funções auxiliares só leem dados do usuário autenticado
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
