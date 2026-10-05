import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), row: { data: null as any, error: null as any }, filters: [] as unknown[] }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: { from: () => {
  const query = { select: () => query, eq: (...args: unknown[]) => { mocks.filters.push(args); return query }, maybeSingle: async () => mocks.row }
  return query
} } }))
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
import { copyIdentity, persistedCopyTier } from "../api/server/copy-identity"
beforeEach(() => { mocks.auth.mockResolvedValue({ userId: null }); mocks.row = { data: null, error: null }; mocks.filters = [] })
const request = (headers: Record<string,string> = {}) => new Request("http://localhost:56331/api/component-source", { method: "POST", headers })
it("denies missing identity and middleware internal secret as identity", async () => {
  await expect(copyIdentity(request())).rejects.toMatchObject({ status: 401 })
  await expect(copyIdentity(request({ "x-internal-token": "synthetic" }))).rejects.toMatchObject({ status: 401 })
})
it("binds active exact API key to canonical user, independent of key plan", async () => {
  mocks.row.data = { user_id: "canonical-user", users: { id: "canonical-user" } }
  expect(await copyIdentity(request({ authorization: "Bearer synthetic" }))).toBe("canonical-user")
  expect(mocks.filters).toEqual([["key", "synthetic"], ["is_active", true]])
})
it("denies inactive/unbound keys and distinguishes storage failure", async () => {
  for (const data of [null, { user_id: null }]) { mocks.row.data = data; await expect(copyIdentity(request({ "x-api-key": "synthetic" }))).rejects.toMatchObject({ status: 401 }) }
  mocks.row.error = { message: "private" }
  await expect(copyIdentity(request({ authorization: "Bearer synthetic" }))).rejects.toMatchObject({ status: 503 })
})
it("rejects identity/header conflicts and cross-origin cookie mutation", async () => {
  mocks.auth.mockResolvedValue({ userId: "session-user" }); mocks.row.data = { user_id: "other" }
  await expect(copyIdentity(request({ authorization: "Bearer a", "x-api-key": "b" }))).rejects.toMatchObject({ status: 401 })
  await expect(copyIdentity(request({ authorization: "Bearer a" }))).rejects.toMatchObject({ status: 401 })
  await expect(copyIdentity(request({ origin: "https://evil.invalid" }))).rejects.toMatchObject({ status: 403 })
  expect(await copyIdentity(request({ origin: "http://localhost:56331" }))).toBe("session-user")
})
it("G6-PRO: preserves persisted active Pro across provider markers and stale period metadata", () => {
  for (const extra of [{}, { meta: { stripe_customer_id: "synthetic", period_end: 1 } }, { lemon_squeezy_subscription_id: "synthetic" }]) {
    expect(persistedCopyTier([{ status: "active", plans: { type: "pro" }, ...extra }])).toBe(true)
  }
  expect(persistedCopyTier([])).toBe(false)
  expect(persistedCopyTier([{ status: "inactive", plans: { type: "pro" } }])).toBe(false)
  expect(persistedCopyTier([{ status: "active", plans: { type: "free" } }])).toBe(false)
})
it("G6-PRO: malformed and duplicate entitlements fail closed", () => {
  for (const rows of [[{}, {}], [{ status: "active", plans: null }], [{ status: "past_due", plans: { type: "pro" } }]]) expect(() => persistedCopyTier(rows)).toThrow()
})
