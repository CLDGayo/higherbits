import { afterEach, describe, expect, it, vi } from "vitest"

const { prisma, supabase } = vi.hoisted(() => ({
  prisma: { studio_artifacts: { count: vi.fn() } },
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/prisma", () => ({ default: prisma }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: supabase }))

const rejectedQuery = {
  select: () => rejectedQuery,
  eq: () => rejectedQuery,
  is: () => rejectedQuery,
  then: (
    _resolve: (value: never) => unknown,
    reject: (error: Error) => unknown,
  ) =>
    Promise.reject(new Error("temporary database outage")).then(
      _resolve,
      reject,
    ),
}

describe("getStudioNavCounts resilience", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("keeps transient badge-query failures from breaking every studio section", async () => {
    supabase.from.mockReturnValue(rejectedQuery)
    supabase.rpc.mockReturnValue(rejectedQuery)
    prisma.studio_artifacts.count.mockRejectedValue(
      new Error("temporary database outage"),
    )
    vi.spyOn(console, "error").mockImplementation(() => {})

    const { getStudioNavCounts } = await import("../studio-counts")

    await expect(getStudioNavCounts("user-1")).resolves.toEqual({
      components: null,
      libraries: null,
      templates: null,
      themes: null,
      ascii: null,
      gradients: null,
      shaders: null,
    })
  })
})
