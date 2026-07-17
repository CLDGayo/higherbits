/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  setUserId: vi.fn(),
  sessionReplayPlugin: vi.fn(() => ({ name: "session-replay" })),
  track: vi.fn(),
}))

vi.mock("@amplitude/analytics-browser", () => ({
  Identify: class {
    set = vi.fn()
  },
  add: mocks.add,
  identify: mocks.identify,
  init: mocks.init,
  setUserId: mocks.setUserId,
  track: mocks.track,
}))

vi.mock("@amplitude/plugin-session-replay-browser", () => ({
  sessionReplayPlugin: mocks.sessionReplayPlugin,
}))

async function loadAmplitude() {
  vi.resetModules()
  return import("./amplitude")
}

describe("Amplitude initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", "placeholder-key")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("does not start telemetry in development", async () => {
    vi.stubEnv("NODE_ENV", "development")
    const { initAmplitude, trackEvent, AMPLITUDE_EVENTS } = await loadAmplitude()

    initAmplitude()
    trackEvent(AMPLITUDE_EVENTS.COPY_CODE)

    expect(mocks.init).not.toHaveBeenCalled()
    expect(mocks.track).not.toHaveBeenCalled()
  })

  it("does not start telemetry in production without an API key", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", "")
    const { initAmplitude } = await loadAmplitude()

    initAmplitude()

    expect(mocks.init).not.toHaveBeenCalled()
  })

  it("starts telemetry in production with an API key", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const { initAmplitude } = await loadAmplitude()

    initAmplitude()

    expect(mocks.sessionReplayPlugin).toHaveBeenCalledWith({ sampleRate: 0.0001 })
    expect(mocks.add).toHaveBeenCalledOnce()
    expect(mocks.init).toHaveBeenCalledWith(
      "placeholder-key",
      expect.objectContaining({
        defaultTracking: expect.objectContaining({ sessions: true }),
      }),
    )
  })
})
