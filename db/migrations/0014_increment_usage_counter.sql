-- Incremento atômico de contadores de uso (dispatch / billing)

CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_user_id uuid,
  p_period_key text,
  p_channel delivery_channel,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_increment <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO user_usage_counters (user_id, period_key, channel, count)
  VALUES (p_user_id, p_period_key, p_channel, p_increment)
  ON CONFLICT (user_id, period_key, channel)
  DO UPDATE SET count = user_usage_counters.count + EXCLUDED.count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_usage_counter(uuid, text, delivery_channel, integer) TO service_role;

COMMENT ON FUNCTION public.increment_usage_counter IS
  'Incrementa contador de envios por usuário/período/canal (usado pelo dispatch).';
