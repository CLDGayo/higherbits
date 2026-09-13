/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

async function loadConsent() {
  vi.resetModules()
  return import("./consent")
}

describe("consent store", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("returns null when no choice has been stored yet", async () => {
    const { getConsent } = await loadConsent()

    expect(getConsent()).toBeNull()
  })

  it("persists and reads back accepted and rejected", async () => {
    const { getConsent, setConsent } = await loadConsent()

    setConsent("accepted")
    expect(getConsent()).toBe("accepted")

    setConsent("rejected")
    expect(getConsent()).toBe("rejected")
  })

  it("clears the stored value when set back to null", async () => {
    const { getConsent, setConsent } = await loadConsent()

    setConsent("accepted")
    setConsent(null)

    expect(getConsent()).toBeNull()
    expect(localStorage.getItem("hb_analytics_consent")).toBeNull()
  })

  it("ignores an unrecognised stored value", async () => {
    localStorage.setItem("hb_analytics_consent", "banana")
    const { getConsent } = await loadConsent()

    expect(getConsent()).toBeNull()
  })

  it("does not throw when localStorage.setItem throws, and keeps the value in memory", async () => {
    const { getConsent, setConsent } = await loadConsent()
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })

    expect(() => setConsent("accepted")).not.toThrow()
    expect(getConsent()).toBe("accepted")
  })

  it("does not throw when localStorage.getItem throws", async () => {
    const { getConsent } = await loadConsent()
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })

    expect(() => getConsent()).not.toThrow()
    expect(getConsent()).toBeNull()
  })

  it("notifies subscribers on every setConsent call and stops after unsubscribe", async () => {
    const { setConsent, subscribe } = await loadConsent()
    const cb = vi.fn()

    const unsubscribe = subscribe(cb)
    setConsent("accepted")
    setConsent("rejected")

    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenNthCalledWith(1, "accepted")
    expect(cb).toHaveBeenNthCalledWith(2, "rejected")

    unsubscribe()
    setConsent("accepted")
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it("is SSR-safe: returns null and does not throw when window is undefined", async () => {
    const { getConsent, setConsent } = await loadConsent()
    vi.stubGlobal("window", undefined)

    expect(getConsent()).toBeNull()
    expect(() => setConsent("accepted")).not.toThrow()

    vi.unstubAllGlobals()
  })
})
