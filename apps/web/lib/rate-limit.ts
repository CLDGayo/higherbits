export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface WindowRecord {
  count: number
  resetAt: number
}

// In-memory store: Map<key, WindowRecord>
const rateLimitStore = new Map<string, WindowRecord>()

const MAX_ENTRIES = 10000
let lastPruned = Date.now()

function pruneExpired(now: number) {
  if (now - lastPruned < 30000 && rateLimitStore.size < MAX_ENTRIES) {
    return
  }
  lastPruned = now
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
  if (rateLimitStore.size >= MAX_ENTRIES) {
    const toRemove = rateLimitStore.size - MAX_ENTRIES + 1000
    let count = 0
    for (const key of rateLimitStore.keys()) {
      rateLimitStore.delete(key)
      count++
      if (count >= toRemove) break
    }
  }
}

/**
 * High-performance, edge-compatible in-memory rate limiter.
 * Decouples rate-limiting from synchronous database roundtrips.
 *
 * @param identifier User ID or Client IP
 * @param endpoint Route group or endpoint name
 * @param limit Max requests allowed in the window
 * @param windowSeconds Window duration in seconds (default: 60)
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 120,
  windowSeconds: number = 60,
): RateLimitResult {
  const now = Date.now()
  pruneExpired(now)

  const key = `${endpoint}:${identifier}`
  const existing = rateLimitStore.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000
    rateLimitStore.set(key, { count: 1, resetAt })
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      reset: Math.ceil(resetAt / 1000),
    }
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(existing.resetAt / 1000),
    }
  }

  existing.count += 1
  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    reset: Math.ceil(existing.resetAt / 1000),
  }
}

/**
 * Reset store for tests
 */
export function _resetRateLimitStore() {
  rateLimitStore.clear()
  lastPruned = 0
}
