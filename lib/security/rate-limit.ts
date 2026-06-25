/**
 * BrandQuest — Rate limiting (placeholder)
 *
 * This is an in-memory token bucket suitable for a single instance / local dev.
 * It demonstrates WHERE rate limiting plugs in and gives basic protection, but
 * it is NOT durable across serverless invocations.
 *
 * TODO(production): Replace with a distributed limiter (e.g. Upstash Redis or
 * DynamoDB-backed counters) so limits hold across all serverless instances.
 * See docs/SECURITY.md.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  }
}

/** Builds a stable key from a request for limiting. */
export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "local"
  const ip = fwd.split(",")[0]?.trim() || "local"
  return `${scope}:${ip}`
}
