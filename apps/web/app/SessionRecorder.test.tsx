/** @vitest-environment jsdom */
import React from "react"
import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  startSessionRecording: vi.fn(),
  stopSessionRecording: vi.fn(),
  initPostHog: vi.fn(),
  getConsent: vi.fn(() => "accepted" as string | null),
  subscribe: vi.fn((_cb: (value: string | null) => void) => () => {}),
  pathname: "/studio",
}))

vi.mock("posthog-js", () => ({
  default: {
    capture: mocks.capture,
    startSessionRecording: mocks.startSessionRecording,
    stopSessionRecording: mocks.stopSessionRecording,
  },
}))

vi.mock("@/lib/posthog", () => ({
  initPostHog: mocks.initPostHog,
}))

vi.mock("@/lib/consent", () => ({
  getConsent: mocks.getConsent,
  subscribe: mocks.subscribe,
}))

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}))

async function renderRecorder() {
  vi.resetModules()
  const { default: SessionRecorder } = await import("./SessionRecorder")
  return render(<SessionRecorder />)
}

describe("SessionRecorder consent gating", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pathname = "/studio"
    mocks.subscribe.mockImplementation(() => () => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("does not init, capture, or start recording before a consent choice is made", async () => {
    mocks.getConsent.mockReturnValue(null)

    await renderRecorder()

    expect(mocks.initPostHog).not.toHaveBeenCalled()
    expect(mocks.capture).not.toHaveBeenCalled()
    expect(mocks.startSessionRecording).not.toHaveBeenCalled()
  })

  it("does not init, capture, or start recording when consent is rejected", async () => {
    mocks.getConsent.mockReturnValue("rejected")

    await renderRecorder()

    expect(mocks.initPostHog).not.toHaveBeenCalled()
    expect(mocks.capture).not.toHaveBeenCalled()
    expect(mocks.startSessionRecording).not.toHaveBeenCalled()
  })

  it("inits, captures a pageview and starts recording on a recorded route once accepted", async () => {
    mocks.getConsent.mockReturnValue("accepted")

    await renderRecorder()

    expect(mocks.initPostHog).toHaveBeenCalled()
    expect(mocks.startSessionRecording).toHaveBeenCalled()
    expect(mocks.capture).toHaveBeenCalledWith("$pageview", { url: "/studio" })
  })

  it("reacts to a later Accept via the consent subscription, without a reload", async () => {
    mocks.getConsent.mockReturnValue(null)
    let emit: ((value: string | null) => void) | undefined
    mocks.subscribe.mockImplementation((cb) => {
      emit = cb
      return () => {}
    })

    await renderRecorder()
    expect(mocks.initPostHog).not.toHaveBeenCalled()

    mocks.getConsent.mockReturnValue("accepted")
    act(() => {
      emit?.("accepted")
    })

    expect(mocks.initPostHog).toHaveBeenCalled()
    expect(mocks.capture).toHaveBeenCalledWith("$pageview", { url: "/studio" })
  })
})
