import { describe, it, expect, vi, beforeEach } from "vitest"
import { isCollectionVisibleTo } from "@/lib/collection-visibility"

const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT")
})
const auth = vi.fn()
let row: Record<string, unknown> | null = null

vi.mock("next/navigation", () => ({ redirect: (...a: unknown[]) => redirect(...(a as [])) }))
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }))
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock("@clerk/nextjs/server", () => ({ auth: () => auth() }))
vi.mock("@/lib/supabase", () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data: row, error: null }),
  }
  return { supabaseWithAdminAccess: { from: () => chain } }
})

import { generateMetadata } from "../page"

const props = { params: Promise.resolve({ collection_slug: "secret" }) }
const base = {
  id: "c1",
  name: "Secret Stash",
  slug: "secret",
  description: null,
  user_id: "owner",
  user_data: { name: "Owner" },
  components_count: [{ count: 1 }],
}

describe("isCollectionVisibleTo", () => {
  it("owner can see own private collection", () => {
    expect(isCollectionVisibleTo({ is_public: false, user_id: "owner" }, "owner")).toBe(true)
  })
  it("anyone can see a public collection", () => {
    expect(isCollectionVisibleTo({ is_public: true, user_id: "owner" }, null)).toBe(true)
    expect(isCollectionVisibleTo({ is_public: true, user_id: "owner" }, "other")).toBe(true)
  })
  it("non-owner and anonymous cannot see a private collection", () => {
    expect(isCollectionVisibleTo({ is_public: false, user_id: "owner" }, "other")).toBe(false)
    expect(isCollectionVisibleTo({ is_public: false, user_id: "owner" }, null)).toBe(false)
  })
  it("fails closed on null/undefined is_public", () => {
    expect(isCollectionVisibleTo({ is_public: null, user_id: "owner" }, "other")).toBe(false)
    expect(isCollectionVisibleTo({ is_public: undefined, user_id: "owner" }, null)).toBe(false)
  })
})

describe("generateMetadata on /c/[slug]", () => {
  beforeEach(() => {
    redirect.mockClear()
    auth.mockReset()
  })

  it("redirects a non-owner from a private collection instead of returning metadata", async () => {
    row = { ...base, is_public: false }
    auth.mockResolvedValue({ userId: "other" })
    await expect(generateMetadata(props)).rejects.toThrow("NEXT_REDIRECT")
    expect(redirect).toHaveBeenCalledWith("/")
  })

  it("redirects an anonymous visitor from a private collection", async () => {
    row = { ...base, is_public: false }
    auth.mockResolvedValue({ userId: null })
    await expect(generateMetadata(props)).rejects.toThrow("NEXT_REDIRECT")
  })

  it("returns metadata for the owner of a private collection", async () => {
    row = { ...base, is_public: false }
    auth.mockResolvedValue({ userId: "owner" })
    const meta = await generateMetadata(props)
    expect(meta.title).toBe("Secret Stash")
    expect(redirect).not.toHaveBeenCalled()
  })

  it("returns metadata for anyone on a public collection", async () => {
    row = { ...base, is_public: true }
    auth.mockResolvedValue({ userId: null })
    const meta = await generateMetadata(props)
    expect(meta.title).toBe("Secret Stash")
  })
})
