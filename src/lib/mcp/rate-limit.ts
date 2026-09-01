import type { SupabaseClient } from "@supabase/supabase-js";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data, error } = await supabase
    .from("rate_limits")
    .select("count, window_start")
    .eq("key", key)
    .gt("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Rate limit check failed:", error.message);
    return { allowed: true };
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from("rate_limits")
      .insert({ key, count: 1 });
    if (insertError) console.error("Rate limit insert failed:", insertError.message);
    return { allowed: true };
  }

  if (data.count >= MAX_ATTEMPTS) {
    const retryAfterMs = new Date(data.window_start).getTime() + WINDOW_MS - Date.now();
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  const { error: updateError } = await supabase
    .from("rate_limits")
    .update({ count: data.count + 1 })
    .eq("key", key)
    .eq("window_start", data.window_start);
  if (updateError) console.error("Rate limit update failed:", updateError.message);

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
