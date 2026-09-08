import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Secret-shaped fixtures. None of these may ever appear in a telemetry payload.
const FAKE_CSB_API_KEY = "csb_test_apikey_MUSTNOTLEAK"
const FAKE_BEARER = "Bearer sk_live_MUSTNOTLEAK"

const rpcMock = vi.fn()
const insertSingleMock = vi.fn()

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "user_test" })),
}))

vi.mock("@/lib/admin", () => ({
  checkIsAdmin: vi.fn(async () => ({ isAdmin: false })),
}))

vi.mock("@/lib/codesandbox-sdk", () => ({
  codesandboxSdk: {
    sandbox: {
      create: vi.fn(),
    },
  },
  DEFAULT_HIBERNATION_TIMEOUT: 300,
}))

vi.mock("@/lib/sandbox-templates", () => ({
  DEFAULT_COMPONENT_TSX: "component",
  DEFAULT_DEMO_TSX: "demo",
  DEFAULT_INDEX_CSS: "css",
  DEFAULT_HIBERNATION_TIMEOUT: 300,
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
    fs: { writeTextFile: vi.fn(async () => undefined) },
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
