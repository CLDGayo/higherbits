import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Secret-shaped fixtures. None of these may ever appear in a telemetry payload.
const FAKE_CSB_API_KEY = "csb_test_apikey_MUSTNOTLEAK"
const FAKE_PITCHER_TOKEN = "pitcher_token_MUSTNOTLEAK"
const FAKE_PREVIEW_TOKEN = "preview_token_MUSTNOTLEAK"

const singleMock = vi.fn()

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    from: () => ({
      select: () => ({
        eq: function eq() {
          return { eq, single: singleMock }
        },
      }),
    }),
  },
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: "user_test" })),
}))

vi.mock("@/lib/admin", () => ({
  checkIsAdmin: vi.fn(async () => ({ isAdmin: false })),
}))

const { defaultSdk, FAKE_VM_TIER } = vi.hoisted(() => {
  const defaultSdk = {
    sandbox: {
      start: vi.fn(),
      previewTokens: { create: vi.fn() },
    },
  }
  // Sentinel stand-in for VMTier.Pico. Identity-compared in the options-object
  // assertion below, so the test fails if the route stops forwarding the tier.
  const FAKE_VM_TIER = { name: "Pico", cpuCores: 1, memoryGiB: 2 }
  return { defaultSdk, FAKE_VM_TIER }
})

vi.mock("@/lib/codesandbox-sdk", () => ({
  codesandboxSdk: defaultSdk,
  DEFAULT_HIBERNATION_TIMEOUT: 60,
  DEFAULT_VM_TIER: FAKE_VM_TIER,
}))

import { POST } from "../route"
import { codesandboxSdk } from "@/lib/codesandbox-sdk"

const sdk = codesandboxSdk as unknown as {
  sandbox: {
    start: ReturnType<typeof vi.fn>
    previewTokens: { create: ReturnType<typeof vi.fn> }
  }
}

// A real ShortUUID-encodable id so ShortUUID().toUUID() succeeds.
const SHORT_ID = "mhvXdrZT4jP5T8vBxuvm75"

function makeRequest(body: unknown) {
  return {
    json: async () => body,
  } as unknown as Parameters<typeof POST>[0]
}

/** Full serialization of every argument of every recorded call (E3). */
function serializeCalls(spy: { mock: { calls: unknown[][] } }) {
  return JSON.stringify(spy.mock.calls)
}

function expectNoSecrets(spy: { mock: { calls: unknown[][] } }) {
  const serialized = serializeCalls(spy)
  for (const forbidden of [
    FAKE_CSB_API_KEY,
    FAKE_PITCHER_TOKEN,
    FAKE_PREVIEW_TOKEN,
    "CSB_API_KEY",
    "pitcher_token",
    "reconnect_token",
    "authorization",
    "Authorization",
  ]) {
    expect(serialized).not.toContain(forbidden)
  }
}

describe("POST /api/sandbox/connect", () => {
  it("should return 400 with 'Invalid request body' on malformed JSON body", async () => {
    const request = {
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input")
      },
    } as unknown as Parameters<typeof POST>[0]

    const response = await POST(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    })
  })

  it("should not swallow the malformed-body case into a 500", async () => {
    const request = {
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON at position 0")
      },
    } as unknown as Parameters<typeof POST>[0]

    const response = await POST(request)

    expect(response.status).not.toBe(500)
  })
})

