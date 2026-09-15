import { describe, expect, it, vi } from "vitest"
import InterceptedComponentPage from "../(...)[username]/[component_slug]/page"
import InterceptedDemoComponentPage from "../(...)[username]/[component_slug]/[demo_slug]/page"
import { RESERVED_TOP_LEVEL_SLUGS } from "@/lib/constants"

vi.mock("@/lib/queries", () => ({
  getComponentWithDemo: vi.fn(),
  getComponentDemos: vi.fn(),
}))

vi.mock("@/lib/api/server/components", () => ({
  hasUserComponentAccess: vi.fn().mockResolvedValue(false),
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}))

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {},
}))

describe("InterceptedComponentPage modal guard", () => {
  it("contains critical top-level application routes in RESERVED_TOP_LEVEL_SLUGS", () => {
    expect(RESERVED_TOP_LEVEL_SLUGS.has("settings")).toBe(true)
    expect(RESERVED_TOP_LEVEL_SLUGS.has("studio")).toBe(true)
    expect(RESERVED_TOP_LEVEL_SLUGS.has("admin")).toBe(true)
    expect(RESERVED_TOP_LEVEL_SLUGS.has("api")).toBe(true)
    expect(RESERVED_TOP_LEVEL_SLUGS.has("login")).toBe(true)
  })

  it("returns null for reserved top-level slugs without database queries in 2-segment route", async () => {
    const result = await InterceptedComponentPage({
      params: Promise.resolve({
        username: "settings",
        component_slug: "profile",
      }),
    })
    expect(result).toBeNull()
  })

  it("returns null for reserved top-level slugs without database queries in 3-segment route", async () => {
    const result = await InterceptedDemoComponentPage({
      params: Promise.resolve({
        username: "studio",
        component_slug: "gwynsarigumba",
        demo_slug: "components",
      }),
    })
    expect(result).toBeNull()
  })

  it("returns null when component lookup returns error or data is not found", async () => {
    const { getComponentWithDemo } = await import("@/lib/queries")
    vi.mocked(getComponentWithDemo).mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" } as any,
      shouldRedirectToDefault: false,
    } as any)

    const result = await InterceptedComponentPage({
      params: Promise.resolve({
        username: "nonexistentuser",
        component_slug: "nonexistentcomponent",
      }),
    })
    expect(result).toBeNull()
  })
})
