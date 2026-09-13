import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "../route"

const mocks = vi.hoisted(() => {
  // Chainable query builder: every call returns the builder; awaiting it
  // resolves to an empty, error-free result.
  const builder: Record<string, unknown> = {}
  const result = { data: [], error: null }
  for (const method of ["update", "select", "neq", "eq"]) {
    builder[method] = vi.fn(() => builder)
  }
  builder.then = (resolve: (v: typeof result) => unknown) => resolve(result)
  return {
    builder,
    mockFrom: vi.fn(() => builder),
    mockGetAllPlans: vi.fn(async () => []),
  }
})

// Local override of the global `__tests__/setup.ts` supabase mock so the
// mutation entrypoint (`.from`) can be asserted on.
vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: { from: mocks.mockFrom },
}))

vi.mock("@/lib/stripe", () => ({
  stripeV1: { subscriptions: { retrieve: vi.fn() } },
  stripeV2: { subscriptions: { retrieve: vi.fn() } },
  getAllPlans: mocks.mockGetAllPlans,
}))

const { mockFrom, mockGetAllPlans } = mocks

const SECRET = "test-cron-secret"

function makeRequest(auth?: string) {
  return new NextRequest("http://localhost/api/subscription/stripe-cron", {
    headers: auth ? { Authorization: auth } : {},
  })
}

describe("GET /api/subscription/stripe-cron — CRON_SECRET guard", () => {
  const originalSecret = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = SECRET
  })

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = originalSecret
  })

  it("passes the guard when CRON_SECRET is set and the header matches", async () => {
    const res = await GET(makeRequest(`Bearer ${SECRET}`))

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith("usages")
    expect(mockGetAllPlans).toHaveBeenCalled()
  })

  it("returns 401 without mutating when the header is wrong", async () => {
    const res = await GET(makeRequest("Bearer wrong-secret"))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(mockFrom).not.toHaveBeenCalled()
    expect(mockGetAllPlans).not.toHaveBeenCalled()
  })

  it("returns 401 without mutating when the header is absent", async () => {
    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("fails closed when CRON_SECRET is unset, even for the literal 'Bearer undefined' header", async () => {
    delete process.env.CRON_SECRET
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    for (const auth of ["Bearer undefined", "Bearer ", "Bearer anything", undefined]) {
      const res = await GET(makeRequest(auth))
      expect(res.status).toBe(401)
    }
    expect(mockFrom).not.toHaveBeenCalled()
    expect(mockGetAllPlans).not.toHaveBeenCalled()

    // The diagnostic log must never carry the received header value.
    const logged = errorSpy.mock.calls.flat().map(String).join(" ")
    expect(logged).not.toContain("Bearer")
    errorSpy.mockRestore()
  })
})
