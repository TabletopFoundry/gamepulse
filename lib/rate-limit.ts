import { headers } from "next/headers";
import { getDb } from "@/lib/db";

type TokenBucket = { count: number; reset_at: number };

const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60_000; // purge stale entries every 5 minutes

let lastCleanup = Date.now();

function cleanup(db: ReturnType<typeof getDb>, now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  db.prepare(`DELETE FROM rate_limit_buckets WHERE reset_at < ?`).run(now);
}

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
}

/**
 * SQLite-backed token-bucket rate limiter for server actions.
 * Returns { allowed: true } if under limit, or { allowed: false, message } if exceeded.
 */
export async function rateLimit(
  action: string,
  maxRequests = 10,
): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const db = getDb();
  const ip = await getClientIp();
  const now = Date.now();

  cleanup(db, now);

  const allowed = db.transaction(() => {
    const bucket = db.prepare(`SELECT count, reset_at FROM rate_limit_buckets WHERE ip = ? AND action = ?`).get(ip, action) as TokenBucket | undefined;

    if (!bucket || bucket.reset_at < now) {
      db.prepare(`
        INSERT INTO rate_limit_buckets (ip, action, count, reset_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(ip, action)
        DO UPDATE SET count = excluded.count, reset_at = excluded.reset_at
      `).run(ip, action, 1, now + WINDOW_MS);
      return true;
    }

    if (bucket.count >= maxRequests) {
      return false;
    }

    db.prepare(`UPDATE rate_limit_buckets SET count = ? WHERE ip = ? AND action = ?`).run(bucket.count + 1, ip, action);
    return true;
  })();

  if (!allowed) {
    return { allowed: false, message: "Too many requests. Please wait a moment and try again." };
  }

  return { allowed: true };
}
