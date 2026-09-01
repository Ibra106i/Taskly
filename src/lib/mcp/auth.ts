import type { OAuthTokenVerifier, AuthInfo } from "@modelcontextprotocol/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { hashKey, timingSafeCompare } from "@/lib/mcp/crypto";

export const apiKeyVerifier: OAuthTokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const supabase = createSupabaseClient();
    const keyHash = hashKey(token);

    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("id, user_id, key_hash")
      .eq("key_hash", keyHash)
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
