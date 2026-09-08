import { describe, expect, it, beforeEach, vi, afterEach } from "vitest"
import { checkRateLimit, _resetRateLimitStore } from "../rate-limit"

describe("checkRateLimit (in-memory rate limiter)", () => {
  beforeEach(() => {
    _resetRateLimitStore()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("allows requests under the limit", () => {
    const result1 = checkRateLimit("user-1", "global_api", 5, 60)
    expect(result1.success).toBe(true)
    expect(result1.limit).toBe(5)
    expect(result1.remaining).toBe(4)

    const result2 = checkRateLimit("user-1", "global_api", 5, 60)
    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(3)
  })

  it("blocks requests once the limit is reached", () => {
    const limit = 3
    for (let i = 0; i < limit; i++) {
      const res = checkRateLimit("user-blocked", "test_api", limit, 60)
      expect(res.success).toBe(true)
    }

    const blocked = checkRateLimit("user-blocked", "test_api", limit, 60)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.limit).toBe(3)
  })

  it("resets limits after the window expires", () => {
    vi.useFakeTimers()
    const now = 1000000000000
    vi.setSystemTime(now)

    checkRateLimit("user-timer", "test_api", 2, 60)
    checkRateLimit("user-timer", "test_api", 2, 60)

    const blocked = checkRateLimit("user-timer", "test_api", 2, 60)
    expect(blocked.success).toBe(false)

    // Advance past window (61 seconds)
    vi.setSystemTime(now + 61000)

    const allowedAgain = checkRateLimit("user-timer", "test_api", 2, 60)
    expect(allowedAgain.success).toBe(true)
    expect(allowedAgain.remaining).toBe(1)
  })

  it("isolates different endpoints and identifiers", () => {
    const resA = checkRateLimit("user-x", "endpoint-a", 1, 60)
    const resB = checkRateLimit("user-x", "endpoint-b", 1, 60)
    const resUserY = checkRateLimit("user-y", "endpoint-a", 1, 60)

    expect(resA.success).toBe(true)
    expect(resB.success).toBe(true)
    expect(resUserY.success).toBe(true)

    // Next hit on endpoint-a for user-x should be blocked
    expect(checkRateLimit("user-x", "endpoint-a", 1, 60).success).toBe(false)
    // But endpoint-b for user-y still has allowance
    expect(checkRateLimit("user-y", "endpoint-b", 1, 60).success).toBe(true)
  })
})
