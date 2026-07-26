import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "../route"

const mocks = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockInvoke: vi.fn(),
}))

// Local override: the global `__tests__/setup.ts` mock only stubs `.from()`,
// not `.rpc` / `.functions.invoke`, which this route depends on.
vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    rpc: mocks.mockRpc,
    functions: { invoke: mocks.mockInvoke },
  },
}))

const { mockRpc, mockInvoke } = mocks

const SECRET = "test-cron-secret"

function makeRequest(opts: { auth?: string; query?: string } = {}) {
  const { auth = `Bearer ${SECRET}`, query = "" } = opts
  return new NextRequest(
    `http://localhost/api/cron/gen-usage-embeddings${query}`,
    { headers: auth ? { Authorization: auth } : {} },
  )
}

function makeItems(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    item_type: "component",
    item_id: i + 1,
  }))
}

describe("GET /api/cron/gen-usage-embeddings", () => {
  const originalSecret = process.env.CRON_SECRET
  const originalCap = process.env.EMBEDDING_CRON_BATCH_CAP

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = SECRET
    delete process.env.EMBEDDING_CRON_BATCH_CAP
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null })
  })

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = originalSecret
    if (originalCap === undefined) delete process.env.EMBEDDING_CRON_BATCH_CAP
    else process.env.EMBEDDING_CRON_BATCH_CAP = originalCap
  })

  it("returns 401 when the Authorization header does not match CRON_SECRET", async () => {
    const res = await GET(makeRequest({ auth: "Bearer wrong-secret" }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" })
    // Auth must fail before any DB or edge-function work happens.
    expect(mockRpc).not.toHaveBeenCalled()
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("calls the RPC then functions.invoke once per missing item with the correct body shape", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { item_type: "component", item_id: 11 },
        { item_type: "demo", item_id: 22 },
      ],
      error: null,
    })

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith("get_missing_usage_embedding_items")

    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(mockInvoke).toHaveBeenNthCalledWith(1, "generate-embeddings", {
      body: { type: "component", id: 11 },
    })
    expect(mockInvoke).toHaveBeenNthCalledWith(2, "generate-embeddings", {
      body: { type: "demo", id: 22 },
    })

    await expect(res.json()).resolves.toEqual([
      { item_type: "component", item_id: 11 },
      { item_type: "demo", item_id: 22 },
    ])
  })

  it("returns 500 without invoking the edge function when the RPC errors", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    })

    const res = await GET(makeRequest())

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({
      error: "Failed to fetch missing items",
      details: "boom",
    })
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("short-circuits before the loop and never calls functions.invoke when dryRun=true", async () => {
    mockRpc.mockResolvedValueOnce({ data: makeItems(3), error: null })

    const res = await GET(makeRequest({ query: "?dryRun=true" }))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      dryRun: true,
      wouldProcess: 3,
      totalMissing: 3,
      cap: 20,
      items: makeItems(3),
    })
    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("still processes items normally when dryRun is absent or not exactly 'true'", async () => {
    mockRpc.mockResolvedValueOnce({ data: makeItems(2), error: null })

    const res = await GET(makeRequest({ query: "?dryRun=false" }))

    expect(res.status).toBe(200)
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })

  it("processes at most EMBEDDING_CRON_BATCH_CAP items when the cap is set", async () => {
    process.env.EMBEDDING_CRON_BATCH_CAP = "3"
    mockRpc.mockResolvedValueOnce({ data: makeItems(10), error: null })

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    expect(mockInvoke).toHaveBeenCalledTimes(3)
    await expect(res.json()).resolves.toHaveLength(3)
  })

  it("falls back to the default cap of 20 when EMBEDDING_CRON_BATCH_CAP is unset", async () => {
    mockRpc.mockResolvedValueOnce({ data: makeItems(25), error: null })

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    expect(mockInvoke).toHaveBeenCalledTimes(20)
    await expect(res.json()).resolves.toHaveLength(20)
  })

  it("falls back to the default cap when EMBEDDING_CRON_BATCH_CAP is not a positive integer", async () => {
    process.env.EMBEDDING_CRON_BATCH_CAP = "not-a-number"
    mockRpc.mockResolvedValueOnce({ data: makeItems(25), error: null })

    await GET(makeRequest())

    expect(mockInvoke).toHaveBeenCalledTimes(20)
  })

  it("reports the capped count in the dry-run response", async () => {
    process.env.EMBEDDING_CRON_BATCH_CAP = "2"
    mockRpc.mockResolvedValueOnce({ data: makeItems(9), error: null })

    const res = await GET(makeRequest({ query: "?dryRun=true" }))
    const body = await res.json()

    expect(body.wouldProcess).toBe(2)
    expect(body.items).toHaveLength(2)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("reports uncapped backlog depth alongside the capped count in dry-run", async () => {
    process.env.EMBEDDING_CRON_BATCH_CAP = "2"
    mockRpc.mockResolvedValueOnce({ data: makeItems(9), error: null })

    const res = await GET(makeRequest({ query: "?dryRun=true" }))
    const body = await res.json()

    // wouldProcess saturates at the cap; totalMissing exposes real backlog depth.
    expect(body.wouldProcess).toBe(2)
    expect(body.totalMissing).toBe(9)
    expect(body.cap).toBe(2)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("never echoes CRON_SECRET in any response body", async () => {
    mockRpc.mockResolvedValueOnce({ data: makeItems(1), error: null })

    const res = await GET(makeRequest({ query: "?dryRun=true" }))
    const text = JSON.stringify(await res.json())

    expect(text).not.toContain(SECRET)
  })
})
