/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  setUserId: vi.fn(),
  sessionReplayPlugin: vi.fn(() => ({ name: "session-replay" })),
  track: vi.fn(),
  setOptOut: vi.fn(),
  getConsent: vi.fn(() => "accepted" as string | null),
}))

vi.mock("@amplitude/analytics-browser", () => ({
  Identify: class {
    set = vi.fn()
  },
  add: mocks.add,
  identify: mocks.identify,
  init: mocks.init,
  setUserId: mocks.setUserId,
  setOptOut: mocks.setOptOut,
  track: mocks.track,
}))

vi.mock("@amplitude/plugin-session-replay-browser", () => ({
  sessionReplayPlugin: mocks.sessionReplayPlugin,
}))

vi.mock("@/lib/consent", () => ({
  getConsent: mocks.getConsent,
}))

async function loadAmplitude() {
  vi.resetModules()
  return import("./amplitude")
}

describe("Amplitude initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getConsent.mockReturnValue("accepted")
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

describe("trackPageProperties", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getConsent.mockReturnValue("accepted")
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", "placeholder-key")
    vi.stubEnv("NODE_ENV", "production")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // Amplitude's HTTP v2 API rejects an empty event_type with
  // 400 "Invalid field values on some events". This shipped as track("")
  // and silently dropped every component page view until 2026-08-30.
  it("sends a non-empty event name", async () => {
    const { trackPageProperties, AMPLITUDE_EVENTS } = await loadAmplitude()

    trackPageProperties({ componentId: "abc" })

    expect(mocks.track).toHaveBeenCalledOnce()
    const [eventName, props] = mocks.track.mock.calls[0]!
    expect(eventName).toBeTruthy()
    expect(eventName).toBe(AMPLITUDE_EVENTS.VIEW_COMPONENT)
    expect(props).toMatchObject({ componentId: "abc" })
  })
})

describe("Amplitude consent gating", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", "placeholder-key")
    vi.stubEnv("NODE_ENV", "production")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("does not init or track when no consent choice has been made, even in production with a key", async () => {
    mocks.getConsent.mockReturnValue(null)
    const { initAmplitude, trackEvent, trackPageProperties, AMPLITUDE_EVENTS } =
      await loadAmplitude()

    initAmplitude()
    trackEvent(AMPLITUDE_EVENTS.COPY_CODE)
    trackPageProperties({ componentId: "abc" })

    expect(mocks.init).not.toHaveBeenCalled()
    expect(mocks.add).not.toHaveBeenCalled()
    expect(mocks.track).not.toHaveBeenCalled()
  })

  it("does not init or track when consent is rejected", async () => {
    mocks.getConsent.mockReturnValue("rejected")
    const { initAmplitude, trackEvent, identifyUser, AMPLITUDE_EVENTS } =
      await loadAmplitude()

    initAmplitude()
    trackEvent(AMPLITUDE_EVENTS.COPY_CODE)
    identifyUser("user_1")

    expect(mocks.init).not.toHaveBeenCalled()
    expect(mocks.track).not.toHaveBeenCalled()
    expect(mocks.setUserId).not.toHaveBeenCalled()
  })

  it("inits when consent is accepted alongside production and an API key", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    const { initAmplitude } = await loadAmplitude()

    initAmplitude()

    expect(mocks.init).toHaveBeenCalledOnce()
  })

  it("drops pre-consent calls rather than queueing them for a later accept", async () => {
    mocks.getConsent.mockReturnValue(null)
    const { trackEvent, initAmplitude, AMPLITUDE_EVENTS } = await loadAmplitude()

    trackEvent(AMPLITUDE_EVENTS.COPY_CODE)
    expect(mocks.track).not.toHaveBeenCalled()

    mocks.getConsent.mockReturnValue("accepted")
    initAmplitude()

    // The pre-consent call must never be replayed after acceptance.
    expect(mocks.track).not.toHaveBeenCalled()

    trackEvent(AMPLITUDE_EVENTS.COPY_CODE)
    expect(mocks.track).toHaveBeenCalledOnce()
  })

  it("calls amplitude.init only once even if initAmplitude runs twice", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    const { initAmplitude } = await loadAmplitude()

    initAmplitude()
    initAmplitude()

    expect(mocks.init).toHaveBeenCalledOnce()
    expect(mocks.add).toHaveBeenCalledOnce()
  })

  it("revokeAmplitude opts out regardless of the current consent value", async () => {
    mocks.getConsent.mockReturnValue(null)
    const { revokeAmplitude } = await loadAmplitude()

    revokeAmplitude()

    expect(mocks.setOptOut).toHaveBeenCalledWith(true)
  })
})
