import { describe, expect, it, vi, beforeEach } from "vitest"

const rpc = vi.fn()

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    rpc: (...args: unknown[]) => rpc(...args),
  },
}))

import { GET } from "../route"

describe("GET /api/tags/counts", () => {
  beforeEach(() => {
    rpc.mockReset()
  })

  it("returns public demo counts with the existing cache contract", async () => {
    rpc.mockResolvedValue({ data: [
      { slug: "background", demo_count: 2 },
      { slug: "hero", demo_count: 1 },
    ], error: null })

    const response = await GET()
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(rpc).toHaveBeenCalledWith("get_public_demo_tag_counts")
    expect(json.counts).toEqual({ background: 2, hero: 1 })
    expect(response.headers.get("Cache-Control")).toContain("public")
  })

  it("handles database errors gracefully and returns 500", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("Database failure") })

    const response = await GET()
    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.counts).toEqual({})
  })
})
