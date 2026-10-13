// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { OnboardingClient } from "../page.client"
import type { ApiKey } from "@/types/global"

const harness = vi.hoisted(() => ({
  auth: { isLoaded: true, userId: "live-user" as string | null },
  params: new URLSearchParams(),
  push: vi.fn(),
  service: vi.fn(() => { throw new Error("Unexpected service call") }),
  fetch: vi.fn(() => { throw new Error("Unexpected fetch") }),
}))
vi.mock("@clerk/nextjs", () => ({ useAuth: () => harness.auth }))
vi.mock("@/lib/clerk", () => ({ useClerkSupabaseClient: () => ({ from: harness.service, rpc: harness.service }) }))
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: false }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: harness.push }), useSearchParams: () => harness.params }))
vi.mock("next/dynamic", () => ({
  default: (loader: () => unknown) => {
    const source = loader.toString()
    const step = ["welcome", "select-ide", "install-ide", "troubleshooting", "create-component", "upgrade-pro"].find((name) => source.includes(`${name}-step`))
    return (props: { selectedIde?: string; osType?: string; onSelect?: (ide: string) => void; onComplete: (action?: string) => void }) => (
      <section data-testid="step">
        <output>{JSON.stringify({ step, selectedIde: props.selectedIde, osType: props.osType })}</output>
        {props.onSelect && <button onClick={() => props.onSelect?.("cline")}>Select cline</button>}
        <button onClick={() => props.onComplete()}>Complete step</button>
        <button onClick={() => props.onComplete("troubleshooting")}>Troubleshoot</button>
      </section>
    )
  },
}))
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  motion: { div: ({ children }: React.PropsWithChildren) => <div>{children}</div> },
}))

const keys = ["magic_onboarding_state", "higherbits_mcp_onboarding_state"]
const state = {
  currentStep: "install-ide",
  selectedIde: "windsurf",
  osType: "windows",
  completedSteps: ["select-ide", "welcome", "select-ide"],
  extra: { untouched: [2, "value"] },
}
const syntheticKey: ApiKey = { id: "synthetic", key: "synthetic-key", user_id: "live-user", plan: "free", requests_limit: 100, requests_count: 0, created_at: "2026-10-13", expires_at: null, last_used_at: null, is_active: true, project_url: "https://example.test" }
const mount = () => render(<OnboardingClient initialApiKey={syntheticKey} userId="stale-initial-user" />)
const observed = () => JSON.parse(screen.getByTestId("step").querySelector("output")!.textContent!)
const saved = () => JSON.parse(localStorage.getItem(keys[0]!)!)

