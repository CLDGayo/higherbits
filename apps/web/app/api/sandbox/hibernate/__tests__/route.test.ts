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

const sdk = codesandboxSdk as unknown as {
  sandbox: { hibernate: ReturnType<typeof vi.fn> }
}

// A real ShortUUID-encodable id so ShortUUID().toUUID() succeeds.
const SHORT_ID = "mhvXdrZT4jP5T8vBxuvm75"

function makeRequest(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0]
}

describe("POST /api/sandbox/hibernate", () => {
  beforeEach(() => {
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
})
