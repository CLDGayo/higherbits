import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Secret-shaped fixtures. None of these may ever appear in a telemetry payload.
const FAKE_CSB_API_KEY = "csb_test_apikey_MUSTNOTLEAK"
const FAKE_BEARER = "Bearer sk_live_MUSTNOTLEAK"

const rpcMock = vi.fn()
const insertSingleMock = vi.fn()
/** Result of the reuse-before-create lookup, and the filters it was built with. */
const reuseLookup = {
  result: { data: [] as Array<Record<string, unknown>>, error: null as unknown },
  filters: {} as Record<string, unknown>,
  called: 0,
}

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "user_test" })),
}))

vi.mock("@/lib/admin", () => ({
  checkIsAdmin: vi.fn(async () => ({ isAdmin: false })),
}))

// Sentinel stand-in for VMTier.Pico. Identity-compared in the credit-burn
// options assertion below, so the test fails if the route stops forwarding it.
const { FAKE_VM_TIER } = vi.hoisted(() => ({
  FAKE_VM_TIER: { name: "Pico", cpuCores: 1, memoryGiB: 2 },
}))

vi.mock("@/lib/codesandbox-sdk", () => ({
  codesandboxSdk: {
    sandbox: {
      create: vi.fn(),
    },
  },
  DEFAULT_HIBERNATION_TIMEOUT: 60,
  DEFAULT_VM_TIER: FAKE_VM_TIER,
}))

vi.mock("@/lib/sandbox-templates", () => ({
  DEFAULT_COMPONENT_TSX: "component",
  DEFAULT_DEMO_TSX: "demo",
  DEFAULT_INDEX_CSS: "css",
  DEFAULT_HIBERNATION_TIMEOUT: 60,
  DEFAULT_TEMPLATE: "react",
  TEMPLATES: { react: "react-template-id" },
}))

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: () => ({
      insert: () => ({
        select: () => ({ single: insertSingleMock }),
      }),
      // Reuse-before-create lookup. Records the filters it was built with so
      // the tests can assert the query is scoped correctly, not merely that
      // some query ran.
      select: () => {
        reuseLookup.called++
        const builder = {
          eq(field: string, value: unknown) {
            reuseLookup.filters[field] = value
            return builder
          },
          is(field: string, value: unknown) {
            reuseLookup.filters[`is:${field}`] = value
            return builder
          },
          gte(field: string, value: unknown) {
            reuseLookup.filters[`gte:${field}`] = value
            return builder
          },
          order() {
            return builder
          },
          limit() {
            return Promise.resolve(reuseLookup.result)
          },
        }
        return builder
      },
    }),
  },
}))

vi.mock("short-uuid", () => ({
  default: () => ({
    fromUUID: () => "shortId123",
    toUUID: (v: string) => v,
  }),
}))

import { POST } from "../route"
import { codesandboxSdk } from "@/lib/codesandbox-sdk"

const sdk = codesandboxSdk as unknown as {
  sandbox: { create: ReturnType<typeof vi.fn> }
}

function makeRequest() {
  return {
    body: null,
    json: async () => ({}),
  } as unknown as Parameters<typeof POST>[0]
}

function okSandbox() {
  return {
    id: "csb-new-1",
    fs: {
      writeTextFile: vi.fn(async () => undefined),
      mkdir: vi.fn(async () => undefined),
    },
  }
}

