import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  earningsRpc: vi.fn(),
  serviceRpc: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    rpc: mocks.serviceRpc,
    from: () => {
      const query: any = {
        select: () => query,
        eq: () => query,
        in: () => query,
        gte: () => query,
        lt: () => query,
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve({ data: [], count: 0, error: null }).then(resolve, reject),
      }
      return query
    },
  },
}))

import { getStudioOverviewData } from "@/components/features/studio/overview/overview-data"

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example.test")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_KEY", "anon-key")
  mocks.auth.mockResolvedValue({
    userId: "creator-1",
    getToken: vi.fn().mockResolvedValue("verified-owner-jwt"),
  })
  mocks.createClient.mockReturnValue({ rpc: mocks.earningsRpc })
  mocks.earningsRpc.mockResolvedValue({ data: [], error: null })
  mocks.serviceRpc.mockResolvedValue({ data: [], error: null })
})

it("uses the verified owner's Supabase JWT for studio earnings", async () => {
  const result = await getStudioOverviewData("creator-1")

  expect(result.daily).toEqual([])
  expect(mocks.createClient).toHaveBeenCalledWith(
    "https://db.example.test",
    "anon-key",
    expect.objectContaining({
      global: { headers: { Authorization: "Bearer verified-owner-jwt" } },
    }),
  )
  expect(mocks.earningsRpc).toHaveBeenCalledWith("get_daily_user_earnings_v2", {
    p_user_id: "creator-1",
  })
  expect(mocks.serviceRpc).toHaveBeenCalledWith("get_user_profile_demo_list_v2", {
    p_user_id: "creator-1",
  })
})

it("denies a different requested owner before reading private studio data", async () => {
  const result = await getStudioOverviewData("creator-2")

  expect(result).toEqual({
    daily: null,
    bookmarks: { current: null, previous: null },
    topComponents: null,
  })
  expect(mocks.createClient).not.toHaveBeenCalled()
  expect(mocks.earningsRpc).not.toHaveBeenCalled()
  expect(mocks.serviceRpc).not.toHaveBeenCalled()
})

it("keeps the earnings panel unavailable when the JWT template is missing", async () => {
  mocks.auth.mockResolvedValue({
    userId: "creator-1",
    getToken: vi.fn().mockResolvedValue(null),
  })

  const result = await getStudioOverviewData("creator-1")

  expect(result.daily).toBeNull()
  expect(result.bookmarks).toEqual({ current: 0, previous: 0 })
  expect(mocks.earningsRpc).not.toHaveBeenCalled()
})
