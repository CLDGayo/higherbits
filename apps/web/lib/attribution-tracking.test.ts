/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConsent: vi.fn(() => null as string | null),
}))

vi.mock("@/lib/consent", () => ({ getConsent: mocks.getConsent }))

async function loadAttribution() {
  vi.resetModules()
  return import("./attribution-tracking")
}

describe("attribution tracking consent gating", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("writes nothing before a consent choice is made", async () => {
    mocks.getConsent.mockReturnValue(null)
    const { trackAttribution, ATTRIBUTION_SOURCE, SOURCE_DETAIL } =
      await loadAttribution()

    trackAttribution(ATTRIBUTION_SOURCE.HEADER, SOURCE_DETAIL.HEADER_GET_PRO_LINK)

    expect(localStorage.getItem("attribution_source")).toBeNull()
    expect(localStorage.getItem("attribution_detail")).toBeNull()
    expect(localStorage.getItem("attribution_timestamp")).toBeNull()
  })

  it("writes nothing when consent is rejected", async () => {
    mocks.getConsent.mockReturnValue("rejected")
    const { trackAttribution, ATTRIBUTION_SOURCE, SOURCE_DETAIL } =
      await loadAttribution()

    trackAttribution(ATTRIBUTION_SOURCE.MAGIC, SOURCE_DETAIL.MAGIC_CONSOLE)

    expect(localStorage.getItem("attribution_source")).toBeNull()
  })

  it("writes all three keys once consent is accepted", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    const { trackAttribution, ATTRIBUTION_SOURCE, SOURCE_DETAIL } =
      await loadAttribution()

    trackAttribution(ATTRIBUTION_SOURCE.SETTINGS, SOURCE_DETAIL.SETTINGS_BILLING)

    expect(localStorage.getItem("attribution_source")).toBe("settings")
    expect(localStorage.getItem("attribution_detail")).toBe("settings_billing")
    expect(localStorage.getItem("attribution_timestamp")).not.toBeNull()
  })

  it("setDefaultAttribution inherits the gate and writes nothing pre-consent", async () => {
    mocks.getConsent.mockReturnValue(null)
    const { setDefaultAttribution, ATTRIBUTION_SOURCE, SOURCE_DETAIL } =
      await loadAttribution()

    setDefaultAttribution(
      ATTRIBUTION_SOURCE.COMPONENT_LIBRARY,
      SOURCE_DETAIL.PREMIUM_COMPONENT_CTA,
    )

    expect(localStorage.getItem("attribution_source")).toBeNull()
  })

  it("setDefaultAttribution writes once consent is accepted", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    const { setDefaultAttribution, ATTRIBUTION_SOURCE, SOURCE_DETAIL } =
      await loadAttribution()

    setDefaultAttribution(
      ATTRIBUTION_SOURCE.COMPONENT_LIBRARY,
      SOURCE_DETAIL.PREMIUM_COMPONENT_CTA,
    )

    expect(localStorage.getItem("attribution_source")).toBe("component_library")
  })

  it("clearAttributionData stays callable after a revoke and removes every key", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    const {
      trackAttribution,
      clearAttributionData,
      ATTRIBUTION_SOURCE,
      SOURCE_DETAIL,
    } = await loadAttribution()

    trackAttribution(ATTRIBUTION_SOURCE.HEADER, SOURCE_DETAIL.HEADER_GET_PRO_LINK)
    mocks.getConsent.mockReturnValue("rejected")
    clearAttributionData()

    expect(localStorage.getItem("attribution_source")).toBeNull()
    expect(localStorage.getItem("attribution_detail")).toBeNull()
    expect(localStorage.getItem("attribution_timestamp")).toBeNull()
  })
})
