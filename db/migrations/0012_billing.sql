-- Billing: planos, Stripe, contadores de uso e listas de destinatários (Business)

DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'business');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'none',
    'active',
    'past_due',
    'canceled',
    'trialing'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_tier plan_tier NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan_period_end timestamptz;

ALTER TABLE reminder_delivery_channels
  ADD COLUMN IF NOT EXISTS destinations jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS user_usage_counters (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_key text NOT NULL,
  channel delivery_channel NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period_key, channel)
);

CREATE INDEX IF NOT EXISTS idx_user_usage_counters_user_period
  ON user_usage_counters (user_id, period_key);

ALTER TABLE user_usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_usage_counters_select_own ON user_usage_counters;
CREATE POLICY user_usage_counters_select_own ON user_usage_counters
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON COLUMN reminder_delivery_channels.destinations IS
  'Lista de destinos (Business). Vazio = usa destination único do perfil.';

COMMENT ON COLUMN users.plan_tier IS
  'Plano Avizme: free (e-mail limitado), pro (SMS/WA perfil), business (listas).';
