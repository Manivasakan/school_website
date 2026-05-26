/**
 * Per-isolate in-memory rate limiter (token bucket).
 *
 * Caveats:
 *  - In-memory state is per Worker isolate. With many isolates / regions, the
 *    effective limit per IP can be higher than configured. For a school site
 *    that's acceptable.
 *  - For strict per-IP limits across all instances, swap this for an Upstash
 *    Redis or Cloudflare KV implementation.
 *
 * Usage:
 *   const ok = checkRate(`forgot:${ip}`, 5, 60_000); // 5 per minute
 *   if (!ok) return NextResponse.json({ error: "Too many" }, { status: 429 });
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRate(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
