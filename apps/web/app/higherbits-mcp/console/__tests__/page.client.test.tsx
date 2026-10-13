// @vitest-environment jsdom
import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ConsoleClient } from "../page.client"
import type { ApiKey } from "@/types/global"

const deny = vi.hoisted(() => ({
  service: vi.fn(() => { throw new Error("Unexpected service call") }),
  fetch: vi.fn(() => { throw new Error("Unexpected fetch") }),
}))
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }))
vi.mock("@/lib/clerk", () => ({ useClerkSupabaseClient: () => ({ from: deny.service, rpc: deny.service }) }))
vi.mock("@/components/features/higherbits-mcp/troubleshooting", () => ({ TroubleshootingSection: ({ selectedIde }: { selectedIde: string }) => <output data-testid="ide">{selectedIde}</output> }))
vi.mock("@/components/ui/code", () => ({ Code: ({ code }: { code: string }) => <code data-testid="command">{code}</code> }))
vi.mock("@/components/features/settings/billing/upgrade-confirmation-dialog", () => ({ UpgradeConfirmationDialog: () => null }))
vi.mock("@/components/features/higherbits-mcp/feedback-dialog", () => ({ FeedbackDialog: () => null }))
vi.mock("@/components/ui/circle-progress", () => ({ CircleProgress: () => null }))

const keys = ["magic_onboarding_state", "higherbits_mcp_onboarding_state"]
const state = {
  currentStep: "install-ide", selectedIde: "windsurf", osType: "windows",
  completedSteps: ["select-ide", "welcome", "select-ide"], extra: { nested: [1, "exact"] },
}
const apiKey: ApiKey = { id: "synthetic", key: "synthetic-key", user_id: "synthetic-user", plan: "free", requests_limit: 100, requests_count: 0, created_at: "2026-10-13", expires_at: null, last_used_at: null, is_active: true, project_url: "https://example.test" }
const mount = () => render(<ConsoleClient subscription={null} apiKey={apiKey} />)

function expectConfiguration(agent = "Macintosh") {
  const configuration = JSON.parse(screen.getByTestId("command").textContent || "{}")
  expect(configuration.mcpServers["@higherbits-dev/cli"]).toEqual({
    command: agent === "Windows" ? "cmd" : "npx",
    args: agent === "Windows" ? ["/c", "npx", "-y", "@higherbits-dev/cli@latest"] : ["-y", "@higherbits-dev/cli@latest"],
    env: { API_KEY: "synthetic-key" },
  })
}

describe("actual console state restoration and synchronization", () => {
  beforeEach(() => {
    localStorage.clear()
    deny.service.mockClear()
    deny.fetch.mockClear()
    vi.stubGlobal("fetch", deny.fetch)
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Macintosh")
  })
  afterEach(() => {
    cleanup()
    try {
      expect(deny.service).not.toHaveBeenCalled()
      expect(deny.fetch).not.toHaveBeenCalled()
    } finally {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    }
  })

  it.each(["legacy", "canonical", "equal", "conflict", "invalid-legacy"])("CONSUMER-CONSOLE %s restores observable IDE/command and both exact aliases", (mode) => {
    if (mode !== "canonical") localStorage.setItem(keys[0]!, mode === "invalid-legacy" ? JSON.stringify({ ...state, currentStep: "invalid" }) : JSON.stringify(state))
    if (mode !== "legacy") localStorage.setItem(keys[1]!, JSON.stringify(mode === "conflict" ? { ...state, selectedIde: "cline" } : state))
    mount()
    expect(screen.getByTestId("ide").textContent).toBe("windsurf")
    expectConfiguration()
    for (const key of keys) expect(localStorage.getItem(key)).toBe(JSON.stringify(state))
  })

  it.each(["null-ide", "invalid", "empty"])("CONSUMER-CONSOLE %s uses cursor default", (mode) => {
    if (mode === "null-ide") localStorage.setItem(keys[0]!, JSON.stringify({ ...state, selectedIde: null }))
    if (mode === "invalid") {
      localStorage.setItem(keys[0]!, "null")
      localStorage.setItem(keys[1]!, "{not-json")
    }
    mount()
    expect(screen.getByTestId("ide").textContent).toBe("cursor")
    expectConfiguration()
  })

  it.each(["Macintosh", "Windows", "Linux"])("CONSUMER-CONSOLE detected OS %s controls command without altering serialized state", (agent) => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(agent)
    localStorage.setItem(keys[1]!, JSON.stringify(state))
    mount()
    expect(screen.getByTestId("ide").textContent).toBe("windsurf")
    expectConfiguration(agent)
    for (const key of keys) expect(localStorage.getItem(key)).toBe(JSON.stringify(state))
  })

  it.each(keys.flatMap((key) => ["read", "write", "readback"].map((fault) => [key, fault])))("CONSUMER-CONSOLE partial %s %s retains restored IDE and readable state", (denied, fault) => {
    for (const key of keys) localStorage.setItem(key, JSON.stringify(state))
    const originalGet = Storage.prototype.getItem
    const originalSet = Storage.prototype.setItem
    let didWrite = false
    const writes = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      didWrite = true
      if (key === denied && fault === "write") throw new Error("synthetic write denial")
      originalSet.call(this, key, value)
    })
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
      if (key === denied && (fault === "read" || (fault === "readback" && didWrite))) throw new Error("synthetic read denial")
      return originalGet.call(this, key)
    })
    mount()
    expect(screen.getByTestId("ide").textContent).toBe("windsurf")
    expectConfiguration()
    expect(writes.mock.calls.map(([key]) => key)).toEqual(keys)
    expect(originalGet.call(localStorage, keys.find((key) => key !== denied)!)).toBe(JSON.stringify(state))
  })

  it("CONSUMER-CONSOLE both reads denied retains OS/cursor defaults without an inner auth gate", () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Windows")
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("synthetic storage denial") })
    mount()
    expect(screen.getByTestId("ide").textContent).toBe("cursor")
    expectConfiguration("Windows")
  })
})
