/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AnalyticsActivityType } from "@/types/global"

const mocks = vi.hoisted(() => {
  const select = vi.fn()
  const insert = vi.fn()
  const from = vi.fn()
  return {
    from,
    select,
    insert,
    createClient: vi.fn(),
    lookup: vi.fn(),
    write: vi.fn(),
    filter: vi.fn(),
    equal: vi.fn(),
    since: vi.fn(),
    limit: vi.fn(),
    unsubscribe: vi.fn(),
    fetch: vi.fn(() => { throw new Error("Unexpected network access") }),
    getConsent: vi.fn(() => null as string | null),
    subscribe: vi.fn((_cb: (value: string | null) => void) => () => {}),
  }
})

vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }))
vi.mock("@/lib/consent", () => ({
  getConsent: mocks.getConsent,
  subscribe: mocks.subscribe,
}))

function makeSupabaseStub() {
  // A thenable query builder: every chained call returns itself, awaiting it
  // resolves to an empty result set so `capture` proceeds to the insert.
  const chain: any = {
    select: (...args: unknown[]) => (mocks.select(...args), chain),
    eq: (...args: unknown[]) => (mocks.equal(...args), chain),
    or: (...args: unknown[]) => (mocks.filter(...args), chain),
    gte: (...args: unknown[]) => (mocks.since(...args), chain),
    limit: (...args: unknown[]) => (mocks.limit(...args), chain),
    then: (resolve: (v: unknown) => void, reject: (error: unknown) => void) =>
      mocks.lookup().then(resolve, reject),
    insert: (...args: unknown[]) => {
      mocks.insert(...args)
      return mocks.write()
    },
  }
  return {
    from: (...args: unknown[]) => {
      mocks.from(...args)
      return chain
    },
  }
}

async function loadHook() {
  vi.resetModules()
  const mod = await import("../use-analytics")
  return mod.useSupabaseAnalytics
}

