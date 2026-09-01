-- Run this in Supabase SQL Editor to add the atomic position function

CREATE OR REPLACE FUNCTION get_next_position(p_user_id text)
RETURNS int AS $$
  SELECT COALESCE(MAX(position), -1) + 1 FROM todos WHERE user_id = p_user_id AND parent_id IS NULL;
$$ LANGUAGE sql;