describe("POST /api/sandbox/connect — Phase 1 telemetry", () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    singleMock.mockResolvedValue({
      data: { codesandbox_id: "csb-1", name: "n", id: "i", component_id: "c" },
      error: null,
    })
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

  it("logs bootup_type telemetry with the exact allowlist fields on the success path", async () => {
    sdk.sandbox.start.mockResolvedValue({
      bootup_type: "RESUME",
      pitcher_token: FAKE_PITCHER_TOKEN,
      reconnect_token: FAKE_PITCHER_TOKEN,
      id: "csb-1",
    })
    sdk.sandbox.previewTokens.create.mockResolvedValue({
      token: FAKE_PREVIEW_TOKEN,
    })

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))
    expect(response.status).toBe(200)

    const calls = telemetryCalls(logSpy)
    expect(calls).toHaveLength(1)
    const payload = calls[0]![1] as Record<string, unknown>
    expect(payload.bootup_type).toBe("RESUME")
    expect(typeof payload.sandboxId).toBe("string")
    expect(typeof payload.timing_ms).toBe("number")
    // No wholesale startData object logged (B3).
    expect(Object.keys(payload).sort()).toEqual([
      "bootup_type",
      "sandboxId",
      "timing_ms",
    ])
  })

  it("logs error telemetry from the outer catch when the SDK start() rejects", async () => {
    sdk.sandbox.start.mockRejectedValue(
      new Error(`boom ${FAKE_CSB_API_KEY}`),
    )

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))
    expect(response.status).toBe(500)

    const calls = telemetryCalls(errorSpy)
    expect(calls).toHaveLength(1)
    const payload = calls[0]![1] as Record<string, unknown>
    expect(payload.outcome).toBe("error")
    expect(typeof payload.sandboxId).toBe("string")
    expect(typeof payload.timing_ms).toBe("number")
    expect(Object.keys(payload).sort()).toEqual([
      "outcome",
      "sandboxId",
      "timing_ms",
    ])
  })

  it("never leaks a secret into the serialized telemetry payload (C2/E3)", async () => {
    sdk.sandbox.start.mockResolvedValue({
      bootup_type: "CLEAN",
      pitcher_token: FAKE_PITCHER_TOKEN,
      reconnect_token: FAKE_PITCHER_TOKEN,
      id: "csb-1",
    })
    sdk.sandbox.previewTokens.create.mockResolvedValue({
      token: FAKE_PREVIEW_TOKEN,
    })

    await POST(makeRequest({ shortSandboxId: SHORT_ID }))

    expectNoSecrets({ mock: { calls: telemetryCalls(logSpy) } })
    expectNoSecrets({ mock: { calls: telemetryCalls(errorSpy) } })
  })

  it("never leaks a secret from a rejecting SDK error into telemetry (C2/E3)", async () => {
    sdk.sandbox.start.mockRejectedValue(
      new Error(`failed with ${FAKE_CSB_API_KEY} and ${FAKE_PITCHER_TOKEN}`),
    )

    await POST(makeRequest({ shortSandboxId: SHORT_ID }))

    expectNoSecrets({ mock: { calls: telemetryCalls(errorSpy) } })
  })

  it("returns 402 with WORKSPACE_FROZEN when CodeSandbox returns workspace frozen error", async () => {
    sdk.sandbox.start.mockRejectedValue(
      new Error("Failed to start sandbox: Your workspace has been frozen. Please upgrade or increase your spending limit to continue."),
    )

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))
    expect(response.status).toBe(402)
    const body = await response.json()
    expect(body.code).toBe("WORKSPACE_FROZEN")
    expect(body.error).toContain("frozen")
  })

  it("returns 429 with RATE_LIMITED when CodeSandbox returns rate limit error", async () => {
    sdk.sandbox.start.mockRejectedValue(
      new Error("Rate limit exceeded. Too many requests."),
    )

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))
    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.code).toBe("RATE_LIMITED")
    expect(body.error).toContain("rate limit")
  })
})

describe("POST /api/sandbox/connect — credit-burn guards", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    singleMock.mockResolvedValue({
      data: { codesandbox_id: "csb-1", name: "n", id: "i", component_id: "c" },
      error: null,
    })
    sdk.sandbox.start.mockResolvedValue({ bootup_type: "RESUME", id: "csb-1" })
    sdk.sandbox.previewTokens.create.mockResolvedValue({ token: "t" })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("passes vmTier, the lowered hibernation timeout, and disabled automatic wakeup to sandbox.start()", async () => {
    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))
    expect(response.status).toBe(200)

    expect(sdk.sandbox.start).toHaveBeenCalledTimes(1)
    const [csbId, opts] = sdk.sandbox.start.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ]
    expect(csbId).toBe("csb-1")
    expect(opts.vmTier).toBe(FAKE_VM_TIER)
    expect(opts.hibernationTimeoutSeconds).toBe(60)
    // Must be the explicit object, never omitted: the SDK's own default for
    // http is TRUE, which silently re-wakes (and re-bills) a hibernated VM on
    // any stray HTTP touch. Omission is the exact regression this asserts on.
    expect(opts.automaticWakeupConfig).toEqual({
      http: false,
      websocket: false,
    })
  })
})