describe("useSupabaseAnalytics consent gating", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    localStorage.clear()
    mocks.lookup.mockResolvedValue({ data: [], error: null })
    mocks.write.mockResolvedValue({ error: null })
    vi.stubGlobal("fetch", mocks.fetch)
    mocks.subscribe.mockImplementation(() => () => {})
    mocks.createClient.mockImplementation(() => makeSupabaseStub())
    ;(window as any).__supabaseAnalyticsClient = undefined
  })

  afterEach(() => {
    cleanup()
    expect(mocks.fetch).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("creates no anonymous id before a consent choice is made", async () => {
    mocks.getConsent.mockReturnValue(null)
    const useSupabaseAnalytics = await loadHook()

    renderHook(() => useSupabaseAnalytics())

    expect(localStorage.getItem("21st_anon_id")).toBeNull()
  })

  it("creates no anonymous id when consent is rejected", async () => {
    mocks.getConsent.mockReturnValue("rejected")
    const useSupabaseAnalytics = await loadHook()

    renderHook(() => useSupabaseAnalytics())

    expect(localStorage.getItem("21st_anon_id")).toBeNull()
  })

  it("attempts no Supabase read or insert pre-consent, for anonymous visitors", async () => {
    mocks.getConsent.mockReturnValue(null)
    const useSupabaseAnalytics = await loadHook()

    const { result } = renderHook(() => useSupabaseAnalytics())
    await act(async () => {
      await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    })

    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("attempts no Supabase read or insert pre-consent for logged-in users either", async () => {
    mocks.getConsent.mockReturnValue(null)
    const useSupabaseAnalytics = await loadHook()

    const { result } = renderHook(() => useSupabaseAnalytics())
    await act(async () => {
      await result.current.capture(
        1,
        AnalyticsActivityType.COMPONENT_VIEW,
        "user_123",
      )
    })

    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("creates an anonymous id and inserts once consent is accepted", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    const useSupabaseAnalytics = await loadHook()

    const { result } = renderHook(() => useSupabaseAnalytics())

    expect(localStorage.getItem("21st_anon_id")).not.toBeNull()

    await act(async () => {
      await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    })

    expect(mocks.from).toHaveBeenCalledWith("component_analytics")
    expect(mocks.insert).toHaveBeenCalledOnce()
  })

  it("removes the anonymous id when consent is revoked after acceptance", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    let emit: ((value: string | null) => void) | undefined
    mocks.subscribe.mockImplementation((cb) => {
      emit = cb
      return () => {}
    })
    const useSupabaseAnalytics = await loadHook()

    renderHook(() => useSupabaseAnalytics())
    expect(localStorage.getItem("21st_anon_id")).not.toBeNull()

    mocks.getConsent.mockReturnValue("rejected")
    act(() => {
      emit?.("rejected")
    })

    expect(localStorage.getItem("21st_anon_id")).toBeNull()
  })
  describe.each([
    ["no choice yet", null],
    ["rejected", "rejected"],
  ])("capture() with consent %s", (_label, consent) => {
    it.each([
      ["an anonymous caller", undefined],
      ["a logged-in caller", "user_123"],
    ])("makes no Supabase select and no insert for %s", async (_who, userId) => {
      // Seed an anon id so the anonymous path would have an identifier if the
      // guard were missing — only the consent check can stop the request.
      localStorage.setItem("21st_anon_id", "seeded_anon")
      mocks.getConsent.mockReturnValue(consent)
      const useSupabaseAnalytics = await loadHook()

      const { result } = renderHook(() => useSupabaseAnalytics())
      await act(async () => {
        await result.current.capture(
          1,
          AnalyticsActivityType.COMPONENT_VIEW,
          userId,
        )
      })

      expect(mocks.createClient).not.toHaveBeenCalled()
      expect(mocks.from).not.toHaveBeenCalled()
      expect(mocks.select).not.toHaveBeenCalled()
      expect(mocks.insert).not.toHaveBeenCalled()
    })
  })

  it("capture() attempts the select and insert for a logged-in caller once accepted", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    const useSupabaseAnalytics = await loadHook()

    const { result } = renderHook(() => useSupabaseAnalytics())
    await act(async () => {
      await result.current.capture(
        1,
        AnalyticsActivityType.COMPONENT_VIEW,
        "user_123",
      )
    })

    expect(mocks.select).toHaveBeenCalledWith("id")
    expect(mocks.insert).toHaveBeenCalledOnce()
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user_123" }),
    )
  })

  it("capture() stops once consent flips from accepted to rejected", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    const useSupabaseAnalytics = await loadHook()

    const { result } = renderHook(() => useSupabaseAnalytics())
    mocks.getConsent.mockReturnValue("rejected")
    await act(async () => {
      await result.current.capture(
        1,
        AnalyticsActivityType.COMPONENT_VIEW,
        "user_123",
      )
    })

    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  const legacyKey = "21st_anon_id"
  const canonicalKey = "higherbits_anon_id"
  const keys = [legacyKey, canonicalKey]

  async function mountAccepted() {
    mocks.getConsent.mockReturnValue("accepted")
    const hook = await loadHook()
    return renderHook(() => hook())
  }

  function observeConsent() {
    let listener: (value: string | null) => void = () => {}
    mocks.subscribe.mockImplementation((callback) => {
      listener = callback
      return mocks.unsubscribe
    })
    return (value: string | null) => {
      mocks.getConsent.mockReturnValue(value)
      act(() => listener(value))
    }
  }

  function deferredLookup() {
    let resolve!: (value: { data: { id: number }[]; error: null }) => void
    mocks.lookup.mockReturnValue(new Promise((complete) => { resolve = complete }))
    return () => resolve({ data: [], error: null })
  }

  it.each([
    ["legacy-only", "legacy-id", null, "legacy-id"],
    ["canonical-only", null, "canonical-id", "canonical-id"],
    ["equal", "same-id", "same-id", "same-id"],
    ["conflicting", "legacy-id", "canonical-id", "legacy-id"],
    ["empty legacy", "", "canonical-id", "canonical-id"],
    ["empty canonical", "legacy-id", "", "legacy-id"],
    ["neither", null, null, null],
    ["both empty", "", "", null],
  ])("ANON-SELECTION %s preserves one exact identity", async (_label, legacy, canonical, expected) => {
    if (legacy !== null) localStorage.setItem(legacyKey, legacy)
    if (canonical !== null) localStorage.setItem(canonicalKey, canonical)
    const random = vi.spyOn(Math, "random").mockReturnValue(0.123456789)
    const { result } = await mountAccepted()
    const identity = localStorage.getItem(legacyKey)
    expect(identity).toBeTruthy()
    if (expected) expect(identity).toBe(expected)
    expect(localStorage.getItem(canonicalKey)).toBe(identity)
    expect(random).toHaveBeenCalledTimes(expected ? 0 : 2)
    await result.current.capture(42, AnalyticsActivityType.COMPONENT_VIEW)
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      component_id: 42, activity_type: AnalyticsActivityType.COMPONENT_VIEW, anon_id: identity,
    }))
    expect(mocks.filter).toHaveBeenCalledExactlyOnceWith(`user_id.eq., anon_id.eq.${identity}`)
  })

  it.each([null, "rejected"])("ANON-CONSENT %s never reads or writes aliases and independently clears", async (consent) => {
    keys.forEach((key) => localStorage.setItem(key, "seed"))
    mocks.getConsent.mockReturnValue(consent)
    const get = vi.spyOn(Storage.prototype, "getItem")
    const set = vi.spyOn(Storage.prototype, "setItem")
    const remove = vi.spyOn(Storage.prototype, "removeItem")
    const hook = await loadHook()
    const { result } = renderHook(() => hook())
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, "user_123")
    expect(get).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
    keys.forEach((key) => expect(remove).toHaveBeenCalledWith(key))
    expect(mocks.createClient).not.toHaveBeenCalled()
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it.each(keys)("ANON-CONSENT independently clears when %s removal throws", async (denied) => {
    const emit = observeConsent()
    const { result } = await mountAccepted()
    const originalRemove = Storage.prototype.removeItem
    const remove = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function(this: Storage, key) {
      if (key === denied) throw new Error("Denied removal")
      return originalRemove.call(this, key)
    })
    emit("rejected")
    keys.forEach((key) => expect(remove).toHaveBeenCalledWith(key))
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it.each([null, "rejected"])("ANON-CONSENT acceptance to %s clears both and disables identity", async (consent) => {
    const emit = observeConsent()
    const { result } = await mountAccepted()
    emit(consent)
    keys.forEach((key) => expect(localStorage.getItem(key)).toBeNull())
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  describe.each(keys)("ANON-FAIL-CLOSED initialization %s", (faultKey) => {
    it.each(["read", "write", "readback", "mismatch"])("%s failure suppresses anonymous capture without regeneration", async (operation) => {
      keys.forEach((key) => localStorage.setItem(key, "existing"))
      const originalGet = Storage.prototype.getItem
      const originalSet = Storage.prototype.setItem
      let reads = 0
      const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(function(this: Storage, key) {
        if (key === faultKey) {
          reads += 1
          if (operation === "read" || (operation === "readback" && reads > 1)) throw new Error("Denied read")
          if (operation === "mismatch" && reads > 1) return "wrong-id"
        }
        return originalGet.call(this, key)
      })
      const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function(this: Storage, key, value) {
        if (key === faultKey && operation === "write") throw new Error("Denied write")
        return originalSet.call(this, key, value)
      })
      const random = vi.spyOn(Math, "random")
      const { result } = await mountAccepted()
      await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
      expect(get).toHaveBeenCalledWith(faultKey)
      keys.forEach((key) => expect(get).toHaveBeenCalledWith(key))
      if (operation !== "read") keys.forEach((key) => expect(set).toHaveBeenCalledWith(key, "existing"))
      if (operation !== "read") keys.forEach((key) => expect(get.mock.calls.filter(([readKey]) => readKey === key)).toHaveLength(2))
      expect(random).not.toHaveBeenCalled()
      expect(mocks.createClient).not.toHaveBeenCalled()
      expect(mocks.select).not.toHaveBeenCalled()
      expect(mocks.insert).not.toHaveBeenCalled()
    })
  })

  describe.each(keys)("ANON-FAIL-CLOSED post-init %s", (faultKey) => {
    it.each(["read throws", "missing", "divergent"])("%s before query permanently invalidates anonymous capture", async (fault) => {
      const { result } = await mountAccepted()
      const identity = localStorage.getItem(legacyKey)!
      if (fault === "missing") localStorage.removeItem(faultKey)
      if (fault === "divergent") localStorage.setItem(faultKey, "different")
      const get = vi.spyOn(Storage.prototype, "getItem")
      if (fault === "read throws") get.mockImplementation((key) => {
        if (key === faultKey) throw new Error("Denied later read")
        return identity
      })
      await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
      get.mockRestore()
      keys.forEach((key) => localStorage.setItem(key, identity))
      await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
      expect(mocks.select).not.toHaveBeenCalled()
      expect(mocks.insert).not.toHaveBeenCalled()
    })

    it.each(["read throws", "missing", "divergent"])("%s during pending lookup prevents insertion", async (fault) => {
      const finish = deferredLookup()
      const { result } = await mountAccepted()
      const pending = result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
      await Promise.resolve()
      if (fault === "missing") localStorage.removeItem(faultKey)
      if (fault === "divergent") localStorage.setItem(faultKey, "different")
      const originalGet = Storage.prototype.getItem
      if (fault === "read throws") vi.spyOn(Storage.prototype, "getItem").mockImplementation(function(this: Storage, key) {
        if (key === faultKey) throw new Error("Denied later read")
        return originalGet.call(this, key)
      })
      finish()
      await pending
      expect(mocks.select).toHaveBeenCalledOnce()
      expect(mocks.insert).not.toHaveBeenCalled()
    })
  })

  describe.each([undefined, "user_123"])("ANON-INFLIGHT caller %s", (userId) => {
    it.each(["rejected", "null", "reaccepted", "unmount"])("%s invalidates pending capture", async (transition) => {
      const emit = observeConsent()
      const finish = deferredLookup()
      const { result, unmount } = await mountAccepted()
      const retainedCapture = result.current.capture
      const pending = retainedCapture(1, AnalyticsActivityType.COMPONENT_VIEW, userId)
      await Promise.resolve()
      if (transition === "unmount") {
        unmount()
        emit("rejected")
        emit("accepted")
      } else emit(transition === "null" ? null : "rejected")
      if (transition === "reaccepted") emit("accepted")
      finish()
      await pending
      expect(mocks.insert).not.toHaveBeenCalled()
      if (transition === "unmount") {
        expect(mocks.unsubscribe).toHaveBeenCalledOnce()
        mocks.select.mockClear()
        await retainedCapture(1, AnalyticsActivityType.COMPONENT_VIEW, userId)
        expect(mocks.select).not.toHaveBeenCalled()
        mocks.lookup.mockResolvedValue({ data: [], error: null })
        const { useSupabaseAnalytics } = await import("../use-analytics")
        const remounted = renderHook(() => useSupabaseAnalytics())
        await remounted.result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, userId)
        expect(mocks.insert).toHaveBeenCalledOnce()
      }
      if (transition === "reaccepted") {
        mocks.lookup.mockResolvedValue({ data: [], error: null })
        await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, userId)
        expect(mocks.insert).toHaveBeenCalledOnce()
      }
    })
  })

  it("ANON-TEARDOWN remounts safely under StrictMode", async () => {
    const { StrictMode } = await import("react")
    const hook = await loadHook()
    mocks.getConsent.mockReturnValue("accepted")
    const { result } = renderHook(() => hook(), { wrapper: StrictMode })
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    expect(mocks.insert).toHaveBeenCalledOnce()
    expect(localStorage.getItem(canonicalKey)).toBe(localStorage.getItem(legacyKey))
  })

  it.each([undefined, "user_123"])("ANON-MEASUREMENT duplicate for %s skips insertion", async (userId) => {
    mocks.lookup.mockResolvedValue({ data: [{ id: 4 }], error: null })
    const { result } = await mountAccepted()
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, userId)
    expect(mocks.select).toHaveBeenCalledExactlyOnceWith("id")
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("ANON-MEASUREMENT separate activity types preserve payload and query", async () => {
    const { result } = await mountAccepted()
    const identity = localStorage.getItem(legacyKey)
    for (const activity of Object.values(AnalyticsActivityType)) {
      await result.current.capture(123, activity)
      expect(mocks.insert).toHaveBeenLastCalledWith(expect.objectContaining({ component_id: 123, activity_type: activity, anon_id: identity }))
    }
    expect(mocks.insert).toHaveBeenCalledTimes(Object.values(AnalyticsActivityType).length)
    expect(mocks.select).toHaveBeenCalledTimes(Object.values(AnalyticsActivityType).length)
    expect(mocks.equal).toHaveBeenCalledWith("component_id", 123)
    for (const activity of Object.values(AnalyticsActivityType)) expect(mocks.equal).toHaveBeenCalledWith("activity_type", activity)
    expect(mocks.limit).toHaveBeenCalledWith(1)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 1)
    for (const [field, value] of mocks.since.mock.calls) {
      expect(field).toBe("created_at")
      expect(Math.abs(new Date(value).getTime() - cutoff.getTime())).toBeLessThan(2000)
    }
  })

  it.each(["initial", "later"])("ANON-MEASUREMENT signed-in identity survives %s anonymous storage failure", async (timing) => {
    const deny = () => vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Denied") })
    if (timing === "initial") deny()
    const { result } = await mountAccepted()
    if (timing === "later") {
      deny()
      await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    }
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, "user_123")
    expect(mocks.filter).toHaveBeenCalledExactlyOnceWith("user_id.eq.user_123, anon_id.eq.")
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ user_id: "user_123", anon_id: undefined }))
  })

  it("ANON-MEASUREMENT development remains no-send", async () => {
    vi.stubEnv("NODE_ENV", "development")
    const { result } = await mountAccepted()
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, "user_123")
    expect(mocks.createClient).not.toHaveBeenCalled()
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  describe.each([undefined, "user_123"])("ANON-DATA-FAILURE caller %s", (userId) => {
    it.each(["error", "missing data", "null", "null response", "malformed data", "throw"])("lookup %s does not insert", async (failure) => {
      vi.spyOn(console, "error").mockImplementation(() => {})
      if (failure === "throw") mocks.lookup.mockRejectedValue(new Error("Lookup failed"))
      else if (failure === "null response") mocks.lookup.mockResolvedValue(null)
      else mocks.lookup.mockResolvedValue({ data: failure === "missing data" ? undefined : failure === "null" ? null : failure === "malformed data" ? {} : [], error: failure === "error" ? { message: "Failed" } : null })
      const { result } = await mountAccepted()
      await expect(result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, userId)).resolves.toBeUndefined()
      expect(mocks.select).toHaveBeenCalledOnce()
      expect(mocks.insert).not.toHaveBeenCalled()
    })

    it.each(["error", "null", "throw"])("insert %s is handled without retry or rejection", async (failure) => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {})
      if (failure === "throw") mocks.write.mockRejectedValue(new Error("Insert failed"))
      else mocks.write.mockResolvedValue(failure === "null" ? null : { error: { message: "Failed" } })
      const { result } = await mountAccepted()
      await expect(result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, userId)).resolves.toBeUndefined()
      expect(mocks.insert).toHaveBeenCalledOnce()
      expect(log).toHaveBeenCalled()
    })
  })

  it.each(keys)("ANON-FAIL-CLOSED %s failed read cannot generate when neither alias exists", async (denied) => {
    const originalGet = Storage.prototype.getItem
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function(this: Storage, key) {
      if (key === denied) throw new Error("Denied read")
      return originalGet.call(this, key)
    })
    const set = vi.spyOn(Storage.prototype, "setItem")
    const random = vi.spyOn(Math, "random")
    const { result } = await mountAccepted()
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    expect(random).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it.each([undefined, "user_123"])("ANON-DATA-FAILURE client construction for %s is caught", async (userId) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.createClient.mockImplementation(() => { throw new Error("Client unavailable") })
    const { result } = await mountAccepted()
    await expect(result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW, userId)).resolves.toBeUndefined()
    expect(mocks.createClient).toHaveBeenCalledOnce()
    expect(mocks.select).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalled()
  })

  it("ANON-MEASUREMENT existing pre-mount recorder prevents provider construction", async () => {
    const hook = await loadHook()
    ;(window as any).__supabaseAnalyticsClient = makeSupabaseStub()
    mocks.getConsent.mockReturnValue("accepted")
    const { result } = renderHook(() => hook())
    await result.current.capture(1, AnalyticsActivityType.COMPONENT_VIEW)
    expect(mocks.createClient).not.toHaveBeenCalled()
    expect(mocks.select).toHaveBeenCalledOnce()
    expect(mocks.insert).toHaveBeenCalledOnce()
  })
})
