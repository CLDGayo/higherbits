import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

const { defaultSdk } = vi.hoisted(() => ({
  defaultSdk: { sandbox: { hibernate: vi.fn() } },
}))

vi.mock("@/lib/codesandbox-sdk", () => ({
  codesandboxSdk: defaultSdk,
  DEFAULT_HIBERNATION_TIMEOUT: 60,
  DEFAULT_VM_TIER: { name: "Pico" },
}))

import { POST } from "../route"
import { codesandboxSdk } from "@/lib/codesandbox-sdk"
import {
  markSandboxConnecting,
  markSandboxConnected,
  _resetActiveStateForTests,
} from "@/lib/sandbox-active-state"
import ShortUUID from "short-uuid"

const sdk = codesandboxSdk as unknown as {
  sandbox: { hibernate: ReturnType<typeof vi.fn> }
}

// A real ShortUUID-encodable id so ShortUUID().toUUID() succeeds.
const SHORT_ID = "mhvXdrZT4jP5T8vBxuvm75"
const UUID = ShortUUID().toUUID(SHORT_ID)

function makeRequest(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0]
}

describe("POST /api/sandbox/hibernate", () => {
  beforeEach(() => {
    _resetActiveStateForTests()
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    sdk.sandbox.hibernate.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("calls codesandboxSdk.sandbox.hibernate exactly once for a resolvable sandbox", async () => {
    singleMock.mockResolvedValue({
      data: { codesandbox_id: "csb-1" },
      error: null,
    })

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))

    expect(response.status).toBe(200)
    expect(sdk.sandbox.hibernate).toHaveBeenCalledTimes(1)
    expect(sdk.sandbox.hibernate).toHaveBeenCalledWith("csb-1")
  })

  it("404s and never hibernates when the id resolves to no DB row", async () => {
    singleMock.mockResolvedValue({ data: null, error: { message: "no rows" } })

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))

    expect(response.status).toBe(404)
    expect(sdk.sandbox.hibernate).not.toHaveBeenCalled()
  })

  it("404s and never hibernates when the row carries no codesandbox_id", async () => {
    singleMock.mockResolvedValue({
      data: { codesandbox_id: null },
      error: null,
    })

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))

    expect(response.status).toBe(404)
    expect(sdk.sandbox.hibernate).not.toHaveBeenCalled()
  })

  it("400s and never hibernates when shortSandboxId is missing", async () => {
    const response = await POST(makeRequest({}))

    expect(response.status).toBe(400)
    expect(sdk.sandbox.hibernate).not.toHaveBeenCalled()
  })

  it("400s (not 500) on a malformed JSON body", async () => {
    const response = await POST({
      json: async () => {
        throw new SyntaxError("Unexpected token")
      },
    } as unknown as Parameters<typeof POST>[0])

    expect(response.status).toBe(400)
    expect(sdk.sandbox.hibernate).not.toHaveBeenCalled()
  })

  it("skips hibernate when a connect operation is actively in progress", async () => {
    markSandboxConnecting(UUID)

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.skipped).toBe(true)
    expect(body.reason).toBe("connect_in_progress")
    expect(sdk.sandbox.hibernate).not.toHaveBeenCalled()
  })

  it("skips hibernate when the sandbox was connected recently (grace window)", async () => {
    markSandboxConnected(UUID)

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.skipped).toBe(true)
    expect(body.reason).toBe("recently_connected")
    expect(sdk.sandbox.hibernate).not.toHaveBeenCalled()
  })

  it("skips hibernate when DB row updated_at is within the grace window", async () => {
    singleMock.mockResolvedValue({
      data: {
        codesandbox_id: "csb-1",
        updated_at: new Date(Date.now() - 2000).toISOString(),
      },
      error: null,
    })

    const response = await POST(makeRequest({ shortSandboxId: SHORT_ID }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.skipped).toBe(true)
    expect(body.reason).toBe("active_session_db")
    expect(sdk.sandbox.hibernate).not.toHaveBeenCalled()
  })

  it("bypasses grace window and hibernates when reason is idle", async () => {
    markSandboxConnected(UUID)
    singleMock.mockResolvedValue({
      data: {
        codesandbox_id: "csb-1",
        updated_at: new Date(Date.now() - 2000).toISOString(),
      },
      error: null,
    })

    const response = await POST(
      makeRequest({ shortSandboxId: SHORT_ID, reason: "idle" }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(sdk.sandbox.hibernate).toHaveBeenCalledTimes(1)
    expect(sdk.sandbox.hibernate).toHaveBeenCalledWith("csb-1")
  })
})
