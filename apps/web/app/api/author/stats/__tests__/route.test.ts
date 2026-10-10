import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  checkIsAdmin: vi.fn(),
  createClient: vi.fn(),
  callerRpc: vi.fn(),
  approvedIds: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("@/lib/admin", () => ({ checkIsAdmin: mocks.checkIsAdmin }))
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }))
vi.mock("@/lib/api/server/auto-index-admission", () => ({
  currentApprovedAutoIndexComponentIds: mocks.approvedIds,
}))
vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    from: () => {
      const query: any = {
        select: () => query,
        or: () => query,
        eq: () => query,
        order: () => query,
        gt: () => query,
        limit: () => query,
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve({ data: [], error: null }).then(resolve, reject),
      }
      return query
    },
  },
}))

import { NextRequest } from "next/server"
import { GET } from "@/app/api/author/stats/route"

const request = (userId?: string) => new NextRequest(
  `https://higherbits.dev/api/author/stats${userId ? `?user_id=${userId}` : ""}`,
)

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example.test")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_KEY", "anon-key")
  mocks.auth.mockResolvedValue({
    userId: "creator-1",
    getToken: vi.fn().mockResolvedValue("verified-supabase-jwt"),
  })
  mocks.checkIsAdmin.mockResolvedValue({ isAdmin: false, error: null })
  mocks.createClient.mockReturnValue({ rpc: mocks.callerRpc })
  mocks.callerRpc.mockResolvedValue({ data: [], error: null })
  mocks.approvedIds.mockResolvedValue(new Set())
})

it("uses the authenticated owner's Supabase JWT for the earnings RPC", async () => {
  const response = await GET(request())

  expect(response.status).toBe(200)
  expect(mocks.createClient).toHaveBeenCalledWith(
    "https://db.example.test",
    "anon-key",
    expect.objectContaining({
      global: { headers: { Authorization: "Bearer verified-supabase-jwt" } },
    }),
  )
  expect(mocks.callerRpc).toHaveBeenCalledWith("get_daily_user_earnings_v2", {
    p_user_id: "creator-1",
  })
})

it("allows a verified admin route to request another author's stats with the admin JWT", async () => {
  mocks.auth.mockResolvedValue({
    userId: "admin-1",
    getToken: vi.fn().mockResolvedValue("verified-admin-jwt"),
  })
  mocks.checkIsAdmin.mockResolvedValue({ isAdmin: true, error: null })

  const response = await GET(request("creator-2"))

  expect(response.status).toBe(200)
  expect(mocks.createClient).toHaveBeenCalledWith(
    "https://db.example.test",
    "anon-key",
    expect.objectContaining({
      global: { headers: { Authorization: "Bearer verified-admin-jwt" } },
    }),
  )
  expect(mocks.callerRpc).toHaveBeenCalledWith("get_daily_user_earnings_v2", {
    p_user_id: "creator-2",
  })
})

it("denies another author's stats to a non-admin before creating an RPC client", async () => {
  const response = await GET(request("creator-2"))

  expect(response.status).toBe(401)
  expect(mocks.createClient).not.toHaveBeenCalled()
  expect(mocks.callerRpc).not.toHaveBeenCalled()
})

it("fails closed when the authenticated Supabase token is unavailable", async () => {
  mocks.auth.mockResolvedValue({
    userId: "creator-1",
    getToken: vi.fn().mockResolvedValue(null),
  })

  const response = await GET(request())

  expect(response.status).toBe(503)
  expect(mocks.callerRpc).not.toHaveBeenCalled()
})
