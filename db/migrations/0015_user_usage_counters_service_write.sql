-- Escrita em user_usage_counters pelo backend (service_role / RPC SECURITY DEFINER)

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_usage_counters TO service_role;

DROP POLICY IF EXISTS user_usage_counters_service_write ON public.user_usage_counters;
CREATE POLICY user_usage_counters_service_write ON public.user_usage_counters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
