import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";
import type { OAuthTokenVerifier, AuthInfo } from "@modelcontextprotocol/server";
import { createSupabaseClient } from "@/lib/supabase/server";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const apiKeyVerifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const supabase = createSupabaseClient();
    const keyHash = hashKey(token);
    const prefix = token.slice(0, 8);

    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("id, user_id, key_hash")
      .eq("prefix", prefix)
      .single();

    if (!apiKey) {
      throw new Error("Invalid API key");
    }

    if (!timingSafeCompare(apiKey.key_hash, keyHash)) {
      throw new Error("Invalid API key");
    }

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
