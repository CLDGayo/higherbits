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

vi.mock("@/lib/codesandbox-sdk", () => ({
  codesandboxSdk: {
    sandbox: {
      start: vi.fn(),
      previewTokens: { create: vi.fn() },
    },
  },
  DEFAULT_HIBERNATION_TIMEOUT: 300,
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
})
