const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const BACKOFF_BASE_MS = 100;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterMs = record.resetAt - now;
    return { allowed: false, retryAfterMs };
  }

  record.count++;
  return { allowed: true };
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  record.count++;
}

export function recordSuccess(key: string): void {
  attempts.delete(key);
}

const CLEANUP_INTERVAL_MS = 300_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (now > record.resetAt) attempts.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref?.();
