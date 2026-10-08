import "server-only";

/**
 * Thin client for the Python (FastAPI) analytics service.
 *
 * The service owns the compute-heavy read paths. If PY_API_URL is not set, or
 * the service is slow/down, every caller transparently falls back to the
 * TypeScript/Drizzle implementation — so the app never breaks.
 */

const BASE = process.env.PY_API_URL?.replace(/\/$/, "") ?? "";
const TOKEN = process.env.PY_SERVICE_TOKEN ?? "";
const TIMEOUT_MS = Number(process.env.PY_TIMEOUT_MS ?? "2500");

/** Circuit breaker: after a failure, skip Python for a short cooldown. */
const COOLDOWN_MS = 30_000;
let downUntil = 0;

export function pyEnabled(): boolean {
  return BASE.length > 0 && Date.now() >= downUntil;
}

export async function pyGet<T>(path: string, params: Record<string, string | number>) {
  if (!pyEnabled()) return null;

  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: TOKEN ? { "X-Service-Token": TOKEN } : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`py_${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    downUntil = Date.now() + COOLDOWN_MS;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[py-client] falling back to TS:", (err as Error).message);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Revives ISO date strings coming back from Python into Date objects. */
export function reviveEntry<T extends { createdAt: string }>(
  entry: T
): Omit<T, "createdAt"> & { createdAt: Date } {
  return { ...entry, createdAt: new Date(entry.createdAt) };
}
