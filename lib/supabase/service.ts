import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env, requireServiceRoleKey } from "@/lib/env";

/** Cliente com service role para jobs/cron (ignora RLS). */
export function createServiceClient() {
  return createClient(env.supabaseUrl, requireServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
