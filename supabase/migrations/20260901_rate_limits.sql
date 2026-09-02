-- Run this in Supabase SQL Editor
-- This replaces the previous rate_limits migration

DROP TABLE IF EXISTS rate_limits;

CREATE TABLE rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Composite index for the RPC lookup (key + window filter)
CREATE INDEX idx_rate_limits_lookup ON rate_limits(key, window_start);

-- Plain index on window_start for cleanup DELETE queries
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

CREATE OR REPLACE FUNCTION rate_limit_check(p_key text, p_window_ms int DEFAULT 60000)
RETURNS int AS $$
DECLARE
  current_count int;
BEGIN
  UPDATE rate_limits
  SET count = count + 1
  WHERE key = p_key AND window_start > now() - (p_window_ms || ' milliseconds')::interval
  RETURNING count INTO current_count;

  IF current_count IS NOT NULL THEN
    RETURN current_count;
  END IF;

  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = 1, window_start = now()
  RETURNING count INTO current_count;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql;
