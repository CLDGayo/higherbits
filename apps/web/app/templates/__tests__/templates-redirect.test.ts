import { describe, it, expect, vi, beforeEach } from "vitest"

// Phase 04 (supabase-interconnect) Step B2 / SPEC AC9.
// Proves the route delegates to `permanentRedirect` (308) — NOT `redirect` (307) —
// and targets the canonical tab URL. This runs without a server, so it is not
// blocked by the Clerk-middleware dev-mode interception that stops the e2e
// variant (see e2e/templates-redirect.spec.ts).
const permanentRedirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT")
})
const redirect = vi.fn()

vi.mock("next/navigation", () => ({
  get permanentRedirect() {
    return permanentRedirect
  },
  get redirect() {
    return redirect
  },
}))

import TemplatesPage from "../page"

describe("/templates route", () => {
  beforeEach(() => {
    permanentRedirect.mockClear()
    redirect.mockClear()
  })

  it("issues a permanent (308) redirect to /?tab=templates", () => {
    // permanentRedirect throws by design in Next; the throw is the control flow.
    expect(() => TemplatesPage()).toThrow("NEXT_REDIRECT")

    expect(permanentRedirect).toHaveBeenCalledTimes(1)
    expect(permanentRedirect).toHaveBeenCalledWith("/?tab=templates")
  })

  it("does not use the temporary (307) redirect helper", () => {
    expect(() => TemplatesPage()).toThrow()
    expect(redirect).not.toHaveBeenCalled()
  })
})
