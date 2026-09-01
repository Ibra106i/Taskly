import type { SupabaseClient } from "@supabase/supabase-js";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  // Atomic check via PostgreSQL function — no TOCTOU race.
  // The function inserts or increments in a single statement.
  const { data, error } = await supabase
    .rpc("rate_limit_check", { p_key: key, p_window_ms: WINDOW_MS });

  if (error) {
    console.error("Rate limit check failed:", error.message);
    return { allowed: true };
  }

  const count = data as number;

  if (count > MAX_ATTEMPTS) {
    // Re-fetch window_start for retry-after calculation
    const { data: row } = await supabase
      .from("rate_limits")
      .select("window_start")
      .eq("key", key)
      .single();

    const retryAfterMs = row
      ? new Date(row.window_start).getTime() + WINDOW_MS - Date.now()
      : WINDOW_MS;
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  return { allowed: true };
}

export async function recordFailure(
  supabase: SupabaseClient,
  key: string
): Promise<void> {
  await checkRateLimit(supabase, key);
}

export async function recordSuccess(
  supabase: SupabaseClient,
  key: string
): Promise<void> {
  const { error } = await supabase
    .from("rate_limits")
    .delete()
    .eq("key", key);
  if (error) console.error("Rate limit delete failed:", error.message);
}

export async function cleanupExpiredRateLimits(
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from("rate_limits")
    .delete()
    .lt("window_start", new Date(Date.now() - 5 * 60_000).toISOString());
  if (error) console.error("Rate limit cleanup failed:", error.message);
}
