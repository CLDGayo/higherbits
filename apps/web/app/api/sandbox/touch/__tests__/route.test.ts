import { beforeEach, describe, expect, it, vi } from "vitest"
import ShortUUID from "short-uuid"

// Two real rows owned by two different real users. P30 (the cross-user case)
// needs BOTH to exist so the rejection can only come from the ownership
// filter — never from a failed id resolution or a missing row.
const UUID_OWNER = "11111111-1111-4111-8111-111111111111"
const UUID_OTHER = "22222222-2222-4222-8222-222222222222"
const OWNER_ID = "user_owner"
const OTHER_ID = "user_other"

const ROWS: Array<Record<string, string>> = [
  { id: UUID_OWNER, user_id: OWNER_ID },
  { id: UUID_OTHER, user_id: OTHER_ID },
]

const mocks = vi.hoisted(() => ({
  authMock: vi.fn(),
  isAdminMock: vi.fn(),
  updateCalls: [] as Array<{ payload: Record<string, unknown>; filters: Record<string, string> }>,
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.authMock }))
vi.mock("@/lib/admin", () => ({ checkIsAdmin: mocks.isAdminMock }))

// Local override of the global setup.ts supabase stub. This fake honours the
// eq() filters for real, so dropping .eq("user_id", ...) in the route changes
// the result the test sees — which is what makes P30 non-vacuous.
vi.mock("@/lib/supabase", () => {
  function selectBuilder(filters: Record<string, string>) {
    return {
      eq(field: string, value: string) {
        return selectBuilder({ ...filters, [field]: value })
      },
      async single() {
        const row = ROWS.find((r) =>
          Object.entries(filters).every(([k, v]) => r[k] === v),
        )
        return row
          ? { data: { id: row.id }, error: null }
          : { data: null, error: { message: "Not found" } }
      },
    }
  }
  return {
    supabaseWithAdminAccess: {
      from: () => ({
        select: () => selectBuilder({}),
        update: (payload: Record<string, unknown>) => {
          const record = { payload, filters: {} as Record<string, string> }
          const builder = {
            eq(field: string, value: string) {
              record.filters[field] = value
              return builder
            },
            then(resolve: (v: unknown) => unknown) {
              mocks.updateCalls.push(record)
              return Promise.resolve({ error: null }).then(resolve)
            },
          }
          return builder
        },
      }),
    }
  }
})

import { POST } from "../route"

const SHORT_OWNER = ShortUUID().fromUUID(UUID_OWNER)
const SHORT_OTHER = ShortUUID().fromUUID(UUID_OTHER)

function makeRequest(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0]
}

function signedInAs(userId: string | null, isAdmin = false) {
  mocks.authMock.mockResolvedValue({ userId })
  mocks.isAdminMock.mockResolvedValue({ isAdmin })
}

describe("POST /api/sandbox/touch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.updateCalls.length = 0
    signedInAs(OWNER_ID)
  })

  it("rejects an unauthenticated caller with 401 and writes nothing", async () => {
    signedInAs(null)

    const res = await POST(makeRequest({ shortSandboxId: SHORT_OWNER }))

    expect(res.status).toBe(401)
    expect(mocks.updateCalls).toHaveLength(0)
  })

  it("returns 400 on a malformed JSON body", async () => {
    const res = await POST({
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input")
      },
    } as unknown as Parameters<typeof POST>[0])

    expect(res.status).toBe(400)
    expect(mocks.updateCalls).toHaveLength(0)
  })

  it("returns 400 when shortSandboxId is missing", async () => {
    const res = await POST(makeRequest({}))

    expect(res.status).toBe(400)
    expect(mocks.updateCalls).toHaveLength(0)
  })

  it("writes sandboxes.updated_at for a sandbox the caller owns (P29)", async () => {
    const before = Date.now()

    const res = await POST(makeRequest({ shortSandboxId: SHORT_OWNER }))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
    expect(mocks.updateCalls).toHaveLength(1)
    const call = mocks.updateCalls[0]!
    expect(call.filters.id).toBe(UUID_OWNER)
    const written = Date.parse(String(call.payload.updated_at))
    expect(Number.isNaN(written)).toBe(false)
    expect(written).toBeGreaterThanOrEqual(before - 1000)
  })

  it("rejects a nonexistent sandbox id with 404 and writes nothing", async () => {
    const missing = ShortUUID().fromUUID("33333333-3333-4333-8333-333333333333")

    const res = await POST(makeRequest({ shortSandboxId: missing }))

    expect(res.status).toBe(404)
    expect(mocks.updateCalls).toHaveLength(0)
  })

  // P30-touch-ownership (Gap A's closing proof).
  //
  // The supplied id is REAL and RESOLVES to a REAL row — it just belongs to
  // someone else. So this cannot pass because id resolution failed or the row
  // was missing; the only thing that can reject it is the ownership filter.
  // Drop .eq("user_id", userId) from the route and this test goes red.
  it("rejects a different authenticated user supplying a real, valid id owned by someone else (P30)", async () => {
    signedInAs(OTHER_ID)

    const res = await POST(makeRequest({ shortSandboxId: SHORT_OWNER }))

    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toEqual({
      error: "Sandbox not found or access denied",
    })
    expect(mocks.updateCalls).toHaveLength(0)
  })

  it("lets each user touch their own sandbox — the ownership filter is not blanket-deny", async () => {
    signedInAs(OTHER_ID)

    const res = await POST(makeRequest({ shortSandboxId: SHORT_OTHER }))

    expect(res.status).toBe(200)
    expect(mocks.updateCalls).toHaveLength(1)
    expect(mocks.updateCalls[0]!.filters.id).toBe(UUID_OTHER)
  })
})
