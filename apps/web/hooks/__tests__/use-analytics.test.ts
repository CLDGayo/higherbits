/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

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
    eq: () => chain,
    or: () => chain,
    gte: () => chain,
    limit: () => chain,
    then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
    insert: (...args: unknown[]) => {
      mocks.insert(...args)
      return { then: (cb: (v: unknown) => void) => cb({ error: null }) }
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
    vi.clearAllMocks()
    localStorage.clear()
    mocks.subscribe.mockImplementation(() => () => {})
    mocks.createClient.mockImplementation(() => makeSupabaseStub())
    ;(window as any).__supabaseAnalyticsClient = undefined
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
})
