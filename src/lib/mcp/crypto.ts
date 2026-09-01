import { createHmac, timingSafeEqual } from "crypto";

function getHmacKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set for HMAC operations");
  }
  return key;
}

export function hashKey(key: string): string {
  return createHmac("sha256", getHmacKey()).update(key).digest("hex");
}

export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(maxLen, 0);
  const paddedB = Buffer.alloc(maxLen, 0);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return timingSafeEqual(paddedA, paddedB);
}

export function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}
