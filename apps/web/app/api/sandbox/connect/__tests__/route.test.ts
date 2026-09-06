import { describe, expect, it, vi } from "vitest"

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
