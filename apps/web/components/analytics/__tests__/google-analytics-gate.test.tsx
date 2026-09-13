/** @vitest-environment jsdom */
import React from "react"
import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConsent: vi.fn(() => null as string | null),
  subscribe: vi.fn((_cb: (value: string | null) => void) => () => {}),
}))

vi.mock("@/lib/consent", () => ({
  getConsent: mocks.getConsent,
  subscribe: mocks.subscribe,
}))

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    <div data-testid="ga-script" data-ga-id={gaId} />
  ),
}))

async function renderGate() {
  vi.resetModules()
  const { GoogleAnalyticsGate } = await import("../google-analytics-gate")
  return render(<GoogleAnalyticsGate />)
}

describe("GoogleAnalyticsGate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.subscribe.mockImplementation(() => () => {})
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TESTDUMMY123")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("renders nothing before a consent choice is made", async () => {
    mocks.getConsent.mockReturnValue(null)

    const { queryByTestId } = await renderGate()

    expect(queryByTestId("ga-script")).toBeNull()
  })

  it("renders nothing when consent is rejected", async () => {
    mocks.getConsent.mockReturnValue("rejected")

    const { queryByTestId } = await renderGate()

    expect(queryByTestId("ga-script")).toBeNull()
  })

  it("renders nothing when consent is accepted but no measurement id is configured", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "")

    const { queryByTestId } = await renderGate()

    // There is deliberately no hardcoded fallback measurement id.
    expect(queryByTestId("ga-script")).toBeNull()
  })

  it("renders GoogleAnalytics once consent is accepted and an id is configured", async () => {
    mocks.getConsent.mockReturnValue("accepted")

    const { queryByTestId } = await renderGate()

    expect(queryByTestId("ga-script")).not.toBeNull()
    expect(queryByTestId("ga-script")?.getAttribute("data-ga-id")).toBe(
      "G-TESTDUMMY123",
    )
  })

  it("mounts GA on a later Accept without a reload", async () => {
    mocks.getConsent.mockReturnValue(null)
    let emit: ((value: string | null) => void) | undefined
    mocks.subscribe.mockImplementation((cb) => {
      emit = cb
      return () => {}
    })

    const { queryByTestId } = await renderGate()
    expect(queryByTestId("ga-script")).toBeNull()

    act(() => {
      emit?.("accepted")
    })

    expect(queryByTestId("ga-script")).not.toBeNull()
  })

  it("sets GA's documented disable flag when consent is revoked after acceptance", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    let emit: ((value: string | null) => void) | undefined
    mocks.subscribe.mockImplementation((cb) => {
      emit = cb
      return () => {}
    })

    const { queryByTestId } = await renderGate()
    expect(queryByTestId("ga-script")).not.toBeNull()

    act(() => {
      emit?.("rejected")
    })

    expect(queryByTestId("ga-script")).toBeNull()
    expect(
      (window as unknown as Record<string, unknown>)[
        "ga-disable-G-TESTDUMMY123"
      ],
    ).toBe(true)
  })
})
