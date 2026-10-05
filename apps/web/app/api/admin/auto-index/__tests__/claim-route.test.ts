import { beforeEach, expect, it, vi } from "vitest"

const mock = vi.hoisted(() => ({ auth: vi.fn(), getUser: vi.fn(), rpc: vi.fn(), admin: true, target: { id: "user_creator", manually_added: false } as unknown }))
vi.mock("@clerk/nextjs/server", () => ({ auth: mock.auth, clerkClient: async () => ({ users: { getUser: mock.getUser } }) }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: {
  rpc: mock.rpc,
  from: () => {
    const query = { select: () => query, eq: (_key: string, value: string) => { query.id = value; return query },
      id: "", maybeSingle: async () => ({ data: query.id === "user_admin" ? { is_admin: mock.admin } : mock.target, error: null }) }
    return query
  },
} }))

import { GET } from "@/app/api/admin/auto-index/route"
import { POST } from "@/app/api/admin/auto-index/claim/route"

const claim = (body: unknown) => new Request("http://localhost/api/admin/auto-index/claim", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
})
const valid = { componentId: 42, targetUserId: "user_creator", verificationNote: "Matched repository ownership" }

beforeEach(() => {
  mock.auth.mockReset().mockResolvedValue({ userId: "user_admin" })
  mock.getUser.mockReset().mockResolvedValue({ id: "user_creator" })
  mock.rpc.mockReset().mockResolvedValue({ data: { items: [], total: 0 }, error: null })
  mock.admin = true
  mock.target = { id: "user_creator", manually_added: false }
})

it("claims only after admin and real Clerk target checks", async () => {
  const response = await POST(claim(valid))
  expect(response.status).toBe(200)
  expect(mock.rpc).toHaveBeenCalledWith("claim_auto_index_creator", {
    p_component_id: 42, p_target_user_id: "user_creator", p_admin_user_id: "user_admin",
    p_verification_note: "Matched repository ownership",
  })
})

it("rejects manual targets and absent Clerk accounts before the RPC", async () => {
  mock.target = { id: "user_creator", manually_added: true }
  expect((await POST(claim(valid))).status).toBe(400)
  mock.target = { id: "user_creator", manually_added: false }
  mock.getUser.mockRejectedValue(new Error("not found"))
  expect((await POST(claim(valid))).status).toBe(400)
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("does not expose listing or claim RPC to non-admins", async () => {
  mock.admin = false
  expect((await GET(new Request("http://localhost/api/admin/auto-index"))).status).toBe(403)
  expect((await POST(claim(valid))).status).toBe(403)
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("bounds pagination and maps claim conflicts", async () => {
  expect((await GET(new Request("http://localhost/api/admin/auto-index?limit=101"))).status).toBe(400)
  mock.rpc.mockResolvedValue({ data: null, error: { message: "slug collision" } })
  expect((await POST(claim(valid))).status).toBe(409)
})
