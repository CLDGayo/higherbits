import { expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }))
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: async () => ({ users: { getUser: mocks.getUser } }), auth: vi.fn() }))
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/queries", () => ({ authUsername: vi.fn(), getUserData: vi.fn() }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: { from: mocks.from } }))

import { syncClerkUserToSupabase } from "@/lib/user"

it("keeps a new Clerk user when a creator's display handle is already claimed", async () => {
  mocks.getUser.mockResolvedValue({ id: "user_clerk_123", username: "8starlabs", firstName: "New", lastName: "User", emailAddresses: [{ emailAddress: "new@example.com" }], imageUrl: "" })
  const writes: any[] = []
  mocks.from.mockImplementation(() => {
    const query: any = {
      select: () => query,
      eq: () => {
        query.maybeSingle = async () => ({ data: null })
        return query
      },
      upsert: (value: any) => {
        writes.push({ ...value })
        query.single = async () => writes.length === 1
          ? { data: null, error: { code: "23505" } }
          : { data: value, error: null }
        return query
      },
    }
    return query
  })

  const user = await syncClerkUserToSupabase("user_clerk_123")
  expect(writes).toHaveLength(2)
  expect(writes[0].display_username).toBe("8starlabs")
  expect(writes[1]).toMatchObject({ username: "user_clerk_123", display_username: "user_clerk_123" })
  expect(user?.id).toBe("user_clerk_123")
})
