-- Evita ocorrências duplicadas (mesmo lembrete, agenda, horário e canal).
ALTER TABLE public.reminder_occurrences
  DROP CONSTRAINT IF EXISTS reminder_occurrences_dedup_key;

ALTER TABLE public.reminder_occurrences
  ADD CONSTRAINT reminder_occurrences_dedup_key
  UNIQUE (reminder_id, schedule_id, scheduled_at, channel);
