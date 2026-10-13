// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearOnboardingState, readOnboardingState, writeOnboardingState } from "./higherbits-mcp-storage"

const keys = ["magic_onboarding_state", "higherbits_mcp_onboarding_state"]
const state = {
  currentStep: "install-ide" as const,
  selectedIde: "windsurf" as const,
  osType: "linux" as const,
  completedSteps: ["select-ide", "welcome", "select-ide"] as ("select-ide" | "welcome")[],
  extra: { nested: ["unchanged", 2] },
}
const canonical = { ...state, selectedIde: "cline" as const }
const fetchDeny = vi.fn(() => { throw new Error("Unexpected fetch") })

describe("MCP onboarding storage compatibility", () => {
  beforeEach(() => {
    localStorage.clear()
    fetchDeny.mockClear()
    vi.stubGlobal("fetch", fetchDeny)
  })
  afterEach(() => {
    try {
      expect(fetchDeny).not.toHaveBeenCalled()
    } finally {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    }
  })

  it.each(["legacy", "canonical", "equal", "conflict", "neither"])("HELPER-VALIDATION selection %s", (mode) => {
    if (["legacy", "equal", "conflict"].includes(mode)) localStorage.setItem(keys[0]!, JSON.stringify(state))
    if (["canonical", "equal", "conflict"].includes(mode)) localStorage.setItem(keys[1]!, JSON.stringify(mode === "equal" ? state : canonical))
    expect(readOnboardingState()).toEqual(mode === "neither" ? null : mode === "canonical" ? canonical : state)
  })

  const invalid = ["{", "null", "1", '"text"', "[]", "{}",
    JSON.stringify({ ...state, currentStep: "unknown" }),
    JSON.stringify({ ...state, selectedIde: "unknown" }),
    JSON.stringify({ ...state, osType: "unknown" }),
    JSON.stringify({ ...state, completedSteps: "welcome" }),
    JSON.stringify({ ...state, completedSteps: ["unknown"] }),
    ...Object.keys(state).filter((field) => field !== "extra").map((field) => JSON.stringify(Object.fromEntries(Object.entries(state).filter(([name]) => name !== field)))),
  ]
  it.each(keys.flatMap((key) => invalid.map((value) => [key, value])))("HELPER-VALIDATION independently rejects %s %s", (key, value) => {
    localStorage.setItem(key!, value!)
    localStorage.setItem(keys.find((candidate) => candidate !== key)!, JSON.stringify(canonical))
    expect(readOnboardingState()).toEqual(canonical)
    localStorage.setItem(keys.find((candidate) => candidate !== key)!, value!)
    expect(readOnboardingState()).toBeNull()
  })

  it.each(["welcome", "select-ide", "install-ide", "create-component", "upgrade-pro", "troubleshooting"])("HELPER-VALIDATION accepts step %s", (step) => {
    const value = { ...state, currentStep: step, completedSteps: [step], selectedIde: null }
    localStorage.setItem(keys[0]!, JSON.stringify(value))
    expect(readOnboardingState()).toEqual(value)
  })

  it("HELPER-EXTRA preserves exact serialization and nested/duplicated data", () => {
    expect(writeOnboardingState(state)).toBe(true)
    for (const key of keys) expect(localStorage.getItem(key)).toBe(JSON.stringify(state))
    expect(readOnboardingState()).toEqual(state)
    expect(clearOnboardingState()).toBe(true)
    for (const key of keys) expect(localStorage.getItem(key)).toBeNull()
  })

  it.each(keys)("HELPER-PARTIAL read denial %s resumes other alias without write probe", (denied) => {
    localStorage.setItem(keys.find((key) => key !== denied)!, JSON.stringify(state))
    const originalGet = Storage.prototype.getItem
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
      if (key === denied) throw new Error("synthetic read denial")
      return originalGet.call(this, key)
    })
    const writes = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("synthetic write denial") })
    expect(readOnboardingState()).toEqual(state)
    expect(writes).not.toHaveBeenCalled()
  })

  it.each(keys.flatMap((key) => ["write", "readback", "mismatch", "silent-write"].map((fault) => [key, fault])))("HELPER-PARTIAL %s %s attempts both and retains readable state", (denied, fault) => {
    const originalSet = Storage.prototype.setItem
    const originalGet = Storage.prototype.getItem
    const writes = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === denied && fault === "write") throw new Error("synthetic write denial")
      if (key === denied && fault === "silent-write") return
      originalSet.call(this, key, value)
    })
    const reads = vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
      if (key === denied && fault === "readback") throw new Error("synthetic read denial")
      if (key === denied && fault === "mismatch") return "different"
      return originalGet.call(this, key)
    })
    expect(writeOnboardingState(state)).toBe(false)
    expect(writes.mock.calls.map(([key]) => key)).toEqual(keys)
    expect(reads.mock.calls.map(([key]) => key)).toEqual(keys)
    expect(readOnboardingState()).toEqual(state)
  })

  it.each(keys.flatMap((key) => ["remove", "readback", "remaining"].map((fault) => [key, fault])))("HELPER-PARTIAL clear %s %s independently verifies absence", (denied, fault) => {
    for (const key of keys) localStorage.setItem(key, JSON.stringify(state))
    const originalRemove = Storage.prototype.removeItem
    const originalGet = Storage.prototype.getItem
    const removes = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (key === denied && fault === "remove") throw new Error("synthetic remove denial")
      if (key === denied && fault === "remaining") return
      originalRemove.call(this, key)
    })
    const reads = vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
      if (key === denied && fault === "readback") throw new Error("synthetic readback denial")
      return originalGet.call(this, key)
    })
    expect(clearOnboardingState()).toBe(false)
    expect(removes.mock.calls.map(([key]) => key)).toEqual(keys)
    expect(reads.mock.calls.map(([key]) => key)).toEqual(keys)
    expect(originalGet.call(localStorage, keys.find((key) => key !== denied)!)).toBeNull()
  })

  it("HELPER-PARTIAL serialization failure does not mutate aliases", () => {
    const circular = { ...state, extra: {} }
    circular.extra = circular
    expect(writeOnboardingState(circular)).toBe(false)
    for (const key of keys) expect(localStorage.getItem(key)).toBeNull()
  })

  it("HELPER-PARTIAL removal throws after deleting but verified absence succeeds", () => {
    for (const key of keys) localStorage.setItem(key, JSON.stringify(state))
    const originalRemove = Storage.prototype.removeItem
    const removes = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      originalRemove.call(this, key)
      throw new Error("synthetic post-removal failure")
    })
    expect(clearOnboardingState()).toBe(true)
    expect(removes.mock.calls.map(([key]) => key)).toEqual(keys)
    for (const key of keys) expect(localStorage.getItem(key)).toBeNull()
  })

  it.each(["cursor", "cline", "windsurf", null].flatMap((selectedIde) => ["mac", "windows", "linux"].map((osType) => [selectedIde, osType] as const)))("HELPER-VALIDATION exact IDE=%s OS=%s", (selectedIde, osType) => {
    const value = { ...state, selectedIde, osType }
    localStorage.setItem(keys[0]!, JSON.stringify(value))
    expect(readOnboardingState()).toEqual(value)
  })
})
