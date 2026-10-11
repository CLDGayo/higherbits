import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`)
  }),
  checkIsAdmin: vi.fn(),
  from: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/lib/admin", () => ({ checkIsAdmin: mocks.checkIsAdmin }))
vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: { from: mocks.from },
}))
vi.mock("@/components/ui/footer", () => ({ Footer: () => null }))
vi.mock("@/components/ui/header.client", () => ({ Header: () => null }))
vi.mock("./console/page.client", () => ({ ConsoleClient: () => null }))
vi.mock("./onboarding/page.client", () => ({ OnboardingClient: () => null }))

import MagicLayout from "../layout"
import ConsolePage from "../console/page"
import OnboardingPage from "../onboarding/page"

function queryResult(data: unknown) {
  const query: Record<string, any> = {}
  query.select = vi.fn(() => query)
  query.eq = vi.fn(() => query)
  query.maybeSingle = vi.fn(async () => ({ data, error: null }))
  query.single = vi.fn(async () => ({ data, error: null }))
  return query
}

describe("HigherBits MCP route access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.from.mockReset()
  })

  it("keeps the product layout public", async () => {
    const children = { marker: "public landing" }
    await expect(MagicLayout({ children } as any)).resolves.toBeDefined()
    expect(mocks.auth).not.toHaveBeenCalled()
    expect(mocks.checkIsAdmin).not.toHaveBeenCalled()
  })

  it("returns signed-out console visitors to sign-in with the console return path", async () => {
    mocks.auth.mockResolvedValue({ userId: null })
    await expect(ConsolePage()).rejects.toThrow(
      "REDIRECT:/sign-in?redirect_url=%2Fmagic%2Fconsole",
    )
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it("limits console queries to the authenticated account", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-own" })
    const plan = queryResult(null)
    const usage = queryResult({ usage: 3, limit: 100 })
    const apiKey = queryResult({
      id: "key-own",
      key: "own-key",
      user_id: "user-own",
      plan: "free",
      requests_limit: 100,
      requests_count: 0,
      created_at: new Date(0).toISOString(),
    })
    mocks.from.mockImplementation((table: string) => {
      if (table === "users_to_plans") return plan
      if (table === "usages") return usage
      if (table === "api_keys") return apiKey
      throw new Error(`Unexpected table ${table}`)
    })

    await ConsolePage()

    for (const query of [plan, usage, apiKey]) {
      expect(query.eq).toHaveBeenCalledWith("user_id", "user-own")
    }
  })

  it("keeps onboarding admin-only and fetches no account data for other users", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-nonadmin" })
    mocks.checkIsAdmin.mockResolvedValue({ isAdmin: false })

    await expect(OnboardingPage()).rejects.toThrow("REDIRECT:/magic/console")
    expect(mocks.checkIsAdmin).toHaveBeenCalledWith("user-nonadmin")
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
