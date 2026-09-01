-- Run this in Supabase SQL Editor
-- This replaces the previous rate_limits migration

DROP TABLE IF EXISTS rate_limits;

CREATE TABLE rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_lookup ON rate_limits(key, window_start);

-- Atomic rate limit check: inserts or increments in one statement, no TOCTOU.
-- Returns the current count for the key within the window.
CREATE OR REPLACE FUNCTION rate_limit_check(p_key text, p_window_ms int DEFAULT 60000)
RETURNS int AS $$
DECLARE
  current_count int;
  window_start timestamptz;
BEGIN
  window_start := now() - (p_window_ms || ' milliseconds')::interval;

  -- Try to increment an existing record within the window
  UPDATE rate_limits
  SET count = count + 1
  WHERE key = p_key AND window_start > window_start
  RETURNING count INTO current_count;

  IF current_count IS NOT NULL THEN
    RETURN current_count;
  END IF;

  -- No record within window: insert fresh
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = 1, window_start = now()
  RETURNING count INTO current_count;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql;
