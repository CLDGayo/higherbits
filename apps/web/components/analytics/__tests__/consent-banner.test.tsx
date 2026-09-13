/** @vitest-environment jsdom */
import React from "react"
import { fireEvent, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConsent: vi.fn(() => null as string | null),
  setConsent: vi.fn(),
  subscribe: vi.fn((_cb: (value: string | null) => void) => () => {}),
  revokeAmplitude: vi.fn(),
  revokePostHog: vi.fn(),
  clearAttributionData: vi.fn(),
}))

vi.mock("@/lib/consent", () => ({
  getConsent: mocks.getConsent,
  setConsent: mocks.setConsent,
  subscribe: mocks.subscribe,
}))

vi.mock("@/lib/amplitude", () => ({ revokeAmplitude: mocks.revokeAmplitude }))
vi.mock("@/lib/posthog", () => ({ revokePostHog: mocks.revokePostHog }))
vi.mock("@/lib/attribution-tracking", () => ({
  clearAttributionData: mocks.clearAttributionData,
}))

async function renderBanner() {
  vi.resetModules()
  const { ConsentBanner } = await import("../consent-banner")
  return render(<ConsentBanner />)
}

describe("ConsentBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.subscribe.mockImplementation(() => () => {})
  })

  it("does not render once a choice has already been made", async () => {
    mocks.getConsent.mockReturnValue("accepted")

    const { queryByRole } = await renderBanner()

    expect(queryByRole("region", { name: /cookie consent/i })).toBeNull()
  })

  it("does not render after a rejection either", async () => {
    mocks.getConsent.mockReturnValue("rejected")

    const { queryByRole } = await renderBanner()

    expect(queryByRole("region", { name: /cookie consent/i })).toBeNull()
  })

  it("renders with an accessible region label while the choice is unknown", async () => {
    mocks.getConsent.mockReturnValue(null)

    const { getByRole } = await renderBanner()

    expect(getByRole("region", { name: /cookie consent/i })).toBeTruthy()
  })

  it("offers exactly two equal-weight buttons: Accept and Reject", async () => {
    mocks.getConsent.mockReturnValue(null)

    const { getAllByRole, getByRole } = await renderBanner()

    const buttons = getAllByRole("button")
    expect(buttons).toHaveLength(2)

    const accept = getByRole("button", { name: /accept/i }) as HTMLButtonElement
    const reject = getByRole("button", { name: /reject/i }) as HTMLButtonElement

    expect(accept.tagName).toBe("BUTTON")
    expect(reject.tagName).toBe("BUTTON")
    // Equal visual weight: identical class strings, so neither choice is nudged.
    expect(accept.className).toBe(reject.className)
  })

  it("offers no close or dismiss control — dismissing must never read as consent", async () => {
    mocks.getConsent.mockReturnValue(null)

    const { queryByRole } = await renderBanner()

    expect(queryByRole("button", { name: /close/i })).toBeNull()
    expect(queryByRole("button", { name: /dismiss/i })).toBeNull()
  })

  it("records an acceptance when Accept is clicked", async () => {
    mocks.getConsent.mockReturnValue(null)

    const { getByRole } = await renderBanner()
    fireEvent.click(getByRole("button", { name: /accept/i }))

    expect(mocks.setConsent).toHaveBeenCalledWith("accepted")
    expect(mocks.revokeAmplitude).not.toHaveBeenCalled()
    expect(mocks.revokePostHog).not.toHaveBeenCalled()
    expect(mocks.clearAttributionData).not.toHaveBeenCalled()
  })

  it("records a rejection and defensively opts both SDKs out when Reject is clicked", async () => {
    mocks.getConsent.mockReturnValue(null)

    const { getByRole } = await renderBanner()
    fireEvent.click(getByRole("button", { name: /reject/i }))

    expect(mocks.setConsent).toHaveBeenCalledWith("rejected")
    expect(mocks.revokeAmplitude).toHaveBeenCalledOnce()
    expect(mocks.revokePostHog).toHaveBeenCalledOnce()
  })

  it("clears stored attribution data when Reject is clicked", async () => {
    mocks.getConsent.mockReturnValue(null)

    const { getByRole } = await renderBanner()
    fireEvent.click(getByRole("button", { name: /reject/i }))

    expect(mocks.clearAttributionData).toHaveBeenCalledOnce()
  })

  it("pins the banner to the bottom of the viewport above dialogs and below toasts", async () => {
    mocks.getConsent.mockReturnValue(null)

    const { container } = await renderBanner()

    const className = (container.firstChild as HTMLElement).className
    expect(className).toContain("fixed")
    expect(className).toContain("inset-x-0")
    expect(className).toContain("bottom-0")
    expect(className).toContain("z-[60]")
  })
})