describe("actual onboarding persistence effects", () => {
  beforeEach(() => {
    localStorage.clear()
    harness.auth = { isLoaded: true, userId: "live-user" }
    harness.params = new URLSearchParams()
    harness.push.mockReset()
    harness.service.mockClear()
    harness.fetch.mockClear()
    vi.stubGlobal("fetch", harness.fetch)
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Macintosh")
  })
  afterEach(() => {
    cleanup()
    try {
      expect(harness.service).not.toHaveBeenCalled()
      expect(harness.fetch).not.toHaveBeenCalled()
    } finally {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    }
  })

  it.each(["legacy", "canonical", "conflict"])("CONSUMER-ONBOARDING restores %s step IDE completed and extra data", (mode) => {
    if (mode !== "canonical") localStorage.setItem(keys[0]!, JSON.stringify(state))
    if (mode !== "legacy") localStorage.setItem(keys[1]!, JSON.stringify(mode === "conflict" ? { ...state, selectedIde: "cursor" } : state))
    mount()
    expect(observed()).toEqual({ step: "install-ide", selectedIde: "windsurf", osType: "mac" })
    expect(saved()).toEqual({ ...state, osType: "mac" })
    expect(localStorage.getItem(keys[1]!)).toBe(localStorage.getItem(keys[0]!))
  })

  it.each(["select-ide", "invalid"])("CONSUMER-ONBOARDING URL step %s has correct precedence", (step) => {
    localStorage.setItem(keys[0]!, JSON.stringify(state))
    harness.params = new URLSearchParams({ step })
    mount()
    expect(observed().step).toBe(step === "invalid" ? "install-ide" : step)
    expect(saved()).toEqual({ ...state, currentStep: step === "invalid" ? "install-ide" : step, osType: "mac" })
    expect(localStorage.getItem(keys[1]!)).toBe(localStorage.getItem(keys[0]!))
  })

  it.each(["Macintosh", "Windows", "Linux"].flatMap((agent) => [false, true].map((delayed) => [agent, delayed] as const)))("CONSUMER-OS-TIMING %s delayed=%s", (agent, delayed) => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(agent)
    localStorage.setItem(keys[0]!, JSON.stringify(state))
    harness.auth.isLoaded = !delayed
    const view = mount()
    if (delayed) {
      expect(screen.queryByTestId("step")).toBeNull()
      harness.auth.isLoaded = true
      view.rerender(<OnboardingClient initialApiKey={null} userId="stale-initial-user" />)
    }
    const osType = agent === "Windows" ? "windows" : agent === "Linux" ? "linux" : "mac"
    expect(observed().osType).toBe(osType)
    expect(saved()).toEqual({ ...state, osType })
  })

  it("CONSUMER-ONBOARDING defaults are preserved and synchronized", () => {
    mount()
    expect(observed().step).toBe("welcome")
    expect(saved()).toEqual({ currentStep: "welcome", selectedIde: null, osType: "mac", completedSteps: [] })
    expect(localStorage.getItem(keys[1]!)).toBe(localStorage.getItem(keys[0]!))
  })

  it("CONSUMER-RELOAD unloaded Clerk prohibits all persistence before and after initialization", () => {
    localStorage.setItem(keys[0]!, JSON.stringify(state))
    const get = vi.spyOn(Storage.prototype, "getItem")
    const set = vi.spyOn(Storage.prototype, "setItem")
    const remove = vi.spyOn(Storage.prototype, "removeItem")
    harness.auth.isLoaded = false
    const view = mount()
    expect(get).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    harness.auth.isLoaded = true
    view.rerender(<OnboardingClient initialApiKey={null} userId="stale-initial-user" />)
    expect(observed().selectedIde).toBe("windsurf")
    get.mockClear(); set.mockClear(); remove.mockClear()
    harness.auth.isLoaded = false
    harness.params = new URLSearchParams({ step: "upgrade-pro" })
    view.rerender(<OnboardingClient initialApiKey={null} userId="stale-initial-user" />)
    expect(get).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    harness.auth.isLoaded = true
    view.rerender(<OnboardingClient initialApiKey={null} userId="stale-initial-user" />)
    expect(observed().step).toBe("upgrade-pro")
    expect(saved().selectedIde).toBe("windsurf")
  })

  it.each([null, ...keys])("CONSUMER-ONBOARDING stale initial identity cannot rewrite after signout; removal fault=%s", (denied) => {
    for (const key of keys) localStorage.setItem(key, JSON.stringify(state))
    const view = mount()
    const originalRemove = Storage.prototype.removeItem
    const remove = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (key === denied) throw new Error("synthetic remove failure")
      originalRemove.call(this, key)
    })
    const set = vi.spyOn(Storage.prototype, "setItem")
    harness.auth.userId = null
    view.rerender(<OnboardingClient initialApiKey={null} userId="stale-initial-user" />)
    expect(observed().step).toBe("welcome")
    expect(remove.mock.calls.map(([key]) => key)).toEqual(keys)
    expect(set).not.toHaveBeenCalled()
    harness.params = new URLSearchParams({ step: "upgrade-pro" })
    view.rerender(<OnboardingClient initialApiKey={null} userId="stale-initial-user" />)
    expect(observed().step).toBe("welcome")
    fireEvent.click(screen.getByText("Complete step"))
    expect(set).not.toHaveBeenCalled()
    for (const key of keys.filter((key) => key !== denied)) expect(localStorage.getItem(key)).toBeNull()
  })

  it.each(keys)("CONSUMER-ONBOARDING partial write %s retains resumed UI", (denied) => {
    localStorage.setItem(keys[0]!, JSON.stringify(state))
    const originalSet = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === denied) throw new Error("synthetic write failure")
      originalSet.call(this, key, value)
    })
    mount()
    expect(observed()).toEqual({ step: "install-ide", selectedIde: "windsurf", osType: "mac" })
    expect(JSON.parse(localStorage.getItem(keys.find((key) => key !== denied)!)!)).toEqual({ ...state, osType: "mac" })
  })

  it("HELPER-EXTRA IDE and URL updates preserve data; completion retains existing Set semantics", () => {
    localStorage.setItem(keys[0]!, JSON.stringify({ ...state, currentStep: "select-ide" }))
    const view = mount()
    fireEvent.click(screen.getByText("Select cline"))
    expect(observed()).toEqual({ step: "install-ide", selectedIde: "cline", osType: "mac" })
    expect(saved()).toEqual({ ...state, selectedIde: "cline", osType: "mac", completedSteps: ["select-ide", "welcome"] })
    harness.params = new URLSearchParams({ step: "troubleshooting" })
    view.rerender(<OnboardingClient initialApiKey={null} userId="stale-initial-user" />)
    expect(observed().selectedIde).toBe("cline")
    expect(saved().extra).toEqual(state.extra)
    expect(saved().completedSteps).toEqual(["select-ide", "welcome"])
    expect(localStorage.getItem(keys[1]!)).toBe(localStorage.getItem(keys[0]!))
  })

  it("CONSUMER-ONBOARDING upgrade completion persists deduplication before console navigation", () => {
    localStorage.setItem(keys[0]!, JSON.stringify({ ...state, currentStep: "upgrade-pro" }))
    mount()
    fireEvent.click(screen.getByText("Complete step"))
    expect(saved()).toEqual({ ...state, osType: "mac", currentStep: "upgrade-pro", completedSteps: ["select-ide", "welcome", "upgrade-pro"] })
    expect(localStorage.getItem(keys[1]!)).toBe(localStorage.getItem(keys[0]!))
    expect(harness.push).toHaveBeenCalledWith("/higherbits-mcp/console")
  })

  it.each(["invalid-legacy", "both-invalid", ...keys])("CONSUMER-ONBOARDING %s resumes valid fallback or existing defaults", (fault) => {
    localStorage.setItem(keys[0]!, "null")
    localStorage.setItem(keys[1]!, JSON.stringify(state))
    if (fault === "both-invalid") localStorage.setItem(keys[1]!, JSON.stringify({ ...state, selectedIde: "invalid" }))
    if (keys.includes(fault)) {
      for (const key of keys) localStorage.setItem(key, JSON.stringify(state))
      const originalGet = Storage.prototype.getItem
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
        if (key === fault) throw new Error("synthetic read denial")
        return originalGet.call(this, key)
      })
    }
    mount()
    expect(observed().step).toBe(fault === "both-invalid" ? "welcome" : "install-ide")
    if (fault !== "both-invalid") {
      expect(observed().selectedIde).toBe("windsurf")
      const readable = keys.find((key) => key !== fault)!
      expect(JSON.parse(localStorage.getItem(readable)!)).toEqual({ ...state, osType: "mac" })
    } else {
      expect(saved()).toEqual({ currentStep: "welcome", selectedIde: null, osType: "mac", completedSteps: [] })
    }
  })

  it("CONSUMER-ONBOARDING initially loaded signed-out ignores stale initial user and URL", () => {
    for (const key of keys) localStorage.setItem(key, JSON.stringify(state))
    harness.auth.userId = null
    harness.params = new URLSearchParams({ step: "install-ide" })
    const get = vi.spyOn(Storage.prototype, "getItem")
    const set = vi.spyOn(Storage.prototype, "setItem")
    mount()
    expect(observed().step).toBe("welcome")
    expect(set).not.toHaveBeenCalled()
    expect(get.mock.calls.map(([key]) => key)).toEqual(keys)
    for (const key of keys) expect(localStorage.getItem(key)).toBeNull()
  })
})
