import type { OAuthTokenVerifier, AuthInfo } from "@modelcontextprotocol/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { hashKey, timingSafeCompare } from "@/lib/mcp/crypto";
import { checkRateLimit, recordFailure, recordSuccess } from "@/lib/mcp/rate-limit";

let cachedSupabase: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabase() {
  if (!cachedSupabase) {
    cachedSupabase = createSupabaseClient();
  }
  return cachedSupabase;
}

export const apiKeyVerifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const supabase = getSupabase();
    const keyHash = hashKey(token);

    const rateKey = `auth:${keyHash}`;
    const { allowed, retryAfterMs } = await checkRateLimit(supabase, rateKey);
    if (!allowed) {
      console.error(`Rate limited auth attempt, retry after ${retryAfterMs}ms`);
      throw new Error("Too many authentication attempts");
    }

    const { data: apiKey, error: dbError } = await supabase
      .from("api_keys")
      .select("id, user_id, key_hash")
      .eq("key_hash", keyHash)
      .single();

    if (dbError || !apiKey || !timingSafeCompare(apiKey.key_hash, keyHash)) {
      await recordFailure(supabase, rateKey);
      throw new Error("Invalid API key");
    }

    await recordSuccess(supabase, rateKey);

    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKey.id);

    return {
      token: keyHash,
      clientId: apiKey.user_id,
      scopes: ["read", "write"],
      expiresAt: Math.floor(Date.now() / 1000) + 86400,
    };
  },
};
