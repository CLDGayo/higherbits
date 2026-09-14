/** @vitest-environment jsdom */
import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const TRIGGER_MS = 40000

const mocks = vi.hoisted(() => ({
  getConsent: vi.fn(() => null as string | null),
  subscribe: vi.fn((_cb: (value: string | null) => void) => () => {}),
}))

vi.mock("@/lib/consent", () => ({
  getConsent: mocks.getConsent,
  subscribe: mocks.subscribe,
}))

vi.mock("@/lib/resend", () => ({
  addToNewsletter: vi.fn(async () => ({ success: true, error: null })),
}))

vi.mock("@/components/ui/logo", () => ({
  Logo: () => <div data-testid="logo" />,
}))

vi.mock("@/hooks/use-media-query", () => ({
  useIsMobile: () => false,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

let emit: ((value: string | null) => void) | undefined

async function renderDialog() {
  const { NewsletterDialog } = await import("../newsletter-dialog")
  return render(<NewsletterDialog />)
}

function elapseTrigger() {
  act(() => {
    vi.advanceTimersByTime(TRIGGER_MS + 1)
  })
}

function emitConsent(value: string | null) {
  act(() => {
    emit?.(value)
  })
}

const dialog = () => screen.queryByRole("dialog")

describe("NewsletterDialog consent gate", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    window.localStorage.clear()
    emit = undefined
    mocks.getConsent.mockReturnValue(null)
    mocks.subscribe.mockImplementation((cb) => {
      emit = cb
      return () => {
        emit = undefined
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("C1: does not open after the timer elapses while consent is unknown", async () => {
    await renderDialog()

    elapseTrigger()

    expect(dialog()).toBeNull()
  })

  it("C2: opens after the timer elapses once consent is accepted", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    await renderDialog()

    elapseTrigger()

    expect(dialog()).not.toBeNull()
  })

  it("C2: opens after the timer elapses once consent is rejected", async () => {
    mocks.getConsent.mockReturnValue("rejected")
    await renderDialog()

    elapseTrigger()

    expect(dialog()).not.toBeNull()
  })

  it("C3: stays closed for a returning subscriber regardless of consent", async () => {
    window.localStorage.setItem("hasSubscribedToNewsletter", "true")
    mocks.getConsent.mockReturnValue("accepted")
    await renderDialog()

    elapseTrigger()

    expect(dialog()).toBeNull()
  })

  it("C4: opens without a reload when consent is chosen after the timer elapsed", async () => {
    await renderDialog()
    elapseTrigger()
    expect(dialog()).toBeNull()

    emitConsent("accepted")

    expect(dialog()).not.toBeNull()
  })

  it("C5: stays closed when consent resets to null while nothing was ever chosen", async () => {
    await renderDialog()

    emitConsent(null)
    elapseTrigger()
    emitConsent(null)

    expect(dialog()).toBeNull()
  })

  it("C6: is not force-closed when consent resets to null while it is open", async () => {
    mocks.getConsent.mockReturnValue("accepted")
    await renderDialog()
    elapseTrigger()
    expect(dialog()).not.toBeNull()

    emitConsent(null)

    expect(dialog()).not.toBeNull()
  })

  it("C7: does not reopen after a same-session decline when consent is re-chosen", async () => {
    await renderDialog()
    elapseTrigger()
    emitConsent("accepted")
    expect(dialog()).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    act(() => {
      vi.runOnlyPendingTimers()
    })
    expect(dialog()).toBeNull()

    emitConsent(null)
    emitConsent("rejected")

    expect(dialog()).toBeNull()
  })
})
