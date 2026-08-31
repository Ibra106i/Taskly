"use server";

import { auth } from "@clerk/nextjs/server";
import { createHash, randomBytes } from "crypto";
import { createSupabaseClient } from "@/lib/supabase/server";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function generateApiKey(): Promise<{ key: string; id: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const randomBytesBuffer = randomBytes(48);
  const key = `tk_${randomBytesBuffer.toString("base64url")}`;
  const keyHash = hashKey(key);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ user_id: userId, key_hash: keyHash })
    .select("id")
    .single();

  if (error) throw error;
  return { key, id: data.id };
}

export async function listApiKeys(): Promise<
  { id: string; created_at: string; last_used_at: string | null }[]
> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, created_at, last_used_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function revokeApiKey(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
