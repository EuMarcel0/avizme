-- Security Advisor: funções SECURITY DEFINER não devem ser executáveis via PostgREST
-- por anon/authenticated (lint 0028 / 0029).
-- Ver: https://supabase.com/docs/guides/database/database-linter

-- Trigger em auth.users — não é RPC do app; revogar não afeta o trigger.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Dispatch / billing — apenas service_role (cron, API server).
REVOKE ALL ON FUNCTION public.increment_usage_counter(uuid, text, delivery_channel, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_usage_counter(uuid, text, delivery_channel, integer)
  TO service_role;

-- Função auxiliar do Supabase (se existir no projeto); não expor na API.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