describe("POST /api/sandbox/new — Phase 1 telemetry", () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    rpcMock.mockResolvedValue({ data: true, error: null })
    reuseLookup.result = { data: [], error: null }
    reuseLookup.filters = {}
    reuseLookup.called = 0
    insertSingleMock.mockResolvedValue({
      data: { id: "00000000-0000-0000-0000-000000000001" },
      error: null,
    })
    sdk.sandbox.create.mockResolvedValue(okSandbox())
  })

  afterEach(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  function telemetryCalls(spy: { mock: { calls: unknown[][] } }) {
    return spy.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].startsWith("[sandbox-telemetry]"),
    )
  }

  /** Full serialization of every recorded telemetry call argument (E3). */
  function expectNoSecrets(calls: unknown[][]) {
    const serialized = JSON.stringify(calls)
    for (const forbidden of [
      FAKE_CSB_API_KEY,
      FAKE_BEARER,
      "CSB_API_KEY",
      "pitcher_token",
      "reconnect_token",
      "authorization",
      "Authorization",
      "sk_live",
    ]) {
      expect(serialized).not.toContain(forbidden)
    }
  }

  function expectErrorTelemetryShape(calls: unknown[][]) {
    expect(calls).toHaveLength(1)
    const payload = calls[0]![1] as Record<string, unknown>
    expect(payload.outcome).toBe("error")
    expect(typeof payload.timing_ms).toBe("number")
    expect(Object.keys(payload).sort()).toEqual([
      "outcome",
      "sandboxId",
      "timing_ms",
    ])
    return payload
  }

  // ---- E1 site 1/3: inner catch around sandbox.create() (502) ----
  it("logs error telemetry when the SDK create() rejects (502 path)", async () => {
    sdk.sandbox.create.mockRejectedValue(
      new Error(`sdk down ${FAKE_CSB_API_KEY}`),
    )

    const response = await POST(makeRequest())
    expect(response.status).toBe(502)

    const calls = telemetryCalls(errorSpy)
    const payload = expectErrorTelemetryShape(calls)
    // No sandbox exists yet at this site.
    expect(payload.sandboxId).toBeUndefined()
    expectNoSecrets(calls)
  })

  // ---- E1 site 2/3: dbError early-return (500) ----
  it("logs error telemetry when the Supabase insert fails (dbError path)", async () => {
    insertSingleMock.mockResolvedValue({
      data: null,
      error: { message: `db exploded ${FAKE_BEARER}` },
    })

    const response = await POST(makeRequest())
    expect(response.status).toBe(500)

    const calls = telemetryCalls(errorSpy)
    const payload = expectErrorTelemetryShape(calls)
    expect(payload.sandboxId).toBe("csb-new-1")
    expectNoSecrets(calls)
  })

  // ---- E1 site 3/3: top-level catch (500) ----
  it("logs error telemetry from the top-level catch on an unexpected failure", async () => {
    rpcMock.mockRejectedValue(new Error(`rpc blew up ${FAKE_CSB_API_KEY}`))

    const response = await POST(makeRequest())
    expect(response.status).toBe(500)

    const calls = telemetryCalls(errorSpy)
    const payload = expectErrorTelemetryShape(calls)
    expect(payload.sandboxId).toBeUndefined()
    expectNoSecrets(calls)
  })

  // ---- E1 negative: pre-flight 401 / 429 are NOT telemetry sites ----
  it("does NOT log sandbox error telemetry on the pre-flight 429 rate-limit return", async () => {
    rpcMock.mockResolvedValue({ data: false, error: null })

    const response = await POST(makeRequest())
    expect(response.status).toBe(429)

    expect(telemetryCalls(errorSpy)).toHaveLength(0)
    expect(telemetryCalls(logSpy)).toHaveLength(0)
  })

  it("does NOT log sandbox error telemetry on the pre-flight 401 unauthorized return", async () => {
    const { auth } = await import("@clerk/nextjs/server")
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)

    const response = await POST(makeRequest())
    expect(response.status).toBe(401)

    expect(telemetryCalls(errorSpy)).toHaveLength(0)
    expect(telemetryCalls(logSpy)).toHaveLength(0)
  })

  // ---- A3: new/route.ts emits no bootup_type telemetry ----
  it("emits no bootup_type telemetry on the success path (A3)", async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)

    expect(telemetryCalls(logSpy)).toHaveLength(0)
    expect(telemetryCalls(errorSpy)).toHaveLength(0)
  })
})

describe("POST /api/sandbox/new — credit-burn guards", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    rpcMock.mockResolvedValue({ data: true, error: null })
    reuseLookup.result = { data: [], error: null }
    reuseLookup.filters = {}
    reuseLookup.called = 0
    insertSingleMock.mockResolvedValue({
      data: { id: "00000000-0000-0000-0000-000000000001" },
      error: null,
    })
    sdk.sandbox.create.mockResolvedValue(okSandbox())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("passes vmTier, the lowered hibernation timeout, and disabled automatic wakeup to sandbox.create()", async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)

    expect(sdk.sandbox.create).toHaveBeenCalledTimes(1)
    const opts = sdk.sandbox.create.mock.calls[0]![0] as Record<string, unknown>
    expect(opts.vmTier).toBe(FAKE_VM_TIER)
    expect(opts.hibernationTimeoutSeconds).toBe(60)
    // Must be the explicit object, never omitted: the SDK's own default for
    // http is TRUE, which silently re-wakes (and re-bills) a hibernated VM on
    // any stray HTTP touch. Omission is the exact regression this asserts on.
    expect(opts.automaticWakeupConfig).toEqual({ http: false, websocket: false })
  })
})

