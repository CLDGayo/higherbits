import { describe, it, expect, vi, beforeEach } from "vitest"

const mocks = vi.hoisted(() => {
  const state: { row: Record<string, unknown> | null } = { row: null }
  const builder: Record<string, unknown> = {}
  for (const method of ["select", "eq"]) {
    builder[method] = vi.fn(() => builder)
  }
  builder.maybeSingle = vi.fn(async () => ({ data: state.row, error: null }))
  return { state, mockFrom: vi.fn(() => builder) }
})

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: { from: mocks.mockFrom },
}))
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}))
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}))
vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>()
  return { ...actual, redirect: vi.fn(actual.redirect) }
})
vi.mock("@/components/ui/header.client", () => ({ Header: () => null }))
vi.mock("@/components/ui/footer", () => ({ Footer: () => null }))
vi.mock("@/components/seo/json-ld", () => ({ JsonLd: () => null }))
vi.mock("../page.client", () => ({ TagPageContent: () => null }))

import { redirect } from "next/navigation"
import TagPage, { generateMetadata } from "../page"

const props = (tag_slug: string) => ({ params: Promise.resolve({ tag_slug }) })
const NOT_FOUND = { digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404") }

describe("/s/[tag_slug] missing tag", () => {
  beforeEach(() => {
    mocks.state.row = null
    vi.mocked(redirect).mockClear()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("page throws 404 for a nonexistent tag, not a redirect", async () => {
    await expect(TagPage(props("zz-nonexistent"))).rejects.toMatchObject(NOT_FOUND)
    expect(redirect).not.toHaveBeenCalled()
  })

  it("generateMetadata throws 404 for a nonexistent tag, not a redirect", async () => {
    await expect(generateMetadata(props("zz-nonexistent"))).rejects.toMatchObject(NOT_FOUND)
    expect(redirect).not.toHaveBeenCalled()
  })

  it("page renders for an existing tag", async () => {
    mocks.state.row = { id: 1, name: "Buttons", slug: "buttons" }
    const el = await TagPage(props("buttons"))
    expect(el).toBeTruthy()
    expect(redirect).not.toHaveBeenCalled()
  })

  it("page throws 404 for invalid params", async () => {
    await expect(TagPage(props("undefined"))).rejects.toMatchObject(NOT_FOUND)
    expect(redirect).not.toHaveBeenCalled()
  })
})
