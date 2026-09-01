import type { OAuthTokenVerifier, AuthInfo } from "@modelcontextprotocol/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { hashKey, timingSafeCompare } from "@/lib/mcp/crypto";
import { checkRateLimit, recordFailure, recordSuccess } from "@/lib/mcp/rate-limit";

function getClientIp(request?: Request): string {
  if (!request) return "unknown";
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export const apiKeyVerifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const supabase = createSupabaseClient();
    const keyHash = hashKey(token);

    const rateKey = `auth:${keyHash.slice(0, 16)}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateKey);
    if (!allowed) {
      console.error(`Rate limited auth attempt, retry after ${retryAfterMs}ms`);
      throw new Error("Too many attempts, try again later");
    }

    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("id, user_id, key_hash")
      .eq("key_hash", keyHash)
      .single();

    if (!apiKey) {
      recordFailure(rateKey);
      throw new Error("Invalid API key");
    }

    if (!timingSafeCompare(apiKey.key_hash, keyHash)) {
      recordFailure(rateKey);
      throw new Error("Invalid API key");
    }

    recordSuccess(rateKey);

    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKey.id);

    return {
      token: token,
      clientId: apiKey.user_id,
      scopes: ["read", "write"],
      expiresAt: Math.floor(Date.now() / 1000) + 86400,
    };
  },
};