describe("POST /api/sandbox/new — reuse-before-create", () => {
  const originalWindow = process.env.CSB_SANDBOX_REUSE_WINDOW_SECONDS

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    delete process.env.CSB_SANDBOX_REUSE_WINDOW_SECONDS
    rpcMock.mockResolvedValue({ data: true, error: null })
    insertSingleMock.mockResolvedValue({
      data: { id: "00000000-0000-0000-0000-000000000001" },
      error: null,
    })
    sdk.sandbox.create.mockResolvedValue(okSandbox())
    reuseLookup.result = { data: [], error: null }
    reuseLookup.filters = {}
    reuseLookup.called = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalWindow === undefined)
      delete process.env.CSB_SANDBOX_REUSE_WINDOW_SECONDS
    else process.env.CSB_SANDBOX_REUSE_WINDOW_SECONDS = originalWindow
  })

  // P22-new-reuse
  it("returns the existing shortSandboxId and creates NO new VM when a recent unbound row exists", async () => {
    reuseLookup.result = {
      data: [
        {
          id: "00000000-0000-0000-0000-0000000000aa",
          codesandbox_id: "csb-warm",
        },
      ],
      error: null,
    }

    const response = await POST(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.shortSandboxId).toBe("shortId123")
    expect(body.reused).toBe(true)
    // The whole point: no billed VM was created.
    expect(sdk.sandbox.create).not.toHaveBeenCalled()
  })

  it("scopes the reuse lookup to the caller's own unbound rows inside the window", async () => {
    reuseLookup.result = {
      data: [
        {
          id: "00000000-0000-0000-0000-0000000000aa",
          codesandbox_id: "csb-warm",
        },
      ],
      error: null,
    }

    await POST(makeRequest())

    expect(reuseLookup.called).toBe(1)
    expect(reuseLookup.filters.user_id).toBe("user_test")
    // Never hand back a sandbox already bound to a published component.
    expect(reuseLookup.filters["is:component_id"]).toBeNull()
    expect(typeof reuseLookup.filters["gte:updated_at"]).toBe("string")
  })

  // P23-new-nonregression
  it("still creates a new VM when no recent row exists", async () => {
    reuseLookup.result = { data: [], error: null }

    const response = await POST(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.shortSandboxId).toBe("shortId123")
    expect(body.reused).toBeUndefined()
    expect(sdk.sandbox.create).toHaveBeenCalledTimes(1)
  })

  it("does not reuse a row whose codesandbox_id is missing", async () => {
    reuseLookup.result = {
      data: [
        { id: "00000000-0000-0000-0000-0000000000aa", codesandbox_id: null },
      ],
      error: null,
    }

    await POST(makeRequest())

    expect(sdk.sandbox.create).toHaveBeenCalledTimes(1)
  })

  it("falls through to create when the reuse lookup errors", async () => {
    reuseLookup.result = { data: null as never, error: { message: "boom" } }

    const response = await POST(makeRequest())

    expect(response.status).toBe(200)
    expect(sdk.sandbox.create).toHaveBeenCalledTimes(1)
  })

  it("skips the lookup entirely when CSB_SANDBOX_REUSE_WINDOW_SECONDS=0", async () => {
    process.env.CSB_SANDBOX_REUSE_WINDOW_SECONDS = "0"

    await POST(makeRequest())

    expect(reuseLookup.called).toBe(0)
    expect(sdk.sandbox.create).toHaveBeenCalledTimes(1)
  })

  it("rejects before the reuse lookup when rate-limited", async () => {
    rpcMock.mockResolvedValue({ data: false, error: null })

    const response = await POST(makeRequest())

    expect(response.status).toBe(429)
    expect(reuseLookup.called).toBe(0)
    expect(sdk.sandbox.create).not.toHaveBeenCalled()
  })
})
