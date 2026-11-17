import { beforeEach, expect, it, vi } from "vitest"

const mock = vi.hoisted(() => ({
  auth: vi.fn(),
  rpc: vi.fn(),
  admin: true,
  active: true,
  archived: false,
  demoExists: true,
  demoError: false,
  demoUpdate: null as Record<string, unknown> | null,
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mock.auth }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    rpc: mock.rpc,
    from: (table: string) => {
      const filters: Record<string, unknown> = {}
      const query: Record<string, any> = {}
      query.select = () => query
      query.eq = (key: string, value: unknown) => { filters[key] = value; return query }
      query.is = () => query
      query.limit = () => query
      query.update = (values: Record<string, unknown>) => { mock.demoUpdate = values; return query }
      query.maybeSingle = async () => {
        if (table === "users") return { data: filters.id === "user_admin" ? { is_admin: mock.admin } : null, error: null }
        if (table === "components" || table === "auto_index_publications") return { data: mock.active ? { id: filters.id ?? filters.component_id } : null, error: null }
        if (table === "auto_index_admin_state") return { data: mock.archived ? { archived_at: "2026-01-01T00:00:00Z" } : null, error: null }
        if (table === "demos") return mock.demoError
          ? { data: null, error: new Error("write failed") }
          : { data: mock.demoExists ? { id: filters.id } : null, error: null }
        return { data: null, error: null }
      }
      return query
    },
  },
}))

import { DELETE, GET, PATCH } from "../route"

const request = (method: string, url = "http://localhost/api/admin/auto-index", body?: unknown) =>
  new Request(url, {
    method,
    ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  })

beforeEach(() => {
  mock.auth.mockReset().mockResolvedValue({ userId: "user_admin" })
  mock.rpc.mockReset().mockResolvedValue({ data: { success: true }, error: null })
  mock.admin = true
  mock.active = true
  mock.archived = false
  mock.demoExists = true
  mock.demoError = false
  mock.demoUpdate = null
})

it("requires an authenticated admin for mutations", async () => {
  mock.auth.mockResolvedValueOnce({ userId: null })
  expect((await PATCH(request("PATCH", undefined, { componentId: 41, status: "posted" }))).status).toBe(401)
  mock.admin = false
  expect((await DELETE(request("DELETE", "http://localhost/api/admin/auto-index?componentId=41"))).status).toBe(403)
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("validates filter and status values before calling the database", async () => {
  expect((await GET(request("GET", "http://localhost/api/admin/auto-index?status=deleted"))).status).toBe(400)
  expect((await PATCH(request("PATCH", undefined, { componentId: 41, status: "deleted" }))).status).toBe(400)
  expect(mock.rpc).not.toHaveBeenCalled()
})

it("forwards the status filter and pagination to the admin-only list RPC", async () => {
  mock.rpc.mockResolvedValueOnce({ data: { items: [], total: 0 }, error: null })
  const response = await GET(request("GET", "http://localhost/api/admin/auto-index?limit=10&offset=20&status=featured"))
  expect(response.status).toBe(200)
  expect(mock.rpc).toHaveBeenCalledWith("list_auto_index_admin_items", {
    p_limit: 10, p_offset: 20, p_status: "featured",
  })
})

it("persists status and visibility changes through the guarded admin RPC", async () => {
  expect((await PATCH(request("PATCH", undefined, { componentId: 41, status: "on_review" }))).status).toBe(200)
  expect(mock.rpc).toHaveBeenLastCalledWith("admin_update_auto_index_state", {
    p_component_id: 41, p_admin_user_id: "user_admin", p_status: "on_review", p_is_public: null, p_archive: false,
  })
  expect((await PATCH(request("PATCH", undefined, { componentId: 41, isPublic: false }))).status).toBe(200)
  expect(mock.rpc).toHaveBeenLastCalledWith("admin_update_auto_index_state", {
    p_component_id: 41, p_admin_user_id: "user_admin", p_status: null, p_is_public: false, p_archive: false,
  })
})

it("updates only an active component's selected demo and rejects database failures", async () => {
  const body = { componentId: 41, demoId: 42, demoName: "Launch", demoSlug: "launch" }
  expect((await PATCH(request("PATCH", undefined, body))).status).toBe(200)
  expect(mock.demoUpdate).toMatchObject({ name: "Launch", demo_slug: "launch" })
  mock.active = false
  expect((await PATCH(request("PATCH", undefined, body))).status).toBe(409)
  mock.active = true
  mock.demoError = true
  expect((await PATCH(request("PATCH", undefined, body))).status).toBe(409)
})

it("deletes from the list by archiving privately without deleting source history", async () => {
  const response = await DELETE(request("DELETE", "http://localhost/api/admin/auto-index?componentId=41"))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ archived: true })
  expect(mock.rpc).toHaveBeenCalledWith("admin_update_auto_index_state", {
    p_component_id: 41, p_admin_user_id: "user_admin", p_status: null, p_is_public: null, p_archive: true,
  })
})
