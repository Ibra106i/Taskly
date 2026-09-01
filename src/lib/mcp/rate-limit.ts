interface RateRecord {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateRecord>();

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const MAX_MAP_SIZE = 10_000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    if (attempts.size >= MAX_MAP_SIZE && !attempts.has(key)) {
      return { allowed: false, retryAfterMs: WINDOW_MS };
    }
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: record.resetAt - now };
  }

  record.count++;
  return { allowed: true };
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    if (attempts.size >= MAX_MAP_SIZE && !attempts.has(key)) {
      return;
    }
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  record.count++;
}

export function recordSuccess(key: string): void {
  attempts.delete(key);
}

const CLEANUP_INTERVAL_MS = 300_000;

const interval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (now > record.resetAt) attempts.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

if (typeof interval.unref === "function") {
  interval.unref();
}
