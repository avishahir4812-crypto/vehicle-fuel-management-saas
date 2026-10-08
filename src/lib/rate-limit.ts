/**
 * Minimal in-memory sliding-window rate limiter.
 * Perfect for a single Node server; in multi-instance production
 * swap the Map for Redis / Upstash — the interface stays identical.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = store.get(options.key);

  // Periodically clear expired buckets to avoid unbounded growth.
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
  }

  if (!bucket || bucket.resetAt < now) {
    store.set(options.key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true };
  }
  if (bucket.count >= options.limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "local").trim();
}
