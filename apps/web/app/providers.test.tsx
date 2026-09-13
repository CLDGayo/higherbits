/** @vitest-environment jsdom */
import React from "react"
import { act, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  initAmplitude: vi.fn(),
  subscribe: vi.fn((_cb: (value: string | null) => void) => () => {}),
  getConsent: vi.fn(() => null as string | null),
  unsubscribe: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock("jotai", () => ({
  atom: () => ({}),
  useAtom: () => [false, vi.fn()],
  useSetAtom: () => vi.fn(),
}))
vi.mock("jotai/utils", () => ({ atomWithStorage: () => ({}) }))

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: any) => <div>{children}</div>,
  useUser: () => ({ user: null }),
  useAuth: () => ({ userId: null }),
}))

vi.mock("@/lib/amplitude", () => ({
  initAmplitude: mocks.initAmplitude,
}))

vi.mock("@/lib/consent", () => ({
  getConsent: mocks.getConsent,
  subscribe: mocks.subscribe,
}))

vi.mock("@/components/features/main-page/sidebar-layout", () => ({
  MainSidebar: () => null,
}))

vi.mock("@/components/ui/command-menu", () => ({
  CommandMenu: () => null,
}))

import { AppProviders } from "./providers"

describe("AppProviders analytics consent wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.subscribe.mockImplementation(() => mocks.unsubscribe)
  })

  it("calls initAmplitude on mount and again after a later accepted consent event", () => {
    let emit: ((value: string | null) => void) | undefined
    mocks.subscribe.mockImplementation((cb) => {
      emit = cb
      return mocks.unsubscribe
    })

    render(
      <AppProviders>
        <span>child</span>
      </AppProviders>,
    )

    expect(mocks.initAmplitude).toHaveBeenCalledTimes(1)

    act(() => {
      emit?.("accepted")
    })

    // Proves the late-Accept re-init: a visitor normally accepts AFTER mount,
    // so without the subscription Amplitude would stay dead until a reload.
    expect(mocks.initAmplitude).toHaveBeenCalledTimes(2)
  })

  it("does not re-init on a rejected consent event", () => {
    let emit: ((value: string | null) => void) | undefined
    mocks.subscribe.mockImplementation((cb) => {
      emit = cb
      return mocks.unsubscribe
    })

    render(
      <AppProviders>
        <span>child</span>
      </AppProviders>,
    )

    act(() => {
      emit?.("rejected")
    })

    expect(mocks.initAmplitude).toHaveBeenCalledTimes(1)
  })

  it("unsubscribes from the consent store on unmount", () => {
    const { unmount } = render(
      <AppProviders>
        <span>child</span>
      </AppProviders>,
    )

    expect(mocks.subscribe).toHaveBeenCalled()
    unmount()

    expect(mocks.unsubscribe).toHaveBeenCalled()
  })
})
