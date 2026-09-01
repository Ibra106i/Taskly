-- Run this in Supabase SQL Editor to create the rate_limits table

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL,
  count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key, window_start);

-- Auto-cleanup: delete rows older than 5 minutes
-- This runs on each INSERT as a lightweight cleanup
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS trigger AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - interval '5 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_rate_limits ON rate_limits;
CREATE TRIGGER trg_cleanup_rate_limits
  AFTER INSERT ON rate_limits
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_rate_limits();
