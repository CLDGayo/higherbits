import { describe, expect, it, vi, beforeEach } from "vitest"

const fromMock = vi.fn()

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    from: (table: string) => fromMock(table),
  },
}))

import { GET } from "../route"

describe("GET /api/tags/counts", () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it("aggregates demo_tags and component_tags counts accurately", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "demo_tags") {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { tags: { slug: "background" } },
              { tags: { slug: "background" } },
              { tags: { slug: "hero" } },
            ],
            error: null,
          }),
        }
      }
      if (table === "component_tags") {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { tags: { slug: "hero" } },
              { tags: { slug: "animation" } },
            ],
            error: null,
          }),
        }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    })

    const response = await GET()
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.counts).toEqual({
      background: 2,
      hero: 2,
      animation: 1,
    })
    expect(response.headers.get("Cache-Control")).toContain("public")
  })

  it("handles database errors gracefully and returns 500", async () => {
    fromMock.mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: new Error("Database failure"),
      }),
    }))

    const response = await GET()
    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.counts).toEqual({})
  })
})
