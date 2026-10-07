import { afterEach, describe, expect, it, vi } from "vitest"
import { connectToSandbox } from "../api"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("connectToSandbox", () => {
  it.each([
    {
      status: 400,
      body: { error: "Sandbox ID is required" },
      message: "Sandbox ID is required",
    },
    {
      status: 503,
      body: {
        error: "Sandbox editing is temporarily unavailable.",
        code: "CODESANDBOX_NOT_CONFIGURED",
      },
      message: "Sandbox editing is temporarily unavailable.",
    },
  ])(
    "does not retry non-retryable $status responses",
    async ({ status, body, message }) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      )
      vi.stubGlobal("fetch", fetchMock)
      vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(connectToSandbox("sandbox-id")).rejects.toThrow(message)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    },
  )
})
