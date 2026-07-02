-- Planos Pro/Premium + anexos de lembretes

-- Migrar enum plan_tier: free/business -> pro/premium
ALTER TABLE users ALTER COLUMN plan_tier DROP DEFAULT;

CREATE TYPE plan_tier_new AS ENUM ('pro', 'premium');

ALTER TABLE users
  ALTER COLUMN plan_tier TYPE plan_tier_new
  USING (
    CASE plan_tier::text
      WHEN 'business' THEN 'premium'::plan_tier_new
      WHEN 'premium' THEN 'premium'::plan_tier_new
      WHEN 'pro' THEN 'pro'::plan_tier_new
      ELSE 'pro'::plan_tier_new
    END
  );

DROP TYPE plan_tier;
ALTER TYPE plan_tier_new RENAME TO plan_tier;
ALTER TABLE users ALTER COLUMN plan_tier SET DEFAULT 'pro'::plan_tier;

COMMENT ON COLUMN users.plan_tier IS
  'Plano Avizme: pro (padrão) ou premium. Sem assinatura ativa, limites de trial aplicados na aplicação.';

-- Anexos
CREATE TABLE IF NOT EXISTS reminder_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminder_attachments_reminder
  ON reminder_attachments (reminder_id);

CREATE INDEX IF NOT EXISTS idx_reminder_attachments_user
  ON reminder_attachments (user_id);

ALTER TABLE reminder_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reminder_attachments_select_own ON reminder_attachments;
CREATE POLICY reminder_attachments_select_own ON reminder_attachments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS reminder_attachments_insert_own ON reminder_attachments;
CREATE POLICY reminder_attachments_insert_own ON reminder_attachments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM reminders r
      WHERE r.id = reminder_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS reminder_attachments_delete_own ON reminder_attachments;
CREATE POLICY reminder_attachments_delete_own ON reminder_attachments
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE reminder_attachments IS
  'Metadados de arquivos anexados a lembretes (conteúdo no bucket reminder-attachments).';

-- Storage bucket (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('reminder-attachments', 'reminder-attachments', false, 10485760)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS reminder_attachments_storage_select ON storage.objects;
CREATE POLICY reminder_attachments_storage_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'reminder-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS reminder_attachments_storage_insert ON storage.objects;
CREATE POLICY reminder_attachments_storage_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'reminder-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS reminder_attachments_storage_delete ON storage.objects;
CREATE POLICY reminder_attachments_storage_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'reminder-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
