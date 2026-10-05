import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  from: vi.fn(),
  upload: vi.fn(),
  componentInsert: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("@/lib/r2", () => ({ uploadToR2: mocks.upload }))
vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: { from: mocks.from },
}))

import { POST } from "../route"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ userId: "creator" })
  mocks.from.mockImplementation((table: string) => {
    if (table === "users") {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        single: vi.fn(async () => ({ data: { username: "creator" }, error: null })),
      }
      return query
    }
    return { insert: mocks.componentInsert }
  })
})

it("U-GHL-02: rejects forged auto-index imports before service writes or source uploads", async () => {
  const response = await POST(new Request("http://localhost/api/components/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ registry: "auto-index", is_public: true }),
  }))

  expect(response.status).toBe(403)
  expect(await response.json()).toEqual({ error: "auto_index_requires_official_finalizer" })
  expect(mocks.upload).not.toHaveBeenCalled()
  expect(mocks.componentInsert).not.toHaveBeenCalled()
  expect(mocks.from.mock.calls.map(([table]) => table)).toEqual(["users"])
})
