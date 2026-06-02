-- Datas de renovação / cancelamento (espelho do Stripe para a UI de planos)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;

COMMENT ON COLUMN users.subscription_cancel_at_period_end IS
  'Stripe cancel_at_period_end: não renova no fim do período atual.';
COMMENT ON COLUMN users.subscription_ends_at IS
  'Data em que o acesso pago encerra (cancel_at do Stripe ou fim do período se cancel_at_period_end).';
