/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  optOutCapturing: vi.fn(),
  stopSessionRecording: vi.fn(),
  getConsent: vi.fn(() => "accepted" as string | null),
}))

vi.mock("posthog-js", () => ({
  default: {
    init: mocks.init,
    opt_out_capturing: mocks.optOutCapturing,
    stopSessionRecording: mocks.stopSessionRecording,
  },
}))

vi.mock("@/lib/consent", () => ({
  getConsent: mocks.getConsent,
}))

async function loadPostHog() {
  vi.resetModules()
  return import("./posthog")
}

describe("PostHog consent gating", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getConsent.mockReturnValue("accepted")
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PUBLIC_KEY", "phc_test_key")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("does not init when no consent choice has been made, even with a valid key", async () => {
    mocks.getConsent.mockReturnValue(null)
    const { initPostHog } = await loadPostHog()

    initPostHog()

    expect(mocks.init).not.toHaveBeenCalled()
  })

  it("does not init when consent is rejected", async () => {
    mocks.getConsent.mockReturnValue("rejected")
    const { initPostHog } = await loadPostHog()

    initPostHog()

    expect(mocks.init).not.toHaveBeenCalled()
  })

  it("does not init when consent is accepted but no key is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PUBLIC_KEY", "")
    const { initPostHog } = await loadPostHog()

    initPostHog()

    expect(mocks.init).not.toHaveBeenCalled()
  })

  it("inits once consent is accepted and a key is present", async () => {
    const { initPostHog } = await loadPostHog()

    initPostHog()

    expect(mocks.init).toHaveBeenCalledOnce()
    expect(mocks.init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ autocapture: false }),
    )
  })

  it("revokePostHog opts out of capturing and stops session recording", async () => {
    mocks.getConsent.mockReturnValue("rejected")
    const { revokePostHog } = await loadPostHog()

    revokePostHog()

    expect(mocks.optOutCapturing).toHaveBeenCalledOnce()
    expect(mocks.stopSessionRecording).toHaveBeenCalledOnce()
  })
})
